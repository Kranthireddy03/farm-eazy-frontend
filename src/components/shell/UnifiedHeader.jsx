import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PUBLIC_NAV } from './navConfig';
import { useShell } from './ShellContext';
import NotificationBell from '../NotificationBell';
import DarkModeToggle from '../DarkModeToggle';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export default function UnifiedHeader() {
  const { isAuthenticated } = useAuth();
  const { openCommandPalette } = useShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="fe-logo-mark">FE</div>
          <div className="leading-tight">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">FarmEazy</p>
            <p className="text-[10px] text-muted-foreground hidden sm:block">Farm operations platform</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  active ? 'ops-chip-active ops-chip' : 'ops-chip hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-8" onClick={openCommandPalette}>
            <Search className="h-3.5 w-3.5" />
            <span className="text-muted-foreground hidden md:inline">Search</span>
            <kbd className="text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </Button>
          <DarkModeToggle variant="dropdown" />
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <Link to="/dashboard" className="hidden md:inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden md:inline-flex h-8 items-center rounded-md px-3 text-sm font-medium hover:bg-muted">
                Sign in
              </Link>
              <Link to="/register" className="hidden md:inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Sign up
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMenuOpen((p) => !p)} aria-label="Menu">
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <button type="button" className="text-left py-2.5 text-sm font-medium text-foreground flex items-center gap-2 border-b border-border/40" onClick={() => { setMenuOpen(false); openCommandPalette(); }}>
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Search & commands</span>
            <kbd className="ml-auto text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </button>
          {PUBLIC_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border-b border-border/40 last:border-0" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="pt-2">
              <Link to="/dashboard" className="w-full text-center h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center shadow-sm" onClick={() => setMenuOpen(false)}>
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1 text-center h-9 rounded-lg border border-border text-sm font-medium flex items-center justify-center hover:bg-muted" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link to="/register" className="flex-1 text-center h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:bg-primary/90" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
