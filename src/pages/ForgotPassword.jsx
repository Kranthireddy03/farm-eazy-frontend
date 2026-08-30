/**
 * Forgot Password Page Component
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { Mail } from 'lucide-react'
import AuthService from '../services/AuthService'
import { useTheme } from '../context/ThemeContext'
import { AuthPageLayout, AuthSidePanel } from '../components/layout/AuthPageLayout'
import AppPage from '../components/layout/AppPage'

function ForgotPassword() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [email, setEmail] = useState('')

  const getCaptchaToken = async (action) => {
    if (typeof executeRecaptcha !== 'function') return null
    try {
      return await executeRecaptcha(action)
    } catch (error) {
      console.warn('reCAPTCHA execution failed:', error)
      return null
    }
  }
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
      const captchaToken = await getCaptchaToken('forgot_password')
      await AuthService.forgotPassword(email, captchaToken)
      setSubmitted(true)
      setCountdown(30)
      setTimeout(() => navigate('/login'), 33000)
    } catch (error) {
      setApiError(error.message || 'No account is registered with this email address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppPage title="Forgot Password" description="Enter your email to receive a secure password reset link.">
    <AuthPageLayout
      title="Forgot Password?"
      description="No worries! Enter your email to reset it."
      side={
        <AuthSidePanel
          title="Get back into your account quickly"
          description="Forgot your password? We will send a secure link to the email on file and guide you through a safe reset flow. If you don't see the reset email, check spam and then use the contact page to request help."
        />
      }
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {apiError && (
            <div className={`${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} border px-4 py-3 rounded-xl flex items-center gap-3`}>
              <p className="font-medium text-sm">{apiError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className={`${isDark ? 'text-muted-foreground' : 'text-foreground'} text-sm font-medium flex items-center gap-2`}>
              <Mail className="h-4 w-4" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({}) }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-input'}`}
              placeholder="farmer@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
              'Send Reset Link'
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-4">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-foreground' : 'text-foreground'} mb-3`}>Check Your Email!</h2>
          <p className={`${isDark ? 'text-muted-foreground' : 'text-muted-foreground'} mb-6 text-sm`}>
            We've sent a password reset link to <span className="font-semibold">{email}</span>
          </p>
          <div className={`rounded-lg p-4 border ${isDark ? 'bg-muted border-border' : 'bg-muted border-border'}`}>
            <p className="text-sm text-muted-foreground">
              Redirecting to login in <span className="font-bold text-primary">{countdown}</span> seconds...
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Go to login now
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 my-6">
        <div className={`flex-1 h-px ${isDark ? 'bg-muted' : 'bg-border'}`} />
        <span className="text-muted-foreground text-sm">or</span>
        <div className={`flex-1 h-px ${isDark ? 'bg-muted' : 'bg-border'}`} />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </AuthPageLayout>
    </AppPage>
  )
}

export default ForgotPassword
