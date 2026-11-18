/**
 * 캐시 백엔드 선택 동작
 *
 * - KV 바인딩이 없으면(로컬/Vercel) Redis를 사용하고, Redis도 없으면 쿼리를 직접 실행한다.
 * - KV 바인딩이 있으면(Cloudflare Workers) KV만 사용한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KvBinding } from './kv';

const redisModule = vi.hoisted(() => ({
  isRedisAvailable: vi.fn(),
}));

vi.mock('./redis', () => redisModule);

function createKvStub(initial: Record<string, string> = {}): KvBinding {
  const store = new Map(Object.entries(initial));

  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(async (options?: { prefix?: string }) => ({
      keys: [...store.keys()]
        .filter(name => (options?.prefix ? name.startsWith(options.prefix) : true))
        .map(name => ({ name })),
      list_complete: true,
    })),
  } as unknown as KvBinding;
}

/** 모듈 레지스트리를 초기화한 뒤 kv·cache 모듈을 함께 로드한다 (같은 인스턴스 보장) */
async function loadCacheModules(kv?: KvBinding) {
  vi.resetModules();
  const kvApi = await import('./kv');
  kvApi.setKvBindingResolver(kv ? () => kv : null);
  const cacheApi = await import('./index');
  return { kvApi, cacheApi };
}

describe('cachedQuery fallback (Redis)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Redis unavailable 시 쿼리를 직접 실행하고 fromCache=false를 반환한다', async () => {
    redisModule.isRedisAvailable.mockResolvedValue(false);
    const { cacheApi } = await loadCacheModules();

    const query = vi.fn(async () => ({ value: 42 }));
    const { data, fromCache } = await cacheApi.cachedQuery({ key: 'test:key', query });

    expect(data).toEqual({ value: 42 });
    expect(fromCache).toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe('cachedQuery (Cloudflare KV)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('KV 바인딩이 있으면 KV만 사용하고 Redis는 건드리지 않는다', async () => {
    const kv = createKvStub();
    const { cacheApi } = await loadCacheModules(kv);

    const query = vi.fn(async () => ({ value: 1 }));
    const { data, fromCache } = await cacheApi.cachedQuery({ key: 'kv:key', query });

    expect(data).toEqual({ value: 1 });
    expect(fromCache).toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
    expect(redisModule.isRedisAvailable).not.toHaveBeenCalled();
  });

  it('KV 적중 시 쿼리를 실행하지 않고 fromCache=true를 반환한다', async () => {
    const kv = createKvStub({ 'kv:key': JSON.stringify({ value: 7 }) });
    const { cacheApi } = await loadCacheModules(kv);

    const query = vi.fn(async () => ({ value: 1 }));
    const { data, fromCache } = await cacheApi.cachedQuery({ key: 'kv:key', query });

    expect(data).toEqual({ value: 7 });
    expect(fromCache).toBe(true);
    expect(query).not.toHaveBeenCalled();
  });

  it('캐시 미스 시 KV에 TTL과 함께 저장한다 (최소 60초)', async () => {
    const kv = createKvStub();
    const { cacheApi } = await loadCacheModules(kv);

    await cacheApi.cachedQuery({ key: 'kv:short', query: async () => 'x', ttl: 5 });

    expect(kv.put).toHaveBeenCalledWith('kv:short', '"x"', { expirationTtl: 60 });
  });
});

describe('invalidateCache (Cloudflare KV)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('와일드카드 패턴은 prefix로 찾아 지운다', async () => {
    const kv = createKvStub({
      'blob-files:limit:100': '{}',
      'blob-files:limit:10': '{}',
      'views:stats': '{}',
    });
    const { cacheApi } = await loadCacheModules(kv);

    const deleted = await cacheApi.invalidateCache('blob-files:*');

    expect(deleted).toBe(2);
    expect(kv.delete).toHaveBeenCalledTimes(2);
    expect(await kv.get('views:stats')).toBeTruthy();
  });

  it('와일드카드가 없으면 해당 키만 지운다', async () => {
    const kv = createKvStub({ 'views:stats': '{}', 'blob-files:limit:100': '{}' });
    const { cacheApi } = await loadCacheModules(kv);

    const deleted = await cacheApi.invalidateCache('views:stats');

    expect(deleted).toBe(1);
    expect(await kv.get('views:stats')).toBeNull();
    expect(await kv.get('blob-files:limit:100')).toBeTruthy();
  });
});
