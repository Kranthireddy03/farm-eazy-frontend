import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import {
  createTicket,
  getTickets,
  cancelTicket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../services/SupportTicketService'

function Support() {
  const { isDark } = useTheme()
  const { toast, showToast, closeToast } = useToast()
  const [activeTab, setActiveTab] = useState('new') // 'new' or 'tickets'
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  
  // Form state
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    contactEmail: localStorage.getItem('farmEazy_email') || '',
    contactPhone: '',
  })

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets()
    }
  }, [activeTab])

  const loadTickets = async () => {
    try {
      setTicketsLoading(true)
      const data = await getTickets()
      setTickets(data)
    } catch (err) {
      showToast('Failed to load tickets', 'error')
    } finally {
      setTicketsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.subject.trim() || !form.description.trim()) {
      showToast('Please fill in subject and description', 'error')
      return
    }

    try {
      setLoading(true)
      const ticket = await createTicket(form)
      showToast(`Ticket ${ticket.displayId} created successfully!`, 'success')
      
      // Reset form
      setForm({
        subject: '',
        description: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        contactEmail: localStorage.getItem('farmEazy_email') || '',
        contactPhone: '',
      })
      
      // Switch to tickets tab
      setActiveTab('tickets')
      loadTickets()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create ticket', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTicket = async (displayId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) return
    
    try {
      await cancelTicket(displayId)
      showToast(`Ticket ${displayId} cancelled`, 'success')
      loadTickets()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel ticket', 'error')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = TICKET_STATUSES[status] || { label: status, color: 'gray' }
    const colorClasses = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[statusConfig.color]}`}>
        {statusConfig.icon} {statusConfig.label}
      </span>
    )
  }
  
  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🎫</span>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Support Center</h1>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Raise a ticket and we'll get back to you within 24 hours
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className={`inline-flex rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'new'
                  ? 'bg-green-500 text-white shadow-lg'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✏️ New Ticket
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'tickets'
                  ? 'bg-green-500 text-white shadow-lg'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 My Tickets {tickets.length > 0 && `(${tickets.length})`}
            </button>
          </div>
        </div>

        {/* New Ticket Form */}
        {activeTab === 'new' && (
          <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Subject */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of your issue"
                  maxLength={200}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none transition ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none transition ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {TICKET_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none transition ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {TICKET_PRIORITIES.map(pri => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Please describe your issue in detail..."
                  rows={5}
                  maxLength={5000}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none transition resize-none ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {form.description.length}/5000 characters
                </p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none transition ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    maxLength={20}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none transition ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                  loading
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-green-500/25'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  '🎫 Submit Ticket'
                )}
              </button>
            </form>
          </div>
        )}

        {/* My Tickets List */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {ticketsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <span className="text-5xl block mb-4">📭</span>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>No tickets yet</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`rounded-xl p-5 border transition-all hover:shadow-lg ${
                    isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-mono text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {ticket.displayId}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {ticket.subject}
                      </h3>
                      <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {ticket.description}
                      </p>
                      <div className={`flex items-center gap-4 mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        <span>📁 {TICKET_CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}</span>
                        <span>📅 {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleCancelTicket(ticket.displayId)}
                        className={`px-3 py-1 text-sm rounded-lg transition ${
                          isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {ticket.resolution && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>Resolution:</p>
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{ticket.resolution}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Contact Info Footer */}
        <div className={`mt-8 rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-center text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Need immediate assistance? Contact us directly:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:+916301630368"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              📞 +91 63016 30368
            </a>
            <a
              href="mailto:support@farm-eazy.com"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              ✉️ support@farm-eazy.com
            </a>
          </div>
          <p className={`text-xs text-center mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Support available Monday - Saturday, 9 AM - 6 PM IST
          </p>
        </div>
      </div>
    </div>
  )
}

export default Support
