import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'
import CancelOrderModal from '../components/CancelOrderModal'
import RefundDetailsModal from '../components/RefundDetailsModal'

function Orders() {
    const { isDark } = useTheme()
    // Import dashboard stats refresh
    const dashboardWindow = window;
    const refreshDashboardStats = () => {
      if (dashboardWindow.fetchStats) {
        dashboardWindow.fetchStats();
      }
    };
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders')
      const list = Array.isArray(response.data) ? response.data : []
      setOrders(list)
    } catch (err) {
      setError('Could not load orders')
    } finally {
      setLoading(false)
      refreshDashboardStats();
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`

  const handleCancelClick = (order) => {
    setSelectedOrder(order)
    setShowCancelModal(true)
  }

  const handleReturnClick = (order) => {
    setSelectedOrder(order)
    setShowReturnModal(true)
  }

  const handleRefundDetailsClick = (order) => {
    setSelectedOrder(order)
    setShowRefundDetailsModal(true)
  }

  const handleCancelSuccess = (result) => {
    setSuccessMessage(result.message || 'Order cancelled successfully')
    fetchOrders() // Refresh orders
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const handleReturnSuccess = (result) => {
    setSuccessMessage(result.message || 'Return request submitted successfully')
    fetchOrders() // Refresh orders
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const handleRefundDetailsSuccess = () => {
    setSuccessMessage('Refund details saved. Your refund will be processed shortly.')
    fetchOrders() // Refresh orders
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  // Get refund status badge
  const getRefundStatusBadge = (order) => {
    if (!order.refundStatus || order.refundStatus === 'NOT_REQUESTED') return null

    const statusConfig = {
      'REFUND_DETAILS_REQUIRED': { bg: 'bg-yellow-500', text: 'Add Refund Details', icon: '⚠️' },
      'REQUESTED': { bg: 'bg-blue-500', text: 'Refund Requested', icon: '⏳' },
      'APPROVED': { bg: 'bg-blue-600', text: 'Refund Approved', icon: '✓' },
      'PROCESSING': { bg: 'bg-purple-500', text: 'Processing Refund', icon: '⚡' },
      'COMPLETED': { bg: 'bg-green-500', text: 'Refunded', icon: '✓' },
      'FAILED': { bg: 'bg-red-500', text: 'Refund Failed', icon: '✗' },
      'REJECTED': { bg: 'bg-red-600', text: 'Refund Rejected', icon: '✗' },
      'PARTIALLY_REFUNDED': { bg: 'bg-teal-500', text: 'Partial Refund', icon: '↩' },
    }

    const config = statusConfig[order.refundStatus] || { bg: 'bg-gray-500', text: order.refundStatus, icon: '?' }

    return (
      <span className={`${config.bg} text-white px-2 py-1 rounded-full text-xs font-medium`}>
        {config.icon} {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <div className={`rounded-lg shadow-lg p-8 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Back to shop
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-lg shadow-lg p-8 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="text-6xl mb-4">📦</div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>My Orders</h1>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Your order history will appear here.</p>
            <button
              onClick={() => navigate('/buying')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Order history</p>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>My Orders</h1>
          </div>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Continue shopping
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            ✓ {successMessage}
          </div>
        )}

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className={`rounded-lg shadow-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Order ID</p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>#FZ{order.id}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Placed on</p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{order.createdAt?.split('T')[0] || '—'}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total</p>
                  <p className="text-lg font-semibold text-orange-400">{formatCurrency(order.finalAmount)}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.orderStatus === 'CANCELLED' ? 'bg-red-900/50 text-red-400' :
                    order.orderStatus === 'DELIVERED' ? 'bg-green-900/50 text-green-400' :
                    order.orderStatus === 'SHIPPED' ? 'bg-purple-900/50 text-purple-400' :
                    isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.orderStatus || 'PENDING'}
                  </span>
                  <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Payment: {order.paymentStatus}</div>
                  {/* Refund status badge */}
                  {getRefundStatusBadge(order) && (
                    <div className="mt-2">{getRefundStatusBadge(order)}</div>
                  )}
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className={`mt-4 border-t ${isDark ? 'border-slate-600' : 'border-gray-200'} pt-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {order.items.map(item => (
                    <div key={`${order.id}-${item.productId}`} className="flex justify-between py-1 items-center">
                      <div>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.productName}</span> × {item.quantity}
                        {item.discountedPrice !== undefined && item.discountedPrice < item.price ? (
                          <>
                            <span className="ml-2 text-orange-400 font-bold">₹{item.discountedPrice.toFixed(2)}</span>
                            <span className={`ml-2 line-through ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>₹{item.price.toFixed(2)}</span>
                            <span className="ml-2 text-green-400 font-semibold">Saved ₹{((item.price - item.discountedPrice) * item.quantity).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="ml-2 text-orange-400 font-bold">₹{item.price.toFixed(2)}</span>
                        )}
                      </div>
                      <span className={isDark ? 'text-white' : 'text-gray-800'}>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Refund amount display */}
              {order.refundStatus && order.refundStatus !== 'NOT_REQUESTED' && (
                <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  {order.refundAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Refund Amount:</span>
                      <span className="text-green-500 font-semibold">{formatCurrency(order.refundAmount)}</span>
                    </div>
                  )}
                  {order.coinsRefunded > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Coins Refunded:</span>
                      <span className="text-yellow-500 font-semibold">+{order.coinsRefunded} 🪙</span>
                    </div>
                  )}
                  {order.coinsUsed > 0 && !order.coinsRefunded && ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(order.refundStatus) && (
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Coins to Refund:</span>
                      <span className="text-yellow-400 font-semibold">{order.coinsUsed} 🪙</span>
                    </div>
                  )}
                  {order.refundReason && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Reason: {order.refundReason}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'} flex flex-wrap gap-2`}>
                {/* Add Refund Details button - when required */}
                {order.refundStatus === 'REFUND_DETAILS_REQUIRED' && (
                  <button
                    onClick={() => handleRefundDetailsClick(order)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg text-sm transition"
                  >
                    ⚠️ Add Refund Details
                  </button>
                )}

                {/* Cancel button - for pending/confirmed orders */}
                {order.canCancel && order.orderStatus !== 'CANCELLED' && (!order.refundStatus || order.refundStatus === 'NOT_REQUESTED') && (
                  <button
                    onClick={() => handleCancelClick(order)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    ❌ Cancel Order
                  </button>
                )}

                {/* Return button - for delivered orders */}
                {order.canReturn && order.orderStatus === 'DELIVERED' && (!order.refundStatus || order.refundStatus === 'NOT_REQUESTED') && (
                  <button
                    onClick={() => handleReturnClick(order)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isDark ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    }`}
                  >
                    ↩️ Request Return
                  </button>
                )}

                {/* Track order button */}
                {['CONFIRMED', 'SHIPPED'].includes(order.orderStatus) && (
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📦 Track Order
                  </button>
                )}

                {/* Reorder button - for delivered/cancelled */}
                {['DELIVERED', 'CANCELLED'].includes(order.orderStatus) && (
                  <button
                    onClick={() => navigate('/buying')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    🔄 Buy Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setSelectedOrder(null)
        }}
        onSuccess={handleCancelSuccess}
        order={selectedOrder}
        type="cancel"
      />

      {/* Return Order Modal */}
      <CancelOrderModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false)
          setSelectedOrder(null)
        }}
        onSuccess={handleReturnSuccess}
        order={selectedOrder}
        type="return"
      />

      {/* Refund Details Modal */}
      <RefundDetailsModal
        isOpen={showRefundDetailsModal}
        onClose={() => {
          setShowRefundDetailsModal(false)
          setSelectedOrder(null)
        }}
        onSuccess={handleRefundDetailsSuccess}
        orderId={selectedOrder?.id}
      />
    </div>
  )
}

export default Orders
