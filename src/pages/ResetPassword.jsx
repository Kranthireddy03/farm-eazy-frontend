/**
 * Reset Password Page Component
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, AlertCircle } from 'lucide-react'
import AuthService from '../services/AuthService'
import { AuthPageLayout, AuthSidePanel } from '../components/layout/AuthPageLayout'
import AppPage from '../components/layout/AppPage'
import { InfoPanel } from '../components/platform/InfoPanel'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

const RESET_SHORT_CODE_KEY = 'farmeazy_reset_short_code'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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
    sessionStorage.removeItem(RESET_SHORT_CODE_KEY)
    const legacyToken = searchParams.get('token')

    if (legacyToken && legacyToken.length >= 8) {
      setToken(legacyToken)
      return
    }

    setInvalidToken(true)
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
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      await AuthService.resetPassword(token, formData.password)
      sessionStorage.removeItem(RESET_SHORT_CODE_KEY)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const message = err.message || 'Failed to reset password. The link may have expired or already been used.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  if (invalidToken) {
    return (
      <AppPage title="Reset Password" description="This password reset link is invalid or has expired.">
        <AuthPageLayout
          title="Invalid link"
          description="This password reset link is invalid or has expired."
          side={
            <AuthSidePanel
              title="Secure password recovery"
              description="Reset links expire after one hour and work only once. Request a fresh link to continue."
            />
          }
        >
          <InfoPanel
            variant="warning"
            title="Link not valid"
            description="The reset link may have expired, already been used, or was opened on a different device without completing verification."
            icon={AlertCircle}
          />
          <Link
            to="/forgot-password"
            className="mt-6 inline-block w-full py-3 text-center bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
          >
            Request new link
          </Link>
        </AuthPageLayout>
      </AppPage>
    )
  }

  if (success) {
    return (
      <AppPage title="Reset Password" description="Your password has been successfully reset.">
        <AuthPageLayout
          title="Password reset"
          description="Your password has been successfully reset."
          side={
            <AuthSidePanel
              title="You're all set"
              description="Use your new password on the login page. If you run into issues, contact support from the help center."
            />
          }
        >
          <InfoPanel
            variant="success"
            title="Password updated"
            description="You can now sign in with your new password. We are redirecting you to the login page."
          />
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
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
        title="Reset password"
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
            <InfoPanel variant="destructive" title="Could not reset password" description={apiError} icon={AlertCircle} />
          )}

          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" /> New password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" /> Confirm password
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
            {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
              <p className="text-primary text-sm">Passwords match</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </AuthPageLayout>
    </AppPage>
  )
}

export default ResetPassword
