// ThemeToggle.jsx
import React from 'react';

export default function ThemeToggle() {
  // Simple theme toggle (dark/light)
  const handleToggle = () => {
    document.documentElement.classList.toggle('dark');
  };
  return (
    <button className="btn btn-sm btn-outline" onClick={handleToggle}>
      Toggle Theme
    </button>
  );
}
