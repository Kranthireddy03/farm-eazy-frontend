/**
 * Register Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 * Now includes email OTP verification for secure registration
 * Uses AuthContext for professional session management
 * Shows toast notifications for OTP/SMS sending status
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'
import OtpService from '../services/OtpService'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGlobalToast } from '../context/ToastContext'

function Register() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const { login, isAuthenticated } = useAuth()
  const { showOtpNotification, success: toastSuccess, error: toastError } = useGlobalToast()
  const [showSuccess, setShowSuccess] = useState(false)
  const [registeredUserId, setRegisteredUserId] = useState(null)
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // OTP states
  const [showOtpScreen, setShowOtpScreen] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [timer, setTimer] = useState(0)
  const [otpVerifying, setOtpVerifying] = useState(false)

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_ ]*$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and spaces'
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpCode]
      newOtp[index] = value
      setOtpCode(newOtp)
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus()
      }
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  // Send OTP to email (and SMS if phone provided)
  const handleSendOtp = async () => {
    setLoading(true)
    setApiError('')
    try {
      // Use detailed OTP sending to get SMS/Email status
      const response = await OtpService.sendOtpDetailed(formData.email, 'REGISTRATION', formData.phone)
      
      // Show toast notification with sending status
      if (response && (response.sentVia || response.displayMessage)) {
        showOtpNotification(response)
      } else {
        toastSuccess('OTP sent successfully!')
      }
      
      setOtpSent(true)
      setTimer(600) // 10 minutes
      setShowOtpScreen(true)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send OTP. Please try again.'
      setApiError(errorMsg)
      toastError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and complete registration
  const handleVerifyOtp = async () => {
    const otpString = otpCode.join('')
    if (otpString.length !== 6) {
      setApiError('Please enter a valid 6-digit OTP')
      return
    }

    setOtpVerifying(true)
    setApiError('')
    try {
      // Verify OTP first
      await OtpService.verifyOtp(formData.email, otpString, 'REGISTRATION')
      
      // OTP verified, now register the user
      const response = await AuthService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.phone
      )
      // Store the user ID for display on success screen
      setRegisteredUserId(response?.id || localStorage.getItem('farmEazy_userId'))
      setShowSuccess(true)
      setTimeout(() => navigate('/login'), 5000)
    } catch (error) {
      setApiError(error.response?.data?.message || error.message || 'Verification failed. Please try again.')
    } finally {
      setOtpVerifying(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return
    setOtpCode(['', '', '', '', '', ''])
    await handleSendOtp()
  }

  // Step 1: Validate form and send OTP
  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateForm()) return
    
    // Send OTP instead of direct registration
    await handleSendOtp()
  }

  // Go back to form from OTP screen
  const handleBackToForm = () => {
    setShowOtpScreen(false)
    setOtpCode(['', '', '', '', '', ''])
    setApiError('')
  }

  // Success Screen
  if (showSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
        {/* Background */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100'}`}>
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-emerald-800' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
            <div className={`absolute -bottom-8 right-20 w-72 h-72 ${isDark ? 'bg-teal-900' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <div className={`backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-emerald-200'} rounded-3xl shadow-2xl border p-12`}>
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className={`text-4xl font-extrabold ${isDark ? 'text-slate-100' : 'text-emerald-800'} mb-4`}>Welcome to FarmEazy!</h1>
            <p className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'} text-lg mb-4`}>Your account has been created successfully.</p>
            
            {/* Display User ID */}
            <div className={`${isDark ? 'bg-slate-700/80 border-slate-500' : 'bg-emerald-50 border-emerald-200'} border-2 rounded-2xl p-6 mb-6`}>
              <p className={`${isDark ? 'text-slate-300' : 'text-emerald-700'} text-sm font-medium mb-2`}>Your User ID</p>
              <div className={`text-4xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                #{registeredUserId ? String(registeredUserId).padStart(5, '0') : '-----'}
              </div>
              <p className={`${isDark ? 'text-slate-400' : 'text-emerald-500'} text-xs mt-2`}>Remember this ID for quick reference</p>
            </div>
            
            <div className={`flex items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-emerald-500'}`}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Redirecting to login...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // OTP Verification Screen
  if (showOtpScreen) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
        {/* Background */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100'}`}>
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-emerald-800' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
            <div className={`absolute -bottom-8 right-20 w-72 h-72 ${isDark ? 'bg-teal-900' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className={`backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-emerald-200'} rounded-3xl shadow-2xl border p-8`}>
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-4xl">📧</span>
              </div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-emerald-800'}`}>Verify Your Email</h1>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`}>
                We've sent a 6-digit OTP to
              </p>
              <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>{formData.email}</p>
            </div>

            {/* Error */}
            {apiError && (
              <div className={`${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} border px-4 py-3 rounded-xl mb-4 flex items-center gap-2`}>
                <span>⚠️</span>
                <p className="text-sm">{apiError}</p>
              </div>
            )}

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-6">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-emerald-400 focus:ring-emerald-400/30' 
                      : 'bg-white border-emerald-200 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/30'
                  }`}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              {timer > 0 ? (
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>
                  OTP expires in <span className="text-orange-500 font-semibold">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className={`${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'} font-semibold text-sm transition`}
                >
                  Didn't receive OTP? Resend
                </button>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otpCode.join('').length !== 6}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {otpVerifying ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <span>✓</span> Verify & Register
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              onClick={handleBackToForm}
              className={`w-full mt-3 py-3 rounded-xl font-semibold transition ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
              }`}
            >
              ← Back to form
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Animated Background */}
      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-teal-100 via-emerald-50 to-green-100'}`}>
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-cyan-900' : 'bg-cyan-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
          <div className={`absolute top-0 -right-4 w-72 h-72 ${isDark ? 'bg-emerald-800' : 'bg-emerald-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`} style={{animationDelay: '2s'}}></div>
          <div className={`absolute -bottom-8 left-20 w-72 h-72 ${isDark ? 'bg-teal-900' : 'bg-yellow-200'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`} style={{animationDelay: '4s'}}></div>
        </div>
        {/* Farm Pattern Overlay */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`} style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDark ? 'ffffff' : '065f46'}' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Farm Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-8 text-6xl opacity-20 animate-bounce" style={{animationDuration: '3s'}}>🌽</div>
        <div className="absolute top-32 right-16 text-5xl opacity-20 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>🌿</div>
        <div className="absolute bottom-40 left-1/4 text-4xl opacity-20 animate-bounce" style={{animationDuration: '5s', animationDelay: '2s'}}>🐄</div>
        <div className="absolute bottom-24 right-1/4 text-5xl opacity-20 animate-bounce" style={{animationDuration: '3.5s'}}>🌻</div>
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className={`backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-emerald-200'} rounded-3xl shadow-2xl border p-8 transform transition-all duration-500 hover:scale-[1.01]`}>
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl rotate-3 absolute -top-1 -left-1 opacity-50"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center relative shadow-lg">
                <span className="text-3xl">🌱</span>
              </div>
            </div>
            <h1 className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-emerald-800'} mt-4 tracking-tight`}>Join FarmEazy</h1>
            <p className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'} mt-1 text-sm`}>Start your smart farming journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {apiError && (
              <div className={`${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} backdrop-blur-sm border px-4 py-3 rounded-xl flex items-center gap-3`}>
                <span className="text-xl">⚠️</span>
                <p className="font-medium">{apiError}</p>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                <span>👤</span> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                placeholder="farmer_john"
              />
              {errors.username && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.username}</p>}
              {formData.username && !errors.username && (
                <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} text-xs`}>✓ You'll be known as @{formData.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                <span>📧</span> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                placeholder="farmer@example.com"
              />
              {errors.email && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                <span>📱</span> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                placeholder="9876543210"
                maxLength="10"
              />
              {errors.phone && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                <span>🔐</span> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-emerald-500 hover:text-emerald-700'} transition-colors`}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  <span>🚀</span> Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className={`flex-1 h-px ${isDark ? 'bg-slate-600' : 'bg-emerald-200'}`}></div>
            <span className={`${isDark ? 'text-slate-400' : 'text-emerald-400'} text-sm`}>or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-slate-600' : 'bg-emerald-200'}`}></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className={`${isDark ? 'text-slate-300' : 'text-emerald-600'}`}>
              Already have an account?{' '}
              <Link to="/login" className={`${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-orange-500 hover:text-orange-600'} font-bold transition-colors`}>
                Login here 🔑
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className={`text-center mt-4 ${isDark ? 'text-slate-400' : 'text-emerald-500'} text-sm`}>
          <p>🌾 Plant seeds of success 🌾</p>
        </div>
      </div>
    </div>
  )
}

export default Register
