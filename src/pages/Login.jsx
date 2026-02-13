/**
 * Login Page Component
 * 
 * Features:
 * - Email and password input fields
 * - Form validation
 * - Error handling
 * - Loading state
 * - Link to registration page
 */

import { useState } from 'react'
import { useLoader } from '../context/LoaderContext'
import PasswordInput from '../components/PasswordInput'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'

function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const { show, hide, isLoading } = useLoader()

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
    show()
    setApiError('')

    if (!validateForm()) {
      return
    }

    try {
      await AuthService.login(formData.email, formData.password)
      onLoginSuccess()
      navigate('/')
    } catch (error) {
      // Check if it's a user not found error
      const errorMsg = error.message || ''
      if (errorMsg.includes('not found') || errorMsg.includes('Invalid credentials') || errorMsg.includes('User not found')) {
        setApiError('❌ Account not found! Please register first and then try to login.')
      } else if (errorMsg.includes('password') || errorMsg.includes('Password')) {
        setApiError('❌ Incorrect password. Please try again or reset your password.')
      } else {
        setApiError(errorMsg || 'Login failed. Please try again.')
      }
    } finally {
      hide()
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🌾</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">FarmEazy</h1>
            <p className="text-gray-600 mt-2">Smart Farm Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error */}
            {apiError && (
              <div className="bg-red-50 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg font-semibold">
                {apiError}
                {apiError.includes('not found') && (
                  <div className="mt-2 text-sm font-normal">
                    <Link to="/register" className="text-red-700 underline hover:text-red-900">
                      👉 Click here to register now
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="your@email.com"
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            {/* Password Field */}
      <PasswordInput
        label="Password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
        error={errors.password}
        required
        autoComplete="current-password"
      />

      {/* Forgot Password Link */}
      <div className="mt-2 text-right">
        <Link to="/reset-password" className="text-blue-600 hover:text-blue-800 underline text-sm font-medium">
        Forgot Password?
        </Link>
      </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
