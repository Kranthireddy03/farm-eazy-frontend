import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

/**
 * RefundDetails - Page to view/manage refund details (bank/UPI info)
 */
function RefundDetails() {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [hasDetails, setHasDetails] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Form state
    const [preferredMethod, setPreferredMethod] = useState('UPI')
    const [accountHolderName, setAccountHolderName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [confirmAccountNumber, setConfirmAccountNumber] = useState('')
    const [ifscCode, setIfscCode] = useState('')
    const [bankName, setBankName] = useState('')
    const [branchName, setBranchName] = useState('')
    const [upiId, setUpiId] = useState('')
    const [isVerified, setIsVerified] = useState(false)

    useEffect(() => {
        fetchRefundDetails()
    }, [])

    const fetchRefundDetails = async () => {
        try {
            const response = await apiClient.get('/refund-details/my-details')
            if (response.data && response.data.hasDetails !== false) {
                setHasDetails(true)
                const details = response.data
                setAccountHolderName(details.accountHolderName || '')
                setIfscCode(details.ifscCode || '')
                setBankName(details.bankName || '')
                setBranchName(details.branchName || '')
                setUpiId(details.upiId || '')
                setPreferredMethod(details.preferredMethod || 'UPI')
                setIsVerified(details.isVerified || false)
            } else {
                setHasDetails(false)
                setIsEditing(true) // Show form if no details
            }
        } catch (err) {
            setHasDetails(false)
            setIsEditing(true)
        } finally {
            setLoading(false)
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
                setError('Please enter a valid UPI ID')
                return false
            }
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!validateForm()) return

        setSaving(true)

        try {
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

            setSuccess('Refund details saved successfully!')
            setHasDetails(true)
            setIsEditing(false)
            setIsVerified(false) // Reset verification status on update
            setAccountNumber('') // Clear sensitive data
            setConfirmAccountNumber('')

            fetchRefundDetails() // Refresh

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save refund details')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your refund details?')) return

        try {
            await apiClient.delete('/refund-details/delete')
            setSuccess('Refund details deleted')
            setHasDetails(false)
            setIsEditing(true)
            // Reset form
            setAccountHolderName('')
            setAccountNumber('')
            setConfirmAccountNumber('')
            setIfscCode('')
            setBankName('')
            setBranchName('')
            setUpiId('')
            setPreferredMethod('UPI')
        } catch (err) {
            setError('Failed to delete refund details')
        }
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
                <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Loading...</p>
            </div>
        )
    }

    return (
        <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-gray-100'} transition`}
                    >
                        ←
                    </button>
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            💳 Refund Details
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Manage your bank/UPI details for receiving refunds
                        </p>
                    </div>
                </div>

                {/* Success/Error messages */}
                {error && (
                    <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        ✓ {success}
                    </div>
                )}

                <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    {/* View mode */}
                    {hasDetails && !isEditing && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isVerified 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                    {isVerified ? '✓ Verified' : '⏳ Pending Verification'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-sm transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Account Holder</p>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{accountHolderName}</p>
                                    </div>
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Preferred Method</p>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {preferredMethod === 'UPI' ? '📱 UPI' : '🏦 Bank Transfer'}
                                        </p>
                                    </div>
                                    {preferredMethod === 'UPI' ? (
                                        <div className="col-span-2">
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>UPI ID</p>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{upiId}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bank</p>
                                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{bankName || '—'}</p>
                                            </div>
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>IFSC</p>
                                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{ifscCode}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                These details will be used for all your refunds. Make sure they are correct.
                            </p>
                        </div>
                    )}

                    {/* Edit/Add mode */}
                    {isEditing && (
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
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
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
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
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
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
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
                                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                        }`}
                                        required={preferredMethod === 'UPI'}
                                    />
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Example: yourname@okhdfcbank, mobile@paytm
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
                                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
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
                                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
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
                                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
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
                                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
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
                                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${
                                                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                {hasDetails && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false)
                                            fetchRefundDetails() // Reset form
                                        }}
                                        className={`flex-1 py-3 rounded-lg font-medium transition ${
                                            isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`${hasDetails ? 'flex-1' : 'w-full'} py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition disabled:opacity-50`}
                                >
                                    {saving ? 'Saving...' : hasDetails ? 'Update Details' : 'Save Details'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Info card */}
                <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <h3 className={`font-medium mb-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>ℹ️ Why do I need this?</h3>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        <li>• When you cancel an order or request a return, refunds are processed to these details</li>
                        <li>• Your details are stored securely and encrypted</li>
                        <li>• You can update them anytime from your profile</li>
                        <li>• Refunds typically take 5-7 business days to process</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default RefundDetails
