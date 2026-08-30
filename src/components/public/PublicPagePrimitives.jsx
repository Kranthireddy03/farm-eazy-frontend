import { cn } from '../../lib/utils';
import { HeroFrame, SectionTitle } from '../ui/PremiumSurface';

export function PublicPageContainer({ children, className = '' }) {
  return (
    <div className={cn('px-4 md:px-6 py-12 md:py-16', className)}>
      <div className="max-w-7xl mx-auto space-y-8">{children}</div>
    </div>
  );
}

export function PublicNotePanel({ eyebrow, title, note, items = [] }) {
  return (
    <div className="ops-panel p-5 md:p-6">
      <SectionTitle eyebrow={eyebrow} title={title} />
      {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
      {items.length > 0 && (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item} className="ops-panel !p-3 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
          <div key={section.title} className="ops-panel p-6 md:p-7">
            <h2 className="ops-section-title text-lg text-foreground">{section.title}</h2>
            <div className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {section.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
