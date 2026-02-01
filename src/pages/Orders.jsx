import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'

function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/orders')
        const list = Array.isArray(response.data) ? response.data : []
        setOrders(list)
      } catch (err) {
        setError('Could not load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <p className="text-gray-700 text-lg">Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Back to shop
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
            <p className="text-gray-600 mb-6">Your order history will appear here.</p>
            <button
              onClick={() => navigate('/buying')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Order history</p>
            <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          </div>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Continue shopping
          </button>
        </div>

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="text-lg font-semibold text-gray-800">#FZ{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Placed on</p>
                  <p className="text-lg font-semibold text-gray-800">{order.createdAt?.split('T')[0] || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-800">{formatCurrency(order.finalAmount)}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
                    {order.orderStatus || 'PENDING'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">Payment: {order.paymentStatus}</div>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-4 border-t pt-4 text-sm text-gray-700">
                  {order.items.map(item => (
                    <div key={`${order.id}-${item.productId}`} className="flex justify-between py-1">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Orders
