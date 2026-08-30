import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

const MODES = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Monitor, label: 'System' },
];

function DarkModeToggle({ floating = false, className = '' }) {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();

  if (floating) {
    return (
      <button
        type="button"
        onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
        className={cn(
          'fixed bottom-6 right-6 z-[60] p-3 rounded-full shadow-lg border border-border bg-card',
          'transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center rounded-md border border-border bg-muted/50 p-0.5',
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      {MODES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setThemeMode(id)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
            themeMode === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label={label}
          aria-pressed={themeMode === id}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export default DarkModeToggle;
