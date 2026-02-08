import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, COLORS_LIGHT, STORAGE_KEYS } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColors = typeof COLORS | typeof COLORS_LIGHT;

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.THEME)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeState(stored);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
    } catch (e) {
      if (__DEV__) console.warn('Failed to persist theme:', e);
    }
  };

  const resolvedScheme: 'light' | 'dark' =
    theme === 'system'
      ? (systemScheme ?? 'dark')
      : theme;

  const isDark = resolvedScheme === 'dark';

  const colors = useMemo(
    () => (isDark ? COLORS : COLORS_LIGHT),
    [isDark]
  );

  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      setTheme,
      isDark,
      colors,
    }),
    [theme, isDark, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
