import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../services/apiClient'

function OrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiClient.get(`/orders/${orderId}`)
        setOrder(response.data)
      } catch (err) {
        setError('Unable to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="spinner text-green-400 mb-4">
            <svg className="animate-spin w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-400 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    )
  }

  // Calculate coin discount (coins used * 1 rupee per coin)
  const coinDiscount = order.coinsUsed || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="bg-green-900/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Order Confirmed!</h1>
            <p className="text-slate-400 mt-2">Thank you for your purchase</p>
            <p className="text-sm text-slate-500 mt-1">Order ID: <span className="font-semibold text-green-400">#FZ{order.id}</span></p>
          </div>

          {/* Order Items */}
          <div className="border-t border-b border-slate-700 py-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-slate-700 p-3 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{item.productName}</p>
                      <p className="text-sm text-slate-400">Quantity: {item.quantity} {item.unit}</p>
                    </div>
                    <p className="font-semibold text-white">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No items found.</p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Price Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>

              {coinDiscount > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>🪙 Coin Discount ({coinDiscount} coins):</span>
                  <span>- {formatCurrency(coinDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Tax & Charges:</span>
                <span className="font-semibold">{formatCurrency(order.taxAmount)}</span>
              </div>

              <div className="border-t border-slate-600 pt-3 flex justify-between text-lg font-bold text-green-400">
                <span>Final Amount:</span>
                <span>{formatCurrency(order.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-blue-900/30 border-l-4 border-blue-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-300 mb-1">Delivery Information</h3>
                <p className="text-blue-300 text-sm">Expected delivery: 3-5 business days</p>
                <p className="text-blue-300 text-sm">Order Status: {order.orderStatus || 'Processing'}</p>
                <p className="text-blue-300 text-sm">Payment Status: {order.paymentStatus || 'Pending'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              View All Orders
            </button>
            <button
              onClick={() => navigate('/buying')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation
