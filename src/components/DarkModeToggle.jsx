import React, { useEffect, useState } from 'react';

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [dark]);

  return (
    <button
      className={`p-2 rounded-full shadow bg-slate-700 text-xl focus:outline-none transition-colors border border-slate-600 ${dark ? 'ring-2 ring-blue-500' : ''}`}
      aria-label="Toggle dark mode"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}

export default DarkModeToggle;
