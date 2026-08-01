import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import UnifiedHeader from '../shell/UnifiedHeader';
import { cn } from '../../lib/utils';

export default function ProductPublicLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UnifiedHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className={cn('animate-in fade-in duration-300')}>
          {children || <Outlet />}
        </div>
      </main>
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FarmEazy — Smart farm operations</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
            <Link to="/privacy-policy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
