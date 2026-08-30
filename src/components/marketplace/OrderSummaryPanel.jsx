import { Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { COIN_VALUE, MINIMUM_PAYMENT } from '../../lib/marketplace';

/**
 * Sticky order summary — cart and checkout flows share pricing breakdown.
 */
export function OrderSummaryPanel({
  subtotal,
  tax,
  total,
  savings = 0,
  finalAmount,
  coins = 0,
  useCoins = false,
  coinsToUse = 0,
  maxCoinsUsable = 0,
  coinsApplied = 0,
  remainingCoins,
  onUseCoinsChange,
  onCoinsToUseChange,
  variant = 'cart',
  primaryAction,
  secondaryAction,
  footerNote,
  className,
}) {
  const showCheckoutCoins = variant === 'checkout';

  return (
    <Card className={`sticky top-20 shadow-md ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (18% GST)</span>
            <span className="font-medium text-foreground">₹{tax.toFixed(2)}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-primary font-medium">
              <span>Product savings</span>
              <span>₹{savings.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-border pt-2">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="order-summary-use-coins"
              checked={useCoins}
              onChange={(e) => onUseCoinsChange?.(e.target.checked)}
              disabled={coins === 0 || (showCheckoutCoins && maxCoinsUsable === 0)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="order-summary-use-coins" className="flex items-center gap-2 cursor-pointer">
              <Coins className="h-4 w-4 text-primary" />
              Use coins
              <span className="text-muted-foreground">({coins} available)</span>
            </Label>
          </div>

          {showCheckoutCoins && coins > 0 && maxCoinsUsable === 0 && (
            <p className="text-xs text-muted-foreground">
              Order total is too low to apply coins (minimum ₹{MINIMUM_PAYMENT} payment required).
            </p>
          )}

          {useCoins && coins > 0 && (
            <div className="space-y-2">
              {showCheckoutCoins ? (
                <>
                  <input
                    type="range"
                    min={0}
                    max={maxCoinsUsable}
                    value={coinsToUse}
                    onChange={(e) => onCoinsToUseChange?.(Number(e.target.value))}
                    className="w-full accent-primary"
                    aria-label="Coins to use"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Using {coinsToUse} coins</span>
                    {remainingCoins != null && <span>{remainingCoins} left</span>}
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-primary">
                  {coinsToUse} coins = ₹{(coinsToUse * COIN_VALUE).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {coinsApplied > 0 && (
            <div className="flex justify-between text-sm font-medium text-primary">
              <span>Coin discount</span>
              <span>- ₹{(coinsApplied * COIN_VALUE).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Pay today</span>
            <span className="text-2xl font-semibold text-primary">₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {footerNote}

        {primaryAction}
        {secondaryAction}
      </CardContent>
    </Card>
  );
}
