import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  RefreshCw, 
  MessageSquare, 
  Ticket, 
  ShoppingBag, 
  Home, 
  ArrowLeft, 
  Database, 
  Server, 
  Radio, 
  CreditCard, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import apiClient from '../services/apiClient';
import { Button } from '../components/ui/button';
import { UnifiedLoader } from '../components/ui/UnifiedLoader';

const FALLBACK_STATE_KEY = 'farmEazy_fallback_state';
const LAST_SYNC_KEY = 'farmEazy_lastSyncAt';

const NODE_SERVICES = [
  { id: 'gateway', name: 'API Gateway & Routing', icon: Server, status: 'MONITORING' },
  { id: 'db', name: 'Soil & Farm Database', icon: Database, status: 'PROTECTED' },
  { id: 'cache', name: 'Redis Realtime Cache', icon: Radio, status: 'ACTIVE' },
  { id: 'payments', name: 'Payments & Settlement', icon: CreditCard, status: 'SECURED' },
];

const EMERGENCY_FARM_TIPS = [
  'Irrigate during early morning or sunset windows to reduce evaporation loss.',
  'Rotate nitrogen-fixing legumes seasonally to enhance soil microbial activity.',
  'Apply organic mulch around roots to retain soil moisture during peak heat.',
  'Inspect sprayer and drip emitter pressure weekly for uniform crop coverage.',
  'Soil testing every pre-sowing season prevents excessive fertilizer overhead.',
];

function getStoredFallbackState() {
  try {
    const raw = sessionStorage.getItem(FALLBACK_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getHealthUrl() {
  const root = String(API_BASE_URL || '').replace(/\/api\/?$/, '');
  return `${root}/actuator/health/readiness`;
}

export default function PremiumFallback() {
  const navigate = useNavigate();
  const location = useLocation();

  const [countdown, setCountdown] = useState(10);
  const [retryStatus, setRetryStatus] = useState('Monitoring system health & connectivity…');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  const fallbackState = useMemo(() => {
    const fromRoute = location.state && typeof location.state === 'object' ? location.state : null;
    return fromRoute || getStoredFallbackState();
  }, [location.state]);

  const lastSync = localStorage.getItem(LAST_SYNC_KEY) || new Date().toLocaleTimeString();

  const cartCount = useMemo(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]');
      return Array.isArray(cart) ? cart.length : 0;
    } catch {
      return 0;
    }
  }, []);

  // Tip rotation
  useEffect(() => {
    const t = setInterval(() => setTipIndex((prev) => (prev + 1) % EMERGENCY_FARM_TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Ping health check
  const pingHealth = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryError('');
    setRetryStatus('Pinging FarmEazy cluster endpoint…');

    try {
      const res = await fetch(getHealthUrl(), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-store' },
      });
      if (res.ok) {
        setRetryStatus('FarmEazy backend is healthy! Redirecting to dashboard…');
        setTimeout(() => navigate('/dashboard', { replace: true }), 600);
        return;
      }
      setRetryStatus('Backend service stabilizing. Auto-retrying in a moment…');
      setRetryError(`Status HTTP ${res.status}: cluster node is synchronizing.`);
    } catch (err) {
      setRetryStatus('Service cluster unreachable. Protected mode active.');
      setRetryError('Network connection pending. System will retry automatically.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Automated countdown auto-ping
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          pingHealth();
          return 12;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRetrying]);

  const handleOpenLiveSupport = () => {
    const chatBtn = document.querySelector('[data-chat-trigger="support"]');
    if (chatBtn) {
      chatBtn.click();
    } else {
      navigate('/support');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 select-none bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_100%,rgba(20,184,166,0.08)_0%,transparent_50%)]">
      <div className="max-w-4xl w-full mx-auto space-y-6 animate-fadeIn">
        
        {/* Main Circuit Breaker Panel */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-10">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            
            {/* Header / Circuit Breaker State Indicator */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-6 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shrink-0">
                  <UnifiedLoader size="sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ⚡ Circuit Breaker Protected
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Session Protected & Preserved
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground mt-1 tracking-tight">
                    FarmEazy Resilience & Fallback Mode
                  </h1>
                </div>
              </div>

              {/* Countdown Ticker */}
              <div className="flex items-center gap-3 bg-muted/40 border border-border/60 px-4 py-2.5 rounded-2xl shrink-0">
                <Clock className="h-4 w-4 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
                <div className="text-left">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Auto Recovery In</div>
                  <div className="text-sm font-extrabold text-foreground">{countdown}s</div>
                </div>
              </div>
            </div>

            {/* Diagnostic Node Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Infrastructure Node Status</span>
                <span>Last Sync: {lastSync}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {NODE_SERVICES.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div 
                      key={node.id} 
                      className="p-3.5 rounded-2xl border border-border/70 bg-card/60 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground truncate">{node.name}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{node.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Monitoring Message */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{retryStatus}</span>
              </div>
              <Button 
                size="sm" 
                onClick={pingHealth} 
                disabled={isRetrying}
                className="rounded-xl flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-primary text-white font-semibold shadow shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Pinging…' : 'Check Now'}
              </Button>
            </div>

            {retryError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{retryError}</span>
              </div>
            )}

            {/* Interactive Fallback & Emergency Actions */}
            <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
              <div 
                onClick={handleOpenLiveSupport}
                className="p-4 rounded-2xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition cursor-pointer flex items-start gap-3.5 group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Connect with Live Support
                    <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Directly message on-duty FarmEazy specialists for technical or order assistance.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => navigate('/support')}
                className="p-4 rounded-2xl border border-border/80 bg-card/60 hover:bg-muted/40 transition cursor-pointer flex items-start gap-3.5 group"
              >
                <div className="h-10 w-10 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Raise Support Ticket</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Submit a prioritized inquiry with automatic escalation tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Offline Agronomy Wisdom Ticker */}
            <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex items-center gap-3">
              <span className="text-lg shrink-0">🌾</span>
              <div className="text-xs">
                <span className="font-bold text-foreground">Agronomy Best Practice: </span>
                <span className="text-muted-foreground italic">{EMERGENCY_FARM_TIPS[tipIndex]}</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="rounded-xl flex items-center gap-2 font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Go Back
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/products')} 
                  className="rounded-xl flex items-center gap-2 font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ShoppingBag className="h-4 w-4" /> Marketplace {cartCount > 0 && `(${cartCount} items)`}
                </Button>

                <Button 
                  onClick={() => navigate('/')} 
                  className="rounded-xl flex items-center gap-2 font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  <Home className="h-4 w-4" /> Home
                </Button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
