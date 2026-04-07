import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../services/apiClient'

/**
 * Modal for confirming ₹1 penny drop verification
 * Appears after user submits bank details
 */
function PennyDropConfirmationModal({ isOpen, bankDetails, onClose, onConfirm, onSkip }) {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    try {
      setLoading(true)
      setError('')

      // Initiate penny drop verification
      const response = await apiClient.post('/bank-verification/initiate', {
        verificationType: 'BANK_ACCOUNT',
        accountHolderName: bankDetails?.accountHolderName || '',
        accountNumber: bankDetails?.accountNumber || '',
        ifscCode: bankDetails?.ifscCode || '',
        bankName: bankDetails?.bankName || '',
        branchName: bankDetails?.branchName || ''
      })

      if (onConfirm) {
        onConfirm(response.data)
      }

      // Auto-close after success
      setTimeout(() => {
        if (isOpen) {
          handleClose()
        }
      }, 2000)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to initiate penny drop verification'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setLoading(false)
    if (onClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        } rounded-lg shadow-xl border max-w-md w-full p-6 transform transition-all`}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Verify Your Bank Account
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We'll send ₹1 to confirm your account details
          </p>
        </div>

        {/* Bank Details Summary */}
        <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-50'} rounded-lg p-4 mb-4 space-y-3`}>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Account Holder
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {bankDetails?.accountHolderName || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Account Number
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ••••{bankDetails?.accountNumber?.slice(-4) || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Bank Name
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {bankDetails?.bankName || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              IFSC Code
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {bankDetails?.ifscCode || 'N/A'}
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className={`${isDark ? 'bg-blue-900/30 border-blue-700/30' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3 mb-4`}>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            <strong>ℹ️ How it works:</strong> We'll transfer ₹1 to your account. You'll receive it in 1-2 business days. 
            Then confirm receipt to complete verification. This ₹1 will be credited back to your FarmEazy wallet.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${isDark ? 'bg-red-900/30 border-red-700/30' : 'bg-red-50 border-red-200'} border rounded-lg p-3 mb-4`}>
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className={`ml-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Initiating verification...
            </span>
          </div>
        )}

        {/* Buttons */}
        {!loading && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (onSkip) {
                  onSkip()
                }
                handleClose()
              }}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              } disabled:opacity-50`}
            >
              Skip for Now
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm & Verify'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PennyDropConfirmationModal
