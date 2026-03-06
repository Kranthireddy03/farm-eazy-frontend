import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

/**
 * RefundDetailsModal - Modal to add/edit bank/UPI details for refunds
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - onClose: function - Called when modal should close
 * - onSuccess: function - Called after successfully saving details
 * - orderId: number (optional) - If provided, will proceed with refund after saving
 */
function RefundDetailsModal({ isOpen, onClose, onSuccess, orderId }) {
    const { isDark } = useTheme()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    // Form state
    const [preferredMethod, setPreferredMethod] = useState('UPI')
    const [accountHolderName, setAccountHolderName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [confirmAccountNumber, setConfirmAccountNumber] = useState('')
    const [ifscCode, setIfscCode] = useState('')
    const [bankName, setBankName] = useState('')
    const [branchName, setBranchName] = useState('')
    const [upiId, setUpiId] = useState('')

    // Load existing details on mount
    useEffect(() => {
        if (isOpen) {
            fetchExistingDetails()
        }
    }, [isOpen])

    const fetchExistingDetails = async () => {
        try {
            const response = await apiClient.get('/refund-details/my-details')
            if (response.data && !response.data.hasDetails === false) {
                const details = response.data
                setAccountHolderName(details.accountHolderName || '')
                setIfscCode(details.ifscCode || '')
                setBankName(details.bankName || '')
                setBranchName(details.branchName || '')
                setUpiId(details.upiId || '')
                setPreferredMethod(details.preferredMethod || 'UPI')
                // Don't populate account number for security
            }
        } catch (err) {
            // No existing details, that's fine
            console.log('No existing refund details')
        }
    }

    const validateForm = () => {
        if (!accountHolderName.trim()) {
            setError('Account holder name is required')
            return false
        }

        if (preferredMethod === 'BANK') {
            if (!accountNumber) {
                setError('Account number is required')
                return false
            }
            if (accountNumber !== confirmAccountNumber) {
                setError('Account numbers do not match')
                return false
            }
            if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
                setError('Please enter a valid IFSC code (e.g., SBIN0001234)')
                return false
            }
        } else {
            if (!upiId || !upiId.includes('@')) {
                setError('Please enter a valid UPI ID (e.g., yourname@upi)')
                return false
            }
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (!validateForm()) return

        setLoading(true)

        try {
            // Save refund details
            await apiClient.post('/refund-details/save', {
                accountHolderName,
                accountNumber: preferredMethod === 'BANK' ? accountNumber : null,
                confirmAccountNumber: preferredMethod === 'BANK' ? confirmAccountNumber : null,
                ifscCode: preferredMethod === 'BANK' ? ifscCode.toUpperCase() : null,
                bankName: preferredMethod === 'BANK' ? bankName : null,
                branchName: preferredMethod === 'BANK' ? branchName : null,
                upiId: preferredMethod === 'UPI' ? upiId : null,
                preferredMethod
            })

            setSuccess(true)

            // If orderId provided, proceed with refund
            if (orderId) {
                try {
                    await apiClient.post(`/orders/${orderId}/proceed-refund`)
                } catch (refundErr) {
                    console.error('Error proceeding with refund:', refundErr)
                }
            }

            setTimeout(() => {
                if (onSuccess) onSuccess()
                onClose()
            }, 1500)

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save refund details')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        💳 Refund Details
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        ✕
                    </button>
                </div>

                {/* Info message */}
                <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                    <p className="text-sm">
                        Add your bank or UPI details to receive refunds. This information will be saved securely and used for all future refunds.
                    </p>
                </div>

                {/* Error/Success messages */}
                {error && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                        ✓ Refund details saved successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Method toggle */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Preferred Refund Method
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPreferredMethod('UPI')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                                    preferredMethod === 'UPI'
                                        ? 'bg-orange-500 text-white'
                                        : isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                📱 UPI
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreferredMethod('BANK')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                                    preferredMethod === 'BANK'
                                        ? 'bg-orange-500 text-white'
                                        : isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                🏦 Bank Account
                            </button>
                        </div>
                    </div>

                    {/* Account holder name */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Account Holder Name *
                        </label>
                        <input
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Enter name as per bank account"
                            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                            }`}
                            required
                        />
                    </div>

                    {/* UPI Fields */}
                    {preferredMethod === 'UPI' && (
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                UPI ID *
                            </label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                                placeholder="yourname@upi"
                                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                }`}
                                required={preferredMethod === 'UPI'}
                            />
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Example: nameof@okhdfcbank, mobile@paytm
                            </p>
                        </div>
                    )}

                    {/* Bank Fields */}
                    {preferredMethod === 'BANK' && (
                        <>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Account Number *
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter account number"
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                    required={preferredMethod === 'BANK'}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Confirm Account Number *
                                </label>
                                <input
                                    type="text"
                                    value={confirmAccountNumber}
                                    onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Re-enter account number"
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                    } ${accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber ? 'border-red-500' : ''}`}
                                    required={preferredMethod === 'BANK'}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    IFSC Code *
                                </label>
                                <input
                                    type="text"
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value.toUpperCase().slice(0, 11))}
                                    placeholder="SBIN0001234"
                                    maxLength={11}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                    required={preferredMethod === 'BANK'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="SBI, HDFC..."
                                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Branch
                                    </label>
                                    <input
                                        type="text"
                                        value={branchName}
                                        onChange={(e) => setBranchName(e.target.value)}
                                        placeholder="Branch name"
                                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                        }`}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-3 rounded-lg font-medium transition ${
                                isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RefundDetailsModal
