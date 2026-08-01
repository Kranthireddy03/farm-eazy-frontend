import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthService from '../services/AuthService'
import { useAuth } from '../context/AuthContext'
import { useGlobalToast } from '../context/ToastContext'
import { STORAGE_KEYS } from '../config/api'
import { AuthPageLayout, AuthSidePanel } from '../components/layout/AuthPageLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { InfoPanel } from '../components/platform/InfoPanel'

function CompleteGoogleProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, logout } = useAuth()
  const { success: toastSuccess } = useGlobalToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setPasswordNow, setSetPasswordNow] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    setFormData((prev) => ({
      ...prev,
      username: location.state?.prefillUsername || localStorage.getItem(STORAGE_KEYS.USER_USERNAME) || '',
    }))
  }, [isAuthenticated, location.state, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const sessionToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
    if (!sessionToken) {
      logout('user')
      navigate('/login', {
        replace: true,
        state: {
          from: '/complete-google-profile',
          loginPrompt: 'Session missing. Please sign in again to complete your profile.',
        },
      })
      return
    }

    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    if (setPasswordNow) {
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    try {
      const response = await AuthService.completeGoogleProfile({
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        password: setPasswordNow ? formData.password : null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pinCode: formData.pinCode.trim(),
      }, sessionToken)

      login(response)
  toastSuccess('Welcome setup complete. Your welcome notification, email, and SMS have been triggered. Onboarding tour starts now.')
      navigate('/', { replace: true })
    } catch (apiError) {
      if (apiError?.response?.status === 401) {
        logout('user')
        navigate('/login', {
          replace: true,
          state: {
            from: '/complete-google-profile',
            socialSignupSource: 'google',
            loginPrompt: 'Session expired. Please sign in again to complete your profile.',
          },
        })
        return
      }
      setError(apiError.response?.data?.message || apiError.message || 'Could not complete your profile.')
    } finally {
      setLoading(false)
    }
  }

  const isPhoneValid = /^[0-9]{10}$/.test((formData.phone || '').trim())
  const isPasswordValid = !setPasswordNow || (formData.password.length >= 6 && formData.password === formData.confirmPassword)
  const canSubmit = isPhoneValid && isPasswordValid && !loading

  return (
    <AuthPageLayout
      title="Complete your account"
      description="Mobile number is required. Other fields are optional. Add a password only if you want password login."
      side={
        <AuthSidePanel
          title="Finish Google signup"
          description="Link your phone to unlock orders, marketplace, and farm tools. Your Google email stays connected for faster sign-in."
        />
      }
    >
      {error && (
        <InfoPanel variant="destructive" title="Could not save profile" description={error} className="mb-4" />
      )}

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="grid gap-2 md:col-span-1">
          <span className="text-sm font-medium text-foreground">Username (optional)</span>
          <Input name="username" value={formData.username} onChange={handleChange} />
        </label>
        <label className="grid gap-2 md:col-span-1">
          <span className="text-sm font-medium text-foreground">
            Mobile number <span className="text-destructive">*</span>
          </span>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            maxLength={10}
            inputMode="numeric"
            required
          />
          {!isPhoneValid && (
            <span className="text-xs text-muted-foreground">Enter a valid 10-digit mobile number.</span>
          )}
        </label>

        <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={setPasswordNow}
              onChange={(e) => {
                setSetPasswordNow(e.target.checked)
                setError('')
              }}
              className="mt-1"
            />
            <span className="text-sm text-muted-foreground">I want to sign in with password also.</span>
          </label>

          {setPasswordNow && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Password</span>
                <Input type="password" name="password" value={formData.password} onChange={handleChange} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Confirm password</span>
                <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
              </label>
            </div>
          )}
        </div>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium">Address (optional)</span>
          <Input name="address" value={formData.address} onChange={handleChange} />
        </label>
        <label className="grid gap-2 md:col-span-1">
          <span className="text-sm font-medium">City (optional)</span>
          <Input name="city" value={formData.city} onChange={handleChange} />
        </label>
        <label className="grid gap-2 md:col-span-1">
          <span className="text-sm font-medium">State (optional)</span>
          <Input name="state" value={formData.state} onChange={handleChange} />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium">PIN code (optional)</span>
          <Input name="pinCode" value={formData.pinCode} onChange={handleChange} />
        </label>

        <div className="md:col-span-2 flex justify-end pt-2">
          <Button type="submit" disabled={!canSubmit}>
            {loading ? 'Saving…' : 'Complete setup'}
          </Button>
        </div>
      </form>
    </AuthPageLayout>
  )
}

export default CompleteGoogleProfile
