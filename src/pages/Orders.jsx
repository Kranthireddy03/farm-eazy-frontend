import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'

function Orders() {
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
        refreshDashboardStats();
      }
    }

    fetchOrders()
  }, [])

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <p className="text-slate-300 text-lg">Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
            <p className="text-slate-400 mb-6">Your order history will appear here.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Order history</p>
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
          </div>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Continue shopping
          </button>
        </div>

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Order ID</p>
                  <p className="text-lg font-semibold text-white">#FZ{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Placed on</p>
                  <p className="text-lg font-semibold text-white">{order.createdAt?.split('T')[0] || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="text-lg font-semibold text-orange-400">{formatCurrency(order.finalAmount)}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-900/50 text-blue-400">
                    {order.orderStatus || 'PENDING'}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">Payment: {order.paymentStatus}</div>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-4 border-t border-slate-600 pt-4 text-sm text-slate-300">
                  {order.items.map(item => (
                    <div key={`${order.id}-${item.productId}`} className="flex justify-between py-1 items-center">
                      <div>
                        <span className="font-semibold text-white">{item.productName}</span> × {item.quantity}
                        {item.discountedPrice !== undefined && item.discountedPrice < item.price ? (
                          <>
                            <span className="ml-2 text-orange-400 font-bold">₹{item.discountedPrice.toFixed(2)}</span>
                            <span className="ml-2 line-through text-slate-500">₹{item.price.toFixed(2)}</span>
                            <span className="ml-2 text-green-400 font-semibold">Saved ₹{((item.price - item.discountedPrice) * item.quantity).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="ml-2 text-orange-400 font-bold">₹{item.price.toFixed(2)}</span>
                        )}
                      </div>
                      <span className="text-white">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  {/* Order-level savings */}
                  {order.items.some(item => item.discountedPrice !== undefined && item.discountedPrice < item.price) && (
                    <div className="flex justify-end text-green-400 font-semibold mt-2">
                      <span>
                        Total Discount Savings: ₹{
                          order.items.reduce((sum, item) => {
                            if (item.discountedPrice !== undefined && item.discountedPrice < item.price) {
                              return sum + ((item.price - item.discountedPrice) * item.quantity);
                            }
                            return sum;
                          }, 0).toFixed(2)
                        }
                      </span>
                    </div>
                  )}
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
