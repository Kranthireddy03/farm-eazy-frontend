import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import apiClient from '../services/apiClient';

const FALLBACK_STATE_KEY = 'farmEazy_fallback_state';
const LAST_SYNC_KEY = 'farmEazy_lastSyncAt';

const TIPS = [
  'Irrigate in early morning windows to reduce evaporation loss.',
  'Rotate crops seasonally to improve soil health and yield.',
  'Use mulch around roots to hold moisture and limit weeds.',
  'Check nozzle pressure weekly for uniform irrigation coverage.'
];

const QUIZ = [
  { q: 'Which crop usually needs standing water for most of its cycle?', a: 'Paddy', options: ['Maize', 'Paddy', 'Groundnut'] },
  { q: 'Best time to irrigate in summer?', a: 'Early morning', options: ['Noon', 'Early morning', 'Midnight only'] },
  { q: 'What helps reduce soil moisture loss?', a: 'Mulching', options: ['Over-tilling', 'Mulching', 'Daily flooding'] }
];

const STATUS_META = {
  api: { icon: 'cloud', title: 'API Cloud' },
  db: { icon: 'sprout', title: 'Soil Database' },
  redis: { icon: 'droplet', title: 'Water Cache' },
  payment: { icon: 'tractor', title: 'Payments Engine' },
  notification: { icon: 'bell', title: 'Alerts Relay' }
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
  return `${root}/health`;
}

export default function PremiumFallback() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pulseStep, setPulseStep] = useState(0);
  const [cropStage, setCropStage] = useState('empty');
  const [harvests, setHarvests] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(12);
  const [retryStatus, setRetryStatus] = useState('Monitoring backend status');
  const [isRetrying, setIsRetrying] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({});
  const [statusUpdatedAt, setStatusUpdatedAt] = useState('');

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
    const ticker = setInterval(() => {
      setPulseStep((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    const tipTicker = setInterval(() => {
      setQuizIndex((prev) => (quizDone ? prev : prev));
    }, 7000);
    return () => clearInterval(tipTicker);
  }, [quizDone]);

  useEffect(() => {
    if (cropStage !== 'planted') return undefined;
    const growTimer = setTimeout(() => {
      setCropStage('ready');
    }, 3500);
    return () => clearTimeout(growTimer);
  }, [cropStage]);

  const pingHealth = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const res = await fetch(getHealthUrl(), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-store' }
      });
      if (res.ok) {
        setRetryStatus('Backend is healthy. Returning to dashboard');
        setTimeout(() => navigate('/dashboard', { replace: true }), 450);
        return;
      }
      setRetryStatus('Backend not ready yet. Staying connected');
    } catch {
      setRetryStatus('Network still unstable. Auto retry will continue');
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
        return;
      }
      setRetryStatus('Status API returned an unexpected response');
    } catch {
      setRetryStatus('Status API unreachable. Waiting for next retry window');
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
      const statusObj = (value && typeof value === 'object')
        ? value
        : { status: value };
      const normalized = String(statusObj.status || 'UNKNOWN').toUpperCase();
      const tone = normalized === 'UP' ? 'border-emerald-300/40 bg-emerald-900/20 text-emerald-100'
        : normalized === 'DEGRADED' ? 'border-amber-300/40 bg-amber-900/20 text-amber-100'
          : 'border-rose-300/40 bg-rose-900/20 text-rose-100';

      return {
        key,
        title: STATUS_META[key]?.title || key,
        icon: STATUS_META[key]?.icon || 'node',
        value: normalized,
        latencyMs: statusObj.latencyMs,
        circuitState: statusObj.circuitState,
        lastFailure: statusObj.lastFailure,
        checkedAt: statusObj.checkedAt,
        tone,
      };
    });
  }, [serviceStatus]);

  const handlePlant = () => {
    if (cropStage === 'empty') setCropStage('planted');
  };

  const handleHarvest = () => {
    if (cropStage === 'ready') {
      setHarvests((prev) => prev + 1);
      setCropStage('empty');
    }
  };

  const currentQuestion = QUIZ[quizIndex];

  const answerQuiz = (option) => {
    if (quizDone) return;
    if (option === currentQuestion.a) {
      setQuizScore((prev) => prev + 1);
    }
    if (quizIndex === QUIZ.length - 1) {
      setQuizDone(true);
      return;
    }
    setQuizIndex((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,#294f2f_0%,#173227_36%,#101a14_78%)] text-slate-100 px-4 py-6 sm:p-8">
      <style>{`\n        @keyframes drift {\n          0% { transform: translateY(0px); }\n          50% { transform: translateY(-8px); }\n          100% { transform: translateY(0px); }\n        }\n        @keyframes glow {\n          0% { box-shadow: 0 0 0 0 rgba(132, 204, 22, 0.25); }\n          100% { box-shadow: 0 0 0 18px rgba(132, 204, 22, 0); }\n        }\n      `}</style>

      <div className="max-w-6xl mx-auto space-y-5">
        <div className="rounded-3xl border border-lime-300/20 bg-black/20 backdrop-blur p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-lime-300/70">Farmeazy Resilience Mode</p>
              <h1 className="text-2xl sm:text-4xl font-black mt-2">Keeping your farm session alive</h1>
              <p className="text-sm sm:text-base text-slate-200/80 mt-2 max-w-2xl">
                Instead of dropping you out, we switched to a smart fallback experience while services recover.
              </p>
            </div>
            <div className="min-w-[220px] rounded-2xl border border-lime-200/20 bg-lime-100/5 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-3 w-3 rounded-full bg-lime-300"
                  style={{ animation: 'glow 1.1s infinite ease-out' }}
                />
                <span className="text-sm font-semibold">Live Recovery Watch</span>
              </div>
              <p className="text-xs text-slate-300 mt-3">Auto retry in {retryCountdown}s</p>
              <p className="text-xs text-lime-200 mt-1">{retryStatus}</p>
              <button
                onClick={pingHealth}
                disabled={isRetrying}
                className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold bg-lime-400 text-slate-900 hover:bg-lime-300 disabled:opacity-60"
              >
                {isRetrying ? 'Checking...' : 'Retry Now'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Mini Farm Loop</h2>
              <span className="text-xs text-lime-200/90">Harvests: {harvests}</span>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-lime-900/30 to-emerald-950/30 p-6 min-h-[190px] flex items-center justify-center">
              {cropStage === 'empty' && (
                <button onClick={handlePlant} className="rounded-2xl bg-lime-300/90 text-slate-900 px-6 py-3 font-bold hover:bg-lime-200">
                  Plant Seed
                </button>
              )}
              {cropStage === 'planted' && (
                <div className="text-center" style={{ animation: 'drift 1.4s infinite ease-in-out' }}>
                  <div className="text-2xl font-bold text-lime-200">Growing...</div>
                  <p className="text-sm mt-2 text-lime-200">Growing while we recover services...</p>
                </div>
              )}
              {cropStage === 'ready' && (
                <button onClick={handleHarvest} className="rounded-2xl bg-amber-300 text-slate-900 px-6 py-3 font-bold hover:bg-amber-200">
                  Harvest Crop
                </button>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-900/20 p-4">
              <p className="text-xs uppercase tracking-widest text-cyan-200/80">Farm Tip</p>
              <p className="mt-2 text-sm text-cyan-50">{TIPS[pulseStep]}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-widest text-lime-200/80">Live System Health</p>
                <span className="text-[11px] text-slate-300">Updated {formatDateTime(statusUpdatedAt)}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {statusCards.length === 0 && (
                  <div className="text-xs text-slate-300">Loading system status...</div>
                )}
                {statusCards.map((item) => (
                  <div key={item.key} className={`rounded-xl border px-3 py-3 ${item.tone}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold tracking-wide uppercase">{item.title}</span>
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
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold">Crop Quick Quiz</h2>
            {!quizDone ? (
              <>
                <p className="text-sm text-slate-200">{currentQuestion.q}</p>
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => answerQuiz(option)}
                      className="w-full text-left rounded-xl border border-slate-500/40 bg-slate-800/40 hover:bg-slate-700/60 px-3 py-2 text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-emerald-900/30 border border-emerald-300/30 p-4 text-sm">
                Quiz complete. Score: {quizScore}/{QUIZ.length}
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm space-y-2">
              <p className="font-semibold">Offline Snapshot</p>
              <p>Last successful sync: {formatDateTime(lastSync)}</p>
              <p>Cart items cached: {cartItems.length}</p>
              <p>Fallback triggered endpoint: {fallbackState?.url || 'Not available'}</p>
              <p>Status code: {fallbackState?.status || 'Network'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
