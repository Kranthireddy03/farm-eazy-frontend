import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'

const SERVICE_OPTIONS = [
  'Fresh produce delivery',
  'Farm input supplies',
  'Vendor marketplace',
  'Irrigation services',
  'All FarmEazy services',
]

export default function ServiceUnavailableLocation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    city: '',
    state: '',
    postalCode: '',
    preferredService: SERVICE_OPTIONS[0],
    households: '',
    notes: '',
  })

  const accessMessage = useMemo(() => {
    return location.state?.message || 'Service is not available for your current location yet.'
  }, [location.state])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submitLaunchRequest = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const subject = `Location Launch Request: ${form.city}, ${form.state}`
    const description = [
      'User requested FarmEazy launch in a non-serviceable location.',
      `City: ${form.city}`,
      `State: ${form.state}`,
      `Postal Code: ${form.postalCode || 'Not provided'}`,
      `Preferred Service: ${form.preferredService}`,
      `Estimated Households Interested: ${form.households || 'Not provided'}`,
      `Additional Notes: ${form.notes || 'None'}`,
      `Game Score: ${score}`,
    ].join('\n')

    try {
      setSaving(true)
      await apiClient.post('/service-requests', {
        category: 'OTHER',
        priority: 'MEDIUM',
        subject,
        description,
      })
      setSuccess('Launch request submitted. Our team will evaluate this location and contact you with updates.')
      setForm((prev) => ({
        ...prev,
        postalCode: '',
        households: '',
        notes: '',
      }))
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit launch request right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-orange-300/30 bg-orange-900/20 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-300">Location Access</p>
          <h1 className="mt-2 text-3xl font-black">FarmEazy Is Expanding</h1>
          <p className="mt-3 text-slate-200">{accessMessage}</p>
          <p className="mt-2 text-slate-300 text-sm">
            Admin and operations panels remain available, but user marketplace actions are paused for this location.
          </p>

          <div className="mt-6 rounded-xl border border-slate-600 bg-slate-900/50 p-4">
            <p className="text-sm font-semibold">Mini Game: Harvest Taps</p>
            <p className="text-xs text-slate-400 mt-1">Tap to collect crops while we process your launch request.</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-4xl">🌾</div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Harvest Score</div>
                <div className="text-2xl font-black text-emerald-300">{score}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScore((prev) => prev + 1)}
              className="mt-4 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2"
            >
              Tap To Harvest
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-3 w-full rounded-xl border border-slate-500 hover:bg-slate-700 font-semibold py-2"
            >
              Back To Dashboard
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-600 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-black">Request Service Launch</h2>
          <p className="mt-2 text-sm text-slate-300">Share your location details so we can prioritize rollout planning.</p>

          <form className="mt-5 space-y-4" onSubmit={submitLaunchRequest}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">City</label>
                <input name="city" value={form.city} onChange={handleChange} required className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">State</label>
                <input name="state" value={form.state} onChange={handleChange} required className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Postal Code</label>
                <input name="postalCode" value={form.postalCode} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Interested Households</label>
                <input name="households" type="number" min="1" value={form.households} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Preferred Service</label>
              <select name="preferredService" value={form.preferredService} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2">
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Additional Notes</label>
              <textarea name="notes" rows="4" value={form.notes} onChange={handleChange} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
            </div>

            {error && <div className="rounded-lg border border-red-400/40 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</div>}
            {success && <div className="rounded-lg border border-emerald-400/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200">{success}</div>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-slate-900 font-bold py-2.5"
            >
              {saving ? 'Submitting...' : 'Submit Launch Request'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
