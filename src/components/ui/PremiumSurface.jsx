import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export function PageCanvas({ children, className = '' }) {
  const { isDark } = useTheme()

  return (
    <div className={`premium-shell min-h-screen ${isDark ? 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.16),transparent_26%),linear-gradient(to_bottom,#020617,#0f172a)] text-slate-100' : 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.16),transparent_24%),linear-gradient(to_bottom,#f8fffd,#eefbf7)] text-slate-900'} ${className}`}>
      <div className="absolute inset-0 premium-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 premium-noise opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function HeroFrame({ eyebrow, title, description, actions, side, className = '' }) {
  const { isDark } = useTheme()

  return (
    <section className={`px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-12 ${className}`}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-6 xl:gap-8 items-center">
        <div className="space-y-6 fade-up">
          {eyebrow && (
            <div className={`premium-chip ${isDark ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-white/80 text-emerald-700'}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {eyebrow}
            </div>
          )}
          <div className="space-y-4 max-w-3xl">
            <h1 className={`text-4xl md:text-5xl xl:text-6xl font-black tracking-tight leading-[1.03] ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {title}
            </h1>
            <p className={`text-base md:text-lg xl:text-xl leading-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {description}
            </p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>

        <div className="fade-up-delay-1">
          {side}
        </div>
      </div>
    </section>
  )
}

export function GlassPanel({ children, className = '' }) {
  return <div className={`premium-panel hover-lift ${className}`}>{children}</div>
}

export function StrongPanel({ children, className = '' }) {
  return <div className={`premium-panel-strong hover-lift ${className}`}>{children}</div>
}

export function SectionTitle({ eyebrow, title, text, className = '' }) {
  const { isDark } = useTheme()

  return (
    <div className={`space-y-3 ${className}`}>
      {eyebrow && <p className={`text-xs font-bold uppercase tracking-[0.32em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{eyebrow}</p>}
      <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
      {text && <p className={`text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>}
    </div>
  )
}

export function PillButton({ children, to, onClick, active = false, className = '', external = false }) {
  const { isDark } = useTheme()
  const baseClass = active
    ? 'premium-button bg-emerald-600 text-white'
    : `premium-button-secondary ${isDark ? 'border-slate-700 bg-slate-900/60 text-slate-100 hover:border-emerald-400/40 hover:bg-slate-800' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-emerald-300 hover:bg-white'}`

  if (to) {
    return <Link to={to} onClick={onClick} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={`${baseClass} ${className}`}>{children}</Link>
  }

  return <button type="button" onClick={onClick} className={`${baseClass} ${className}`}>{children}</button>
}

export function FlipCard({ frontTitle, frontText, backTitle, backText, icon, className = '' }) {
  const { isDark } = useTheme()

  return (
    <div className={`flip-perspective ${className}`}>
      <div className={`flip-card relative min-h-[22rem] rounded-[1.5rem] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        <div className={`flip-card-face absolute inset-0 rounded-[1.5rem] border ${isDark ? 'border-slate-700 bg-slate-900/90' : 'border-slate-200 bg-white/90'} p-6 flex flex-col justify-between shadow-[0_20px_60px_rgba(15,23,42,0.16)]`}>
          <div>
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-black">{frontTitle}</h3>
            <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{frontText}</p>
          </div>
          <p className={`text-xs uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Hover to reveal</p>
        </div>
        <div className={`flip-card-face flip-card-back absolute inset-0 rounded-[1.5rem] border ${isDark ? 'border-emerald-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950' : 'border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-cyan-50'} p-6 flex flex-col justify-between shadow-[0_20px_60px_rgba(15,23,42,0.16)]`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>More detail</p>
            <h3 className="mt-3 text-xl font-black">{backTitle}</h3>
            <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{backText}</p>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-white/75'}`}>
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Built for clarity</div>
            <div className={`mt-1 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Fast scanning, subtle motion, and actionable presentation.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ScrollRail({ children, className = '' }) {
  return <div className={`scroll-snap-x overflow-x-auto pb-2 ${className}`}>{children}</div>
}

export function PageFooter({ headline, description, actions, className = '' }) {
  const { isDark } = useTheme()

  return (
    <section className={`rounded-[2rem] border p-5 md:p-6 shadow-2xl transition-all ${isDark ? 'border-slate-700 bg-slate-900/90 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'} ${className}`}>
      <div className="grid gap-5 md:grid-cols-[1.3fr_0.9fr] items-center">
        <div className="space-y-3">
          <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Next step</p>
          <h3 className="text-xl md:text-2xl font-black leading-tight">Choose your next action.</h3>
          <p className={`text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{description || 'Select a page to continue exploring the platform, view services, or contact support.'}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          {actions}
        </div>
      </div>
    </section>
  )
}
