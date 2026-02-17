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

/**
 * Password visibility farming style button
 */
const FarmingEyeButton = ({ visible, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="ml-2 px-3 py-1 rounded-full border-2 border-green-600 bg-gradient-to-r from-green-200 to-yellow-100 hover:from-green-300 hover:to-yellow-200 transition flex items-center focus:outline-none focus:ring-2 focus:ring-green-500"
    style={{ fontWeight: 'bold', fontSize: '1.1em' }}
  >
    <span style={{ marginRight: 4 }}>{visible ? '👁️' : '🌱'}</span>
    {visible ? 'Hide' : 'Show'}
  </button>
);

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [invalidToken, setInvalidToken] = useState(false)
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const resetToken = searchParams.get('token')
    if (!resetToken || resetToken.length < 8) {
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
    setErrors({})
    if (!validateForm()) return
    setLoading(true)
    try {
      await AuthService.resetPassword(token, formData.password)
      showToast('Password reset successful!', 'success')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      showToast('Failed to reset password. Please try again.', 'error')
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
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-6 text-green-800">Reset Password</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="flex items-center mt-1">
                <input
                  type={showNew ? 'text' : 'password'}
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  required
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  className="ml-2 px-3 py-1 rounded-full border-2 border-green-600 bg-gradient-to-r from-green-200 to-yellow-100 hover:from-green-300 hover:to-yellow-200 transition flex items-center focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontWeight: 'bold', fontSize: '1.1em' }}
                >
                  <span style={{ marginRight: 4 }}>{showNew ? '👁️' : '🌱'}</span>
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="flex items-center mt-1">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  required
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  className="ml-2 px-3 py-1 rounded-full border-2 border-green-600 bg-gradient-to-r from-green-200 to-yellow-100 hover:from-green-300 hover:to-yellow-200 transition flex items-center focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontWeight: 'bold', fontSize: '1.1em' }}
                >
                  <span style={{ marginRight: 4 }}>{showConfirm ? '👁️' : '🌱'}</span>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || formData.password !== formData.confirmPassword}
              className="btn-primary w-full mt-4"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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
      </div>
    </div>
  );
}

export default ResetPassword;

