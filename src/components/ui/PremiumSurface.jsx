/**
 * Public/marketing surface components — premium ops styling.
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Button, buttonVariants } from './button';
import { cn } from '../../lib/utils';

export function PageCanvas({ children, className = '' }) {
  return <div className={cn('min-h-full', className)}>{children}</div>;
}

export function HeroFrame({ eyebrow, title, description, actions, side, className = '' }) {
  return (
    <section className={cn('ops-page-hero', className)}>
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <div className="space-y-4">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
          )}
          <h1 className="ops-page-title fe-display text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
          )}
          {actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
        </div>
        {side && <div className="min-w-0">{side}</div>}
      </div>
    </section>
  );
}

export function GlassPanel({ children, className = '' }) {
  return (
    <div className={cn('ops-panel p-6', className)}>
      {children}
    </div>
  );
}

export function StrongPanel({ children, className = '' }) {
  return (
    <div className={cn('ops-panel p-6 md:p-7', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, text, className = '' }) {
  return (
    <div className={cn('space-y-2', className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
      )}
      <h2 className="ops-section-title text-lg text-foreground">{title}</h2>
      {text && <p className="ops-section-desc">{text}</p>}
    </div>
  );
}

export function PillButton({ children, to, onClick, active = false, className = '', external = false }) {
  const variant = active ? 'default' : 'outline';
  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className={cn(buttonVariants({ variant }), 'shadow-sm', className)}
      >
        {children}
      </Link>
    );
  }
  return (
    <Button type="button" variant={variant} onClick={onClick} className={className}>
      {children}
    </Button>
  );
}

/** @deprecated Use FeatureCard grid instead of flip/quiz cards */
export function FlipCard({ frontTitle, frontText, icon, className = '' }) {
  return (
    <Card className={cn('border-0 shadow-none', className)}>
      <CardHeader>
        {icon && <span className="text-2xl mb-2">{icon}</span>}
        <CardTitle className="text-lg">{frontTitle}</CardTitle>
        <CardDescription>{frontText}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function ScrollRail({ children, className = '' }) {
  return <div className={cn('flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory', className)}>{children}</div>;
}

export function PageFooter({ headline, description, actions, className = '' }) {
  return (
    <div className={cn('ops-panel mt-8 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4', className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
        <h3 className="text-lg font-semibold text-foreground mt-1">{headline || 'Continue exploring'}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, description, className = '' }) {
  return (
    <div className={cn('ops-panel h-full p-5 sm:p-6', className)}>
      {Icon && (
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary mb-3 inline-flex">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  );
}
