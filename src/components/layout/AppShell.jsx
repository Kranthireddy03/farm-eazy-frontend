/**
 * Production app shell: sidebar + sticky header + location bar.
 * Clean SaaS layout — no glassmorphism or gradient chrome.
 */
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Home, LayoutDashboard, Sprout, Droplets, ShoppingCart, Store,
  LifeBuoy, Settings, Bell, MapPin, Search, Menu, ChevronLeft,
  LogOut, Package,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import NotificationBell from '../NotificationBell';
import ChatSupport from '../ChatSupport';
import LocationBar from '../LocationBar';
import AppOpenLocationModal from '../AppOpenLocationModal';
import InactivityWarning from '../InactivityWarning';
import { useShell } from '../shell/ShellContext';
import { useAuth } from '../../context/AuthContext';
import { useCoin } from '../../context/CoinContext';
import { useTheme } from '../../context/ThemeContext';
import useSessionTimeout from '../../hooks/useSessionTimeout';
import AuthService from '../../services/AuthService';
import apiClient from '../../services/apiClient';

const NAV = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Farms', path: '/farms', icon: Sprout },
  { name: 'Crops', path: '/crops', icon: Sprout },
  { name: 'Irrigation', path: '/irrigation', icon: Droplets },
  { name: 'Services', path: '/irrigation-services', icon: Package },
  { name: 'Marketplace', path: '/buying', icon: ShoppingCart },
  { name: 'Support', path: '/support', icon: LifeBuoy },
  { name: 'Vendor', path: '/vendor-dashboard', icon: Store },
];

export default function AppShell({ children, onShowTour }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openCommandPalette } = useShell();
  const { isDark } = useTheme();
  const { logout: authLogout, getUserEmail, getUserName, isAuthenticated } = useAuth();
  const { coins, refreshCoins } = useCoin();
  const [collapsed, setCollapsed] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const hasRedirectedRef = useRef(false);

  const userEmail = getUserEmail();
  const userUsername = localStorage.getItem('farmEazy_username') || getUserName();
  const userId = localStorage.getItem('farmEazy_userId');

  const { timeRemaining, showWarning, resetTimer, formatTimeDisplay } = useSessionTimeout();

  useEffect(() => {
    if (hasRedirectedRef.current) return;
    const token = localStorage.getItem('farmEazy_token');
    const email = localStorage.getItem('farmEazy_email');
    if (!token || !email) {
      hasRedirectedRef.current = true;
      sessionStorage.setItem('logoutReason', 'Session expired. Please login again.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]');
      setCartCount(cart.reduce((s, i) => s + (i.quantity || 1), 0));
    };
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    window.addEventListener('storage', updateCart);
    return () => {
      window.removeEventListener('cart-updated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showUserMenu]);

  useEffect(() => {
    apiClient.post('/coins/login-bonus').catch(() => {}).finally(() => refreshCoins?.());
  }, [refreshCoins]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    authLogout('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card transition-[width] duration-200 shrink-0',
          collapsed ? 'w-[4.5rem]' : 'w-60',
        )}
      >
        <div className="h-14 flex items-center gap-2 px-3 border-b border-border">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">FE</div>
          {!collapsed && <span className="font-semibold text-sm truncate">FarmEazy</span>}
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ name, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span>{name}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="h-full px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate('/dashboard')} aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-sm truncate hidden sm:block">Farm management</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={openCommandPalette}>
                <Search className="h-4 w-4" />
                <span className="text-muted-foreground">Search</span>
                <kbd className="text-[10px] font-mono text-muted-foreground">⌘K</kbd>
              </Button>

              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>

              <NotificationBell />

              <Button variant="outline" size="icon" onClick={() => navigate('/cart')} className="relative" aria-label="Cart">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {coins?.totalCoins != null && (
                <Badge variant="secondary" className="hidden md:inline-flex">🪙 {coins.totalCoins}</Badge>
              )}

              <Badge variant="outline" className="hidden sm:inline-flex font-mono text-xs">
                {formatTimeDisplay(timeRemaining)}
              </Badge>

              <div className="relative" ref={userMenuRef}>
                <Button variant="outline" size="sm" onClick={() => setShowUserMenu((v) => !v)} className="gap-2 max-w-[140px]">
                  <span className="truncate">{userUsername || 'Account'}</span>
                </Button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-popover shadow-md z-50 py-1 text-sm">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-medium truncate">{userUsername}</p>
                      <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-muted" onClick={() => { setShowUserMenu(false); navigate('/settings'); }}>
                      Settings
                    </button>
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-destructive" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <LocationBar />
        <AppOpenLocationModal />

        <main className="flex-1 p-4 md:p-6 w-full max-w-screen-2xl mx-auto min-h-[calc(100vh-12rem)]">
          {children || <Outlet />}
        </main>

        <footer className="border-t border-border py-4 px-6 text-xs text-muted-foreground flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} FarmEazy</span>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </footer>
      </div>

      <InactivityWarning showWarning={showWarning} timeRemaining={timeRemaining} onStayOnline={resetTimer} />
      <ChatSupport />
    </div>
  );
}
