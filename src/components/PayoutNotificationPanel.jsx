import { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

/**
 * PayoutNotificationPanel Component
 * Displays batch payout notifications and status updates for vendors
 * Shows pending payouts, completed payouts, and retry attempts
 */
export function PayoutNotificationPanel() {
  const { isDark } = useTheme()
  const [notifications, setNotifications] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)

  // Fetch payout notifications and dashboard summary
  useEffect(() => {
    const loadPayoutData = async () => {
      try {
        setLoading(true)
        
        // Fetch dashboard summary
        const summaryResponse = await apiClient.get('/notifications/dashboard/summary')
        setSummary(summaryResponse?.data)

        // Fetch notifications (only PAYMENT type related to payouts)
        const notifResponse = await apiClient.get('/notifications?page=0&size=10&sortBy=createdAt')
        const allNotifications = notifResponse?.data?.content || []
        
        // Filter for payment notifications (payouts)
        const payoutNotifications = allNotifications.filter(n => 
          n.notificationType === 'PAYMENT' && 
          (n.message?.includes('payout') || n.message?.includes('batch') || n.message?.includes('payment'))
        )
        
        setNotifications(payoutNotifications)
        setError(null)
      } catch (err) {
        console.error('Error loading payout notifications:', err)
        setError('Failed to load payout information')
      } finally {
        setLoading(false)
      }
    }

    loadPayoutData()
    // Refresh every 5 minutes
    const interval = setInterval(loadPayoutData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/mark-as-read`)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  if (loading) {
    return (
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-foreground'}`}>
        💰 Payout Information
      </h2>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard 
            title="Pending Payouts"
            value={summary.pendingPayouts || 0}
            amount={summary.pendingAmount || '₹0.00'}
            icon="⏳"
            isDark={isDark}
          />
          <SummaryCard 
            title="Completed Payouts"
            value={`₹${parseFloat(summary.totalPayoutsCompleted || 0).toLocaleString('en-IN', {
              maximumFractionDigits: 2
            })}`}
            amount="Lifetime"
            icon="✅"
            isDark={isDark}
          />
          <SummaryCard 
            title="Last Updated"
            value={new Date(summary.lastUpdated).toLocaleDateString('en-IN')}
            amount={new Date(summary.lastUpdated).toLocaleTimeString('en-IN')}
            icon="🔄"
            isDark={isDark}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <PayoutNotificationItem
              key={notif.id}
              notification={notif}
              isDark={isDark}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        ) : (
          <div className={`p-4 text-center ${isDark ? 'bg-gray-700' : 'bg-muted/50'} rounded-lg`}>
            <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              No payout notifications yet
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
          💡 Payouts are processed daily. You'll receive notifications for each batch status update.
          For more details, visit the <a href="/transactions" className="text-green-600 hover:underline">Transactions</a> page.
        </p>
      </div>
    </div>
  )
}

/**
 * PayoutNotificationItem Component
 * Displays individual payout notification with status badge
 */
export function PayoutNotificationItem({ notification, isDark, onMarkAsRead }) {
  const getStatusBadgeColor = (message) => {
    if (message?.includes('completed') || message?.includes('success')) {
      return { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' }
    } else if (message?.includes('failed') || message?.includes('error')) {
      return { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
    } else if (message?.includes('processing') || message?.includes('pending')) {
      return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⏳' }
    } else if (message?.includes('approved')) {
      return { bg: 'bg-purple-100', text: 'text-purple-800', icon: '✔️' }
    } else if (message?.includes('retry')) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🔄' }
    }
    return { bg: 'bg-muted', text: 'text-foreground', icon: 'ℹ️' }
  }

  const statusBadge = getStatusBadgeColor(notification.message?.toLowerCase())
  const formattedDate = new Date(notification.createdAt).toLocaleDateString('en-IN')
  const formattedTime = new Date(notification.createdAt).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div 
      className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${
        isDark 
          ? `bg-gray-700 border-l-blue-500 ${!notification.isRead ? 'opacity-100' : 'opacity-75'}` 
          : `bg-muted/50 border-l-blue-500 ${!notification.isRead ? 'opacity-100' : 'opacity-75'}`
      }`}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-3 py-1 rounded text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.icon} {notification.title}
          </span>
          {!notification.isRead && (
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
          )}
        </div>

        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-muted-foreground'}`}>
          {notification.message}
        </p>

        <div className={`flex gap-4 mt-2 text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
          <span>📅 {formattedDate}</span>
          <span>⏰ {formattedTime}</span>
        </div>
      </div>

      {!notification.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMarkAsRead(notification.id)
          }}
          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
          title="Mark as read"
        >
          Read
        </button>
      )}
    </div>
  )
}

/**
 * SummaryCard Component
 * Displays summary statistic about payouts
 */
function SummaryCard({ title, value, amount, icon, isDark }) {
  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-muted/50'} text-center`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-sm font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
        {title}
      </p>
      <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-foreground'}`}>
        {value}
      </p>
      <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
        {amount}
      </p>
    </div>
  )
}

export default PayoutNotificationPanel
