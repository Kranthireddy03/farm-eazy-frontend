import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { buildCommandItems } from './navConfig';
import { useShell } from './ShellContext';
import { buildSupportPortalUrl, prepareSupportPortalHandoff } from '../../utils/supportPortal';

export default function CommandPalette() {
  const { commandOpen, setCommandOpen, closeCommandPalette } = useShell();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const openSupportPortal = useCallback((portalPath, mode) => {
    const handoffReady = prepareSupportPortalHandoff({ mode, redirect: portalPath, theme: isDark ? 'dark' : 'light' });
    if (!handoffReady) {
      navigate('/login');
      return;
    }
    const url = buildSupportPortalUrl({ portalPath, mode, redirect: portalPath, theme: isDark ? 'dark' : 'light' });
    if (url) window.location.assign(url);
  }, [isDark, navigate]);

  const items = useMemo(
    () => buildCommandItems({ navigate, isAuthenticated, isAdmin, openSupportPortal }),
    [navigate, isAuthenticated, isAdmin, openSupportPortal],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((open) => !open);
        setQuery('');
        setActiveIndex(0);
      }
      if (e.key === 'Escape') closeCommandPalette();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeCommandPalette, setCommandOpen]);

  useEffect(() => {
    const onTheme = () => toggleTheme();
    window.addEventListener('farmeazy:toggle-theme', onTheme);
    return () => window.removeEventListener('farmeazy:toggle-theme', onTheme);
  }, [toggleTheme]);

  useEffect(() => {
    if (!commandOpen) return;
    setActiveIndex(0);
  }, [query, commandOpen]);

  const runItem = (item) => {
    closeCommandPalette();
    setQuery('');
    if (item.id === 'theme-toggle') {
      toggleTheme();
      return;
    }
    item.action?.();
  };

  const onPaletteKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      runItem(filtered[activeIndex]);
    }
  };

  if (!commandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh] bg-slate-950/60 backdrop-blur-sm"
      onClick={closeCommandPalette}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-400">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onPaletteKeyDown}
            placeholder="Search pages, actions, settings…"
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-sm"
            autoFocus
          />
          <kbd className="hidden sm:inline text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</kbd>
        </div>
        <ul className="max-h-[min(60vh,420px)] overflow-y-auto py-2 custom-scrollbar">
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">No matches for &quot;{query}&quot;</li>
          )}
          {filtered.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => runItem(item)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                  index === activeIndex
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-lg w-8 text-center shrink-0">{item.icon}</span>
                <span className="flex-1 font-medium">{item.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex justify-between">
          <span>↑↓ navigate · Enter select</span>
          <span><kbd className="font-mono">Ctrl</kbd>+<kbd className="font-mono">K</kbd></span>
        </div>
      </div>
    </div>
  );
}
