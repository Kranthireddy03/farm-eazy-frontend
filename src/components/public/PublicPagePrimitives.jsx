import { Card, CardContent } from '../ui/card'
import { HeroFrame, SectionTitle, StrongPanel } from '../ui/PremiumSurface'

export function PublicPageContainer({ children, className = '' }) {
  return (
    <div className={`px-4 md:px-6 py-12 md:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-8">{children}</div>
    </div>
  )
}

export function PublicNotePanel({ eyebrow, title, note, items = [] }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 md:p-6">
        <SectionTitle eyebrow={eyebrow} title={title} />
        {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
        {items.length > 0 && (
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <Card key={item} className="border-border shadow-none">
                <CardContent className="px-4 py-3 text-sm text-muted-foreground">{item}</CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PublicLegalPage({ title, description, noteTitle, noteText, sections }) {
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
            <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
            <div className="mt-3 text-sm md:text-base text-muted-foreground">
              {section.body}
            </div>
          </StrongPanel>
        ))}
      </div>
    </div>
  )
}
