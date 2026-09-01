import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import InvoiceModal from '../components/InvoiceModal';

export default function ServiceAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeInvoiceBookingId, setActiveInvoiceBookingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/analytics/services/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load service analytics:', err);
        setError(err.response?.data?.message || err.message || 'Unable to load analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Dedicated Service Analytics & Client Registry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-lg">
          <span className="text-4xl block mb-3">⚠️</span>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Failed to Load Service Analytics</h3>
          <p className="text-xs text-rose-600 mb-6">{error || 'Service not found or access denied.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            ← Back to Services
          </button>
        </div>
      </div>
    );
  }

  const clients = data.clientBookings || [];
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      (c.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.clientEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.bookingId || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition cursor-pointer text-xs font-semibold"
            >
              ← Back
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{data.title}</h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {data.type}
                </span>
                {data.isSuspended ? (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold uppercase">
                    Paused by Admin
                  </span>
                ) : data.isActive ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    Active Listing
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Service Ref: {data.displayId || `#${data.serviceId}`} · Base Rate: <strong className="text-slate-800">₹{data.rate} / {data.priceUnit}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/services"
              className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 transition"
            >
              📋 All My Services
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Moderation / Suspension Banner */}
        {data.isSuspended && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl shadow-xs text-xs space-y-1">
            <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
              <span>⛔</span> <span>Service Paused by Administration</span>
            </div>
            <p className="text-rose-800">
              <strong>Reason:</strong> {data.suspensionReason || 'Operational quality check review.'}
            </p>
            <p className="text-rose-600 text-[11px]">
              This service is temporarily hidden from new client bookings. Please check quality standards or reach out to support.
            </p>
          </div>
        )}

        {/* Analytics KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Capacity */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available Capacity</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.availableCapacity ?? 1} <span className="text-xs font-normal text-slate-500">Units</span>
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-2">Active fleet units</p>
          </div>

          {/* Total Bookings */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Bookings</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.totalBookingsCount ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">{data.completedBookingsCount ?? 0} completed</p>
          </div>

          {/* Gross Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Revenue</p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              ₹{Number(data.totalGrossRevenue ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-2">Escrow processed</p>
          </div>

          {/* Unique Clients */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unique Clients</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.uniqueClientsCount ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Farms served</p>
          </div>

          {/* Cancellation Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cancellations</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.cancelledBookingsCount ?? 0}
            </p>
            <p className="text-[10px] text-rose-600 font-semibold mt-2">
              {data.cancellationRatePercentage ?? 0}% cancel rate
            </p>
          </div>

          {/* Rating */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Client Rating</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-amber-500 font-mono">{Number(data.averageRating || 0).toFixed(1)}</span>
              <span className="text-amber-400 text-sm">★</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{data.reviewCount ?? 0} verified ratings</p>
          </div>

        </div>

        {/* Client Booking Registry Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>📑 Client Booking Log & Work Registry</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {filteredClients.length} {filteredClients.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact log of all farm clients, booked durations, locations, and invoices
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search client, email, booking #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-60"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredClients.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400">
                <span className="text-3xl block mb-2">🚜</span>
                No client booking records matching the current filter.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Client Name & Contact</th>
                    <th className="py-3 px-4 text-center">Duration / Qty</th>
                    <th className="py-3 px-4">Work Location</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4">Service Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        BK#{c.bookingId}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{c.clientName}</p>
                        <p className="text-[11px] text-slate-500">{c.clientEmail || c.clientPhone || 'No contact email'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {c.hours ? `${c.hours} hrs` : `${c.requestedQuantity || 1} units`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                        {c.location || 'Client Farm Location'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                        ₹{Number(c.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.serviceDate ? new Date(c.serviceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                          c.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setActiveInvoiceBookingId(c.bookingId)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-xs"
                        >
                          🧾 Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

      {/* Invoice Modal */}
      {activeInvoiceBookingId && (
        <InvoiceModal
          isOpen={Boolean(activeInvoiceBookingId)}
          bookingId={activeInvoiceBookingId}
          onClose={() => setActiveInvoiceBookingId(null)}
        />
      )}

    </div>
  );
}
