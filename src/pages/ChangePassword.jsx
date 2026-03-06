/**
 * Change Password Page Component - Modern FarmEazy Design
 * Features elegant card design with farming theme - for authenticated users
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

function ChangePassword() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      setSuccess(true)
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const message = err.response?.data?.message || 'Password change failed. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  // Success Screen
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-5xl">✅</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-4">Password Changed!</h1>
          <p className="text-emerald-100 mb-6">
            Your password has been successfully updated. A confirmation email has been sent.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-emerald-500"
          >
            Done ✓
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-2xl mx-auto px-4 py-8 ${isDark ? '' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 min-h-screen'}`}>
      {/* Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-t-3xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-3xl">🔐</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Change Password</h1>
            <p className="text-emerald-100 text-sm">Keep your account secure with a strong password</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className={`rounded-b-3xl shadow-2xl p-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {apiError && (
            <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-red-900/30 border-2 border-red-700 text-red-400' : 'bg-red-50 border-2 border-red-300 text-red-600'}`}>
              <span className="text-xl">⚠️</span>
              <p className="font-medium">{apiError}</p>
            </div>
          )}

          {/* Security Tips */}
          <div className={`rounded-xl p-4 ${isDark ? 'bg-amber-900/30 border-2 border-amber-700' : 'bg-amber-50 border-2 border-amber-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Password Tips</p>
                <ul className={`text-sm mt-1 space-y-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                  <li>• Use at least 6 characters</li>
                  <li>• Mix letters, numbers, and symbols</li>
                  <li>• Avoid common words or personal info</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Password */}
          <div className="space-y-2">
            <label className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <span>🔒</span> Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 pr-12 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showCurrent ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.currentPassword && <p className="text-red-400 text-sm flex items-center gap-1"><span>❌</span> {errors.currentPassword}</p>}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className={`flex-1 h-px ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>New Password</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <span>🔐</span> New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 pr-12 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showNew ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-400 text-sm flex items-center gap-1"><span>❌</span> {errors.newPassword}</p>}
            {formData.newPassword && formData.newPassword.length >= 6 && !errors.newPassword && (
              <p className="text-emerald-400 text-sm flex items-center gap-1"><span>✅</span> Password strength: Good</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <span>🔐</span> Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 pr-12 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showConfirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-sm flex items-center gap-1"><span>❌</span> {errors.confirmPassword}</p>}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && !errors.confirmPassword && (
              <p className="text-emerald-400 text-sm flex items-center gap-1"><span>✅</span> Passwords match!</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating Password...
              </>
            ) : (
              <>
                <span>🔄</span> Update Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Note */}
      <div className={`text-center mt-6 text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        <p>🔒 Your password is encrypted and secure</p>
      </div>
    </div>
  )
}

export default ChangePassword
