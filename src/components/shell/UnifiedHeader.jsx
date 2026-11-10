import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PUBLIC_NAV } from './navConfig';
import { useShell } from './ShellContext';
import NotificationBell from '../NotificationBell';
import DarkModeToggle from '../DarkModeToggle';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import FarmEazyLogo from '../common/FarmEazyLogo';

export default function UnifiedHeader() {
  const { isAuthenticated } = useAuth();
  const { openCommandPalette } = useShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Icon */}
        <Link
          to="/"
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          aria-label="FarmEazy Home"
        >
          <FarmEazyLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
          {PUBLIC_NAV.map((item) => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs xl:text-sm font-medium transition-all whitespace-nowrap',
                  active
                    ? 'ops-chip-active ops-chip font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'ops-chip text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions & Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-lg border-border/80 text-xs font-medium hover:bg-muted/70 transition-colors"
            onClick={openCommandPalette}
            aria-label="Search and commands"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground hidden md:inline">Search</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">⌘K</kbd>
          </Button>

          <DarkModeToggle variant="dropdown" />

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="hidden md:inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 transition-all whitespace-nowrap"
            >
              Dashboard
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-border/80 bg-background/80 text-sm font-semibold text-foreground/90 hover:text-foreground hover:bg-muted hover:border-border transition-all whitespace-nowrap shadow-xs"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="h-9 px-4.5 inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all whitespace-nowrap"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-lg"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-1.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-foreground flex items-center gap-2.5 bg-muted/40 hover:bg-muted/70 transition-colors"
            onClick={() => {
              setMenuOpen(false);
              openCommandPalette();
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Search & commands</span>
            <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-background text-muted-foreground border border-border/50">⌘K</kbd>
          </button>

          <div className="py-1 flex flex-col gap-0.5">
            {PUBLIC_NAV.map((item) => {
              const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-border/60">
              <Link
                to="/dashboard"
                className="w-full text-center h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center shadow-sm hover:bg-emerald-500 transition-all"
                onClick={() => setMenuOpen(false)}
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex gap-2.5 pt-3 border-t border-border/60 mt-1">
              <Link
                to="/login"
                className="flex-1 text-center h-10 rounded-lg border border-border text-sm font-semibold flex items-center justify-center bg-background hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center hover:bg-emerald-500 shadow-sm transition-all"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
