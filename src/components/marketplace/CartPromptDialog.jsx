import { CheckCircle2, ShoppingCart, Store } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export function CartPromptDialog({
  open,
  productName,
  quantity,
  unitPrice,
  onViewCart,
  onContinue,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-prompt-title"
    >
      <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-normal">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 id="cart-prompt-title" className="text-lg font-semibold">Added to cart</h2>
            <p className="text-sm text-muted-foreground mt-1">{productName}</p>
            {quantity && unitPrice && (
              <p className="text-sm text-muted-foreground">
                {quantity} × ₹{Number(unitPrice).toFixed(2)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button className="gap-2 w-full" onClick={onViewCart}>
              <ShoppingCart className="h-4 w-4" />
              View cart & checkout
            </Button>
            <Button variant="outline" className="gap-2 w-full" onClick={onContinue}>
              <Store className="h-4 w-4" />
              Continue shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
