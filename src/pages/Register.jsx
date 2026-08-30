/**
 * Register Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 * Now includes email OTP verification for secure registration
 * Uses AuthContext for professional session management
 * Shows toast notifications for OTP/SMS sending status
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import AuthService from '../services/AuthService'
import OtpService from '../services/OtpService'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGlobalToast } from '../context/ToastContext'
import { AuthPageLayout, AuthSidePanel } from '../components/layout/AuthPageLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { InfoPanel } from '../components/platform/InfoPanel'

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
const GOOGLE_ALLOWED_ORIGINS = (import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const GOOGLE_ORIGIN_LIST_EXPLICIT = Boolean(import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS)

function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark } = useTheme()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const { login, isAuthenticated } = useAuth()
  const { showOtpNotification, success: toastSuccess, error: toastError } = useGlobalToast()
  const [showSuccess, setShowSuccess] = useState(false)
  const [registeredUserId, setRegisteredUserId] = useState(null)

  const getCaptchaToken = async (action) => {
    if (typeof executeRecaptcha !== 'function') return null
    try {
      return await executeRecaptcha(action)
    } catch (error) {
      console.warn('reCAPTCHA execution failed:', error)
      return null
    }
  }
  const [suppressAuthRedirect, setSuppressAuthRedirect] = useState(false)
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !suppressAuthRedirect) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, suppressAuthRedirect]);

  useEffect(() => {
    const prefillEmail = location.state?.prefillEmail
    const prefillUsername = location.state?.prefillUsername
    if (!prefillEmail && !prefillUsername) {
      return
    }

    setFormData(prev => ({
      ...prev,
      email: prefillEmail || prev.email,
      username: prefillUsername || prev.username,
    }))

    if (location.state?.signupPrompt) {
      setApiError(location.state.signupPrompt)
    }
  }, [location.state])
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    termsAccepted: false,
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [googleStatus, setGoogleStatus] = useState('')
  const [googleStatusTone, setGoogleStatusTone] = useState('info')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [legalDoc, setLegalDoc] = useState(null) // 'terms' | 'privacy' — opens the in-page consent subscreen

  const googleButtonRef = useRef(null)
  const googleRenderedRef = useRef(false)
  const googleMode = 'register'
  const currentOrigin = window.location.origin
  const isGoogleOriginAllowed = GOOGLE_ALLOWED_ORIGINS.includes(currentOrigin)
  
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
              const authResponse = await AuthService.registerWithGoogle(response.credential)
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
                navigate('/', { state: { welcomeBack: true, socialLogin: 'google' }, replace: true })
              }
            } catch (error) {
              const errorMessage = error.response?.data?.message || error.message || 'Google sign-in failed. Please try again.'
              const unregistered = errorMessage.toLowerCase().includes('sign up first') || errorMessage.toLowerCase().includes('not registered')

              if (unregistered) {
                setFormData((prev) => ({
                  ...prev,
                  email: googleProfile?.email || prev.email,
                  username: googleProfile?.name || prev.username,
                }))
                setApiError('Google account detected. Complete the remaining details below and create your FarmEazy account.')
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
      setGoogleStatus('Google sign-up is currently unavailable in this environment. Continue with the form below.')
      setGoogleStatusTone('info')
      return undefined
    }

    if (!GOOGLE_ORIGIN_LIST_EXPLICIT) {
      setGoogleStatus('Using default localhost origins for Google sign-up. Set VITE_GOOGLE_ALLOWED_ORIGINS to customize environments.')
      setGoogleStatusTone('info')
    }

    if (!isGoogleOriginAllowed) {
      setGoogleStatus(`Google sign-up is unavailable for this origin (${currentOrigin}). Please update allowed origins in environment and Google OAuth settings.`)
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
  }, [currentOrigin, isDark, isGoogleOriginAllowed, login, navigate, googleMode])

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
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms and Conditions and Privacy Policy'
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
      const captchaToken = await getCaptchaToken('registration_otp')
      const response = await OtpService.sendOtpDetailed(formData.email, 'REGISTRATION', formData.phone, captchaToken)
      
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
      const captchaToken = await getCaptchaToken('register')
      const response = await AuthService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.phone,
        captchaToken,
        formData.termsAccepted
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

    try {
      setLoading(true)
      const availability = await AuthService.checkRegistrationAvailability(
        formData.username,
        formData.email,
        formData.phone
      )

      if (!availability?.available) {
        setApiError(availability?.message || 'Some registration fields are already in use.')
        return
      }
    } catch (error) {
      setApiError(error.message || 'Could not validate registration details. Please try again.')
      return
    } finally {
      setLoading(false)
    }
    
    // Send OTP instead of direct registration
    await handleSendOtp()
  }

  // Go back to form from OTP screen
  const handleBackToForm = () => {
    setShowOtpScreen(false)
    setOtpCode(['', '', '', '', '', ''])
    setApiError('')
  }

  if (showSuccess) {
    return (
      <AuthPageLayout
        title="Welcome to FarmEazy"
        description="Your account has been created successfully."
        side={
          <AuthSidePanel
            imageSrc="/auth-register.png"
            imageAlt="FarmEazy welcome"
            title="You're all set"
            description="Sign in to manage farms, irrigation, marketplace listings, and expert support."
          />
        }
      >
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl">
            ✓
          </div>
          {(location.state?.socialSignupSource === 'google' || location.state?.signupPrompt) && (
            <p className="text-sm text-muted-foreground">
              You can finish sign-up with the Google email detected in the login flow.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            After sign-up, you will receive the standard welcome notification, email, and SMS.
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Your user ID</p>
            <p className="text-3xl font-bold font-mono text-primary">
              #{registeredUserId ? String(registeredUserId).padStart(5, '0') : '-----'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Redirecting to login…
          </p>
        </div>
      </AuthPageLayout>
    )
  }

  if (showOtpScreen) {
    return (
      <AuthPageLayout
        title="Verify your email"
        description={`Enter the 6-digit code sent to ${formData.email}`}
        side={
          <AuthSidePanel
            imageSrc="/auth-register.png"
            imageAlt="Verify email"
            title="Secure your account"
            description="Email verification helps protect your FarmEazy profile and farm data."
          />
        }
      >
        {apiError && (
          <InfoPanel variant="destructive" title="Could not verify" description={apiError} className="mb-4" />
        )}

        <div className="flex justify-center gap-2 mb-6">
          {otpCode.map((digit, index) => (
            <Input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold"
            />
          ))}
        </div>

        <div className="text-center mb-6">
          {timer > 0 ? (
            <p className="text-sm text-muted-foreground">
              OTP expires in{' '}
              <span className="font-semibold text-foreground">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </p>
          ) : (
            <Button type="button" variant="link" onClick={handleResendOtp} disabled={loading}>
              Didn&apos;t receive OTP? Resend
            </Button>
          )}
        </div>

        <Button
          type="button"
          onClick={handleVerifyOtp}
          disabled={otpVerifying || otpCode.join('').length !== 6}
          className="w-full"
        >
          {otpVerifying ? 'Verifying…' : 'Verify & sign up'}
        </Button>

        <Button type="button" variant="ghost" onClick={handleBackToForm} className="w-full mt-3">
          Back to form
        </Button>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout
      title="Sign up for FarmEazy"
      description="Create your account to start your smart farming journey"
      side={
        <AuthSidePanel
          imageSrc="/auth-register.png"
          imageAlt="FarmEazy register illustration"
          title="Create your smart farming account"
          description="Join FarmEazy to manage farms, irrigation, crop sales, and expert support from one polished dashboard."
        />
      }
    >
          <div className={`mb-5 rounded-lg border p-4 ${isDark ? 'border-border bg-muted/30' : 'border-border/60 bg-primary/5'}`}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Continue with Google sign-up</p>
            <div ref={googleButtonRef} className="flex items-center justify-center min-h-[48px] min-w-[48px]" />
            <p className={`mt-3 text-xs ${isDark ? 'text-muted-foreground' : 'text-primary'}`}>
              Google sign-up is for new FarmEazy accounts. If this email already exists, please use the Login page instead. After you complete setup, FarmEazy will send the standard welcome email, SMS, and notification.
            </p>
            {googleStatus && (
              <div
                className={`mt-3 rounded-xl px-3 py-2 text-xs border ${googleStatusTone === 'warning'
                  ? isDark
                    ? 'border-amber-700/60 bg-amber-900/30 text-amber-200'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                  : isDark
                    ? 'border-border bg-muted/80 text-muted-foreground'
                    : 'border-border bg-background text-muted-foreground'}`}
              >
                {googleStatus}
              </div>
            )}
          </div>

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
              <label className={`${isDark ? 'text-muted-foreground' : 'text-primary'} text-sm font-semibold flex items-center gap-2`}>
                <span>👤</span> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-muted/80 border-border text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                placeholder="farmer_john"
              />
              {errors.username && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.username}</p>}
              {formData.username && !errors.username && (
                <p className={`${isDark ? 'text-primary' : 'text-primary'} text-xs`}>✓ You'll be known as @{formData.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-muted-foreground' : 'text-primary'} text-sm font-semibold flex items-center gap-2`}>
                <span>📧</span> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-muted/80 border-border text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                placeholder="farmer@example.com"
              />
              {errors.email && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-muted-foreground' : 'text-primary'} text-sm font-semibold flex items-center gap-2`}>
                <span>📱</span> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-muted/80 border-border text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                placeholder="9876543210"
                maxLength="10"
              />
              {errors.phone && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-muted-foreground' : 'text-primary'} text-sm font-semibold flex items-center gap-2`}>
                <span>🔐</span> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-muted/80 border-border text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-muted-foreground hover:text-muted-foreground' : 'text-primary hover:text-primary'} transition-colors`}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-muted-foreground' : 'text-primary'} text-sm font-semibold flex items-center gap-2`}>
                <span>🔒</span> Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-muted/80 border-border text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-muted-foreground hover:text-muted-foreground' : 'text-primary hover:text-primary'} transition-colors`}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.confirmPassword && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.confirmPassword}</p>}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="termsAccepted"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }));
                  if (errors.termsAccepted) setErrors(prev => ({ ...prev, termsAccepted: '' }));
                }}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="termsAccepted" className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-primary/80'} leading-relaxed cursor-pointer select-none`}>
                I accept the{' '}
                <button type="button" onClick={() => setLegalDoc('terms')} className="text-teal-500 hover:underline font-semibold inline">Terms and Conditions</button>
                {' '}and{' '}
                <button type="button" onClick={() => setLegalDoc('privacy')} className="text-teal-500 hover:underline font-semibold inline">Privacy Policy</button>
              </label>
            </div>
            {errors.termsAccepted && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.termsAccepted}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-6"
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

          {/* Progress Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 text-sm">
            <div className={`rounded-3xl border p-4 ${isDark ? 'border-border bg-muted/40' : 'border-border bg-primary/5'}`}>
              <p className="uppercase tracking-[0.18em] text-xs text-muted-foreground">Step 1</p>
              <p className="mt-2 font-bold">Create account</p>
            </div>
            <div className={`rounded-3xl border p-4 ${isDark ? 'border-border bg-muted/40' : 'border-border bg-background'}`}>
              <p className="uppercase tracking-[0.18em] text-xs text-muted-foreground">Step 2</p>
              <p className="mt-2 font-bold">Verify email</p>
            </div>
            <div className={`rounded-3xl border p-4 ${isDark ? 'border-border bg-muted/40' : 'border-border bg-primary/5'}`}>
              <p className="uppercase tracking-[0.18em] text-xs text-muted-foreground">Step 3</p>
              <p className="mt-2 font-bold">Start farming</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className={`flex-1 h-px ${isDark ? 'bg-muted' : 'bg-primary/20'}`}></div>
            <span className={`${isDark ? 'text-muted-foreground' : 'text-primary'} text-sm`}>or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-muted' : 'bg-primary/20'}`}></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className={`${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* In-page Terms & Privacy consent subscreen (no navigation) */}
          {legalDoc && (
            <div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
              onClick={() => setLegalDoc(null)}
            >
              <div
                className="max-w-2xl w-full bg-background border border-border/80 rounded-3xl shadow-2xl animate-scaleUp flex flex-col max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={legalDoc === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{legalDoc === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Scroll through and accept to continue registering</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLegalDoc(null)}
                    className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition font-bold"
                    aria-label="Close"
                  >✕</button>
                </div>

                <div className="px-6 py-5 overflow-y-auto space-y-4 text-sm leading-relaxed" style={{ maxHeight: '52vh' }}>
                  {legalDoc === 'terms' ? (
                    <>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">1. Acceptance of Terms</h4>
                        <p className="text-muted-foreground">By creating an account on FarmEazy, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the platform.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">2. Eligible Use</h4>
                        <p className="text-muted-foreground">FarmEazy connects farmers with agricultural services, products, machinery, and labour. You agree to use the platform only for lawful agricultural purposes and not to list prohibited, illegal, or fraudulent items or services.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">3. Marketplace Rules</h4>
                        <p className="text-muted-foreground">Sellers are responsible for the accuracy of their listings. Buyers must not purchase their own listings. Listing eligibility requires completed verification and bank details. Prices, stock, and availability shown on the platform are subject to confirmation.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">4. Payments & Coins</h4>
                        <p className="text-muted-foreground">Payments are processed through integrated payment gateways. FarmEazy may offer coins as part of reward programs. Coin balances are non-transferable and subject to the platform's reward policy.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">5. Account Security</h4>
                        <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify support immediately of any unauthorized use.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">6. Prohibited Content</h4>
                        <p className="text-muted-foreground">You may not post content that is unlawful, misleading, defamatory, infringing, or that violates the rights of others. FarmEazy may remove content and suspend accounts that violate these terms.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">7. Liability</h4>
                        <p className="text-muted-foreground">FarmEazy acts as a platform connecting buyers and sellers. We are not a party to transactions between users. To the maximum extent permitted by law, FarmEazy's liability is limited to the services provided.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">8. Termination</h4>
                        <p className="text-muted-foreground">We may suspend or terminate access to the platform for violations of these terms, fraudulent activity, or any conduct that harms the community or platform.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">9. Changes to Terms</h4>
                        <p className="text-muted-foreground">FarmEazy may update these terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">10. Contact</h4>
                        <p className="text-muted-foreground">For any questions about these terms, contact our support team through the Support section of the platform.</p>
                      </section>
                    </>
                  ) : (
                    <>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">1. Information We Collect</h4>
                        <p className="text-muted-foreground">We collect information you provide during registration, including your name, email, phone number, farm details, and location. We also collect usage data, transaction data, and device information necessary to operate the platform.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">2. How We Use Information</h4>
                        <p className="text-muted-foreground">We use your information to provide and improve the platform, process transactions, send notifications and receipts, personalise content, and ensure marketplace safety and security.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">3. Data Sharing</h4>
                        <p className="text-muted-foreground">We do not sell your personal data. We share necessary information with service providers (such as payment gateways and notification services) solely to operate the platform, and with other users only as required to fulfil transactions you initiate.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">4. Location & Marketplace</h4>
                        <p className="text-muted-foreground">Your location and address are used to show products and services available in your area and to calculate delivery options. You control address details through your account settings.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">5. Security</h4>
                        <p className="text-muted-foreground">We use appropriate technical and organisational measures to protect your information from unauthorised access, alteration, disclosure, or destruction.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">6. Retention</h4>
                        <p className="text-muted-foreground">We retain your information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">7. Your Rights</h4>
                        <p className="text-muted-foreground">You can access, correct, or delete your personal information through your account settings or by contacting support. You may also withdraw consent where processing relies on it.</p>
                      </section>
                      <section className="space-y-2">
                        <h4 className="font-bold text-foreground">8. Contact</h4>
                        <p className="text-muted-foreground">If you have questions about this Privacy Policy or your data, contact our support team through the Support section of the platform.</p>
                      </section>
                    </>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-border/70 flex flex-wrap justify-end gap-2 shrink-0">
                  <Button type="button" variant="outline" onClick={() => setLegalDoc(null)} className="rounded-xl">Close</Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, termsAccepted: true }))
                      if (errors.termsAccepted) setErrors(prev => ({ ...prev, termsAccepted: '' }))
                      setLegalDoc(null)
                    }}
                    className="rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold"
                  >
                    ✓ Accept & Continue
                  </Button>
                </div>
              </div>
            </div>
          )}
    </AuthPageLayout>
  )
}

export default Register
