/**
 * Login Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 * Supports both Password login and OTP login (phone-based)
 * Uses AuthContext for professional session management
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthService from '../services/AuthService'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const { login, isAuthenticated } = useAuth()
  
  // Login mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password')
  
  // OTP stage: 'phone' (enter phone) or 'verify' (enter OTP)
  const [otpStage, setOtpStage] = useState('phone')
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Show logout reason message if present
  useEffect(() => {
    const logoutReason = sessionStorage.getItem('logoutReason');
    if (logoutReason) {
      setApiError(logoutReason);
      sessionStorage.removeItem('logoutReason');
    }
  }, []);

  // Password login form
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  
  // OTP login form
  const [otpFormData, setOtpFormData] = useState({ phone: '', otpCode: '' })
  const [otpMessage, setOtpMessage] = useState('')
  
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Countdown timer for OTP resend
  const [resendTimer, setResendTimer] = useState(0)
  
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // ===== PASSWORD LOGIN =====
  const validatePasswordForm = () => {
    const newErrors = {}
    if (!formData.identifier) {
      newErrors.identifier = 'Email, username, or user ID is required'
    } else if (formData.identifier.length < 3) {
      newErrors.identifier = 'Please enter a valid identifier'
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
    if (apiError) setApiError('')
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validatePasswordForm()) return

    setLoading(true)
    try {
      const response = await AuthService.login(formData.identifier, formData.password)
      login(response)
      
      const isFirstLogin = localStorage.getItem('firstLogin') !== 'done'
      if (isFirstLogin) {
        localStorage.setItem('firstLogin', 'done')
        navigate('/', { state: { welcome: true } })
      } else {
        navigate('/', { state: { welcomeBack: true } })
      }
    } catch (error) {
      const errorMsg = error.message || ''
      if (errorMsg.includes('not found') || errorMsg.includes('Invalid credentials') || errorMsg.includes('User not found')) {
        setApiError('Account not found! Please check your credentials or register first.')
      } else if (errorMsg.includes('password') || errorMsg.includes('Invalid')) {
        setApiError('Incorrect credentials. Please try again.')
      } else {
        setApiError(errorMsg || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ===== OTP LOGIN =====
  const validateOtpPhoneForm = () => {
    const newErrors = {}
    if (!otpFormData.phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(otpFormData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const validateOtpCodeForm = () => {
    const newErrors = {}
    if (!otpFormData.otpCode) {
      newErrors.otpCode = 'OTP is required'
    } else if (!/^[0-9]{6}$/.test(otpFormData.otpCode)) {
      newErrors.otpCode = 'Please enter a valid 6-digit OTP'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOtpChange = (e) => {
    const { name, value } = e.target
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, '')
    const maxLength = name === 'phone' ? 10 : 6
    setOtpFormData(prev => ({ ...prev, [name]: digitsOnly.slice(0, maxLength) }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (apiError) setApiError('')
  }

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setApiError('')
    setOtpMessage('')
    if (!validateOtpPhoneForm()) return

    setLoading(true)
    try {
      const response = await AuthService.requestLoginOtp(otpFormData.phone)
      if (response.success) {
        setOtpMessage(response.displayMessage || 'OTP sent to your phone!')
        setOtpStage('verify')
        setResendTimer(60) // 60 second cooldown
      } else {
        setApiError(response.displayMessage || response.message || 'Failed to send OTP')
      }
    } catch (error) {
      const errorMsg = error.message || ''
      if (errorMsg.includes('not registered') || errorMsg.includes('not found')) {
        setApiError('This phone number is not registered. Please sign up first.')
      } else {
        setApiError(errorMsg || 'Failed to send OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateOtpCodeForm()) return

    setLoading(true)
    try {
      const response = await AuthService.loginWithOtp(otpFormData.phone, otpFormData.otpCode)
      login(response)
      
      const isFirstLogin = localStorage.getItem('firstLogin') !== 'done'
      if (isFirstLogin) {
        localStorage.setItem('firstLogin', 'done')
        navigate('/', { state: { welcome: true } })
      } else {
        navigate('/', { state: { welcomeBack: true } })
      }
    } catch (error) {
      const errorMsg = error.message || ''
      if (errorMsg.includes('expired')) {
        setApiError('OTP has expired. Please request a new one.')
      } else if (errorMsg.includes('Invalid') || errorMsg.includes('invalid')) {
        setApiError('Invalid OTP. Please check and try again.')
      } else if (errorMsg.includes('already been used')) {
        setApiError('This OTP has already been used. Please request a new one.')
      } else {
        setApiError(errorMsg || 'Verification failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setApiError('')
    setOtpMessage('')
    
    setLoading(true)
    try {
      const response = await AuthService.requestLoginOtp(otpFormData.phone)
      if (response.success) {
        setOtpMessage('New OTP sent to your phone!')
        setResendTimer(60)
        setOtpFormData(prev => ({ ...prev, otpCode: '' }))
      } else {
        setApiError(response.displayMessage || 'Failed to resend OTP')
      }
    } catch (error) {
      setApiError(error.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }
  
  const handleBackToPhone = () => {
    setOtpStage('phone')
    setOtpFormData(prev => ({ ...prev, otpCode: '' }))
    setOtpMessage('')
    setApiError('')
    setErrors({})
  }
  
  // Switch login mode
  const switchLoginMode = (mode) => {
    setLoginMode(mode)
    setOtpStage('phone')
    setErrors({})
    setApiError('')
    setOtpMessage('')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Animated Background */}
      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100'}`}>
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-emerald-800' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
          <div className={`absolute top-0 -right-4 w-72 h-72 ${isDark ? 'bg-teal-800' : 'bg-emerald-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`} style={{animationDelay: '2s'}}></div>
          <div className={`absolute -bottom-8 left-20 w-72 h-72 ${isDark ? 'bg-cyan-900' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`} style={{animationDelay: '4s'}}></div>
        </div>
        {/* Farm Pattern Overlay */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`} style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDark ? 'ffffff' : '065f46'}' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
        <div className={`backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-emerald-200'} rounded-3xl shadow-2xl border p-8 transform transition-all duration-500 hover:scale-[1.02]`}>
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl rotate-3 absolute -top-1 -left-1 opacity-50"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center relative shadow-lg">
                <span className="text-4xl">🌾</span>
              </div>
            </div>
            <h1 className={`text-4xl font-extrabold ${isDark ? 'text-slate-100' : 'text-emerald-800'} mt-6 tracking-tight`}>FarmEazy</h1>
            <p className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'} mt-2 font-medium`}>Welcome back, farmer!</p>
          </div>
          
          {/* Login Mode Tabs */}
          <div className="flex mb-6 rounded-xl overflow-hidden border ${isDark ? 'border-slate-600' : 'border-emerald-200'}">
            <button
              type="button"
              onClick={() => switchLoginMode('password')}
              className={`flex-1 py-3 px-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loginMode === 'password'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                  : isDark
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-gray-50 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>🔐</span> Password
            </button>
            <button
              type="button"
              onClick={() => switchLoginMode('otp')}
              className={`flex-1 py-3 px-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loginMode === 'otp'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                  : isDark
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-gray-50 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>📱</span> OTP
            </button>
          </div>

          {/* Error Display */}
          {apiError && (
            <div className={`${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} backdrop-blur-sm border px-4 py-3 rounded-xl flex items-start gap-3 mb-5`}>
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium">{apiError}</p>
                {apiError.includes('not found') || apiError.includes('not registered') ? (
                  <Link to="/register" className={`${isDark ? 'text-red-300 hover:text-red-100' : 'text-red-600 hover:text-red-800'} underline text-sm mt-1 inline-block`}>
                    Create an account →
                  </Link>
                ) : null}
              </div>
            </div>
          )}
          
          {/* Success Message (for OTP) */}
          {otpMessage && (
            <div className={`${isDark ? 'bg-emerald-900/50 border-emerald-700 text-emerald-200' : 'bg-emerald-100 border-emerald-300 text-emerald-700'} backdrop-blur-sm border px-4 py-3 rounded-xl flex items-center gap-3 mb-5`}>
              <span className="text-xl">✅</span>
              <p className="font-medium">{otpMessage}</p>
            </div>
          )}

          {/* PASSWORD LOGIN FORM */}
          {loginMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Identifier Field */}
              <div className="space-y-2">
                <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                  <span>👤</span> Email / Username / User ID
                </label>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                  placeholder="email@example.com or username or 10001"
                />
                {errors.identifier && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-sm flex items-center gap-1`}><span>❌</span> {errors.identifier}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                  <span>🔐</span> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm pr-12`}
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
                {errors.password && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-sm flex items-center gap-1`}><span>❌</span> {errors.password}</p>}
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link to="/forgot-password" className={`${isDark ? 'text-emerald-300 hover:text-white' : 'text-emerald-600 hover:text-emerald-800'} text-sm font-medium transition-colors`}>
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
                    Logging in...
                  </>
                ) : (
                  <>
                    <span>🔑</span> Login
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP LOGIN FORM */}
          {loginMode === 'otp' && (
            <>
              {/* Stage 1: Enter Phone */}
              {otpStage === 'phone' && (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                      <span>📱</span> Mobile Number
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-emerald-500'} font-medium`}>+91</span>
                      <input
                        type="tel"
                        name="phone"
                        value={otpFormData.phone}
                        onChange={handleOtpChange}
                        className={`w-full pl-14 pr-4 py-3.5 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-sm flex items-center gap-1`}><span>❌</span> {errors.phone}</p>}
                    <p className={`${isDark ? 'text-slate-400' : 'text-emerald-500'} text-xs`}>
                      We'll send a 6-digit OTP to this number
                    </p>
                  </div>

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
                        <span>📤</span> Send OTP
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Stage 2: Enter OTP */}
              {otpStage === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {/* Phone display with edit option */}
                  <div className={`${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} font-medium`}>+91 {otpFormData.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToPhone}
                      className={`${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'} text-sm font-medium`}
                    >
                      Change
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                      <span>🔢</span> Enter OTP
                    </label>
                    <input
                      type="text"
                      name="otpCode"
                      value={otpFormData.otpCode}
                      onChange={handleOtpChange}
                      className={`w-full px-4 py-3.5 text-center text-2xl tracking-[0.5em] font-mono ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="••••••"
                      maxLength={6}
                      autoFocus
                    />
                    {errors.otpCode && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-sm flex items-center gap-1`}><span>❌</span> {errors.otpCode}</p>}
                  </div>
                  
                  {/* Resend OTP */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className={`${isDark ? 'text-slate-400' : 'text-emerald-500'} text-sm`}>
                        Resend OTP in <span className="font-bold">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className={`${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'} text-sm font-medium transition-colors disabled:opacity-50`}
                      >
                        Didn't receive OTP? Resend →
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpFormData.otpCode.length !== 6}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span>✅</span> Verify & Login
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className={`flex-1 h-px ${isDark ? 'bg-slate-600' : 'bg-emerald-200'}`}></div>
            <span className={`${isDark ? 'text-slate-400' : 'text-emerald-400'} text-sm`}>or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-slate-600' : 'bg-emerald-200'}`}></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className={`${isDark ? 'text-slate-300' : 'text-emerald-600'}`}>
              New to FarmEazy?{' '}
              <Link to="/register" className={`${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-orange-500 hover:text-orange-600'} font-bold transition-colors`}>
                Join the farm! 🌱
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className={`text-center mt-6 ${isDark ? 'text-slate-400' : 'text-emerald-500'} text-sm`}>
          <p>🌾 Growing success together 🌾</p>
        </div>
      </div>
    </div>
  )
}

export default Login
