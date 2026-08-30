import { AlertTriangle, Home, LifeBuoy, RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from './button';
import { Card, CardContent } from './card';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not complete this action. Your session and data remain safe.',
  onRetry,
  showHome = true,
  showSupport = true,
  className,
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center text-center py-12 px-6">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          )}
          {showHome && (
            <Link to="/" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
              <Home className="h-4 w-4" />Go home
            </Link>
          )}
          {showSupport && (
            <Link to="/support" className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2')}>
              <LifeBuoy className="h-4 w-4" />Contact support
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
