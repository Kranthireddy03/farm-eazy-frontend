import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

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
    <header className="sticky top-0 z-40">
      <div className={`${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-emerald-100'} backdrop-blur-xl border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="text-2xl">🌾</span>
            <div className="leading-tight">
              <p className={`font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-emerald-900'}`}>FarmEazy</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-emerald-700'}`}>Smart Farming Platform</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${isDark ? 'text-slate-300 hover:text-emerald-300' : 'text-slate-700 hover:text-emerald-800'} transition`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/login"
              className={`${isDark ? 'text-slate-300 hover:text-white border-slate-700 hover:border-slate-500' : 'text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300'} border px-3 py-1.5 rounded-lg text-sm transition`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm transition"
            >
              Register
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            className={`md:hidden p-2 rounded-lg border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'}`}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className={`md:hidden border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-emerald-100 bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`${isDark ? 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900' : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'} px-3 py-2 rounded-lg transition`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`${isDark ? 'text-slate-200 border-slate-700' : 'text-slate-700 border-slate-200'} border px-3 py-2 rounded-lg text-sm flex-1 text-center`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm flex-1 text-center"
                >
                  Register
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
