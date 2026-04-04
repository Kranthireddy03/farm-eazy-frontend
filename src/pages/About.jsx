import { useTheme } from '../context/ThemeContext'

export default function About() {
  const { isDark } = useTheme()

  const principles = [
    {
      title: 'Operational Clarity',
      text: 'Every flow is designed to reduce confusion and help users take action fast.',
      icon: '🎯',
    },
    {
      title: 'Reliable by Design',
      text: 'From auth to support, we prioritize stable workflows that teams can trust daily.',
      icon: '🛡️',
    },
    {
      title: 'Farmer-first UX',
      text: 'Practical interfaces shaped around real agricultural operations.',
      icon: '🌱',
    },
    {
      title: 'Scalable Architecture',
      text: 'Built for growth from individual users to larger farm organizations.',
      icon: '📈',
    },
  ]

  return (
    <div className="px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <section className={`rounded-2xl border p-7 md:p-10 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-xl'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>About FarmEazy</p>
          <h1 className={`mt-3 text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            A focused platform for modern farming teams.
          </h1>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            FarmEazy combines field operations, irrigation workflows, support systems, and marketplace interactions into one cohesive experience.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {principles.map((item) => (
            <article key={item.title} className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-2xl">{item.icon}</p>
              <h2 className={`mt-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
            </article>
          ))}
        </section>

        <section className={`mt-8 rounded-2xl border p-7 md:p-9 ${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>Our Vision</h2>
          <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Build a dependable digital backbone for agriculture where users can manage operations, collaborate efficiently, and scale outcomes without workflow friction.
          </p>
        </section>
      </div>
    </div>
  )
}
