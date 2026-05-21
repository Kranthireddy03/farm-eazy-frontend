import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from './DarkModeToggle'

function PublicHeader() {
  const { isDark } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/public-services', label: 'Platform Overview' },
    { to: '/blog', label: 'Blog' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className="sticky top-0 z-40 px-4 md:px-6 pt-2">
      <div className={`${isDark ? 'bg-slate-950/88 border-slate-800/80 backdrop-blur-xl' : 'bg-white/88 border-white/90 backdrop-blur-xl'} premium-panel shadow-[0_12px_50px_rgba(15,23,42,0.16)]`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg text-xl">🌾</div>
            <div className="leading-tight">
              <p className={`font-black tracking-tight text-lg ${isDark ? 'text-white' : 'text-slate-950'}`}>FarmEazy</p>
              <p className={`text-[11px] uppercase tracking-[0.3em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Smart Farm Platform</p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-full transition ${isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <DarkModeToggle className="hidden md:inline-flex" />
            <Link
              to="/login"
              className={`premium-button-secondary ${isDark ? 'border-slate-700 bg-white/5 text-slate-100 hover:border-emerald-400/40 hover:bg-white/10' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-emerald-300 hover:bg-white'}`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="premium-button bg-emerald-600 text-white"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            className={`md:hidden h-11 w-11 rounded-2xl border ${isDark ? 'border-slate-700 text-slate-100 bg-white/5' : 'border-slate-200 text-slate-700 bg-white/80'}`}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className={`md:hidden border-t ${isDark ? 'border-slate-800 bg-slate-950/95' : 'border-slate-100 bg-white/95'} backdrop-blur-xl`}>
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-2xl transition ${isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`premium-button-secondary text-center ${isDark ? 'border-slate-700 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="premium-button bg-emerald-600 text-white text-center"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default PublicHeader
