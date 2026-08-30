import { useState } from 'react';
import BidService from '../../services/BidService';
import { useToast } from '../../hooks/useToast';

/**
 * Buyer-facing bid submission panel for BIDDING listings.
 *
 * The vendor's hidden reserve price is never shown here and is never sent to or
 * received from the API. The 24-hour window is enforced authoritatively by the
 * backend; the countdown here is UX only.
 */
export default function BidPanel({ listing }) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState(listing.minBidQuantity || 1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const minBid = listing.minBidQuantity || 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await BidService.submitBid(listing.id, { bidAmount: amount, quantity, message });
      setSubmitted(true);
      showToast('Bid submitted successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit bid', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-muted/40 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Bidding</p>
          <p className="text-xs text-muted-foreground">
            Bid closes {listing.bidCloseAt ? new Date(listing.bidCloseAt).toLocaleString() : 'soon'}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">24h window</span>
      </div>

      {submitted ? (
        <div className="text-sm text-success">
          Your bid has been submitted. The vendor will review bids once the window closes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" htmlFor="bidAmount">Your bid (₹)</label>
            <input
              id="bidAmount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" htmlFor="bidQuantity">Quantity ({listing.unit || 'units'})</label>
            <input
              id="bidQuantity"
              type="number"
              min={minBid}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum quantity: {minBid}</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" htmlFor="bidMessage">Message (optional)</label>
            <textarea
              id="bidMessage"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Any remarks for the vendor…"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit bid'}
          </button>
        </form>
      )}
    </div>
  );
}
