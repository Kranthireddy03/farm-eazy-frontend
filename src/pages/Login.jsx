/**
 * Login Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 * Supports Password login, OTP login, and Google sign-in
 * Uses AuthContext for professional session management
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import AuthService from '../services/AuthService'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
const GOOGLE_ALLOWED_ORIGINS = (import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const GOOGLE_ORIGIN_LIST_EXPLICIT = Boolean(import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS)

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark } = useTheme()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const { login, isAuthenticated } = useAuth()
  const redirectTo = location.state?.from || '/'
  
  const getCaptchaToken = async (action) => {
    if (typeof executeRecaptcha !== 'function') return null
    try {
      return await executeRecaptcha(action)
    } catch (error) {
      console.warn('reCAPTCHA execution failed:', error)
      return null
    }
  }
  
  // Login mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password')
  
  // OTP stage: 'phone' (enter phone) or 'verify' (enter OTP)
  const [otpStage, setOtpStage] = useState('phone')
  const [otpPreview, setOtpPreview] = useState(null)
  const [suppressAuthRedirect, setSuppressAuthRedirect] = useState(false)
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !suppressAuthRedirect) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo, suppressAuthRedirect]);
  
  // Show logout reason message if present
  useEffect(() => {
    if (location.state?.loginPrompt) {
      setApiError(location.state.loginPrompt)
    }

    const logoutReason = sessionStorage.getItem('logoutReason');
    if (logoutReason) {
      setApiError(logoutReason);
      sessionStorage.removeItem('logoutReason');
    }
  }, [location.state]);

  // Password login form
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  
  // OTP login form
  const [otpFormData, setOtpFormData] = useState({ phone: '', otpCode: '' })
  const [otpMessage, setOtpMessage] = useState('')
  
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [googleStatus, setGoogleStatus] = useState('')
  const [googleStatusTone, setGoogleStatusTone] = useState('info')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const googleButtonRef = useRef(null)
  const googleRenderedRef = useRef(false)
  const googleMode = 'login'
  const currentOrigin = window.location.origin
  const isGoogleOriginAllowed = GOOGLE_ALLOWED_ORIGINS.includes(currentOrigin)

  const decodeGoogleProfile = (credential) => {
    try {
      const payloadPart = credential.split('.')[1]
      if (!payloadPart) {
        return null
      }
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
      const normalized = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
      const payload = JSON.parse(atob(normalized))
      return {
        email: payload.email || '',
        name: payload.name || payload.given_name || '',
      }
    } catch {
      return null
    }
  }
  
  // Countdown timer for OTP resend
  const [resendTimer, setResendTimer] = useState(0)
  
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  useEffect(() => {
    let cancelled = false
    setGoogleStatus('')
    setGoogleStatusTone('info')

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current || googleRenderedRef.current) {
        return
      }

      if (window.__farmeazyGoogleInitMode !== googleMode) {
        window.google.accounts.id.cancel()
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          use_fedcm_for_prompt: false,
          callback: async (response) => {
            if (!response?.credential) {
              setApiError('Google sign-in did not return a credential.')
              return
            }

            setApiError('')
            setLoading(true)
            const googleProfile = decodeGoogleProfile(response.credential)
            try {
              const authResponse = await AuthService.loginWithGoogle(response.credential)
              if (authResponse?.requiresProfileCompletion) {
                setSuppressAuthRedirect(true)
              }
              login(authResponse)
              if (authResponse?.requiresProfileCompletion) {
                navigate('/complete-google-profile', {
                  replace: true,
                  state: {
                    socialSignupSource: 'google',
                    prefillEmail: authResponse.email || googleProfile?.email || '',
                    prefillUsername: authResponse.username || googleProfile?.name || '',
                    requiresProfileCompletion: true,
                  },
                })
              } else {
                navigate(redirectTo, { state: { welcomeBack: true, socialLogin: 'google' }, replace: true })
              }
            } catch (error) {
              const errorMessage = error.response?.data?.message || error.message || 'Google sign-in failed. Please try again.'
              if (errorMessage.toLowerCase().includes('sign up first') || errorMessage.toLowerCase().includes('not registered')) {
                navigate('/register', {
                  state: {
                    socialSignupSource: 'google',
                    prefillEmail: googleProfile?.email || '',
                    prefillUsername: googleProfile?.name || '',
                    signupPrompt: errorMessage,
                    registerWithGoogle: true,
                  },
                })
                return
              }
              setApiError(errorMessage)
            } finally {
              setLoading(false)
            }
          },
        })
        window.__farmeazyGoogleInitMode = googleMode
      }

      googleButtonRef.current.innerHTML = ''

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'circle',
        text: 'icon',
        logo_alignment: 'left',
        width: 48,
      })

      googleRenderedRef.current = true
    }

    if (!GOOGLE_CLIENT_ID) {
      setGoogleStatus('Google sign-in is currently unavailable in this environment. You can still use password or OTP login.')
      setGoogleStatusTone('info')
      return undefined
    }

    if (!GOOGLE_ORIGIN_LIST_EXPLICIT) {
      setGoogleStatus('Using default localhost origins for Google sign-in. Set VITE_GOOGLE_ALLOWED_ORIGINS to customize environments.')
      setGoogleStatusTone('info')
    }

    if (!isGoogleOriginAllowed) {
      setGoogleStatus(`Google sign-in is unavailable for this origin (${currentOrigin}). Please update allowed origins in environment and Google OAuth settings.`)
      setGoogleStatusTone('warning')
      return undefined
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
      return undefined
    }

    const scriptId = 'google-identity-services-sdk'
    let script = document.getElementById(scriptId)
    const handleScriptLoad = () => renderGoogleButton()

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = handleScriptLoad
      document.body.appendChild(script)
    } else {
      if (window.google?.accounts?.id) {
        renderGoogleButton()
      } else {
        script.addEventListener('load', handleScriptLoad)
      }
    }

    return () => {
      cancelled = true
      if (script) {
        script.removeEventListener('load', handleScriptLoad)
      }
    }
  }, [isDark, login, navigate, redirectTo, isGoogleOriginAllowed, currentOrigin, googleMode])

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
      const captchaToken = await getCaptchaToken('login')
      const response = await AuthService.login(formData.identifier, formData.password, rememberMe, captchaToken)
      login(response)
      
      const isFirstLogin = localStorage.getItem('firstLogin') !== 'done'
      if (isFirstLogin) {
        localStorage.setItem('firstLogin', 'done')
        navigate(redirectTo, { state: { welcome: true } })
      } else {
        navigate(redirectTo, { state: { welcomeBack: true } })
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
      const preview = await AuthService.previewLoginUser(otpFormData.phone)
      if (preview?.exists) {
        setOtpPreview(preview)
        setOtpStage('confirm')
      } else {
        setApiError(preview?.message || 'This phone number is not registered. Please sign up first.')
      }
    } catch (error) {
      const errorMsg = error.message || ''
      if (errorMsg.includes('not registered') || errorMsg.includes('not found')) {
        setApiError('This phone number is not registered. Please sign up first.')
      } else {
        setApiError(errorMsg || 'Failed to validate phone number. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAndSendOtp = async () => {
    setApiError('')
    setOtpMessage('')
    setLoading(true)
    try {
      const captchaToken = await getCaptchaToken('login_otp')
      const response = await AuthService.requestLoginOtp(otpFormData.phone, captchaToken)
      if (response.success) {
        setOtpMessage(response.displayMessage || 'OTP sent to your phone!')
        setOtpStage('verify')
        setResendTimer(60)
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
        navigate(redirectTo, { state: { welcome: true } })
      } else {
        navigate(redirectTo, { state: { welcomeBack: true } })
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
      const captchaToken = await getCaptchaToken('login_otp')
      const response = await AuthService.requestLoginOtp(otpFormData.phone, captchaToken)
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
    setOtpPreview(null)
    setOtpFormData(prev => ({ ...prev, otpCode: '' }))
    setOtpMessage('')
    setApiError('')
    setErrors({})
  }
  
  // Switch login mode
  const switchLoginMode = (mode) => {
    setLoginMode(mode)
    setOtpStage('phone')
    setOtpPreview(null)
    setErrors({})
    setApiError('')
    setOtpMessage('')
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6">
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <img src="/auth-login.png" alt="FarmEazy login illustration" className="w-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">FarmEazy</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground leading-tight">Welcome back</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Access farms, crops, marketplace, and support tools for your selected service location.
            </p>
          </div>
        </div>

        <div className="w-full rounded-lg border border-border bg-card shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">FE</div>
            <h1 className="text-2xl font-semibold text-foreground mt-4">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Use your FarmEazy account credentials</p>
          </div>
          {/* Login Mode Tabs */}
          <div className={`flex mb-6 rounded-2xl overflow-hidden border ${isDark ? 'border-slate-600' : 'border-emerald-200'}`}>
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

          <div className={`grid grid-cols-2 gap-3 mb-6 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-emerald-700'}`}>
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="uppercase tracking-[0.2em]">Quick access</p>
              <p className="mt-2 text-lg font-black">Field-ready</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-emerald-200 bg-white'}`}>
              <p className="uppercase tracking-[0.2em]">Secure session</p>
              <p className="mt-2 text-lg font-black">2FA built in</p>
            </div>
          </div>

          <div className={`glass-card mb-5 rounded-2xl border p-4 ${isDark ? 'border-slate-600 bg-slate-900/40' : 'border-emerald-100 bg-emerald-50/70'}`}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-emerald-800'}`}>Continue sign in with Google</p>
            <div ref={googleButtonRef} className="flex items-center justify-center min-h-[48px] min-w-[48px]" />
            <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-emerald-600'}`}>
              Google sign-in is for existing FarmEazy accounts only. If this email is new, use Register so FarmEazy can create your account and send the usual welcome email, SMS, and notification after setup.
            </p>
            {googleStatus && (
              <div
                className={`mt-3 rounded-xl px-3 py-2 text-xs border ${googleStatusTone === 'warning'
                  ? isDark
                    ? 'border-amber-700/60 bg-amber-900/30 text-amber-200'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                  : isDark
                    ? 'border-slate-600 bg-slate-800/80 text-slate-300'
                    : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {googleStatus}
              </div>
            )}
          </div>

          {/* Error Display */}
          {apiError && (
            <div className={`${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} glass-card border px-4 py-3 rounded-xl flex items-start gap-3 mb-5`}>
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
            <div className={`${isDark ? 'bg-emerald-900/50 border-emerald-700 text-emerald-200' : 'bg-emerald-100 border-emerald-300 text-emerald-700'} glass-card border px-4 py-3 rounded-xl flex items-center gap-3 mb-5`}>
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
                  className={`form-input w-full px-4 py-3.5 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'}`}
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
                    className={`form-input w-full px-4 py-3.5 pr-12 ${isDark ? 'bg-slate-700/80 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-emerald-200 text-emerald-900 placeholder-emerald-400'}`}
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
              <div className="flex items-center justify-between">
                <label className={`${isDark ? 'text-slate-300' : 'text-emerald-700'} text-sm font-medium inline-flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-400"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className={`${isDark ? 'text-emerald-300 hover:text-white' : 'text-emerald-600 hover:text-emerald-800'} text-sm font-medium transition-colors`}>
                  Forgot password? →
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="premium-button w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                    <span>🔑</span> Sign in
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
                    className="premium-button w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

              {otpStage === 'confirm' && (
                <div className="space-y-5">
                  <div className={`${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-4`}>
                    <p className={`${isDark ? 'text-slate-300' : 'text-emerald-700'} text-sm mb-2`}>
                      Is this your account?
                    </p>
                    <p className={`${isDark ? 'text-white' : 'text-emerald-900'} font-bold text-lg`}>
                      {otpPreview?.username || 'Unknown user'}
                    </p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-emerald-600'} text-sm mt-1`}>
                      {otpPreview?.maskedPhone ? `Mobile: ${otpPreview.maskedPhone}` : `+91 ${otpFormData.phone}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAndSendOtp}
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
                        <span>✅</span> Yes, Send OTP
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    className={`w-full py-3 rounded-xl border transition ${
                      isDark
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    No, change mobile number
                  </button>
                </div>
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
                        <span>✅</span> Verify & Sign in
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
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              New to FarmEazy?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
