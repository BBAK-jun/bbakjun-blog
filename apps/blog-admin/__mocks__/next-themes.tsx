import { type ReactNode } from 'react';

export function useTheme() {
  return {
    theme: 'light',
    setTheme: () => {},
    themes: ['light', 'dark'],
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
