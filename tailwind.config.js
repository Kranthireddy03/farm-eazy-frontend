module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // Enable class-based dark mode (class on html element)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        // Light mode specific colors
        light: {
          bg: '#f8fafc',
          'bg-secondary': '#f1f5f9',
          'bg-card': '#ffffff',
          'bg-hover': '#e2e8f0',
          text: '#1e293b',
          'text-secondary': '#475569',
          'text-muted': '#64748b',
          border: '#cbd5e1',
        },
        // Dark mode specific colors (existing slate-based theme)
        dark: {
          bg: '#0f172a',
          'bg-secondary': '#1e293b',
          'bg-card': '#334155',
          'bg-hover': '#475569',
          text: '#f1f5f9',
          'text-secondary': '#cbd5e1',
          'text-muted': '#94a3b8',
          border: '#475569',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    textSizeAdjust: false, // Disable deprecated -webkit-text-size-adjust
  },
}
