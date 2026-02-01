/**
 * Reset Password Page Component
 * 
 * Features:
 * - Password and confirm password input fields
 * - Form validation
 * - Error handling
 * - Loading state
 * - Token verification from URL
 * - Toast notifications
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast, showToast, closeToast } = useToast()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [invalidToken, setInvalidToken] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Get token from URL query parameter
    const resetToken = searchParams.get('token')
    if (!resetToken) {
      setInvalidToken(true)
    } else {
      setToken(resetToken)
    }
  }, [searchParams])

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Call reset password endpoint with token
      await AuthService.resetPassword(token, formData.password)
      
      setResetSuccess(true)
      showToast('Password changed successfully!', 'success')
      
      // Start countdown
      let timeLeft = 5
      const countdownInterval = setInterval(() => {
        timeLeft -= 1
        setCountdown(timeLeft)
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval)
          navigate('/login')
        }
      }, 1000)
      
    } catch (error) {
      showToast(error.message || 'Failed to reset password. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="btn-primary w-full inline-block"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="w-full max-w-md">
        {/* Success Message */}
        {resetSuccess ? (
          <div className="card text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Changed Successfully!</h1>
            <p className="text-gray-600 mb-4">
              Your password has been reset successfully.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Redirecting to login page in <span className="text-2xl font-bold">{countdown}</span> seconds...
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          /* Card */
          <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔑</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Create New Password</h1>
            <p className="text-gray-600 mt-2">Enter a new password for your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Back to{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
