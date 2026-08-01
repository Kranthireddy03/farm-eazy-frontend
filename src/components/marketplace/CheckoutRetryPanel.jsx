import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

export function CheckoutRetryPanel({
  retryTimer,
  onRetry,
  onEditDetails,
  onBackToShop,
  retryLoading = false,
}) {
  const minutes = Math.floor(retryTimer / 60);
  const seconds = (retryTimer % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-[hsl(var(--warning))]" />
          </div>
          <CardTitle>Payment retry required</CardTitle>
          <CardDescription>
            Payment did not complete. No order has been placed yet.
            You have <strong>{minutes}:{seconds}</strong> to retry.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={onRetry} disabled={retryLoading}>
            {retryLoading ? 'Opening payment…' : 'Retry payment'}
          </Button>
          <Button variant="outline" onClick={onEditDetails}>Edit order details</Button>
          <Button variant="ghost" onClick={onBackToShop}>Back to marketplace</Button>
        </CardContent>
      </Card>
    </div>
  );
}
