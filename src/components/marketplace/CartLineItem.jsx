import { Minus, Plus, Trash2 } from 'lucide-react';
import ProductMediaCarousel from '../ProductMediaCarousel';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getItemUnitPrice } from '../../lib/marketplace';

/**
 * Single cart line — quantity controls, pricing, remove.
 */
export function CartLineItem({ item, onUpdateQuantity, onRemove }) {
  const unitPrice = getItemUnitPrice(item);
  const lineTotal = unitPrice * item.quantity;
  const hasDiscount = item.discountedPrice !== undefined && item.discountedPrice < item.price;
  const mediaUrls = item.mediaUrls || (item.imageUrls ? item.imageUrls.split(',') : []);
  const outOfStock = item.availableQuantity <= 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-4">
          <div className="h-20 w-20 shrink-0 rounded-md border border-border overflow-hidden bg-muted">
            <ProductMediaCarousel mediaUrls={mediaUrls.length ? mediaUrls : item.imageUrl ? [item.imageUrl] : []} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{item.productName}</h3>
                <p className="text-sm text-muted-foreground">Seller: {item.sellerFullName}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.productName}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="font-semibold text-primary">₹{unitPrice.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground line-through">₹{Number(item.price).toFixed(2)}</span>
                  {item.discountPercentage && (
                    <Badge variant="success">{item.discountPercentage}% off</Badge>
                  )}
                </>
              ) : (
                <span className="font-semibold text-primary">₹{Number(item.price).toFixed(2)}</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                  className="h-8 w-14 rounded-md border border-input bg-background text-center text-sm font-medium"
                  min={1}
                  max={item.availableQuantity}
                  aria-label="Quantity"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {outOfStock ? (
                    <span className="text-destructive font-medium">Out of stock</span>
                  ) : (
                    <span className="text-primary">{item.availableQuantity} in stock</span>
                  )}
                </span>
              </div>
              <p className="font-semibold">₹{lineTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
