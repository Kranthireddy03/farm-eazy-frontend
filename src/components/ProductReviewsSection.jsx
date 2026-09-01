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

  const fetchReviewsAndStats = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const targetPath = targetType.toLowerCase() === 'service' ? 'service' : 'product';
      const [reviewsRes, statsRes] = await Promise.all([
        apiClient.get(`/reviews/${targetPath}/${targetId}?page=0&size=20`).catch(() => ({ data: { content: [] } })),
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
      
      {/* Header & Overall Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>⭐ Customer Ratings & Feedback</span>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
              {total} {total === 1 ? 'Review' : 'Reviews'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Verified farmer & buyer feedback on quality, delivery, and experience</p>
        </div>

        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
        >
          <span>✍️ Write a Review</span>
        </button>
      </div>

      {/* Rating Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        
        {/* Score Card */}
        <div className="flex flex-col items-center justify-center text-center p-4 bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <span className="text-5xl font-black text-slate-900 font-mono">{avg}</span>
          <div className="flex items-center space-x-1 my-2 text-amber-400 text-lg">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star}>
                {Number(avg) >= star ? '★' : Number(avg) >= star - 0.5 ? '★' : '☆'}
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-500">Based on {total} verified reviews</span>
        </div>

        {/* 5 to 1 Star Progress Bars */}
        <div className="md:col-span-2 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (stats.ratingDistribution && stats.ratingDistribution[star]) || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center space-x-3 text-xs">
                <span className="w-12 font-bold text-slate-700 flex items-center space-x-1">
                  <span>{star}</span> <span className="text-amber-400">★</span>
                </span>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right font-mono font-medium text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <span className="text-3xl block mb-2">🌾</span>
            <p className="font-bold text-slate-700 text-sm">No customer reviews yet</p>
            <p className="text-xs text-slate-500 mt-1">Be the first verified customer to share feedback!</p>
          </div>
        ) : (
          reviews.map((rev) => {
            let aspectObj = {};
            try {
              if (rev.aspectRatings) aspectObj = JSON.parse(rev.aspectRatings);
            } catch (e) {}

            const attachmentList = rev.attachmentUrls ? rev.attachmentUrls.split('|||').filter(Boolean) : [];

            return (
              <div key={rev.id} className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      {(rev.reviewerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs leading-none">{rev.reviewerName || 'Verified Buyer'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex text-amber-400 text-xs">
                          {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                        </div>
                        {rev.verifiedPurchase && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px] flex items-center space-x-1">
                            <span>✓</span> <span>Verified Order</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>

                {/* Aspect Pills */}
                {Object.keys(aspectObj).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(aspectObj).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                        {k}: <strong className="text-emerald-700">{v}/5</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Title & Comment */}
                {rev.reviewTitle && (
                  <h5 className="font-bold text-xs text-slate-900">{rev.reviewTitle}</h5>
                )}
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{rev.reviewComment}</p>

                {/* Attachments Gallery */}
                {attachmentList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachmentList.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Proof attachment"
                        onClick={() => setSelectedPhoto(url)}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition"
                      />
                    ))}
                  </div>
                )}

                {/* Vendor Reply Bubble */}
                {rev.vendorReply ? (
                  <div className="mt-3 pl-3 py-2 border-l-2 border-emerald-500 bg-emerald-50/50 rounded-r-lg text-xs space-y-0.5">
                    <p className="font-bold text-emerald-900 text-[11px] flex items-center space-x-1">
                      <span>🏪</span> <span>Seller Response</span>
                    </p>
                    <p className="text-slate-700 text-xs">{rev.vendorReply}</p>
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
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        ></textarea>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => { setReplyingReviewId(null); setReplyText(''); }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={submittingReply}
                            onClick={() => handleVendorReply(rev.id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {submittingReply ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingReviewId(rev.id)}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer"
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
