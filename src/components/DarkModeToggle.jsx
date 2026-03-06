/**
 * Theme Toggle Component
 * 
 * A floating button that toggles between dark and light modes.
 * Uses ThemeContext for state management and persists preference.
 * 
 * Props:
 * - floating: boolean - If true, renders as fixed floating button
 * - className: string - Additional CSS classes
 */

import { useTheme } from '../context/ThemeContext';

function DarkModeToggle({ floating = false, className = '' }) {
  const { isDarkMode, toggleTheme } = useTheme();

  // Floating button styles (fixed position, always visible)
  if (floating) {
    return (
      <button
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg 
          transition-all duration-300 transform hover:scale-110 
          ${isDarkMode 
            ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400 border border-slate-500 shadow-slate-900/50' 
            : 'bg-white hover:bg-gray-100 text-slate-700 border border-gray-300 shadow-gray-300/50'
          }
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${className}`}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="text-2xl transition-transform duration-300">
          {isDarkMode ? '☀️' : '🌙'}
        </span>
      </button>
    );
  }

  // Inline button styles (for header/navbar)
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full shadow transition-all duration-300 
        ${isDarkMode 
          ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400 border border-slate-600' 
          : 'bg-gray-100 hover:bg-gray-200 text-slate-700 border border-gray-300'
        }
        focus:outline-none focus:ring-2 focus:ring-primary
        ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-xl">
        {isDarkMode ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

export default DarkModeToggle;
