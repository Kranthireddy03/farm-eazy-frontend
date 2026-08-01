import { cn } from '../../lib/utils';

export function CheckoutStepIndicator({ steps = ['Payment', 'Order', 'Complete'], currentStep, totalSteps }) {
  return (
    <div className="w-full max-w-sm mx-auto" role="status" aria-label="Checkout progress">
      <div className="flex justify-between mb-2">
        {steps.map((label, idx) => {
          const done = idx + 1 <= currentStep;
          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {done ? '✓' : idx + 1}
              </div>
              <span className={cn('text-[10px] mt-1', done ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-slow ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
