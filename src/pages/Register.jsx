/**
 * Register Page Component - Modern FarmEazy Design
 * Features elegant glass morphism, animated backgrounds, and farming theme
 * Now includes email OTP verification for secure registration
 * Uses AuthContext for professional session management
 * Shows toast notifications for OTP/SMS sending status
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import AuthService from '../services/AuthService'
import OtpService from '../services/OtpService'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGlobalToast } from '../context/ToastContext'

function HoverQuestionCard({ title, question, options, correctIndex, correctText, wrongText, isDark }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-900/85' : 'border-slate-200 bg-white/95'} shadow-sm transition duration-300 ease-[cubic-bezier(0.2,0.85,0.2,1)] hover:shadow-xl hover:-translate-y-0.5`}>
      <div className={`absolute inset-0 rounded-2xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/12'} opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none`} />
      <div className="relative p-5">
        <p className={`text-xs uppercase tracking-[0.28em] font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{title}</p>
        <h3 className={`mt-3 text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{question}</h3>
        <div className="mt-4 grid gap-3">
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(index)}
              className={`w-full text-left px-3 py-3 rounded-2xl border transition-all duration-200 ${selected === index ? (isDark ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-emerald-400 bg-emerald-50 text-emerald-900') : (isDark ? 'border-slate-700 bg-slate-900/85 text-slate-300 hover:border-emerald-400 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-400 hover:bg-emerald-50')}`}>
              {option}
            </button>
          ))}
        </div>
        {selected !== null && (
          <p className={`mt-4 text-sm font-medium ${selected === correctIndex ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-rose-300' : 'text-red-600')}`}>
            {selected === correctIndex ? correctText : wrongText}
          </p>
        )}
      </div>
    </div>
  )
}

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
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [googleStatus, setGoogleStatus] = useState('')
  const [googleStatusTone, setGoogleStatusTone] = useState('info')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registerQuizSeed, setRegisterQuizSeed] = useState(() => Math.random())

  const registerQuestionCards = [
    {
      title: 'Signup hint',
      question: 'What should you verify before creating a FarmEazy account?',
      options: ['Phone number', 'Blog content', 'Notification settings'],
      correctIndex: 0,
      correctText: 'Great — verifying your phone keeps your account secure and ready for OTP flows.',
      wrongText: 'Not quite — phone verification is the key step for FarmEazy registration.',
    },
    {
      title: 'Setup tip',
      question: 'What is the best description of FarmEazy after signup?',
      options: ['A marketplace only', 'A smart farm dashboard', 'A photography app'],
      correctIndex: 1,
      correctText: 'Yes — FarmEazy is a smart farming dashboard for crops, irrigation, and sales.',
      wrongText: 'Try again — FarmEazy is built for farm management, not just marketplace or photos.',
    },
    {
      title: 'Fresh start',
      question: 'Which detail makes it easier to connect farms and buyers?',
      options: ['Phone number', 'Favorite color', 'Emoji choice'],
      correctIndex: 0,
      correctText: 'Correct — a phone number helps FarmEazy confirm your identity and support reach you.',
      wrongText: 'Wrong — FarmEazy needs real contact details like phone number.',
    },
    {
      title: 'Growth tip',
      question: 'Why does FarmEazy ask for a username during registration?',
      options: ['For system alerts', 'For identity and profile', 'For blog posts'],
      correctIndex: 1,
      correctText: 'Right — the username is used for your FarmEazy profile and identity.',
      wrongText: 'Not quite — it is for your profile identity, not blog content.',
    },
    {
      title: 'Smart signup',
      question: 'What happens after you complete registration?',
      options: ['You can add farms immediately', 'Your account is muted', 'You lose access'],
      correctIndex: 0,
      correctText: 'Exactly — after signup, you can immediately start adding farms and tracking crops.',
      wrongText: 'Nope — FarmEazy opens access after signup, not restricts it.',
    },
    {
      title: 'Next step',
      question: 'What is the easiest way to finish account setup?',
      options: ['Complete profile details', 'Change theme', 'Delete account'],
      correctIndex: 0,
      correctText: 'Yes — completing profile details is the easiest way to get started.',
      wrongText: 'Try again — the setup is about profile details, not theme or deletion.',
    },
    {
      title: 'Onboarding',
      question: 'Which item should you keep handy during signup?',
      options: ['Phone', 'Laptop charger', 'Coffee cup'],
      correctIndex: 0,
      correctText: 'Right — you should keep your phone handy for verification codes.',
      wrongText: 'Not quite — the important thing is your phone for OTP, not accessories.',
    },
    {
      title: 'Account safety',
      question: 'Why is password confirmation required?',
      options: ['To avoid typos', 'To save data', 'To update profile'],
      correctIndex: 0,
      correctText: 'Correct — it helps avoid typos and keeps your password entry accurate.',
      wrongText: 'Wrong — the main reason is to confirm the password you entered.',
    },
    {
      title: 'Farm focus',
      question: 'After registration, what is the best first action?',
      options: ['Add a farm', 'Send a message', 'Write a review'],
      correctIndex: 0,
      correctText: 'Exactly — adding a farm is the best way to start using FarmEazy.',
      wrongText: 'No — the first action should be farm setup, not messages or reviews.',
    },
    {
      title: 'Modern signup',
      question: 'What does FarmEazy give you after sign-up?',
      options: ['Crop and irrigation tools', 'Music playlists', 'Movie tickets'],
      correctIndex: 0,
      correctText: 'Right — it gives access to farm and irrigation management, not entertainment.',
      wrongText: 'Not that — FarmEazy focuses on farming tools after signup.',
    },
    {
      title: 'Profile tip',
      question: 'Why should you add a profile photo?',
      options: ['Better recognition', 'Improve weather', 'Faster login'],
      correctIndex: 0,
      correctText: 'Yes — a profile photo makes your account easier to recognize inside the app.',
      wrongText: 'Not really — profile photos are for recognition, not weather or speed.',
    },
    {
      title: 'Phone check',
      question: 'Which info does FarmEazy need for OTP?',
      options: ['Phone number', 'Birthday', 'Favorite farm'],
      correctIndex: 0,
      correctText: 'Correct — OTP verification relies on your phone number.',
      wrongText: 'Wrong — FarmEazy needs phone number for OTP, not birthday or favorites.',
    },
    {
      title: 'Email tip',
      question: 'What happens if email is invalid?',
      options: ['No verification code', 'More crops', 'Faster dashboard'],
      correctIndex: 0,
      correctText: 'Right — an invalid email means the verification code cannot be delivered.',
      wrongText: 'Not that — the issue is not related to crops or dashboard speed.',
    },
    {
      title: 'Help readiness',
      question: 'How can full details help support?',
      options: ['They resolve issues faster', 'They change theme', 'They delete accounts'],
      correctIndex: 0,
      correctText: 'Exactly — complete registration details help support resolve issues faster.',
      wrongText: 'No — support uses your details to help, not to change themes or delete accounts.',
    },
    {
      title: 'Secure start',
      question: 'What is a strong registration password?',
      options: ['Mix letters and numbers', 'Only your name', 'Repeated digits'],
      correctIndex: 0,
      correctText: 'Right — strong passwords mix letters, numbers, and symbols.',
      wrongText: 'Not secure — you should avoid simple names and repeated digits.',
    },
    {
      title: 'Account setup',
      question: 'Which action comes after sign-up?',
      options: ['Verify email', 'Share posts', 'Book tours'],
      correctIndex: 0,
      correctText: 'Yes — verifying your email is the next required step.',
      wrongText: 'No — email verification follows signup before optional actions.',
    },
    {
      title: 'Farm planning',
      question: 'Why add farm details now?',
      options: ['To see accurate schedules', 'To skip onboarding', 'To enable ads'],
      correctIndex: 0,
      correctText: 'Exactly — accurate farm details let FarmEazy tailor schedules and alerts.',
      wrongText: 'Not right — it is about schedule accuracy, not ads or skipping onboarding.',
    },
    {
      title: 'Confirmation',
      question: 'Why confirm password twice?',
      options: ['Reduce entry mistakes', 'Create a second password', 'Send OTP'],
      correctIndex: 0,
      correctText: 'Right — confirming twice reduces the chance of a typo.',
      wrongText: 'Wrong — the goal is preventing mistakes, not creating two passwords.',
    },
    {
      title: 'Signup benefit',
      question: 'Registering now means you can:',
      options: ['Track irrigation', 'Play music', 'Watch movies'],
      correctIndex: 0,
      correctText: 'Yes — registration unlocks irrigation tracking and farm management tools.',
      wrongText: 'No — FarmEazy is about farm tools, not entertainment.',
    },
    {
      title: 'Launch tip',
      question: 'What should you keep ready during sign-up?',
      options: ['Phone for OTP', 'Travel plans', 'Favorite recipe'],
      correctIndex: 0,
      correctText: 'Correct — your phone should be ready for OTP verification.',
      wrongText: 'Not that — the important item is your phone, not travel or recipes.',
    },
  ]

  const pickRandomCards = (cards, count) => {
    const shuffled = [...cards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, count)
  }

  const displayRegisterCards = useMemo(() => pickRandomCards(registerQuestionCards, 2), [registerQuizSeed])
  const refreshRegisterCards = () => setRegisterQuizSeed(Math.random())

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
        captchaToken
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

  // Success Screen
  if (showSuccess) {
    return (
      <div className="premium-shell min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
        {/* Background */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100'}`}>
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-emerald-800' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
            <div className={`absolute -bottom-8 right-20 w-72 h-72 ${isDark ? 'bg-teal-900' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
          </div>
          <div className="absolute inset-0 premium-grid opacity-20 pointer-events-none"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className={`backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-emerald-200'} rounded-3xl shadow-2xl border p-12`}>
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className={`text-4xl font-extrabold ${isDark ? 'text-slate-100' : 'text-emerald-800'} mb-4`}>Welcome to FarmEazy!</h1>
            <p className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'} text-lg mb-4`}>Your account has been created successfully.</p>
            {(location.state?.socialSignupSource === 'google' || location.state?.signupPrompt) && (
              <p className={`${isDark ? 'text-slate-300' : 'text-emerald-700'} text-sm mb-4`}>
                You can finish sign-up with the Google email that was detected in the login flow.
              </p>
            )}
            <p className={`${isDark ? 'text-slate-400' : 'text-emerald-500'} text-xs mb-4`}>
              After sign-up, you will receive the same welcome notification, email, and SMS as every other new account.
            </p>
            
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
      <div className="premium-shell min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
        {/* Background */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100'}`}>
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-emerald-800' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
            <div className={`absolute -bottom-8 right-20 w-72 h-72 ${isDark ? 'bg-teal-900' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
          </div>
          <div className="absolute inset-0 premium-grid opacity-20 pointer-events-none"></div>
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
                  <span>✓</span> Verify & Sign up
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
    <div className="premium-shell min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),transparent_26%)]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundSize: '24px 24px', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)' }} />

      {/* Register Experience Grid */}
      <div className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
        <div className={`relative overflow-hidden rounded-[2rem] border border-slate-700 shadow-[0_25px_90px_rgba(0,0,0,0.3)] ${isDark ? 'bg-slate-950/95 text-slate-100' : 'bg-white/95 text-slate-950'}`}>
          <div className="relative h-full min-h-[680px] overflow-hidden rounded-[2rem]">
            <img src="/auth-register.png" alt="FarmEazy register illustration" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
            <div className="absolute left-0 bottom-0 w-full p-8 sm:p-10">
              <span className="text-xs uppercase tracking-[0.24em] text-emerald-300">FARMEAZY signup</span>
              <h2 className="mt-3 text-4xl font-black leading-tight">Create your smart farming account</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 max-w-lg">
                Join FarmEazy to manage farms, irrigation, crop sales, and expert support from one polished dashboard.
              </p>
              <div className={`mt-6 rounded-3xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/90' : 'border-slate-200 bg-white/95'} shadow-sm`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={`text-xs uppercase tracking-[0.28em] font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Quick questions</p>
                  <button type="button" onClick={refreshRegisterCards} className={`text-xs font-semibold transition ${isDark ? 'text-emerald-300 hover:text-emerald-100' : 'text-emerald-700 hover:text-emerald-900'}`}>
                    Refresh
                  </button>
                </div>
                <div className="space-y-4">
                  {displayRegisterCards.map((card, index) => (
                    <HoverQuestionCard key={`${card.question}-${registerQuizSeed}-${index}`} {...card} isDark={isDark} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full">
          <div className={`backdrop-blur-xl relative overflow-hidden rounded-[2rem] border border-slate-700 shadow-[0_20px_80px_rgba(0,0,0,0.32)] transform transition duration-300 hover:scale-[1.01] p-8 ${isDark ? 'bg-slate-950/95 text-slate-100' : 'bg-white/95 text-slate-950'}`}>
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl rotate-3 absolute -top-1 -left-1 opacity-50"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center relative shadow-lg">
                <span className="text-3xl">🌱</span>
              </div>
            </div>
            <h1 className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-emerald-800'} mt-4 tracking-tight`}>Sign up for FarmEazy</h1>
            <p className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'} mt-1 text-sm`}>Create your account to start your smart farming journey</p>
          </div>


          <div className={`glass-card mb-5 rounded-2xl border p-4 ${isDark ? 'border-slate-600 bg-slate-900/40' : 'border-emerald-100 bg-emerald-50/70'}`}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-emerald-800'}`}>Continue with Google sign-up</p>
            <div ref={googleButtonRef} className="flex items-center justify-center min-h-[48px] min-w-[48px]" />
            <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-emerald-600'}`}>
              Google sign-up is for new FarmEazy accounts. If this email already exists, please use the Login page instead. After you complete setup, FarmEazy will send the standard welcome email, SMS, and notification.
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className={`${isDark ? 'text-slate-200' : 'text-emerald-700'} text-sm font-semibold flex items-center gap-2`}>
                <span>🔒</span> Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
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
              {errors.confirmPassword && <p className={`${isDark ? 'text-red-400' : 'text-red-500'} text-xs flex items-center gap-1`}><span>❌</span> {errors.confirmPassword}</p>}
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

          {/* Progress Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 text-sm">
            <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="uppercase tracking-[0.18em] text-xs text-slate-500">Step 1</p>
              <p className="mt-2 font-bold">Create account</p>
            </div>
            <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-emerald-200 bg-white'}`}>
              <p className="uppercase tracking-[0.18em] text-xs text-slate-500">Step 2</p>
              <p className="mt-2 font-bold">Verify email</p>
            </div>
            <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="uppercase tracking-[0.18em] text-xs text-slate-500">Step 3</p>
              <p className="mt-2 font-bold">Start farming</p>
            </div>
          </div>

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
                Sign in here 🔑
              </Link>
            </p>
          </div>

          <div className={`mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <div className={`rounded-3xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="text-xs uppercase tracking-[0.2em]">Ready for users</p>
              <p className="mt-3 font-bold">Quick, friendly forms</p>
            </div>
            <div className={`rounded-3xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-white bg-white'}`}>
              <p className="text-xs uppercase tracking-[0.2em]">Next steps</p>
              <p className="mt-3 font-bold">Account access in minutes</p>
            </div>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className={`text-center mt-4 ${isDark ? 'text-slate-400' : 'text-emerald-500'} text-sm`}>
          <p>🌾 Plant seeds of success 🌾</p>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Register
