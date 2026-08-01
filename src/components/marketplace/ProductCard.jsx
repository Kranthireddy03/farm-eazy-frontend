import { Heart, MapPin, Phone, Mail, Eye, Share2, ShoppingCart, Tag, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const CATEGORY_LABELS = {
  SEEDS: 'Seeds',
  FERTILIZERS: 'Fertilizers',
  PESTICIDES: 'Pesticides',
  TOOLS: 'Tools',
  EQUIPMENT: 'Equipment',
  ORGANIC: 'Organic',
  OTHERS: 'Others',
};

function formatPrice(product) {
  if (product.discountPercentage && product.discountPercentage > 0) {
    const discounted =
      product.discountedPrice ??
      product.price - (product.price * product.discountPercentage) / 100;
    return {
      display: Number(discounted).toFixed(2),
      original: Number(product.price).toFixed(2),
      hasDiscount: true,
      pct: product.discountPercentage,
    };
  }
  return { display: Number(product.price).toFixed(2), hasDiscount: false };
}

export function ProductCard({
  product,
  onView,
  onQuickView,
  onAddToCart,
  onRevealPhone,
  onRevealEmail,
  onShare,
  isWishlisted,
  onToggleWishlist,
  revealedPhone,
  revealedEmail,
  className,
}) {
  const price = formatPrice(product);
  const notDeliverable = product.deliverable === false;
  const outOfStock = product.quantity <= 0 || product.status === 'OUT_OF_STOCK';

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow duration-normal',
        className,
      )}
    >
      <div
        className="relative aspect-[4/3] bg-muted cursor-pointer overflow-hidden"
        onClick={() => onView?.(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onView?.(product)}
        aria-label={`View ${product.productName}`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="h-full w-full object-cover transition-transform duration-normal group-hover:scale-[1.02]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {price.hasDiscount && (
            <Badge variant="success" className="shadow-sm">
              <Tag className="h-3 w-3 mr-1" />
              {price.pct}% off
            </Badge>
          )}
          {notDeliverable && (
            <Badge variant="destructive">Not deliverable</Badge>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-background/90 backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist?.(product);
            }}
            aria-label={isWishlisted ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isWishlisted}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-primary text-primary')} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-background/90 backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(product);
            }}
            aria-label="Share product"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
            {CATEGORY_LABELS[product.category] || product.category}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <button
            type="button"
            onClick={() => onView?.(product)}
            className="text-left font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {product.productName}
          </button>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{product.sellerFullName}</span>
        </div>

        {product.sellerLocation && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{product.sellerLocation}</span>
          </div>
        )}

        <div className="flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="text-sm font-medium">
              {product.quantity} {product.unit}
              {outOfStock && <span className="text-destructive ml-1">Out of stock</span>}
            </p>
          </div>
          <div className="text-right">
            {price.hasDiscount && (
              <span className="text-xs text-muted-foreground line-through mr-1">₹{price.original}</span>
            )}
            <span className="text-lg font-semibold text-primary">₹{price.display}</span>
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1 gap-2"
            size="sm"
            disabled={notDeliverable || outOfStock}
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingCart className="h-4 w-4" />
            {notDeliverable ? 'Not deliverable' : 'Add to cart'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onQuickView?.(product)}
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!product.sellerPhone}
            onClick={() => onRevealPhone?.(product)}
            aria-label="Contact seller by phone"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!product.sellerEmail}
            onClick={() => onRevealEmail?.(product)}
            aria-label="Contact seller by email"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>

        {(revealedPhone || revealedEmail) && (
          <div className="rounded-md border border-border bg-muted/40 p-2 text-xs space-y-1">
            {revealedPhone && product.sellerPhone && (
              <a href={`tel:${product.sellerPhone}`} className="text-primary font-medium hover:underline block">
                {product.sellerPhone}
              </a>
            )}
            {revealedEmail && product.sellerEmail && (
              <a href={`mailto:${product.sellerEmail}`} className="text-primary font-medium hover:underline block">
                {product.sellerEmail}
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
