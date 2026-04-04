import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function PublicServices() {
  const { isDark } = useTheme()

  const pillars = [
    {
      name: 'Farm Operations',
      desc: 'Track fields, crop cycles, and critical activities in one operational workspace.',
      icon: '🧭',
    },
    {
      name: 'Irrigation Intelligence',
      desc: 'Plan and monitor irrigation with practical scheduling flows and visibility.',
      icon: '💧',
    },
    {
      name: 'Marketplace Workflows',
      desc: 'Enable buy/sell interactions with cleaner process visibility and records.',
      icon: '🛒',
    },
    {
      name: 'Support & FAQ',
      desc: 'Resolve user issues faster with integrated FAQ and support journeys.',
      icon: '🎫',
    },
    {
      name: 'Secure Access',
      desc: 'OTP and password pathways with improved verification and session control.',
      icon: '🔐',
    },
    {
      name: 'Adaptive UI',
      desc: 'Dark and light mode with responsive mobile-first layouts.',
      icon: '🌓',
    },
  ]

  return (
    <div className="px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <section className={`rounded-2xl border p-7 md:p-10 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-xl'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Platform Overview</p>
          <h1 className={`mt-3 text-3xl md:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            A complete farm-management platform, built for daily execution.
          </h1>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            FarmEazy is designed to support operational decisions, improve process clarity, and reduce workflow bottlenecks across the farm lifecycle.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pillars.map((pillar) => (
            <article key={pillar.name} className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-2xl">{pillar.icon}</p>
              <h2 className={`mt-2 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pillar.name}</h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{pillar.desc}</p>
            </article>
          ))}
        </section>

        <section className={`mt-8 rounded-2xl border p-6 md:p-8 ${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>Explore knowledge and support next</h2>
              <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dive into practical content and user support workflows.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/blog" className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">View Blog</Link>
              <Link to="/faq" className={`px-4 py-2.5 rounded-lg border font-semibold transition ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-emerald-200 text-emerald-800 hover:bg-white'}`}>Open FAQ</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
