import { useTheme } from '../../context/ThemeContext'
import { GlassPanel, HeroFrame, SectionTitle, StrongPanel } from '../ui/PremiumSurface'

export function PublicPageContainer({ children, className = '' }) {
  return (
    <div className={`px-4 md:px-6 py-12 md:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-8">{children}</div>
    </div>
  )
}

export function PublicNotePanel({ eyebrow, title, note, items = [] }) {
  const { isDark } = useTheme()

  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionTitle eyebrow={eyebrow} title={title} />
      {note && <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{note}</p>}
      {items.length > 0 && (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div
              key={item}
              className={`rounded-2xl px-4 py-3 text-sm border ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-700'}`}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

export function PublicLegalPage({ title, description, noteTitle, noteText, sections }) {
  const { isDark } = useTheme()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 space-y-6">
      <HeroFrame
        eyebrow="Legal"
        title={title}
        description={description}
        actions={null}
        side={
          <PublicNotePanel
            eyebrow="Readability"
            title={noteTitle}
            note={noteText}
          />
        }
      />

      <div className="grid gap-6">
        {sections.map((section) => (
          <StrongPanel key={section.title} className="p-6 md:p-7">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.title}</h2>
            <div className={`mt-3 text-sm md:text-base ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {section.body}
            </div>
          </StrongPanel>
        ))}
      </div>
    </div>
  )
}
