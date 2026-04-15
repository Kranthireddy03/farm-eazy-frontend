import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthService from '../services/AuthService'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useGlobalToast } from '../context/ToastContext'
import { STORAGE_KEYS } from '../config/api'

function CompleteGoogleProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, logout } = useAuth()
  const { isDark } = useTheme()
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
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'}`}>
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl backdrop-blur-xl p-8 ${isDark ? 'border-slate-700 bg-slate-900/90' : 'border-emerald-100 bg-white/95'}`}>
        <div className="mb-6">
          <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Finish Google Signup</p>
          <h1 className={`mt-2 text-3xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Complete your account</h1>
          <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Mobile number is mandatory. All other fields are optional and based on your preference. Add password only if you want password login.</p>
        </div>

        {error && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-red-700 bg-red-950/50 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 md:col-span-1">
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Username (optional)</span>
            <input name="username" value={formData.username} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
          </label>
          <label className="grid gap-2 md:col-span-1">
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Mobile Number <span className="text-red-500">*</span></span>
            <input name="phone" value={formData.phone} onChange={handleChange} maxLength={10} inputMode="numeric" required className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
            {!isPhoneValid && (
              <span className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Enter a valid 10-digit mobile number to enable Complete Setup.</span>
            )}
          </label>

          <div className={`md:col-span-2 rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/60' : 'border-emerald-100 bg-emerald-50/70'}`}>
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
              <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                I want to sign in with password also.
              </span>
            </label>

            {setPasswordNow && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 md:col-span-1">
                  <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Password <span className="text-red-500">*</span></span>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
                </label>
                <label className="grid gap-2 md:col-span-1">
                  <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Confirm Password <span className="text-red-500">*</span></span>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
                </label>
              </div>
            )}
          </div>

          <label className="grid gap-2 md:col-span-2">
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Address (optional)</span>
            <input name="address" value={formData.address} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
          </label>
          <label className="grid gap-2 md:col-span-1">
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>City (optional)</span>
            <input name="city" value={formData.city} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
          </label>
          <label className="grid gap-2 md:col-span-1">
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>State (optional)</span>
            <input name="state" value={formData.state} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>PIN Code (optional)</span>
            <input name="pinCode" value={formData.pinCode} onChange={handleChange} className={`rounded-xl border px-4 py-3 outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-emerald-500'}`} />
          </label>

          <div className="md:col-span-2 flex items-center justify-end pt-2">
            <button type="submit" disabled={!canSubmit} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompleteGoogleProfile
