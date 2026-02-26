/**
 * Login Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'
import OtpVerification from '../components/OtpVerification'

function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  
  // Clear tokens only on explicit logout
  useEffect(() => {
    const clearOnLogout = sessionStorage.getItem('logout_flag')
    if (clearOnLogout) {
      localStorage.removeItem('farmEazy_token')
      localStorage.removeItem('farmEazy_email')
      localStorage.removeItem('farmEazy_userId')
      localStorage.removeItem('farmEazy_username')
      localStorage.removeItem('farmEazy_fullName')
      sessionStorage.removeItem('logout_flag')
    }
  }, [])

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [pendingCredentials, setPendingCredentials] = useState(null)
  const [otpSentMessage, setOtpSentMessage] = useState('')

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setOtpSentMessage('')
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await AuthService.requestOtp(formData.email, '0000000000', 'LOGIN')
      setPendingCredentials({ email: formData.email, password: formData.password })
      setOtpSentMessage(response.message || 'OTP sent to your email!')
      setShowOtpModal(true)
    } catch (error) {
      const errorMsg = error.message || ''
      if (errorMsg.includes('not found') || errorMsg.includes('Invalid credentials')) {
        setApiError('Account not found! Please register first.')
      } else {
        setApiError(errorMsg || 'Failed to send OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerified = async () => {
    if (!pendingCredentials) return
    setLoading(true)
    try {
      await AuthService.login(pendingCredentials.email, pendingCredentials.password)
      setShowOtpModal(false)
      onLoginSuccess()
      const isFirstLogin = localStorage.getItem('firstLogin') !== 'done'
      if (isFirstLogin) {
        localStorage.setItem('firstLogin', 'done')
        navigate('/', { state: { welcome: true } })
      } else {
        navigate('/', { state: { welcomeBack: true } })
      }
    } catch (error) {
      setApiError(error.message?.includes('password') 
        ? 'Incorrect password. Please try again.'
        : error.message || 'Login failed. Please try again.')
      setShowOtpModal(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        {/* Farm Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Farm Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{animationDuration: '3s'}}>🌾</div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>🌻</div>
        <div className="absolute bottom-32 left-1/4 text-4xl opacity-20 animate-bounce" style={{animationDuration: '5s', animationDelay: '2s'}}>🌱</div>
        <div className="absolute bottom-20 right-1/3 text-5xl opacity-20 animate-bounce" style={{animationDuration: '3.5s'}}>🚜</div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:scale-[1.02]">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl rotate-3 absolute -top-1 -left-1 opacity-50"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center relative shadow-lg">
                <span className="text-4xl">🌾</span>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-white mt-6 tracking-tight">FarmEazy</h1>
            <p className="text-emerald-200 mt-2 font-medium">Welcome back, farmer!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Display */}
            {apiError && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-medium">{apiError}</p>
                  {apiError.includes('not found') && (
                    <Link to="/register" className="text-red-200 underline text-sm mt-1 inline-block hover:text-white">
                      Create an account →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {otpSentMessage && (
              <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 px-4 py-3 rounded-xl flex items-center gap-3">
                <span className="text-xl">✅</span>
                <p className="font-medium">{otpSentMessage}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-semibold flex items-center gap-2">
                <span>📧</span> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                placeholder="farmer@example.com"
              />
              {errors.email && <p className="text-red-300 text-sm flex items-center gap-1"><span>❌</span> {errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-semibold flex items-center gap-2">
                <span>🔐</span> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <p className="text-red-300 text-sm flex items-center gap-1"><span>❌</span> {errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-emerald-300 hover:text-white text-sm font-medium transition-colors">
                Forgot password? →
              </Link>
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
                  Sending OTP...
                </>
              ) : (
                <>
                  <span>🔑</span> Login with OTP
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-white/70">
              New to FarmEazy?{' '}
              <Link to="/register" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
                Join the farm! 🌱
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="text-center mt-6 text-white/40 text-sm">
          <p>🌾 Growing success together 🌾</p>
        </div>
      </div>

      {/* OTP Modal */}
      <OtpVerification
        isOpen={showOtpModal}
        onClose={() => { setShowOtpModal(false); setPendingCredentials(null); }}
        email={pendingCredentials?.email || formData.email}
        phone="0000000000"
        purpose="LOGIN"
        onVerified={handleOtpVerified}
      />
    </div>
  )
}

export default Login
