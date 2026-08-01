import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LifeBuoy, MessageCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import apiClient from '../services/apiClient';
import { getUserFacingErrorMessage } from '../utils/userFacingError';
import {
  ExperienceAlert,
  ExperiencePageShell,
  ExperiencePanel,
} from '../components/experience/ExperiencePageShell';

const FALLBACK_STATE_KEY = 'farmEazy_fallback_state';
const LAST_SYNC_KEY = 'farmEazy_lastSyncAt';

const TIPS = [
  'Irrigate in early morning windows to reduce evaporation loss.',
  'Rotate crops seasonally to improve soil health and yield.',
  'Use mulch around roots to hold moisture and limit weeds.',
  'Check nozzle pressure weekly for uniform irrigation coverage.',
];

const STATUS_META = {
  api: { title: 'API Cloud' },
  db: { title: 'Soil Database' },
  redis: { title: 'Water Cache' },
  payment: { title: 'Payments Engine' },
  notification: { title: 'Alerts Relay' },
};

function getStoredFallbackState() {
  try {
    const raw = sessionStorage.getItem(FALLBACK_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return 'Not available';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Not available';
  return dt.toLocaleString();
}

function getHealthUrl() {
  const root = String(API_BASE_URL || '').replace(/\/api\/?$/, '');
  return `${root}/actuator/health/readiness`;
}

export default function PremiumFallback() {
  const navigate = useNavigate();
  const location = useLocation();

  const [retryCountdown, setRetryCountdown] = useState(12);
  const [retryStatus, setRetryStatus] = useState('Monitoring backend status');
  const [retryError, setRetryError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({});
  const [statusUpdatedAt, setStatusUpdatedAt] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  const fallbackState = useMemo(() => {
    const fromRoute = location.state && typeof location.state === 'object' ? location.state : null;
    return fromRoute || getStoredFallbackState();
  }, [location.state]);

  const cartItems = useMemo(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }, []);

  const lastSync = localStorage.getItem(LAST_SYNC_KEY);

  useEffect(() => {
    const ticker = setInterval(() => setTipIndex((prev) => (prev + 1) % TIPS.length), 7000);
    return () => clearInterval(ticker);
  }, []);

  const pingHealth = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryError('');
    try {
      const res = await fetch(getHealthUrl(), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-store' },
      });
      if (res.ok) {
        setRetryStatus('Backend is healthy. Returning to your dashboard.');
        setTimeout(() => navigate('/dashboard', { replace: true }), 450);
        return;
      }
      setRetryStatus('Backend is not ready yet.');
      setRetryError(`Health check returned HTTP ${res.status}. We will keep retrying automatically.`);
    } catch (err) {
      setRetryStatus('Network still unstable.');
      setRetryError(getUserFacingErrorMessage(err, 'Could not reach the server. Check your connection.'));
    } finally {
      setIsRetrying(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await apiClient.get('/system/full-status', { _skipFallback: true, _skipAuth: true });
      const services = response?.data?.services;
      if (services && typeof services === 'object') {
        setServiceStatus(services);
        setStatusUpdatedAt(new Date().toISOString());
        setRetryError('');
        return;
      }
      setRetryError('Status API returned an unexpected response shape.');
    } catch (err) {
      setRetryError(getUserFacingErrorMessage(err, 'Status API unreachable. Waiting for the next retry window.'));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          loadSystemStatus();
          return 12;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const statusCards = useMemo(() => {
    return Object.entries(serviceStatus).map(([key, value]) => {
      const statusObj = (value && typeof value === 'object') ? value : { status: value };
      const normalized = String(statusObj.status || 'UNKNOWN').toUpperCase();
      const tone = normalized === 'UP'
        ? 'border-emerald-400/35 bg-emerald-950/40 text-emerald-100'
        : normalized === 'DEGRADED'
          ? 'border-amber-400/35 bg-amber-950/40 text-amber-100'
          : 'border-rose-400/35 bg-rose-950/40 text-rose-100';

      return {
        key,
        title: STATUS_META[key]?.title || key,
        value: normalized,
        latencyMs: statusObj.latencyMs,
        circuitState: statusObj.circuitState,
        lastFailure: statusObj.lastFailure,
        tone,
      };
    });
  }, [serviceStatus]);

  const failureExplanation = fallbackState?.message
    || 'A protected service did not respond. Your session and cart snapshot are preserved.';

  return (
    <ExperiencePageShell
      variant="resilience"
      badge="FarmEazy resilience mode"
      title="Keeping your farm session alive"
      description="Instead of dropping you out, we switched to a protected experience while services recover. Live chat on the main app still connects to support agents on the support portal."
      meta={
        <>
          <p>Triggered endpoint: {fallbackState?.url || 'Not recorded'}</p>
          <p>HTTP status: {fallbackState?.status || 'Network'}</p>
        </>
      }
      actions={
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/30 p-4 min-w-[220px]">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/90">Recovery watch</p>
          <p className="text-sm text-white mt-2">Auto retry in {retryCountdown}s</p>
          <p className="text-xs text-emerald-100/80 mt-1">{retryStatus}</p>
          <button
            type="button"
            onClick={pingHealth}
            disabled={isRetrying}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-emerald-400 text-slate-900 hover:bg-emerald-300 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking…' : 'Retry now'}
          </button>
        </div>
      }
      aside={
        <ExperiencePanel
          title="Need help now?"
          description="Open live chat from the floating button on any main-app page, or call support directly."
        >
          <div className="space-y-3 mt-2">
            <a
              href="tel:+916301630368"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              <LifeBuoy className="h-4 w-4 text-emerald-300" />
              +91 63016 30368
            </a>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-950/40 px-4 py-3 text-sm font-semibold hover:bg-sky-900/50"
            >
              <MessageCircle className="h-4 w-4 text-sky-300" />
              Return to app (live chat)
            </button>
          </div>
        </ExperiencePanel>
      }
      footer={
        <p>
          Last successful sync: {formatDateTime(lastSync)} · Cart items cached: {cartItems.length}
        </p>
      }
    >
      {(retryError || failureExplanation) && (
        <ExperienceAlert tone="warning">
          <strong className="block font-semibold mb-1">What happened</strong>
          {failureExplanation}
          {retryError && <span className="block mt-2 text-amber-100/90">{retryError}</span>}
        </ExperienceAlert>
      )}

      <ExperiencePanel title="Live system health" description={`Updated ${formatDateTime(statusUpdatedAt)}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statusCards.length === 0 && (
            <p className="text-sm text-slate-400">Loading system status…</p>
          )}
          {statusCards.map((item) => (
            <div key={item.key} className={`rounded-xl border px-3 py-3 ${item.tone}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide">{item.title}</span>
                <span className="text-[11px] font-black">{item.value}</span>
              </div>
              <div className="mt-2 text-[11px] opacity-90 space-y-1">
                <div>Latency: {typeof item.latencyMs === 'number' ? `${item.latencyMs}ms` : 'N/A'}</div>
                <div>Breaker: {item.circuitState || 'N/A'}</div>
                {item.lastFailure ? <div className="truncate">Last error: {item.lastFailure}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </ExperiencePanel>

      <ExperiencePanel title="Farm tip while you wait">
        <p className="text-sm text-slate-200 leading-relaxed">{TIPS[tipIndex]}</p>
      </ExperiencePanel>
    </ExperiencePageShell>
  );
}
