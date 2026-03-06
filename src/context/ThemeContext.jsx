/**
 * Theme Context
 * 
 * Manages dark/light mode state across the entire application.
 * Provides theme state and toggle function to all components.
 */

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage, default to dark
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('farmEazy_theme')
    // Default to dark mode if no preference saved
    return savedTheme === null ? true : savedTheme === 'dark'
  })

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    
    if (isDarkMode) {
      root.classList.add('dark')
      root.classList.remove('light')
      localStorage.setItem('farmEazy_theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      localStorage.setItem('farmEazy_theme', 'light')
    }
  }, [isDarkMode])

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  // Set specific theme
  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark')
  }

  const value = {
    isDarkMode,
    isDark: isDarkMode, // alias for convenience
    toggleTheme,
    setTheme,
    theme: isDarkMode ? 'dark' : 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
