import { useState } from 'react';
import BidService from '../../services/BidService';
import { useToast } from '../../hooks/useToast';

/**
 * Buyer-facing bid form for a BIDDING service listing. The vendor's hidden price is never
 * shown; the 24-hour window and eligibility are enforced server-side.
 */
export default function ServiceBidPanel({ listing }) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState(listing.minBidQuantity || 1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await BidService.submitServiceBid(listing.id, { bidAmount: amount, quantity, message });
      setSubmitted(true);
      showToast('Bid submitted successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit bid', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <p className="text-sm text-green-600">Your bid has been submitted.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-border p-3 bg-muted/40">
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Bidding</span>
        <span className="text-xs text-muted-foreground">
          {listing.bidCloseAt ? `Closes ${new Date(listing.bidCloseAt).toLocaleString()}` : '24h window'}
        </span>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Your bid (₹)</label>
        <input
          type="number" min="0.01" step="0.01" required value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Quantity</label>
        <input
          type="number" min={listing.minBidQuantity || 1} value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Message (optional)</label>
        <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
      </div>
      <button type="submit" disabled={submitting}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Submit bid'}
      </button>
    </form>
  );
}
