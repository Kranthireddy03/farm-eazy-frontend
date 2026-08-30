import { cn } from '../../lib/utils';
import { Label } from './label';

export function FormField({
  label,
  id,
  required,
  hint,
  error,
  children,
  className,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-0.5" aria-hidden>*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}

/** Floating label field — input must pass id and use peer classes via Input */
export function FloatingField({
  label,
  id,
  required,
  error,
  children,
  className,
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <Label
        htmlFor={id}
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all pointer-events-none',
          'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-primary',
          'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs',
        )}
      >
        {label}{required && ' *'}
      </Label>
      {error && <p className="text-xs text-destructive mt-1" role="alert">{error}</p>}
    </div>
  );
}
