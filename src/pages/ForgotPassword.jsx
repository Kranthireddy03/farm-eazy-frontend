/**
 * Forgot Password Page Component
 * 
 * Features:
 * - Email input field
 * - Form validation
 * - Error handling
 * - Loading state
 * - Success message
 * - Toast notifications
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'
import { useToast } from '../hooks/useToast'
import { useLoader } from '../context/LoaderContext'
import Toast from '../components/Toast'

function ForgotPassword() {
  const navigate = useNavigate()
  const { toast, showToast, closeToast } = useToast()
  const { show, hide } = useLoader()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)

  if (loading) {
    return <Loader message="Processing, please wait..." />;
  }

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  /**
   * Validate email
   */
  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    show()

    try {
      // Call forgot password endpoint
      await AuthService.forgotPassword(email)
      
      setSubmitted(true)
      setCountdown(30) // Start 30-second countdown
      showToast('Password reset link sent to your email!', 'success')
      
      // Redirect to login after 33 seconds (30 countdown + 3 seconds message)
      setTimeout(() => {
        navigate('/login')
      }, 33000)
    } catch (error) {
      // Check if this is an email delivery error (503 status)
      if (error.status === 503 || error.message?.includes('email') || error.errorCode?.includes('EMAIL')) {
        // Navigate to email error page with details
        navigate('/email-error', {
          state: {
            title: 'Email Delivery Failed',
            message: error.message || 'We were unable to send the password reset email. Please try again later.',
            errorCode: error.errorCode || 'EMAIL_DELIVERY_FAILED',
            email: email,
            returnPath: '/forgot-password'
          }
        })
      } else {
        // Show toast for other errors (like email not found)
        showToast(error.message || 'Failed to process request. Please try again.', 'error')
      }
    } finally {
      hide()
    }
  }

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    setEmail(e.target.value)
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({})
    }
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
        {/* Card */}
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-600 mt-2">Enter your email to receive a reset link</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your@email.com"
                  disabled={loading}
                />
                {errors.email && <p className="error-message">{errors.email}</p>}
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
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700">
                  ✓ Reset link has been sent to <strong>{email}</strong>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Please check your email and click the link to reset your password.
                </p>
              </div>
              
              {/* Countdown Timer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 font-semibold text-lg">
                  {countdown > 0 ? `${countdown}` : '✓'} seconds remaining
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {countdown > 0 
                    ? 'You can request another reset link after the timer ends'
                    : 'Timer completed. Redirecting to login...'}
                </p>
                {/* Visual progress bar */}
                {countdown > 0 && (
                  <div className="mt-3 bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-1000"
                      style={{ width: `${(countdown / 30) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
