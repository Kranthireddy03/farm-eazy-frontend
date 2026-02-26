/**
 * Forgot Password Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [apiError, setApiError] = useState('')

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      await AuthService.forgotPassword(email)
      setSubmitted(true)
      setCountdown(30)
      setTimeout(() => navigate('/login'), 33000)
    } catch (error) {
      if (error.status === 503 || error.message?.includes('email')) {
        navigate('/email-error', {
          state: {
            title: 'Email Delivery Failed',
            message: error.message || 'Unable to send the password reset email.',
            email: email,
            returnPath: '/forgot-password'
          }
        })
      } else {
        setApiError(error.message || 'Failed to process request. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{animationDuration: '3s'}}>🔐</div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>📧</div>
        <div className="absolute bottom-32 left-1/4 text-4xl opacity-20 animate-bounce" style={{animationDuration: '5s', animationDelay: '2s'}}>🔑</div>
        <div className="absolute bottom-20 right-1/3 text-5xl opacity-20 animate-bounce" style={{animationDuration: '3.5s'}}>🌾</div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:scale-[1.02]">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl rotate-3 absolute -top-1 -left-1 opacity-50"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-2xl flex items-center justify-center relative shadow-lg">
                <span className="text-4xl">🔐</span>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-6 tracking-tight">Forgot Password?</h1>
            <p className="text-indigo-200 mt-2 text-sm">No worries! Enter your email to reset it.</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Display */}
              {apiError && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="font-medium">{apiError}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-semibold flex items-center gap-2">
                  <span>📧</span> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({}) }}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  placeholder="farmer@example.com"
                />
                {errors.email && <p className="text-red-300 text-sm flex items-center gap-1"><span>❌</span> {errors.email}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <span>📤</span> Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check Your Email!</h2>
              <p className="text-indigo-200 mb-6">
                We've sent a password reset link to <span className="text-white font-semibold">{email}</span>
              </p>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-white/70 text-sm">
                  Redirecting to login in{' '}
                  <span className="text-yellow-400 font-bold text-lg">{countdown}</span>{' '}
                  seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 text-indigo-300 hover:text-white transition-colors text-sm font-medium"
              >
                Go to login now →
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <p className="text-white/70">
              Remember your password?{' '}
              <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
                Login here 🔑
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="text-center mt-6 text-white/40 text-sm">
          <p>🌾 We're here to help 🌾</p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
