/**
 * Theme Context — light, dark, and system preference.
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
  return mode === 'dark';
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    const legacy = localStorage.getItem('farmEazy_theme');
    if (legacy === 'light' || legacy === 'dark') return legacy;
    return 'system';
  });

  const isDarkMode = resolveIsDark(themeMode);

  const applyTheme = useCallback((dark) => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    localStorage.setItem('farmEazy_theme', dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    applyTheme(isDarkMode);
    localStorage.setItem(STORAGE_KEY, themeMode);
  }, [isDarkMode, themeMode, applyTheme]);

  useEffect(() => {
    if (themeMode !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode, applyTheme]);

  const setThemeModeSafe = (mode) => {
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      setThemeMode(mode);
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const dark = resolveIsDark(prev);
      return dark ? 'light' : 'dark';
    });
  };

  const setTheme = (theme) => setThemeModeSafe(theme === 'dark' ? 'dark' : 'light');

  const value = {
    isDarkMode,
    isDark: isDarkMode,
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
