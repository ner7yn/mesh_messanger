// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { createTheme, AppTheme } from '../theme/index';
import { useAppStore } from '../store/index';

export function useTheme(): AppTheme {
  const systemColorScheme = useColorScheme();
  const themeSetting = useAppStore(s => s.theme);

  const isDark = useMemo(() => {
    if (themeSetting === 'dark') return true;
    if (themeSetting === 'light') return false;
    return systemColorScheme === 'dark';
  }, [themeSetting, systemColorScheme]);

  return useMemo(() => createTheme(isDark), [isDark]);
}
