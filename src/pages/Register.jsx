/**
 * Register Page Component
 * 
 * Features:
 * - Full Name, Email, Password input fields
 * - Phone number input (10 digits)
 * - Username input
 * - Form validation
 * - Error handling
 * - Loading state
 * - Link to login page
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'

function Register({ onRegisterSuccess }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    username: '',
  })
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters'
    }

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

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits'
    }

    // Username is required
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]*$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
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
    setApiError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await AuthService.register(
        formData.fullName,
        formData.email,
        formData.password,
        formData.phone,
        formData.username
      )
      onRegisterSuccess()
      navigate('/')
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🌾</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">FarmEazy</h1>
            <p className="text-gray-600 mt-2">Join Smart Farm Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {apiError}
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="John Doe"
              />
              {errors.fullName && <p className="error-message">{errors.fullName}</p>}
            </div>

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

            {/* Phone Field */}
            <div>
              <label className="form-label">Phone Number (10 digits)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="9876543210"
              />
              {errors.phone && <p className="error-message">{errors.phone}</p>}
            </div>

            {/* Username Field */}
            <div>
              <label className="form-label">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a username"
                required
              />
              {errors.username && <p className="error-message">{errors.username}</p>}
              {formData.username && !errors.username && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Your username: @{formData.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="flex items-center mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  required
                />
                <FarmingEyeButton
                  visible={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                  label={showPassword ? 'Hide password' : 'Show password'}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
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
                  Creating account...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
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

export default Register
