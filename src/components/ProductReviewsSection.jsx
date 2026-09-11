import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import ReviewModal from './ReviewModal';

export default function ProductReviewsSection({ targetType = 'PRODUCT', targetId, targetTitle, isOwner = false }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, ratingDistribution: {} });
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Filters
  const [starFilter, setStarFilter] = useState('ALL');
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const fetchReviewsAndStats = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const targetPath = targetType.toLowerCase() === 'service' ? 'service' : 'product';
      const [reviewsRes, statsRes] = await Promise.all([
        apiClient.get(`/reviews/${targetPath}/${targetId}?page=0&size=50`).catch(() => ({ data: { content: [] } })),
        apiClient.get(`/reviews/stats/${targetType}/${targetId}`).catch(() => ({ data: { averageRating: 0, totalReviews: 0, ratingDistribution: {} } }))
      ]);
      setReviews(reviewsRes.data?.content || []);
      setStats(statsRes.data || { averageRating: 0, totalReviews: 0, ratingDistribution: {} });
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndStats();
  }, [targetId, targetType]);

  const handleVendorReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      await apiClient.post(`/reviews/${reviewId}/reply`, { reply: replyText.trim() });
      setReplyText('');
      setReplyingReviewId(null);
      fetchReviewsAndStats();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const total = stats.totalReviews || reviews.length || 0;
  const avg = Number(stats.averageRating || 0).toFixed(1);

  // Filtered reviews
  const filteredReviews = reviews.filter((rev) => {
    if (starFilter !== 'ALL' && Number(rev.rating) !== Number(starFilter)) return false;
    if (onlyPhotos) {
      const attachments = rev.attachmentUrls ? rev.attachmentUrls.split('|||').filter(Boolean) : [];
      if (attachments.length === 0) return false;
    }
    if (onlyVerified && !rev.verifiedPurchase) return false;
    return true;
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm space-y-6">
      
      {/* Header & Overall Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <span>⭐ Customer Ratings & Feedback</span>
            <span className="text-xs px-2.5 py-0.5 bg-primary/10 text-primary font-bold rounded-full">
              {total} {total === 1 ? 'Review' : 'Reviews'}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Verified farmer & buyer feedback on quality, delivery, and experience</p>
        </div>

        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
        >
          <span>✍️ Write a Review</span>
        </button>
      </div>

      {/* Rating Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/40 p-6 rounded-2xl border border-border">
        
        {/* Score Card */}
        <div className="flex flex-col items-center justify-center text-center p-4 bg-card rounded-xl border border-border/80 shadow-xs">
          <span className="text-5xl font-black text-foreground font-mono">{avg}</span>
          <div className="flex items-center space-x-1 my-2 text-amber-400 text-lg">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star}>
                {Number(avg) >= star ? '★' : Number(avg) >= star - 0.5 ? '★' : '☆'}
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Based on {total} verified reviews</span>
        </div>

        {/* 5 to 1 Star Progress Bars */}
        <div className="md:col-span-2 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (stats.ratingDistribution && stats.ratingDistribution[star]) || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;
            return (
              <div 
                key={star} 
                onClick={() => setStarFilter(starFilter === String(star) ? 'ALL' : String(star))}
                className="flex items-center space-x-3 text-xs cursor-pointer hover:opacity-80 transition"
              >
                <span className="w-12 font-bold text-foreground flex items-center space-x-1">
                  <span>{star}</span> <span className="text-amber-400">★</span>
                </span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right font-mono font-medium text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-2 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Stars:</span>
          {['ALL', '5', '4', '3', '2', '1'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStarFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                starFilter === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {st === 'ALL' ? 'All Stars' : `${st} ★`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={onlyPhotos}
              onChange={(e) => setOnlyPhotos(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>📷 With Photos</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>✓ Verified Purchases</span>
          </label>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">Loading customer reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <span className="text-3xl block mb-2">🌾</span>
            <p className="font-bold text-foreground text-sm">No customer reviews matching filter</p>
            <p className="text-xs text-muted-foreground mt-1">Try resetting the star or photo filters to see all reviews.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            let aspectObj = {};
            try {
              if (rev.aspectRatings) aspectObj = JSON.parse(rev.aspectRatings);
            } catch (e) {}

            const attachmentList = rev.attachmentUrls ? rev.attachmentUrls.split('|||').filter(Boolean) : [];

            return (
              <div key={rev.id} className="p-5 bg-card rounded-xl border border-border shadow-xs space-y-3">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {(rev.reviewerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs leading-none">{rev.reviewerName || 'Verified Buyer'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex text-amber-400 text-xs">
                          {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                        </div>
                        {rev.verifiedPurchase && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded text-[10px] flex items-center space-x-1">
                            <span>✓</span> <span>Verified Order</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>

                {/* Aspect Pills */}
                {Object.keys(aspectObj).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(aspectObj).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-muted text-foreground/80 rounded-md text-[10px] font-medium">
                        {k}: <strong className="text-primary">{v}/5</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Title & Comment */}
                {rev.reviewTitle && (
                  <h5 className="font-bold text-xs text-foreground">{rev.reviewTitle}</h5>
                )}
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">{rev.reviewComment}</p>

                {/* Attachments Gallery */}
                {attachmentList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachmentList.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Proof attachment"
                        onClick={() => setSelectedPhoto(url)}
                        className="w-16 h-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition"
                      />
                    ))}
                  </div>
                )}

                {/* Vendor Reply Bubble */}
                {rev.vendorReply ? (
                  <div className="mt-3 pl-3 py-2 border-l-2 border-primary bg-primary/5 rounded-r-lg text-xs space-y-0.5">
                    <p className="font-bold text-primary text-[11px] flex items-center space-x-1">
                      <span>🏪</span> <span>Seller Response</span>
                    </p>
                    <p className="text-foreground/90 text-xs">{rev.vendorReply}</p>
                  </div>
                ) : isOwner ? (
                  <div className="pt-2">
                    {replyingReviewId === rev.id ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          rows="2"
                          placeholder="Type your official response to this customer..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full text-xs p-2 border border-border bg-background rounded-lg focus:ring-1 focus:ring-primary outline-none"
                        ></textarea>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => { setReplyingReviewId(null); setReplyText(''); }}
                            className="px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted rounded"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={submittingReply}
                            onClick={() => handleVendorReply(rev.id)}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                          >
                            {submittingReply ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingReviewId(rev.id)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>💬 Reply as Seller</span>
                      </button>
                    )}
                  </div>
                ) : null}

              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={selectedPhoto} alt="Zoomed view" className="max-w-2xl max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}

      {/* Write Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
        onReviewSubmitted={fetchReviewsAndStats}
      />

    </div>
  );
}
