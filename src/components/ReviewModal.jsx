import React, { useState } from 'react';
import apiClient from '../services/apiClient';

export default function ReviewModal({ targetType, targetId, targetTitle, orderId, bookingId, isOpen, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Aspect ratings
  const isProduct = targetType === 'PRODUCT';
  const isService = targetType === 'SERVICE';
  
  const [aspects, setAspects] = useState(
    isProduct
      ? { quality: 5, packaging: 5, deliverySpeed: 5, valueForMoney: 5 }
      : { punctuality: 5, equipmentCondition: 5, operatorSkill: 5, valueForMoney: 5 }
  );

  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAspectChange = (key, val) => {
    setAspects(prev => ({ ...prev, [key]: val }));
  };

  const handleAddAttachment = (e) => {
    const files = Array.from(e.target.files);
    // For local preview demo or data URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      setError('Please provide a review comment');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        targetType: targetType.toUpperCase(),
        targetId: Number(targetId),
        orderId: orderId ? Number(orderId) : null,
        bookingId: bookingId ? Number(bookingId) : null,
        rating: Number(rating),
        aspectRatings: JSON.stringify(aspects),
        reviewTitle: reviewTitle.trim() || null,
        reviewComment: reviewComment.trim(),
        attachmentUrls: attachments.length > 0 ? attachments.join('|||') : null
      };

      const res = await apiClient.post('/reviews', payload);

      if (onReviewSubmitted) {
        onReviewSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const aspectLabels = isProduct ? {
    quality: 'Crop / Product Quality',
    packaging: 'Packaging & Freshness',
    deliverySpeed: 'Delivery Punctuality',
    valueForMoney: 'Value for Money'
  } : {
    punctuality: 'Arrival Punctuality',
    equipmentCondition: 'Machine / Tool Condition',
    operatorSkill: 'Operator Expertise',
    valueForMoney: 'Value for Money'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 transition-all">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⭐</span>
            <div>
              <h3 className="font-bold text-base md:text-lg leading-tight">Rate & Review Experience</h3>
              <p className="text-emerald-100 text-xs truncate max-w-xs md:max-w-md">{targetTitle || `${targetType} #${targetId}`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Overall Star Rating */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Overall Experience Rating
            </label>
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl transition transform hover:scale-110 focus:outline-none cursor-pointer"
                >
                  <span className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              {rating === 5 ? '🌟 Excellent & Highly Recommended' :
               rating === 4 ? '👍 Very Good' :
               rating === 3 ? '👌 Satisfactory' :
               rating === 2 ? '⚠️ Substandard' : '❌ Needs Serious Improvement'}
            </p>
          </div>

          {/* Aspect Breakdown */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Multi-Dimensional Aspect Scores
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(aspectLabels).map(([key, label]) => (
                <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="font-bold text-emerald-700 font-mono">{aspects[key]}/5</span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => handleAspectChange(key, num)}
                        className={`flex-1 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                          aspects[key] >= num
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Review Headline / Summary (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Excellent germination rate & pristine packing"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="4"
              required
              placeholder="Share details of your experience to help fellow farmers and verify vendor quality..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            ></textarea>
          </div>

          {/* Photo Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Photos / Proof of Quality (Optional)
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition flex items-center space-x-1.5">
                <span>📸</span> <span>Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAddAttachment}
                  className="hidden"
                />
              </label>

              {attachments.map((url, idx) => (
                <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 group">
                  <img src={url} alt="Review preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="absolute inset-0 bg-rose-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting Review...' : 'Post Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
