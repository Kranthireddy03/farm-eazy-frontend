import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, CloudSun, Monitor, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export const THEME_MODES = [
  { id: 'light', icon: Sun, label: 'Light', desc: 'Crisp bright mode' },
  { id: 'dim', icon: CloudSun, label: 'Dim', desc: 'Eye comfort / twilight' },
  { id: 'dark', icon: Moon, label: 'Dark', desc: 'Deep midnight dark' },
  { id: 'system', icon: Monitor, label: 'Auto', desc: 'System preference' },
];

function DarkModeToggle({ variant = 'segmented', className = '' }) {
  const { themeMode, setThemeMode, isDim, isDarkMode } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const activeMode = THEME_MODES.find((m) => m.id === themeMode) || THEME_MODES[3];
  const ActiveIcon = activeMode.icon;

  // Compact header icon + dropdown (ideal for tight header spaces or mobile)
  if (variant === 'dropdown') {
    return (
      <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground transition-all duration-200 text-xs font-medium shadow-sm hover:shadow active:scale-95"
          aria-label="Theme selector"
          title={`Theme: ${activeMode.label}`}
        >
          <ActiveIcon className={cn('h-4 w-4 transition-transform', themeMode === 'light' ? 'text-amber-500' : themeMode === 'dim' ? 'text-indigo-400' : 'text-cyan-400')} />
          <span className="hidden md:inline font-medium text-xs">{activeMode.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Theme & Contrast
            </div>
            {THEME_MODES.map(({ id, icon: Icon, label, desc }) => {
              const isActive = themeMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setThemeMode(id);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left group',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-foreground hover:bg-muted/80'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-foreground')} />
                    <div>
                      <div className="leading-none">{label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
                    </div>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Segmented Header Scroller (visible at all times with 4 sensitivity levels)
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-2xl border border-border/80 bg-muted/40 p-0.5 shadow-inner backdrop-blur-md',
        className
      )}
      role="group"
      aria-label="Theme selector"
    >
      {THEME_MODES.map(({ id, icon: Icon, label }) => {
        const isActive = themeMode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setThemeMode(id)}
            className={cn(
              'relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            )}
            title={`${label} Mode`}
            aria-pressed={isActive}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5',
                isActive
                  ? id === 'light'
                    ? 'text-amber-500'
                    : id === 'dim'
                    ? 'text-indigo-400'
                    : id === 'dark'
                    ? 'text-cyan-400'
                    : 'text-emerald-500'
                  : 'text-muted-foreground'
              )}
            />
            <span className="hidden lg:inline text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default DarkModeToggle;
