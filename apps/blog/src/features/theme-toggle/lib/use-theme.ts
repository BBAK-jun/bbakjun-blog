// Theme toggle hooks
import { useTheme as useNextTheme } from 'next-themes';
import { useState } from 'react';

export const useTheme = () => {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted] = useState(() => typeof window !== 'undefined');

  return {
    theme,
    setTheme,
    resolvedTheme,
    mounted,
    isDark: mounted && (theme === 'dark' || resolvedTheme === 'dark'),
    isLight: mounted && (theme === 'light' || resolvedTheme === 'light'),
    toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  };
};
