import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { DetailPanel } from '../components/platform/DetailPanel'
import { InfoPanel } from '../components/platform/InfoPanel'
import { FePanel } from '../components/platform/FeOpsPrimitives'
import { Button, buttonVariants } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PageSkeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/badge'

const EMPTY_FORM = {
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
}

export default function VendorOnboarding() {
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
        }),
      ])

      const profile = profileRes?.data || {}
      setForm({
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pinCode: profile.pinCode || '',
      })
      setEligibility(eligibilityRes?.data || null)
    } catch {
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
      { key: 'pennyDrop', title: 'Manual penny-drop confirmed', completed: hasManualPennyDrop, actionPath: '/vendor-verification', actionLabel: 'Confirm INR 1 receipt' },
    ]
  }, [eligibility])

  const completedCount = onboardingSteps.filter((s) => s.completed).length

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
        pinCode: form.pinCode,
      })

      setMessage({ type: 'success', text: 'Profile details saved. Complete bank verification to unlock vendor dashboard.' })
      await loadData()
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      const validationErrors = Array.isArray(error?.response?.data?.errors)
        ? error.response.data.errors.join(' | ')
        : ''
      setMessage({ type: 'error', text: validationErrors || apiMessage || 'Unable to save profile details.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppPage title="Vendor onboarding" description="Loading profile requirements…">
        <PageSkeleton variant="cards" />
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Vendor onboarding"
      description="Complete profile, bank verification, and penny-drop confirmation to unlock the seller workspace."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => navigate('/vendor-dashboard')}>
            Vendor dashboard
          </Button>
          <Link to="/vendor-verification" className={buttonVariants({ size: 'sm' })}>
            Bank verification
          </Link>
        </>
      }
      meta={<Badge variant="muted">{completedCount}/{onboardingSteps.length} steps complete</Badge>}
    >
      {message.text && (
        <InfoPanel
          variant={message.type === 'error' ? 'destructive' : 'success'}
          title={message.type === 'error' ? 'Could not save' : 'Saved'}
          description={message.text}
          className="mb-6"
        />
      )}

      <PageScaffold
        aside={
          <InfoPanel title="Unlock checklist" description="Complete each step to list products and services.">
            <div className="mt-4 space-y-3">
              {onboardingSteps.map((step) => (
                <div
                  key={step.key}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <span className="text-sm text-foreground">{step.title}</span>
                  <Badge variant={step.completed ? 'success' : 'warning'}>
                    {step.completed ? 'Done' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </InfoPanel>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {onboardingSteps.map((step) => (
            <FePanel key={step.key} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <Badge variant={step.completed ? 'success' : 'warning'}>
                  {step.completed ? 'Completed' : 'Pending'}
                </Badge>
              </div>
              {!step.completed && (
                <Link
                  to={step.actionPath}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  {step.actionLabel}
                </Link>
              )}
            </FePanel>
          ))}
        </div>

        <DetailPanel title="Profile details" description="Phone and address are required for vendor listings.">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Email (from account)</label>
              <Input value={form.email} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone *</label>
              <Input name="phone" value={form.phone} onChange={handleChange} required className="mt-1" placeholder="10-digit phone" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">PIN code</label>
              <Input name="pinCode" value={form.pinCode} onChange={handleChange} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">Address *</label>
              <Input name="address" value={form.address} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">City *</label>
              <Input name="city" value={form.city} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">State *</label>
              <Input name="state" value={form.state} onChange={handleChange} required className="mt-1" />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile details'}
              </Button>
              <Link to="/vendor-verification" className={buttonVariants({ variant: 'outline' })}>
                Continue to bank verification
              </Link>
            </div>
          </form>
        </DetailPanel>
      </PageScaffold>
    </AppPage>
  )
}
