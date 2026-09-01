import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export default function InvoiceModal({ orderId, bookingId, isOpen, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchInvoice() {
      setLoading(true);
      setError(null);
      try {
        const url = orderId 
          ? `/invoices/order/${orderId}`
          : `/invoices/booking/${bookingId}`;
        const res = await apiClient.get(url);
        setInvoice(res.data);
      } catch (err) {
        console.error('Failed to load invoice:', err);
        setError(err.response?.data?.message || err.message || 'Unable to fetch invoice');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [isOpen, orderId, bookingId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 transition-all">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🧾</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">Tax Invoice & Billing Summary</h3>
              <p className="text-emerald-100 text-xs">{invoice ? invoice.invoiceNumber : 'Loading details...'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={loading || !invoice}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🖨️ Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto bg-slate-50/50 print:bg-white print:p-0 print:max-h-none">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
              <p className="text-sm font-medium text-slate-600">Generating Tax Invoice...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <p className="text-rose-700 font-semibold text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          ) : invoice ? (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none">
              
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black tracking-tight text-emerald-700">🌱 FarmEazy</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full uppercase tracking-wider">Official Invoice</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{invoice.platformName}</p>
                  <p className="text-xs text-slate-500">GSTIN: <span className="font-semibold text-slate-700">{invoice.platformGstin}</span></p>
                  <p className="text-xs text-slate-500">Support: <span className="text-emerald-700">{invoice.platformSupportEmail}</span></p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-mono font-bold tracking-wide">
                    {invoice.invoiceNumber}
                  </span>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Date: <span className="font-medium text-slate-800">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Ref ID: <span className="font-semibold text-slate-700">{invoice.displayOrderId}</span>
                  </p>
                </div>
              </div>

              {/* Parties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
                
                {/* Billed To / Buyer */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
                    <span>👤</span> <span>Billed To (Customer)</span>
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{invoice.buyerName}</p>
                  {invoice.buyerEmail && <p className="text-slate-600 mt-0.5">Email: {invoice.buyerEmail}</p>}
                  {invoice.buyerPhone && <p className="text-slate-600">Phone: {invoice.buyerPhone}</p>}
                  {invoice.shippingAddress && (
                    <div className="mt-2 text-slate-700 pt-2 border-t border-slate-200">
                      <p className="font-semibold text-[11px] text-slate-500">Delivery Destination:</p>
                      <p>{invoice.shippingAddress}</p>
                      <p>{[invoice.shippingCity, invoice.shippingState, invoice.shippingPincode].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Seller / Provider */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
                    <span>🏪</span> <span>Supplier / Verified Seller</span>
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{invoice.sellerName}</p>
                  {invoice.sellerLocation && <p className="text-slate-600 mt-0.5">Hub: {invoice.sellerLocation}</p>}
                  {invoice.sellerEmail && <p className="text-slate-600">Email: {invoice.sellerEmail}</p>}
                  {invoice.sellerPhone && <p className="text-slate-600">Contact: {invoice.sellerPhone}</p>}
                  <div className="mt-2 text-emerald-700 font-semibold pt-2 border-t border-slate-200 flex items-center space-x-1">
                    <span>🛡️</span> <span>FarmEazy Escrow Protected Transaction</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-6">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Itemized Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Type</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items && invoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-semibold text-slate-800">{item.itemName}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                              {item.itemType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">₹{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{Number(item.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="text-xs text-slate-500 space-y-1 max-w-sm">
                  <p className="font-bold text-slate-700">Payment & Policy Information:</p>
                  <p>Method: <span className="font-semibold text-slate-800">{invoice.paymentMethod || 'Online'}</span></p>
                  <p>Status: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">{invoice.paymentStatus}</span></p>
                  {invoice.transactionId && (
                    <p className="font-mono text-[11px] text-slate-600">Txn: {invoice.transactionId}</p>
                  )}
                  <p className="pt-2 text-[10px] text-slate-400">
                    This is a computer-generated invoice and requires no physical signature under IT Act 2000.
                  </p>
                </div>

                <div className="w-full md:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">₹{Number(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {Number(invoice.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount / Coupons:</span>
                      <span className="font-mono">-₹{Number(invoice.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {Number(invoice.shippingAmount || 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery / Transport:</span>
                      <span className="font-mono">₹{Number(invoice.shippingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {Number(invoice.taxAmount || 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST / Tax:</span>
                      <span className="font-mono">₹{Number(invoice.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Total Paid:</span>
                    <span className="text-base font-mono text-emerald-700">₹{Number(invoice.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end space-x-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || !invoice}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            Download / Print
          </button>
        </div>

      </div>
    </div>
  );
}
