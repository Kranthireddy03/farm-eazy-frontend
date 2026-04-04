import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/apiClient'
import OtpService from '../services/OtpService'

const VERIFICATION_TYPES = [
  { value: 'BANK_ACCOUNT', label: 'Bank Account', icon: '🏦', description: 'Verify your bank account using IFSC and account number' },
  { value: 'UPI', label: 'UPI ID', icon: '📱', description: 'Verify your UPI ID for quick transfers' }
]

const STATUS_COLORS = {
  INITIATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  TRANSFER_PENDING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  TRANSFER_SUCCESS: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  TRANSFER_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  VERIFIED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const STATUS_LABELS = {
  INITIATED: 'INITIATED',
  TRANSFER_PENDING: 'TRANSFER PENDING',
  TRANSFER_SUCCESS: 'AWAITING CONFIRMATION',
  TRANSFER_FAILED: 'TRANSFER FAILED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
}

function BankVerification() {
  const { isDark } = useTheme()
  const { getUserEmail, getUserPhone } = useAuth()
  const location = useLocation()
  const isVendorFlow = location?.pathname === '/vendor-verification'
  const verificationTypeOptions = isVendorFlow
    ? VERIFICATION_TYPES.filter(type => type.value === 'BANK_ACCOUNT')
    : VERIFICATION_TYPES
  const [verificationType, setVerificationType] = useState('')
  const [verifications, setVerifications] = useState([])
  const [limits, setLimits] = useState({ canVerify: true, remainingToday: 3, dailyLimit: 3 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [confirmingVerificationNumber, setConfirmingVerificationNumber] = useState('')
  const [otpChannelMessage, setOtpChannelMessage] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    consentAccepted: false
  })

  const [upiForm, setUpiForm] = useState({
    upiId: '',
    accountHolderName: '',
    consentAccepted: false
  })

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(' | ')
    }
    return data?.message || fallback
  }

  const normalizeVerificationItem = (item) => {
    const verificationType = item?.verificationType || item?.type || 'BANK_ACCOUNT'
    const accountMasked = item?.accountMasked || item?.accountNumberMasked || ''
    const upiMasked = item?.upiIdMasked || item?.upiId || ''

    return {
      ...item,
      verificationType,
      accountMasked,
      upiMasked,
      accountHolderName: item?.accountHolderName || 'Account Holder',
      status: item?.status || 'PENDING',
      createdAt: item?.createdAt || null,
      verificationNumber: item?.verificationNumber || ''
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [verificationsRes, limitsRes] = await Promise.all([
        apiClient.get('/bank-verification'),
        apiClient.get('/bank-verification/limits')
      ])
      // Backend returns Page object with content array
      const verificationData = verificationsRes.data?.content || verificationsRes.data || []
      setVerifications(
        Array.isArray(verificationData)
          ? verificationData.map(normalizeVerificationItem)
          : []
      )
      setLimits(limitsRes.data || { canVerify: true, remainingToday: 3, dailyLimit: 3 })
    } catch (error) {
      console.error('Failed to fetch verification data:', error)
      setVerifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBank = async (e) => {
    e.preventDefault()

    if (!otpVerified) {
      setMessage({ type: 'error', text: 'Please verify OTP before initiating bank verification.' })
      return
    }
    
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setMessage({ type: 'error', text: 'Account numbers do not match' })
      return
    }

    if (!bankForm.consentAccepted) {
      setMessage({ type: 'error', text: 'Please accept consent to continue verification.' })
      return
    }

    if (!limits.canVerify) {
      setMessage({ type: 'error', text: 'Daily verification limit reached. Try again tomorrow.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        verificationType: 'BANK_ACCOUNT',
        accountHolderName: bankForm.accountHolderName,
        accountNumber: bankForm.accountNumber,
        confirmAccountNumber: bankForm.confirmAccountNumber,
        ifscCode: bankForm.ifscCode.toUpperCase(),
        bankName: bankForm.bankName,
        branchName: bankForm.branchName
      }

      const response = await apiClient.post('/bank-verification/initiate', payload)
      const currentStatus = response?.data?.status
      const requiresConfirmation = ['INITIATED', 'TRANSFER_PENDING', 'TRANSFER_SUCCESS'].includes(currentStatus)
      
      setMessage({ 
        type: 'success', 
        text: requiresConfirmation
          ? `Verification request created. Reference: ${response.data.verificationNumber}. Please confirm receipt from history to complete verification.`
          : `Bank verification initiated! Reference: ${response.data.verificationNumber}`
      })
      setBankForm({
        accountHolderName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        consentAccepted: false
      })
      setVerificationType('')
      fetchData()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: getErrorMessage(error, 'Failed to initiate verification')
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitUPI = async (e) => {
    e.preventDefault()

    if (isVendorFlow) {
      setMessage({ type: 'error', text: 'UPI verification is not allowed in vendor onboarding. Use bank account verification.' })
      return
    }

    if (!otpVerified) {
      setMessage({ type: 'error', text: 'Please verify OTP before initiating UPI verification.' })
      return
    }

    if (!upiForm.consentAccepted) {
      setMessage({ type: 'error', text: 'Please accept consent to continue verification.' })
      return
    }

    if (!limits.canVerify) {
      setMessage({ type: 'error', text: 'Daily verification limit reached. Try again tomorrow.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        verificationType: 'UPI',
        upiId: upiForm.upiId,
        accountHolderName: upiForm.accountHolderName
      }

      const response = await apiClient.post('/bank-verification/initiate', payload)
      const currentStatus = response?.data?.status
      const requiresConfirmation = ['INITIATED', 'TRANSFER_PENDING', 'TRANSFER_SUCCESS'].includes(currentStatus)
      
      setMessage({ 
        type: 'success', 
        text: requiresConfirmation
          ? `Verification request created. Reference: ${response.data.verificationNumber}. Please confirm receipt from history to complete verification.`
          : `UPI verification initiated! Reference: ${response.data.verificationNumber}`
      })
      setUpiForm({ upiId: '', accountHolderName: '', consentAccepted: false })
      setVerificationType('')
      fetchData()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: getErrorMessage(error, 'Failed to initiate verification')
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

  const maskAccountNumber = (num) => {
    if (!num || num.length < 4) return num
    return '••••' + num.slice(-4)
  }

  const sendVerificationOtp = async () => {
    const email = getUserEmail?.()?.trim()
    const phone = getUserPhone?.()?.trim()

    if (!email) {
      setMessage({ type: 'error', text: 'Unable to find your login email. Please re-login and try again.' })
      return
    }

    try {
      setOtpSending(true)
      const response = await OtpService.sendOtpDetailed(email, 'BANK_VERIFICATION', phone || null)
      setOtpSent(true)
      setOtpVerified(false)
      setOtpChannelMessage(response?.displayMessage || response?.message || 'OTP sent successfully.')
      setMessage({ type: 'success', text: 'OTP sent. Enter the code to continue verification.' })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to send OTP. Please try again.') })
    } finally {
      setOtpSending(false)
    }
  }

  const verifyVerificationOtp = async () => {
    const email = getUserEmail?.()?.trim()

    if (!email) {
      setMessage({ type: 'error', text: 'Unable to find your login email. Please re-login and try again.' })
      return
    }

    if (!otpCode || otpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Enter a valid 6-digit OTP.' })
      return
    }

    try {
      setOtpVerifying(true)
      const response = await OtpService.verifyOtp(email, otpCode, 'BANK_VERIFICATION')
      const verified = Boolean(response?.verified)
      if (!verified) {
        setMessage({ type: 'error', text: response?.message || 'OTP verification failed.' })
        return
      }

      setOtpVerified(true)
      setMessage({ type: 'success', text: 'OTP verified. You can now submit verification details.' })
    } catch (error) {
      setOtpVerified(false)
      setMessage({ type: 'error', text: getErrorMessage(error, 'OTP verification failed. Please try again.') })
    } finally {
      setOtpVerifying(false)
    }
  }

  const confirmVerification = async (verificationNumber) => {
    if (!verificationNumber) {
      return
    }

    try {
      setConfirmingVerificationNumber(verificationNumber)
      const response = await apiClient.post(`/bank-verification/confirm/${verificationNumber}`)

      if (response?.data?.success) {
        setMessage({ type: 'success', text: 'Verification completed successfully. Vendor access will be unlocked now.' })
      } else {
        setMessage({ type: 'error', text: response?.data?.message || 'Could not complete verification. Please try again.' })
      }

      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to confirm verification. Please try again.') })
    } finally {
      setConfirmingVerificationNumber('')
    }
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {isVendorFlow ? 'Vendor Verification' : 'Bank Verification'}
          </h1>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {isVendorFlow
              ? 'Complete verification to unlock vendor dashboard and paid product/service listings'
              : 'Verify your bank account or UPI ID for secure transactions'}
          </p>
        </div>

        {/* Limits Card */}
        <div className={`mb-6 p-4 rounded-xl border ${
          limits.canVerify 
            ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
            : isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${limits.canVerify ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {limits.canVerify ? '✓ Verifications Available' : '✕ Daily Limit Reached'}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {limits.remainingToday} of {limits.dailyLimit} verifications remaining today
              </p>
            </div>
            <div className="text-3xl">
              {limits.canVerify ? '🔓' : '🔒'}
            </div>
          </div>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Manual Penny Drop Security</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            FarmEazy uses a controlled INR 1 verification flow with audit logs and masked account details. Verification is finalized only after successful transfer confirmation.
          </p>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${otpVerified
          ? (isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')
          : (isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200')}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className={`font-semibold ${otpVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {otpVerified ? '✓ OTP Verified' : 'OTP Verification Required'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Verify OTP before submitting {isVendorFlow ? 'vendor bank' : 'bank/UPI'} verification.
              </p>
              {otpChannelMessage && (
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{otpChannelMessage}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={sendVerificationOtp}
                disabled={otpSending}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-600 to-teal-600 text-white disabled:opacity-50"
              >
                {otpSending ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Send OTP')}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className={`w-44 px-3 py-2 rounded-lg border ${
                isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
            <button
              onClick={verifyVerificationOtp}
              disabled={otpVerifying || otpCode.length !== 6}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-white dark:bg-slate-600 disabled:opacity-50"
            >
              {otpVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
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

        {/* Verification Type Selection */}
        {!verificationType && (
          <div className={`rounded-xl shadow-lg border p-6 mb-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Select Verification Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationTypeOptions.map(type => (
                <button
                  key={type.value}
                  onClick={() => setVerificationType(type.value)}
                  disabled={!limits.canVerify || !otpVerified}
                  className={`p-6 rounded-xl border text-left transition ${
                    (limits.canVerify && otpVerified)
                      ? isDark 
                        ? 'bg-slate-700 border-slate-600 hover:border-green-500 hover:bg-slate-600' 
                        : 'bg-gray-50 border-gray-200 hover:border-green-500 hover:bg-green-50'
                      : 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                  }`}
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {type.label}
                  </h3>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bank Account Form */}
        {verificationType === 'BANK_ACCOUNT' && (
          <div className={`rounded-xl shadow-lg border p-6 mb-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                🏦 Bank Account Verification
              </h2>
              <button
                onClick={() => setVerificationType('')}
                className={`text-sm ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                ← Change Type
              </button>
            </div>

            <form onSubmit={handleSubmitBank} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  required
                  placeholder="Name as per bank records"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                    required
                    minLength={9}
                    maxLength={18}
                    placeholder="Enter account number"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    value={bankForm.confirmAccountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                    required
                    placeholder="Re-enter account number"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={bankForm.consentAccepted}
                  onChange={(e) => setBankForm({ ...bankForm, consentAccepted: e.target.checked })}
                  className="mt-1"
                />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  I confirm this bank account belongs to me and I authorize FarmEazy to perform INR 1 penny-drop verification for payout/refund security.
                </span>
              </label>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                  required
                  pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  11-character IFSC code (e.g., SBIN0001234)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    placeholder="e.g., State Bank of India"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.branchName}
                    onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                    placeholder="e.g., Hyderabad Main"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !bankForm.consentAccepted}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Verify Bank Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* UPI Form */}
        {!isVendorFlow && verificationType === 'UPI' && (
          <div className={`rounded-xl shadow-lg border p-6 mb-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                📱 UPI Verification
              </h2>
              <button
                onClick={() => setVerificationType('')}
                className={`text-sm ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                ← Change Type
              </button>
            </div>

            <form onSubmit={handleSubmitUPI} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={upiForm.upiId}
                  onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value.toLowerCase() })}
                  required
                  pattern="^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$"
                  placeholder="e.g., yourname@upi"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Enter your UPI ID (e.g., mobile@paytm, name@ybl)
                </p>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={upiForm.consentAccepted}
                  onChange={(e) => setUpiForm({ ...upiForm, consentAccepted: e.target.checked })}
                  className="mt-1"
                />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  I confirm this UPI ID belongs to me and I authorize FarmEazy to validate it for secure transactions.
                </span>
              </label>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={upiForm.accountHolderName}
                  onChange={(e) => setUpiForm({ ...upiForm, accountHolderName: e.target.value })}
                  required
                  placeholder="Name linked to UPI"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !upiForm.consentAccepted}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Verify UPI ID'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verification History */}
        <div className={`rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Verification History
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : verifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">🏦</div>
              <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                No verification requests yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {verifications.map((v, index) => (
                <div key={index} className={`p-4 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {v.verificationType === 'UPI' ? '📱' : '🏦'}
                      </div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {v.verificationType === 'UPI' ? (v.upiMasked || v.accountMasked || '-') : (v.accountMasked || '-')}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {v.accountHolderName} • {v.verificationNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[v.status] || STATUS_COLORS.PENDING}`}>
                        {STATUS_LABELS[v.status] || v.status}
                      </span>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {formatDate(v.createdAt)}
                      </p>
                      {v.status === 'TRANSFER_SUCCESS' && (
                        <button
                          type="button"
                          onClick={() => confirmVerification(v.verificationNumber)}
                          disabled={confirmingVerificationNumber === v.verificationNumber}
                          className="mt-2 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {confirmingVerificationNumber === v.verificationNumber ? 'Confirming...' : 'Confirm ₹1 Received'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className={`mt-8 p-6 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🔒 Security Information
          </h3>
          <ul className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            <li>• Your bank details are encrypted and stored securely</li>
            <li>• Verification is done through RBI-approved payment gateways</li>
            <li>• We never share your financial information with third parties</li>
            <li>• Daily verification limit: {limits.dailyLimit} attempts per day</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BankVerification
