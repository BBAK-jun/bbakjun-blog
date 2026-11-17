import { useSyncExternalStore, useRef, useCallback } from 'react';

/**
 * Deep equality check for objects and arrays
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Cache to store previous snapshots for each key
 * This prevents unnecessary re-renders when content hasn't changed
 */
const snapshotCache = new Map<string, { value: any; serialized: string }>();

/**
 * Hook to sync state with localStorage using useSyncExternalStore
 * with deep equality checks to prevent infinite loops
 *
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * setTheme('dark'); // Saves to localStorage and syncs across tabs
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const updateTimeoutRef = useRef<number | null>(null);

  // Refs to keep setValue stable — prevents infinite re-render loops when
  // callers pass a fresh initialValue object every render (e.g. getDefaultDraftData())
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorageChange = (e: StorageEvent) => {
        // Only trigger for this specific key
        if (e.key === key) {
          callback();
        }
      };

      const handleCustomEvent = (e: Event) => {
        const customEvent = e as CustomEvent<{ key: string }>;
        // Only trigger for this specific key
        if (customEvent.detail?.key === key) {
          callback();
        }
      };

      // Listen to storage events from other tabs
      window.addEventListener('storage', handleStorageChange);

      // Listen to custom events for same-tab updates
      window.addEventListener('local-storage-change', handleCustomEvent);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('local-storage-change', handleCustomEvent);
      };
    },
    [key]
  );

  // Depend only on [key] — initialValue via ref avoids new callback every render
  const getSnapshot = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      const serialized = item || '';

      // Check cache first
      const cached = snapshotCache.get(key);
      if (cached && cached.serialized === serialized) {
        // Return the same reference if content hasn't changed
        return cached.value;
      }

      // Parse new value
      const newValue = item ? (JSON.parse(item) as T) : initialValueRef.current;

      // Update cache
      snapshotCache.set(key, { value: newValue, serialized });

      return newValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => initialValueRef.current, []);

  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Refs so setValue can read latest values without depending on them
  const storeRef = useRef(store);
  storeRef.current = store;
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;

  // Stable: depends only on [key]. Unstable setValue causes infinite loops in
  // consumers that use it in useEffect dependency arrays (e.g. useFileCreator)
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storeRef.current) : value;

        // Check if value actually changed using deep equality
        const currentValue = getSnapshotRef.current();
        if (deepEqual(currentValue, valueToStore)) {
          // Value hasn't changed, don't update
          return;
        }

        // Debounce the update to prevent rapid successive updates
        if (updateTimeoutRef.current !== null) {
          window.clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = window.setTimeout(() => {
          const serialized = JSON.stringify(valueToStore);
          window.localStorage.setItem(key, serialized);

          // Update cache immediately
          snapshotCache.set(key, { value: valueToStore, serialized });

          // Notify same-tab listeners
          window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key } }));

          updateTimeoutRef.current = null;
        }, 50); // 50ms debounce
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [store, setValue];
}
