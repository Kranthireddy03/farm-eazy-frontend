import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PUBLIC_NAV } from './navConfig';
import { useShell } from './ShellContext';
import DarkModeToggle from '../DarkModeToggle';
import NotificationBell from '../NotificationBell';

/**
 * Unified header for public & auth-aware marketing pages.
 * Theme toggle and command palette are always visible in the bar.
 */
export default function UnifiedHeader() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const { openCommandPalette } = useShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const shellClass = isDark
    ? 'bg-slate-950/90 border-slate-800/80 backdrop-blur-xl'
    : 'bg-white/90 border-white/90 backdrop-blur-xl';

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-4 md:px-6 pt-2">
      <div className={`${shellClass} premium-panel shadow-[0_12px_50px_rgba(15,23,42,0.12)] border rounded-2xl`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMenuOpen(false)}>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg text-xl">🌾</div>
            <div className="leading-tight hidden xs:block">
              <p className={`font-black tracking-tight text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-950'}`}>FarmEazy</p>
              <p className={`text-[10px] uppercase tracking-[0.25em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Smart Farm Platform</p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            {PUBLIC_NAV.map((item) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-full transition ${isActive
                    ? (isDark ? 'text-white bg-emerald-500/15 ring-1 ring-emerald-400/30' : 'text-emerald-900 bg-emerald-100 ring-1 ring-emerald-300/40')
                    : (isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80')}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openCommandPalette}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition ${isDark ? 'border-slate-700 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}`}
              title="Command palette (Ctrl+K)"
            >
              <span>🔍</span>
              <span className="hidden md:inline">Search</span>
              <kbd className="font-mono text-[10px] opacity-60">⌘K</kbd>
            </button>

            <DarkModeToggle />

            {isAuthenticated && (
              <>
                <NotificationBell />
                <Link
                  to="/dashboard"
                  className="hidden md:inline-flex premium-button bg-emerald-600 text-white text-sm px-4 py-2"
                >
                  Dashboard
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className={`premium-button-secondary text-sm px-4 py-2 ${isDark ? 'border-slate-700 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  Sign in
                </Link>
                <Link to="/register" className="premium-button bg-emerald-600 text-white text-sm px-4 py-2">
                  Sign up
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              className={`xl:hidden h-10 w-10 rounded-xl border flex items-center justify-center ${isDark ? 'border-slate-700 text-slate-100 bg-white/5' : 'border-slate-200 text-slate-700 bg-white/80'}`}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className={`xl:hidden border-t ${isDark ? 'border-slate-800 bg-slate-950/95' : 'border-slate-100 bg-white/95'} backdrop-blur-xl rounded-b-2xl`}>
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); openCommandPalette(); }}
                className={`px-4 py-3 rounded-xl text-left text-sm font-medium ${isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                🔍 Search & commands (Ctrl+K)
              </button>
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl transition ${isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="premium-button bg-emerald-600 text-white text-center mt-2">
                  Open dashboard
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="premium-button-secondary text-center">Sign in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="premium-button bg-emerald-600 text-white text-center">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
