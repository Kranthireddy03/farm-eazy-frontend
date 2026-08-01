import { DetailPanel } from '../platform/DetailPanel';
import { cn } from '../../lib/utils';

const PAYMENT_OPTIONS = [
  {
    value: 'CASH_ON_DELIVERY',
    title: 'Cash on delivery',
    description: 'Pay when your order arrives',
    hint: 'Free · Delivery in 3–5 days',
  },
  {
    value: 'RAZORPAY',
    title: 'Razorpay (UPI, card, net banking)',
    description: 'Pay securely online with Razorpay',
    hint: null,
  },
];

export function CheckoutPaymentSection({ selectedPayment, onSelect }) {
  return (
    <DetailPanel title="Payment method" description="Choose how you want to pay for this order.">
      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => {
          const selected = selectedPayment === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40',
              )}
            >
              <input
                type="radio"
                name="payment"
                value={option.value}
                checked={selected}
                onChange={(e) => onSelect(e.target.value)}
                className="mt-1 h-4 w-4 cursor-pointer accent-primary"
              />
              <div>
                <p className="font-semibold text-foreground">{option.title}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                {option.hint && (
                  <p className="text-xs text-primary mt-1">{option.hint}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </DetailPanel>
  );
}
