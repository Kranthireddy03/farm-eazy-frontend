import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function LandingHome() {
  const { isDark } = useTheme()

  const capabilities = [
    {
      title: 'Farm Command Center',
      text: 'Manage crops, irrigation, field activities, and vendor operations from one secure dashboard.',
      icon: '🧭',
    },
    {
      title: 'Smart Operations',
      text: 'Plan irrigation and crop lifecycles with guided workflows designed for real-world farm execution.',
      icon: '🌾',
    },
    {
      title: 'Support That Responds',
      text: 'Built-in support and FAQ workflows reduce confusion and keep users productive.',
      icon: '🎫',
    },
  ]

  const highlights = [
    'Secure auth with OTP and password flows',
    'Dark mode and light mode accessibility',
    'Knowledge feed and FAQ integration',
    'Operational visibility across farm lifecycle',
  ]

  return (
    <div className="w-full">
      <section className="relative overflow-hidden px-4 md:px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-200/70'}`}></div>
          <div className={`absolute top-32 right-0 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-200/70'}`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-slate-800 text-emerald-300 border border-slate-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              <span>Smart Farm Workflows</span>
            </p>
            <h1 className={`mt-5 text-4xl md:text-5xl leading-tight font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Farming workflows that feel simple, reliable, and scalable.
            </h1>
            <p className={`mt-5 text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              FarmEazy helps modern farm teams run planning, tracking, and support in one platform with clear UX and secure operations.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">
                Create Account
              </Link>
              <Link to="/login" className={`px-5 py-3 rounded-xl border font-semibold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-white'}`}>
                Sign In
              </Link>
              <Link to="/public-services" className={`px-5 py-3 rounded-xl font-semibold transition ${isDark ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-700 hover:text-emerald-800'}`}>
                View Platform Overview
              </Link>
            </div>

            <ul className="mt-8 grid sm:grid-cols-2 gap-3">
              {highlights.map((point) => (
                <li key={point} className={`text-sm rounded-lg px-3 py-2 ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-100 shadow-sm'}`}>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className={`rounded-2xl p-6 md:p-8 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-xl'}`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>What Makes FarmEazy Different</h2>
            <div className="mt-5 space-y-4">
              {capabilities.map((item) => (
                <div key={item.title} className={`rounded-xl p-4 border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
                  <p className="text-2xl">{item.icon}</p>
                  <h3 className={`mt-2 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-2xl p-6 md:p-8 border ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800' : 'border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50'}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>Ready to modernize your farm operations?</h2>
                <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-emerald-800'}`}>Start with a secure account, then scale your workflows confidently.</p>
              </div>
              <div className="flex gap-3">
                <Link to="/register" className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">Get Started</Link>
                <Link to="/contact" className={`px-4 py-2.5 rounded-lg border font-semibold transition ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-emerald-200 text-emerald-800 hover:bg-white'}`}>Talk to Team</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
