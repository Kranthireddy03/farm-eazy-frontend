/**
 * Theme Context — light, dim, dark, and system preference.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'farmEazy_theme_mode';

const ThemeContext = createContext();

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDark(mode) {
  if (mode === 'system') return getSystemDark();
  return mode === 'dark' || mode === 'dim';
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dim' || saved === 'dark' || saved === 'system') return saved;
    const legacy = localStorage.getItem('farmEazy_theme');
    if (legacy === 'light' || legacy === 'dark') return legacy;
    return 'system';
  });

  const isDarkMode = resolveIsDark(themeMode);

  const applyTheme = useCallback((mode) => {
    const root = document.documentElement;
    const isDark = mode === 'system' ? getSystemDark() : (mode === 'dark' || mode === 'dim');
    const isDim = mode === 'dim';

    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    root.classList.toggle('theme-dim', isDim);

    localStorage.setItem('farmEazy_theme', isDark ? 'dark' : 'light');
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode, applyTheme]);

  useEffect(() => {
    if (themeMode !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode, applyTheme]);

  const setThemeModeSafe = (mode) => {
    if (mode === 'light' || mode === 'dim' || mode === 'dark' || mode === 'system') {
      setThemeMode(mode);
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'light') return 'dim';
      if (prev === 'dim') return 'dark';
      if (prev === 'dark') return 'light';
      return isDarkMode ? 'light' : 'dark';
    });
  };

  const setTheme = (theme) => setThemeModeSafe(theme === 'dark' ? 'dark' : theme === 'dim' ? 'dim' : 'light');

  const value = {
    isDarkMode,
    isDark: isDarkMode,
    isDim: themeMode === 'dim',
    themeMode,
    toggleTheme,
    setTheme,
    setThemeMode: setThemeModeSafe,
    theme: isDarkMode ? 'dark' : 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
