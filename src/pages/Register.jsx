/**
 * Register Page Component
 * 
 * Features:
 * - Full Name, Email, Password input fields
 * - Phone number input (10 digits)
 * - Form validation
 * - Error handling
 * - Loading state
 * - Link to login page
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
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
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameSuggestions, setUsernameSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

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

    // Fetch username suggestions when both email and phone are filled
    if (name === 'email' || name === 'phone') {
      const updatedFormData = {
        ...formData,
        [name]: value,
      }
      
      if (updatedFormData.email && updatedFormData.phone && /^[0-9]{10}$/.test(updatedFormData.phone)) {
        fetchUsernameSuggestions(updatedFormData.email, updatedFormData.phone)
      } else {
        setUsernameSuggestions([])
      }
    }
  }

  /**
   * Fetch username suggestions from backend
   */
  const fetchUsernameSuggestions = async (email, phone) => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/suggest-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsernameSuggestions(Array.from(data.suggestions) || [])
        // Auto-select first suggestion
        if (data.suggestions && data.suggestions.length > 0) {
          const firstSuggestion = Array.from(data.suggestions)[0]
          setFormData((prev) => ({
            ...prev,
            username: firstSuggestion,
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching username suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  /**
   * Select a suggested username
   */
  const selectUsername = (username) => {
    setFormData((prev) => ({
      ...prev,
      username: username,
    }))
    setShowSuggestions(false)
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

            {/* Username Field with Suggestions */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label">
                  Username <span className="text-red-500">*</span>
                </label>
                {loadingSuggestions && <span className="text-xs text-gray-500">Generating suggestions...</span>}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={(e) => {
                    handleChange(e)
                    if (usernameSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onFocus={() => usernameSuggestions.length > 0 && setShowSuggestions(true)}
                  className="form-input"
                  placeholder="Choose from suggestions or enter your own"
                  required
                />
                
                {/* Show suggestions button if available */}
                {usernameSuggestions.length > 0 && !showSuggestions && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                  >
                    View {usernameSuggestions.length} suggestions
                  </button>
                )}
                
                {/* Username Suggestions Dropdown */}
                {showSuggestions && usernameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-green-300 rounded-lg shadow-xl z-10">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-700 font-semibold">💡 Suggested usernames:</p>
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-1">
                        {Array.from(usernameSuggestions).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectUsername(suggestion)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                              formData.username === suggestion
                                ? 'bg-green-100 border-2 border-green-500 text-green-800'
                                : 'bg-gray-50 hover:bg-green-50 border-2 border-transparent text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👤</span>
                              <span className="font-semibold text-green-600">@{suggestion}</span>
                              {formData.username === suggestion && (
                                <span className="ml-auto text-green-600">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                        💬 Don't like these? Type your own username above!
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {errors.username && <p className="error-message">{errors.username}</p>}
              {formData.username && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Your username: @{formData.username}
                </p>
              )}
              {!formData.username && usernameSuggestions.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 {usernameSuggestions.length} suggestions available - click to view
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
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
