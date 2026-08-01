/**
 * Reset Password Page Component
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import AuthService from '../services/AuthService'
import { useTheme } from '../context/ThemeContext'
import { AuthPageLayout, AuthSidePanel } from '../components/layout/AuthPageLayout'
import AppPage from '../components/layout/AppPage'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [invalidToken, setInvalidToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    const resetToken = searchParams.get('token')
    if (!resetToken || resetToken.length < 8) {
      setInvalidToken(true)
    } else {
      setToken(resetToken)
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
    if (!validateForm()) return
    
    setLoading(true)
    try {
      await AuthService.resetPassword(token, formData.password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password. The link may have expired.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  if (invalidToken) {
    return (
      <AppPage title="Reset Password" description="This password reset link is invalid or has expired.">
      <AuthPageLayout
        title="Invalid Link"
        description="This password reset link is invalid or has expired. Please request a new one."
        side={
          <AuthSidePanel
            title="Secure password recovery"
            description="Reset links expire for your security. Request a fresh link and complete the reset within the time window."
          />
        }
      >
        <Link
          to="/forgot-password"
          className="inline-block w-full py-3 text-center bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
        >
          Request New Link
        </Link>
      </AuthPageLayout>
      </AppPage>
    )
  }

  if (success) {
    return (
      <AppPage title="Reset Password" description="Your password has been successfully reset.">
      <AuthPageLayout
        title="Password Reset!"
        description="Your password has been successfully reset. You can now login with your new password."
        side={
          <AuthSidePanel
            title="You're all set"
            description="Use your new password on the login page. If you run into issues, contact support from the help center."
          />
        }
      >
        <div className={`flex items-center justify-center gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Redirecting to login...</span>
        </div>
      </AuthPageLayout>
      </AppPage>
    )
  }

  return (
    <AppPage title="Reset Password" description="Create a strong new password for your account.">
    <AuthPageLayout
      title="Reset Password"
      description="Create a strong new password"
      side={
        <AuthSidePanel
          title="Secure your farm account"
          description="Choose a password you haven't used elsewhere. After resetting, sign in with your new credentials."
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {apiError && (
          <div className={`${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} border px-4 py-3 rounded-xl`}>
            <p className="font-medium text-sm">{apiError}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className={`${isDark ? 'text-slate-200' : 'text-foreground'} text-sm font-medium flex items-center gap-2`}>
            <Lock className="h-4 w-4" /> New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary pr-12 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-background border-input'}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <label className={`${isDark ? 'text-slate-200' : 'text-foreground'} text-sm font-medium flex items-center gap-2`}>
            <Lock className="h-4 w-4" /> Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary pr-12 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-background border-input'}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
            <p className="text-emerald-600 text-sm">Passwords match</p>
          )}
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
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthPageLayout>
    </AppPage>
  )
}

export default ResetPassword
