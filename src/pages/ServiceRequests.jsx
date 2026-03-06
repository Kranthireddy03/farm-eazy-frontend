import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../services/apiClient'

const CATEGORIES = [
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue', icon: '💳' },
  { value: 'ORDER_ISSUE', label: 'Order Issue', icon: '📦' },
  { value: 'DELIVERY_ISSUE', label: 'Delivery Issue', icon: '🚚' },
  { value: 'REFUND_ISSUE', label: 'Refund Issue', icon: '💰' },
  { value: 'ACCOUNT_ISSUE', label: 'Account Issue', icon: '👤' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue', icon: '🔧' },
  { value: 'SELLER_COMPLAINT', label: 'Seller Complaint', icon: '🏪' },
  { value: 'BUYER_COMPLAINT', label: 'Buyer Complaint', icon: '🛒' },
  { value: 'BANK_VERIFICATION', label: 'Bank Verification', icon: '🏦' },
  { value: 'OTHER', label: 'Other', icon: '❓' }
]

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-gray-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', color: 'text-orange-500' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-500' }
]

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  WAITING_FOR_USER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  WAITING_FOR_INFO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  ESCALATED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

function ServiceRequests() {
  const { isDark } = useTheme()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const [formData, setFormData] = useState({
    category: '',
    priority: 'MEDIUM',
    subject: '',
    description: '',
    relatedOrderId: '',
    relatedProductId: ''
  })

  useEffect(() => {
    fetchRequests()
  }, [page])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/service-requests?page=${page}&size=10&sort=createdAt,desc`)
      setRequests(response.data.content || [])
      setTotalPages(response.data.totalPages || 0)
    } catch (error) {
      console.error('Failed to fetch service requests:', error)
      setMessage({ type: 'error', text: 'Failed to load service requests' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
        relatedOrderId: formData.relatedOrderId ? parseInt(formData.relatedOrderId) : null,
        relatedProductId: formData.relatedProductId ? parseInt(formData.relatedProductId) : null
      }

      const response = await apiClient.post('/service-requests', payload)
      
      setMessage({ 
        type: 'success', 
        text: `Service request created successfully! Request #${response.data.requestNumber}` 
      })
      setFormData({
        category: '',
        priority: 'MEDIUM',
        subject: '',
        description: '',
        relatedOrderId: '',
        relatedProductId: ''
      })
      setShowForm(false)
      fetchRequests()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create service request' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Service Requests
            </h1>
            <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Raise and track your support tickets
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition shadow-lg"
          >
            {showForm ? '✕ Cancel' : '+ New Request'}
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className={`mb-8 rounded-xl shadow-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Create New Service Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="Brief description of your issue"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  placeholder="Provide detailed information about your issue..."
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Related Order ID (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.relatedOrderId}
                    onChange={(e) => setFormData({ ...formData, relatedOrderId: e.target.value })}
                    placeholder="Enter order ID if applicable"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Related Product ID (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.relatedProductId}
                    onChange={(e) => setFormData({ ...formData, relatedProductId: e.target.value })}
                    placeholder="Enter product ID if applicable"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className={`rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
              <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                No service requests yet
              </h3>
              <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Click "New Request" to create your first support ticket
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-slate-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Request #
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Subject
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Category
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Created
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {requests.map((request) => (
                      <tr key={request.id} className={`${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition`}>
                        <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          <span className="font-mono font-semibold">{request.requestNumber}</span>
                        </td>
                        <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                          <div className="max-w-xs truncate">{request.subject}</div>
                        </td>
                        <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                          {CATEGORIES.find(c => c.value === request.category)?.label || request.category}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[request.status] || STATUS_COLORS.OPEN}`}>
                            {request.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/service-requests/${request.requestNumber}`}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 flex justify-between items-center border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ← Previous
                  </button>
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Help */}
        <div className={`mt-8 p-6 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Need immediate help?
          </h3>
          <div className="flex flex-wrap gap-4">
            <a href="tel:+916301630368" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              📞 Call: +91 63016 30368
            </a>
            <a href="mailto:support@farm-eazy.com" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              ✉️ Email: support@farm-eazy.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceRequests
