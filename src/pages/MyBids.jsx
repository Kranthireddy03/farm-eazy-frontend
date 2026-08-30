import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BidService from '../services/BidService';
import { useToast } from '../hooks/useToast';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-500/15 text-blue-300',
  ACCEPTED: 'bg-emerald-500/15 text-emerald-300',
  REJECTED: 'bg-rose-500/15 text-rose-300',
};

/**
 * User-side bid history. For ACCEPTED bids the user can (a) start/pay the order via the
 * existing payment flow and (b) open the private vendor chat. Amount shown is their own bid.
 */
export default function MyBids() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BidService.getMyBids()
      .then(setBids)
      .catch(() => showToast('Failed to load your bids', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const pay = async (bid) => {
    try {
      const order = await BidService.getOrder(bid.id);
      showToast(`Order #${order.orderId} created — proceed to payment.`, 'success');
      navigate('/orders');
    } catch (e) {
      showToast(e.response?.data?.message || 'Unable to create order', 'error');
    }
  };

  const chat = async (bid) => {
    try {
      const conversation = await BidService.startVendorConversation(bid.listingId, bid.id);
      navigate(`/messages/${conversation.displayId}`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Unable to open conversation', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">My Bids</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
      ) : bids.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">You have not placed any bids yet.</p>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <div key={bid.id} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">{bid.listingName || `Listing #${bid.listingId}`}</p>
                  <p className="text-xs text-muted-foreground">
                    Your bid ₹{Number(bid.bidAmount || 0).toLocaleString()} · Qty {bid.quantity}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[bid.status] || 'bg-slate-500/15 text-slate-300'}`}>
                  {bid.status}
                </span>
              </div>
              {bid.status === 'ACCEPTED' && (
                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => pay(bid)}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                  >
                    Pay & Complete
                  </button>
                  <button
                    onClick={() => chat(bid)}
                    className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted"
                  >
                    Chat with Vendor
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
