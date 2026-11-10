import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import UnifiedHeader from '../shell/UnifiedHeader';
import FarmEazyLogo from '../common/FarmEazyLogo';
import { cn } from '../../lib/utils';

export default function ProductPublicLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col fe-premium-canvas">
      <UnifiedHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 min-h-[calc(100vh-12rem)]">
        <div className={cn('animate-in fade-in duration-300')}>
          {children || <Outlet />}
        </div>
      </main>
      <footer className="fe-footer-premium mt-auto border-t border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0">
              <FarmEazyLogo size="sm" subtitle="Smart farming, made easy" />
            </Link>
            <span className="hidden sm:inline text-xs text-muted-foreground/60">|</span>
            <span className="text-xs">© {new Date().getFullYear()} FarmEazy Inc. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/coverage" className="hover:text-foreground transition-colors">Coverage Zones</Link>
            <Link to="/public-services" className="hover:text-foreground transition-colors">Platform</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
