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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <p className="text-gray-700 text-lg">Loading your order...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Order Confirmed</p>
              <h1 className="text-3xl font-bold text-gray-800">Thank you for your purchase!</h1>
              <p className="text-gray-600 mt-1">Order ID: #FZ{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(order.finalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">Payment: {order.paymentStatus}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Items</p>
            {order.items && order.items.length > 0 ? (
              order.items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm text-gray-800 py-1">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No items found.</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Go to My Orders
            </button>
            <button
              onClick={() => navigate('/buying')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
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
