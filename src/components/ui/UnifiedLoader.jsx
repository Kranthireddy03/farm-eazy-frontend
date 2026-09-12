import React from 'react';

/**
 * FarmEazy Signature Ultra-Premium Agricultural Biome Loader
 * 
 * High-performance, GPU-accelerated signature loader featuring:
 * - Dual counter-rotating luminous energy orbits with gradient tails
 * - Floating seed/dewdrop particle satellites
 * - Multi-layered organic leaf/sprout emblem with radial ambient glow
 * - Dynamic light/dark theme adaptation and configurable sizing
 */
export function UnifiedLoader({
  size = 'md',
  message = null,
  subtitle = null,
  fullScreen = false,
  className = '',
  color = 'primary', // 'primary' | 'emerald' | 'teal' | 'amber' | 'white'
}) {
  const sizeMap = {
    xs: { dim: 24, core: 14, icon: 10, stroke: 2, text: 'text-xs', sub: 'text-[10px]' },
    sm: { dim: 36, core: 22, icon: 14, stroke: 2.2, text: 'text-xs', sub: 'text-[10px]' },
    md: { dim: 56, core: 34, icon: 20, stroke: 2.8, text: 'text-sm', sub: 'text-xs' },
    lg: { dim: 80, core: 48, icon: 28, stroke: 3.2, text: 'text-base', sub: 'text-xs' },
    xl: { dim: 110, core: 66, icon: 38, stroke: 3.8, text: 'text-lg', sub: 'text-sm' },
  };

  const cfg = sizeMap[size] || sizeMap.md;

  const colorConfig = {
    primary: {
      grad1: '#10b981', // emerald-500
      grad2: '#14b8a6', // teal-500
      grad3: '#059669', // emerald-600
      glow: 'rgba(16, 185, 129, 0.28)',
      icon: 'text-emerald-600 dark:text-emerald-400',
      track: 'stroke-emerald-500/20 dark:stroke-emerald-400/15',
    },
    emerald: {
      grad1: '#34d399',
      grad2: '#10b981',
      grad3: '#047857',
      glow: 'rgba(52, 211, 153, 0.3)',
      icon: 'text-emerald-500',
      track: 'stroke-emerald-500/20',
    },
    teal: {
      grad1: '#2dd4bf',
      grad2: '#06b6d4',
      grad3: '#0f766e',
      glow: 'rgba(45, 212, 191, 0.3)',
      icon: 'text-teal-500',
      track: 'stroke-teal-500/20',
    },
    amber: {
      grad1: '#fbbf24',
      grad2: '#f59e0b',
      grad3: '#d97706',
      glow: 'rgba(251, 191, 36, 0.3)',
      icon: 'text-amber-500',
      track: 'stroke-amber-500/20',
    },
    white: {
      grad1: '#ffffff',
      grad2: '#cbd5e1',
      grad3: '#94a3b8',
      glow: 'rgba(255, 255, 255, 0.2)',
      icon: 'text-white',
      track: 'stroke-white/25',
    },
  };

  const theme = colorConfig[color] || colorConfig.primary;
  const uid = React.useId().replace(/:/g, '');

  const visual = (
    <div 
      className="relative flex items-center justify-center select-none" 
      style={{ width: cfg.dim, height: cfg.dim }}
    >
      {/* 1. Ambient Radial Breathing Glow */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none transition-all"
        style={{
          background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
          transform: 'scale(1.4)',
          animation: 'fe-pulse-aura 3s ease-in-out infinite',
        }}
      />

      {/* 2. Outer Orbital Energy SVG */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ animation: 'fe-spin-clockwise 2.8s linear infinite' }}
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-outer-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.grad1} stopOpacity="1" />
            <stop offset="60%" stopColor={theme.grad2} stopOpacity="0.8" />
            <stop offset="100%" stopColor={theme.grad3} stopOpacity="0" />
          </linearGradient>
          <filter id={`blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* Outer subtle guide track */}
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          className={theme.track} 
          strokeWidth={cfg.stroke} 
          strokeDasharray="4 6"
        />

        {/* Outer glowing sweeping arc */}
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          stroke={`url(#grad-outer-${uid})`} 
          strokeWidth={cfg.stroke * 1.8} 
          strokeLinecap="round" 
          strokeDasharray="65 180" 
        />

        {/* Glowing Head Particle */}
        <circle 
          cx="50" 
          cy="8" 
          r="3" 
          fill={theme.grad1} 
          filter={`url(#blur-${uid})`}
        />
        <circle 
          cx="50" 
          cy="8" 
          r="2" 
          fill="#ffffff" 
        />
      </svg>

      {/* 3. Counter-Rotating Inner Seed Ring */}
      <svg 
        className="absolute" 
        style={{ 
          width: cfg.core * 1.25, 
          height: cfg.core * 1.25, 
          animation: 'fe-spin-counter 3.6s linear infinite' 
        }}
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          stroke={theme.grad2} 
          strokeWidth="3.2" 
          strokeDasharray="24 38" 
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </svg>

      {/* 4. Center Geometric Sprout & Leaf Pod */}
      <div 
        className="relative z-10 flex items-center justify-center rounded-2xl bg-card/90 dark:bg-slate-900/90 backdrop-blur-md border border-border/80 shadow-md transition-transform"
        style={{ 
          width: cfg.core, 
          height: cfg.core,
          animation: 'fe-sprout-breathe 2.4s ease-in-out infinite'
        }}
      >
        <svg 
          style={{ width: cfg.icon, height: cfg.icon }} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={theme.icon}
        >
          {/* Natural Organic Sprout Geometry */}
          <path d="M7 20h10" />
          <path d="M10 20c5.5-2.5.8-6.4 3-13" />
          <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" fill="currentColor" fillOpacity="0.15" />
          <path d="M14.1 6a7 7 0 0 1 4 2c1.2 1.5 1.5 3.3 1.5 4.5-1.7-.1-3.3-.8-4.3-1.8-.8-.8-1.3-1.8-1.5-2.8a6.3 6.3 0 0 1 .3-1.9z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      </div>

      <style>{`
        @keyframes fe-spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fe-spin-counter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fe-pulse-aura {
          0%, 100% { opacity: 0.6; transform: scale(1.3); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes fe-sprout-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center p-8 rounded-3xl bg-card/95 dark:bg-slate-900/95 border border-border/80 shadow-2xl max-w-sm w-full mx-4 text-center">
          {visual}
          {message && (
            <h3 className={`mt-5 font-bold text-foreground ${cfg.text} tracking-tight`}>
              {message}
            </h3>
          )}
          {subtitle && (
            <p className={`mt-1 text-muted-foreground ${cfg.sub} leading-relaxed`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-3 select-none ${className}`} role="status" aria-live="polite">
      {visual}
      {message && (
        <p className={`mt-3 font-semibold text-foreground ${cfg.text} tracking-tight text-center`}>
          {message}
        </p>
      )}
      {subtitle && (
        <p className={`mt-0.5 text-muted-foreground ${cfg.sub} text-center`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default UnifiedLoader;
