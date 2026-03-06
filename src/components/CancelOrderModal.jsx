import { useState } from 'react'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'
import RefundDetailsModal from './RefundDetailsModal'

/**
 * CancelOrderModal - Modal to cancel an order or request a return
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - onClose: function - Called when modal should close
 * - onSuccess: function - Called after successfully cancelling/requesting return
 * - order: object - The order to cancel/return
 * - type: 'cancel' | 'return' - Type of action
 */
function CancelOrderModal({ isOpen, onClose, onSuccess, order, type = 'cancel' }) {
    const { isDark } = useTheme()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [reason, setReason] = useState('')
    const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(false)
    const [refundResponse, setRefundResponse] = useState(null)

    const isCancel = type === 'cancel'
    const title = isCancel ? 'Cancel Order' : 'Request Return'
    const actionText = isCancel ? 'Cancel Order' : 'Request Return'

    const reasonOptions = isCancel ? [
        'Changed my mind',
        'Found a better price elsewhere',
        'Ordered by mistake',
        'Delivery taking too long',
        'Product no longer needed',
        'Other'
    ] : [
        'Product damaged',
        'Wrong product received',
        'Product not as described',
        'Quality not satisfactory',
        'Size/fit issue',
        'Other'
    ]

    const validateForm = () => {
        if (!reason.trim() || reason.length < 10) {
            setError('Please provide a reason (at least 10 characters)')
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        setError(null)

        if (!validateForm()) return

        setLoading(true)

        try {
            const endpoint = isCancel ? '/orders/cancel' : '/orders/return'
            const response = await apiClient.post(endpoint, {
                orderId: order.id,
                reason: reason,
                refundType: isCancel ? 'CANCELLATION' : 'RETURN'
            })

            const result = response.data

            if (result.status === 'REFUND_DETAILS_REQUIRED') {
                // Need to show refund details modal
                setRefundResponse(result)
                setShowRefundDetailsModal(true)
            } else if (result.status === 'REFUND_INITIATED' || result.status === 'CANCELLED') {
                // Success
                if (onSuccess) onSuccess(result)
                onClose()
            } else if (result.status === 'ERROR') {
                setError(result.message)
            } else {
                // Some other status, treat as success
                if (onSuccess) onSuccess(result)
                onClose()
            }

        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isCancel ? 'cancel order' : 'request return'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleRefundDetailsSuccess = () => {
        setShowRefundDetailsModal(false)
        if (onSuccess) onSuccess(refundResponse)
        onClose()
    }

    if (!isOpen || !order) return null

    // Show refund details modal if required
    if (showRefundDetailsModal) {
        return (
            <RefundDetailsModal
                isOpen={true}
                onClose={() => {
                    setShowRefundDetailsModal(false)
                    onClose()
                }}
                onSuccess={handleRefundDetailsSuccess}
                orderId={order.id}
            />
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {isCancel ? '❌' : '↩️'} {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        ✕
                    </button>
                </div>

                {/* Order summary */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Order ID</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>#FZ{order.id}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</span>
                        <span className="font-semibold text-orange-500">₹{(order.finalAmount || order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.orderStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            order.orderStatus === 'DELIVERED' ? 'bg-blue-100 text-blue-700' :
                            isDark ? 'bg-slate-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {order.orderStatus}
                        </span>
                    </div>
                </div>

                {/* Warning message */}
                <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
                    <p className="text-sm">
                        {isCancel 
                            ? 'Once cancelled, this action cannot be undone. If you paid online, the refund will be processed to your bank/UPI.'
                            : 'After requesting a return, please keep the product ready for pickup. Refund will be processed after product inspection.'
                        }
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                        {error}
                    </div>
                )}

                {/* Reason selection */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Select a reason *
                    </label>
                    <div className="space-y-2">
                        {reasonOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    if (option === 'Other') {
                                        setReason('')
                                    } else {
                                        setReason(option)
                                    }
                                }}
                                className={`w-full text-left px-4 py-2 rounded-lg border transition ${
                                    reason === option
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                        : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'
                                } ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom reason input */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Additional comments (required)
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide details about your reason..."
                        rows={3}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                            isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800'
                        }`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {reason.length}/500 characters
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex-1 py-3 rounded-lg font-medium transition ${
                            isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Keep Order
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || reason.length < 10}
                        className={`flex-1 py-3 font-bold rounded-lg transition disabled:opacity-50 ${
                            isCancel 
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                    >
                        {loading ? 'Processing...' : actionText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CancelOrderModal
