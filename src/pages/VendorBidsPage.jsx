import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BidService from '../services/BidService';
import { useToast } from '../hooks/useToast';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-500/15 text-blue-300',
  ACCEPTED: 'bg-emerald-500/15 text-emerald-300',
  REJECTED: 'bg-rose-500/15 text-rose-300',
};

/**
 * Vendor bid management. Shows all bids for a bidding listing (product or service) with
 * Accept / Reject / Contact User actions. Business rules (window, ownership, competing
 * bids) are enforced by the backend; this UI only calls the secure APIs.
 */
export default function VendorBidsPage({ listingType = 'product' }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    const fn = listingType === 'service'
      ? BidService.getBidsForServiceListing(listingId)
      : BidService.getBidsForListing(listingId);
    fn.then(setBids).catch((e) => showToast(e.response?.data?.message || 'Failed to load bids', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [listingId, listingType]);

  const act = async (fn, bidId, okMsg) => {
    setBusyId(bidId);
    try {
      await fn(bidId);
      showToast(okMsg, 'success');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const contactUser = async (bid) => {
    try {
      const conversation = await BidService.startVendorConversation(bid.listingId, bid.id);
      navigate(`/messages/${conversation.displayId}`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Unable to open conversation', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bids for listing #{listingId}</h2>
        <button onClick={load} className="text-sm text-primary hover:underline">Refresh</button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading bids…</p>
      ) : bids.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No bids yet.</p>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <div key={bid.id} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">₹{Number(bid.bidAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {bid.bidderUsername || bid.bidderEmail} · {bid.bidderState || '—'} · Qty {bid.quantity}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[bid.status] || 'bg-slate-500/15 text-slate-300'}`}>
                  {bid.status}
                </span>
              </div>
              {bid.message && <p className="text-sm text-muted-foreground">{bid.message}</p>}
              <p className="text-xs text-muted-foreground">
                Submitted {bid.createdAt ? new Date(bid.createdAt).toLocaleString() : '—'}
              </p>
              {bid.status === 'SUBMITTED' && (
                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => act(BidService.acceptBid, bid.id, 'Bid accepted')}
                    disabled={busyId === bid.id}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => act(BidService.rejectBid, bid.id, 'Bid rejected')}
                    disabled={busyId === bid.id}
                    className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
              {bid.status === 'ACCEPTED' && (
                <button
                  onClick={() => contactUser(bid)}
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                >
                  Contact User
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
