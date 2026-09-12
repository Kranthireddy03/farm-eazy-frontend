import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Compass, 
  ArrowLeft, 
  Home, 
  ShoppingBag, 
  MessageSquare, 
  Ticket, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { GlassPanel } from '../components/ui/PremiumSurface';
import UnifiedLoader from '../components/ui/UnifiedLoader';

export default function NotFound({ 
  title = "Page Not Available or Relocated", 
  message = "The page, marketplace resource, or workspace you are trying to reach could not be found or has moved.",
  circuitBreak = false,
  error = null,
  onRetry = null
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenLiveSupport = () => {
    // Check if customer live support widget trigger exists
    const chatBtn = document.querySelector('[data-chat-trigger="support"]');
    if (chatBtn) {
      chatBtn.click();
    } else {
      navigate('/support');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 md:p-8 select-none">
      <div className="max-w-3xl w-full mx-auto space-y-6 animate-fadeIn">
        
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/20 backdrop-blur-xl shadow-2xl p-6 sm:p-10">
          {/* Ambient Background Decorative Glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            
            {/* Animated Icon & Badge */}
            <div className="relative">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg group">
                <Compass className="h-12 w-12 text-primary animate-pulse transition-transform duration-700 group-hover:rotate-45" />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                {circuitBreak ? 'Circuit Break' : '404 Error'}
              </span>
            </div>

            {/* Headline & Description */}
            <div className="space-y-2 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {circuitBreak ? 'Service Unavailable / Recovered' : title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {message}
              </p>
              {location.pathname && (
                <div className="inline-block mt-2 px-3 py-1 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground font-mono">
                  Requested URI: <span className="text-foreground font-semibold">{location.pathname}</span>
                </div>
              )}
            </div>

            {/* Error detail if from ErrorBoundary */}
            {error && (
              <div className="w-full max-w-lg p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive text-left overflow-x-auto">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Diagnostics Trace:
                </div>
                <div className="font-mono break-all">{error?.message || String(error)}</div>
              </div>
            )}

            {/* Action Buttons Grid */}
            <div className="pt-3 w-full flex flex-wrap items-center justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="rounded-xl flex items-center gap-2 font-semibold shadow-sm hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Go Back
              </Button>

              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  className="rounded-xl flex items-center gap-2 font-semibold bg-gradient-to-r from-teal-500 to-primary text-white shadow-lg"
                >
                  <RefreshCw className="h-4 w-4" /> Retry Request
                </Button>
              )}

              <Button 
                onClick={() => navigate('/')} 
                className="rounded-xl flex items-center gap-2 font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Home className="h-4 w-4" /> Return to Home
              </Button>

              <Button 
                variant="outline"
                onClick={() => navigate('/products')} 
                className="rounded-xl flex items-center gap-2 font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <ShoppingBag className="h-4 w-4" /> Marketplace
              </Button>
            </div>

            {/* Dedicated Support Section */}
            <div className="w-full pt-6 mt-6 border-t border-border/60 grid sm:grid-cols-2 gap-3.5 text-left">
              <div 
                onClick={handleOpenLiveSupport}
                className="p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition cursor-pointer flex items-start gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Connect with Live Support
                    <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                    Chat directly with an active FarmEazy specialist for assistance.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => navigate('/support')}
                className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-muted/40 transition cursor-pointer flex items-start gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Raise Support Ticket</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                    Log an inquiry or service request tracked with official SLA guarantees.
                  </p>
                </div>
              </div>
            </div>

            {/* System Status Ticker */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>FarmEazy Core Network Operational · 99.98% Uptime</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
