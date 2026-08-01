import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../services/apiClient'

const EMPTY_FORM = {
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pinCode: ''
}

function VendorOnboarding() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [eligibility, setEligibility] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [profileRes, eligibilityRes] = await Promise.all([
        apiClient.get('/vendors/onboarding-profile'),
        apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', {
          validateStatus: (status) => status < 500,
        })
      ])

      const profile = profileRes?.data || {}
      setForm({
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pinCode: profile.pinCode || ''
      })
      setEligibility(eligibilityRes?.data || null)
    } catch (_error) {
      setMessage({ type: 'error', text: 'Unable to load onboarding details right now.' })
      setEligibility(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onboardingSteps = useMemo(() => {
    const missing = Array.isArray(eligibility?.missingRequirements) ? eligibility.missingRequirements : []

    const hasEmail = !missing.some((item) => String(item).toLowerCase().includes('email'))
    const hasPhone = !missing.some((item) => String(item).toLowerCase().includes('phone'))
    const hasAddress = !missing.some((item) => {
      const text = String(item).toLowerCase()
      return text.includes('address') || text.includes('city') || text.includes('state') || text.includes('location')
    })
    const hasBankDetails = !missing.some((item) => {
      const text = String(item).toLowerCase()
      return text.includes('vendor details') || text.includes('bank details')
    })
    const hasManualPennyDrop = !missing.some((item) => {
      const text = String(item).toLowerCase()
      return text.includes('penny') || text.includes('bank verification')
    })

    return [
      { key: 'email', title: 'Email ready', completed: hasEmail, actionPath: '/vendor-onboarding', actionLabel: 'Review email' },
      { key: 'phone', title: 'Phone ready', completed: hasPhone, actionPath: '/vendor-onboarding', actionLabel: 'Update phone' },
      { key: 'address', title: 'Address and location ready', completed: hasAddress, actionPath: '/vendor-onboarding', actionLabel: 'Update address' },
      { key: 'bankDetails', title: 'Bank details submitted', completed: hasBankDetails, actionPath: '/vendor-verification', actionLabel: 'Complete bank details' },
      { key: 'pennyDrop', title: 'Manual penny-drop confirmed', completed: hasManualPennyDrop, actionPath: '/vendor-verification', actionLabel: 'Confirm INR 1 receipt' }
    ]
  }, [eligibility])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await apiClient.put('/vendors/onboarding-profile', {
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode
      })

      setMessage({ type: 'success', text: 'Profile details saved. Complete bank verification to unlock vendor dashboard.' })
      await loadData()
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      const validationErrors = Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.join(' | ') : ''
      setMessage({ type: 'error', text: validationErrors || apiMessage || 'Unable to save profile details.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`premium-shell min-h-[18rem] flex items-center justify-center ${isDark ? 'bg-background' : 'bg-gradient-to-br from-primary/5 via-white to-primary/5'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={`premium-shell min-h-screen -m-6 p-6 space-y-6 ${isDark ? 'bg-background' : 'bg-gradient-to-br from-primary/5 via-white to-primary/5'}`}>
      <section className={`rounded-3xl border p-6 md:p-8 ${isDark ? 'bg-card border-border' : 'bg-background border-border shadow-lg'}`}>
        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-primary' : 'text-primary'}`}>Vendor Onboarding</p>
        <h1 className={`mt-2 text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-foreground'}`}>Complete Required Profile Details</h1>
        <p className={`mt-3 text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
          Vendor dashboard unlock requires email, phone, address, bank details and manual penny-drop confirmation.
        </p>
        <div className="mt-5 flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/vendor-dashboard')}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold"
          >
            Check Vendor Dashboard
          </button>
          <Link
            to="/vendor-verification"
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-card text-white hover:bg-muted'}`}
          >
            Open Bank Verification
          </Link>
        </div>
      </section>

      {message.text && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'error'
          ? (isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
          : (isDark ? 'bg-emerald-950/30 border-emerald-800 text-primary' : 'bg-primary/5 border-border text-primary')}`}>
          {message.text}
        </div>
      )}

      <section className={`rounded-2xl border p-5 ${isDark ? 'bg-card border-border' : 'bg-background border-border shadow-sm'}`}>
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>Verification Steps</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {onboardingSteps.map((step) => (
            <div key={step.key} className={`rounded-xl border p-4 ${isDark ? 'border-border bg-muted' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${isDark ? 'text-foreground' : 'text-foreground'}`}>{step.title}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${step.completed
                  ? 'bg-primary/10 text-primary'
                  : 'bg-amber-100 text-amber-700'}`}>
                  {step.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
              {!step.completed && (
                <div className="mt-3">
                  <Link to={step.actionPath} className={`text-xs font-semibold underline ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                    {step.actionLabel}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className={`rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${isDark ? 'bg-card border-border' : 'bg-background border-border shadow-sm'}`}>
        <div className="md:col-span-2">
          <label className={`block text-sm mb-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Email (from account)</label>
          <input value={form.email} disabled className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-muted-foreground' : 'bg-muted border-border text-foreground'}`} />
        </div>

        <div>
          <label className={`block text-sm mb-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Phone *</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit phone" required className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        </div>

        <div>
          <label className={`block text-sm mb-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Pin Code</label>
          <input name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="Postal code" className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm mb-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Address *</label>
          <input name="address" value={form.address} onChange={handleChange} placeholder="Street address" required className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        </div>

        <div>
          <label className={`block text-sm mb-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>City *</label>
          <input name="city" value={form.city} onChange={handleChange} placeholder="City" required className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        </div>

        <div>
          <label className={`block text-sm mb-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>State *</label>
          <input name="state" value={form.state} onChange={handleChange} placeholder="State" required className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Profile Details'}
          </button>
          <Link to="/vendor-verification" className={`px-5 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted'}`}>
            Continue to Bank Verification
          </Link>
        </div>
      </form>
    </div>
  )
}

export default VendorOnboarding
