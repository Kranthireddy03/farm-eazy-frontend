import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import InvoiceModal from '../components/InvoiceModal';

export default function ProductAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeInvoiceOrderId, setActiveInvoiceOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/analytics/products/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load product analytics:', err);
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
          <p className="text-sm font-semibold text-slate-600">Loading Dedicated Product Analytics & Buyer Registry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-lg">
          <span className="text-4xl block mb-3">⚠️</span>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Failed to Load Product Analytics</h3>
          <p className="text-xs text-rose-600 mb-6">{error || 'Product not found or access denied.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            ← Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const buyers = data.buyers || [];
  const filteredBuyers = buyers.filter(b => {
    const matchesSearch = 
      (b.buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.buyerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.displayOrderId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (b.orderStatus || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isLowStock = (data.presentStock || 0) <= 5;
  const isOutOfStock = (data.presentStock || 0) === 0;

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
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{data.productName}</h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {data.category}
                </span>
                {data.isSuspended ? (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold uppercase">
                    Paused by Admin
                  </span>
                ) : isOutOfStock ? (
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                    Low Stock ({data.presentStock} {data.unit})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    Active & In Stock ({data.presentStock} {data.unit})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Product ID #{data.productId} · Base Price: <strong className="text-slate-800">₹{data.price} / {data.unit}</strong>
                {data.discountedPrice && <span className="ml-1 text-emerald-700 font-bold">(Offer: ₹{data.discountedPrice})</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to={`/products/${data.productId}`}
              className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 transition"
            >
              👁️ View Product Page
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Moderation / Suspension Banner */}
        {data.isSuspended && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl shadow-xs text-xs space-y-1">
            <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
              <span>⛔</span> <span>Listing Paused by Administration</span>
            </div>
            <p className="text-rose-800">
              <strong>Reason:</strong> {data.suspensionReason || 'Operational quality check review.'}
            </p>
            <p className="text-rose-600 text-[11px]">
              This product is temporarily hidden from buyer checkouts. Please review quality guidelines or contact support to resolve.
            </p>
          </div>
        )}

        {/* Analytics KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Present Stock */}
          <div className={`p-4 rounded-2xl border ${
            isOutOfStock ? 'bg-rose-50/70 border-rose-200' : isLowStock ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
          } shadow-xs`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Present Stock</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.presentStock ?? 0} <span className="text-xs font-normal text-slate-500">{data.unit}</span>
            </p>
            <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(100, ((data.presentStock || 0) / 50) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Units Sold */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Units Sold</p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {data.totalUnitsSold ?? 0} <span className="text-xs font-normal text-slate-500">{data.unit}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-2">{data.totalOrdersCount ?? 0} total order lines</p>
          </div>

          {/* Gross Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Revenue</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              ₹{Number(data.totalGrossRevenue ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-2">Paid & verified orders</p>
          </div>

          {/* Unique Buyers */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unique Buyers</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.uniqueBuyersCount ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Verified customers</p>
          </div>

          {/* Returns & Refunds */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Returns & Refunds</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {data.returnsCount ?? 0}
            </p>
            <p className="text-[10px] text-rose-600 font-semibold mt-2">
              {data.returnRatePercentage ?? 0}% return rate
            </p>
          </div>

          {/* Customer Rating */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer Rating</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-amber-500 font-mono">{Number(data.averageRating || 0).toFixed(1)}</span>
              <span className="text-amber-400 text-sm">★</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{data.reviewCount ?? 0} customer reviews</p>
          </div>

        </div>

        {/* Buyers & Order Registry Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>📋 Buyer Order Log & Purchase History</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {filteredBuyers.length} {filteredBuyers.length === 1 ? 'Record' : 'Records'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact records of each customer purchase, prices, timestamps, and downloadable tax invoices
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search buyer name, email, order #..."
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
                <option value="DELIVERED">DELIVERED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredBuyers.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400">
                <span className="text-3xl block mb-2">🔍</span>
                No buyer purchase records matching the current filter.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Customer Name & Contact</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Price at Purchase</th>
                    <th className="py-3 px-4 text-right">Total Billing</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4 text-center">Order Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBuyers.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {b.displayOrderId}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{b.buyerName}</p>
                        <p className="text-[11px] text-slate-500">{b.buyerEmail || b.buyerPhone || 'No contact email'}</p>
                        {b.shippingCity && (
                          <p className="text-[10px] text-slate-400 mt-0.5">📍 {b.shippingCity}, {b.shippingState}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {b.quantity} {data.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        ₹{Number(b.pricePerUnit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {b.orderDate ? new Date(b.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          b.orderStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          b.orderStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                          b.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setActiveInvoiceOrderId(b.orderId)}
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
      {activeInvoiceOrderId && (
        <InvoiceModal
          isOpen={Boolean(activeInvoiceOrderId)}
          orderId={activeInvoiceOrderId}
          onClose={() => setActiveInvoiceOrderId(null)}
        />
      )}

    </div>
  );
}
