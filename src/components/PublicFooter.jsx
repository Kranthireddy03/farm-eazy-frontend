import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function PublicFooter() {
  const { isDark } = useTheme()
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className={`mt-auto px-4 md:px-6 pb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
      <div className={`max-w-7xl mx-auto premium-panel overflow-hidden`}>
        <div className={`px-6 md:px-8 py-8 md:py-10 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900' : 'bg-gradient-to-br from-white via-emerald-50/80 to-cyan-50/80'}`}>
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.9fr_0.9fr] gap-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">🌾</div>
                <div>
                  <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-950'}`}>FarmEazy</p>
                  <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Premium agriculture experience</p>
                </div>
              </div>
              <p className={`mt-4 text-sm leading-7 max-w-md ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                A modern platform for farming operations, support workflows, and informed decision-making. Built to feel calm, fast, and trustworthy.
              </p>
            </div>

            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.3em] mb-4 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Public Pages</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['/', '/about', '/public-services', '/blog', '/faq', '/contact'].map((path) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`rounded-2xl border px-3 py-2 transition ${isDark ? 'border-white/8 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white/70 hover:bg-white'}`}
                  >
                    {path === '/' ? 'Home' : path.replace('/', '').replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.3em] mb-4 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Legal</p>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  ['/privacy-policy', 'Privacy Policy'],
                  ['/terms', 'Terms'],
                  ['/refund-policy', 'Refund Policy'],
                  ['/shipping-policy', 'Shipping Policy'],
                  ['/marketplace-disclosure', 'Marketplace Disclosure'],
                ].map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={scrollToTop}
                    className={`rounded-2xl border px-3 py-2 transition ${isDark ? 'border-white/8 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white/70 hover:bg-white'}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-8 pt-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            <p>Contact: support@farm-eazy.com</p>
            <p>© {new Date().getFullYear()} FarmEazy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
