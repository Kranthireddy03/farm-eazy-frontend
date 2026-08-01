import { DetailPanel } from '../platform/DetailPanel';

export function CheckoutOrderReviewSection({ cartItems }) {
  return (
    <DetailPanel title="Order review" description="Items and vendor details for this checkout.">
      <div className="space-y-4">
        {cartItems.map((item) => {
          const itemPrice =
            item.discountedPrice && item.discountedPrice > 0 ? item.discountedPrice : item.price;
          const hasDiscount = item.discountPercentage && item.discountPercentage > 0;

          return (
            <div
              key={item.id}
              className="flex justify-between items-start pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{item.productName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {hasDiscount ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{itemPrice.toFixed(2)}
                      </p>
                      <span className="line-through text-xs text-muted-foreground">
                        ₹{item.price.toFixed(2)}
                      </span>
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-1.5 py-0.5 rounded">
                        {item.discountPercentage}% off
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                    </p>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-xs text-primary font-medium mt-1">
                    Saving ₹{((item.price - itemPrice) * item.quantity).toFixed(2)}
                  </p>
                )}
                <div className="mt-3 p-3 rounded-lg border border-border bg-muted/40 text-sm space-y-1">
                  <p className="font-medium text-foreground">Vendor information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Sold by:</span>{' '}
                      {item.vendorName || 'Not specified'}
                      {item.vendorType ? ` (${item.vendorType})` : ''}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Vendor ID:</span>{' '}
                      {item.vendorId || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Location:</span>{' '}
                      {item.vendorLocation || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Type:</span>{' '}
                      {item.vendorType || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
              <p className="font-bold text-foreground shrink-0 ml-4">
                ₹{(itemPrice * item.quantity).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
    </DetailPanel>
  );
}
