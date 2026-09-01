import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Search, CheckCircle2, AlertTriangle, Flame, ShieldCheck,
  Building2, Sparkles, Send, ArrowRight, Truck, Tractor, Sprout
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import LocationService from '../services/LocationService'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getUserFacingErrorMessage } from '../utils/userFacingError'

export default function ActiveLocationsPage() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()

  const [activeZones, setActiveZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [demandCount, setDemandCount] = useState(0)

  // Demand Request Form state
  const [requestForm, setRequestForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    let active = true
    const loadZones = async () => {
      try {
        setLoadingZones(true)
        const zones = await LocationService.getActiveZones()
        if (active) setActiveZones(Array.isArray(zones) ? zones : [])
      } catch (_err) {
        if (active) setActiveZones([])
      } finally {
        if (active) setLoadingZones(false)
      }
    }
    loadZones()
    return () => { active = false }
  }, [])

  const handleCheckLocation = async (e) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    setChecking(true)
    setCheckResult(null)
    setRequestSuccess(false)
    setRequestError('')

    try {
      const isPostal = /^[0-9]{6}$/.test(query)
      const payload = isPostal ? { postalCode: query } : { city: query }
      const res = await LocationService.checkLocationStatus(payload)
      setCheckResult(res)

      if (!res.allowed) {
        const count = await LocationService.getLocationDemand(payload)
        setDemandCount(count || res.requestCount || 0)
        setRequestForm((prev) => ({
          ...prev,
          city: !isPostal ? query : prev.city,
          postalCode: isPostal ? query : prev.postalCode,
        }))
      }
    } catch (_err) {
      setCheckResult({ allowed: false, message: 'Unable to check coverage right now.' })
    } finally {
      setChecking(false)
    }
  }

  const handleDemandSubmit = async (e) => {
    e.preventDefault()
    setSubmittingRequest(true)
    setRequestError('')
    try {
      await LocationService.submitLocationRequest({
        userName: requestForm.userName || 'Guest User',
        userEmail: requestForm.userEmail,
        userPhone: requestForm.userPhone,
        locationName: `${requestForm.city || searchQuery} Area`,
        city: requestForm.city || searchQuery,
        state: requestForm.state || '',
        postalCode: requestForm.postalCode || (/^[0-9]{6}$/.test(searchQuery) ? searchQuery : ''),
        notes: requestForm.notes,
      })
      setRequestSuccess(true)
      setDemandCount((prev) => prev + 1)
    } catch (err) {
      setRequestError(getUserFacingErrorMessage(err, 'Failed to record coverage request.'))
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 animate-fadeIn">
      
      {/* Hero Header */}
      <section className={`rounded-3xl border p-8 md:p-12 text-center relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-b from-emerald-950/40 via-card to-background border-emerald-500/20'
          : 'bg-gradient-to-b from-emerald-50 via-white to-background border-emerald-100'
      }`}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldCheck className="h-4 w-4" />
          <span>Operational Service Network</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight max-w-3xl mx-auto leading-tight">
          FarmEazy Active Delivery Zones &amp; Coverage
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          FarmEazy operates in dedicated agricultural hubs and delivery clusters. Explore our active operating zones or check serviceability for your location.
        </p>

        {/* Live Search & Checker Bar */}
        <div className="mt-8 max-w-xl mx-auto">
          <form onSubmit={handleCheckLocation} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter 6-digit Pincode or City (e.g. 500032, Hyderabad)"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border bg-background text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={checking || !searchQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-6 py-3 cursor-pointer shadow-md"
            >
              {checking ? 'Checking…' : 'Check Coverage'}
            </Button>
          </form>

          {/* Search Result Box */}
          {checkResult && (
            <div className="mt-4 text-left animate-fadeIn">
              {checkResult.allowed ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                        🎉 Great news! FarmEazy is LIVE in your area!
                      </h4>
                      <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        Covered by operational zone: <strong>{checkResult.matchedLocationName || 'Active Zone'}</strong>
                        {checkResult.distanceKm != null && ` (${checkResult.distanceKm.toFixed(1)} km from hub)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl">
                        {isAuthenticated ? 'Go to Dashboard' : 'Sign in to Order Fresh Produce'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-amber-800 dark:text-amber-200">
                        We haven&apos;t launched in this location yet
                      </h4>
                      <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                        {checkResult.message || 'FarmEazy services are expanding rapidly across India.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/20 p-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔥</span>
                      <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                        {demandCount} user{demandCount === 1 ? '' : 's'} in this area have requested FarmEazy launch
                      </span>
                    </div>
                    <Badge className="bg-amber-600 text-white font-bold text-[10px]">High Launch Priority</Badge>
                  </div>

                  {requestSuccess ? (
                    <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-4 text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                        Thank you! Your launch request has been recorded. We will email/SMS you when service launches here!
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleDemandSubmit} className="space-y-3 pt-1">
                      <p className="text-xs font-bold text-foreground">Submit a launch vote for your area:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={requestForm.userName}
                          onChange={(e) => setRequestForm({ ...requestForm, userName: e.target.value })}
                          placeholder="Your Full Name"
                          className="px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                        />
                        <input
                          type="email"
                          required
                          value={requestForm.userEmail}
                          onChange={(e) => setRequestForm({ ...requestForm, userEmail: e.target.value })}
                          placeholder="Email Address"
                          className="px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="tel"
                          value={requestForm.userPhone}
                          onChange={(e) => setRequestForm({ ...requestForm, userPhone: e.target.value })}
                          placeholder="Mobile Phone (Optional for SMS)"
                          className="px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                        />
                        <input
                          type="text"
                          value={requestForm.city}
                          onChange={(e) => setRequestForm({ ...requestForm, city: e.target.value })}
                          placeholder="City / Village"
                          className="px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                        />
                      </div>
                      {requestError && <p className="text-xs text-rose-600">{requestError}</p>}
                      <Button
                        type="submit"
                        disabled={submittingRequest}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
                      >
                        {submittingRequest ? 'Submitting…' : '🚀 Request Service in My Area'}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Active Operational Zones Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <MapPin className="h-6 w-6 text-emerald-600" />
              <span>Active Operational Zones</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Hubs where FarmEazy fulfillment, doorstep delivery, and agricultural services are currently operating.
            </p>
          </div>
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30 text-xs px-3 py-1">
            {activeZones.length} Active Delivery Hubs
          </Badge>
        </div>

        {loadingZones ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-3xl border bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : activeZones.length === 0 ? (
          <div className="rounded-3xl border border-border p-12 text-center text-muted-foreground space-y-2">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-base font-bold">No active delivery zones currently published.</p>
            <p className="text-xs">Check back soon as new operational zones are launched weekly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeZones.map((zone) => (
              <div
                key={zone.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-emerald-500/40 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-foreground group-hover:text-emerald-600 transition-colors">
                      {zone.locationName}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {zone.city}, {zone.state} {zone.postalCode ? `(${zone.postalCode})` : ''}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{zone.radiusKm ? `${zone.radiusKm} km fulfillment radius` : 'Local cluster'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tractor className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Farm machinery &amp; drone services</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Direct farmer produce marketplace</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    to={isAuthenticated ? "/dashboard" : "/login"}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-muted/60 hover:bg-emerald-600 hover:text-white text-foreground transition-all"
                  >
                    <span>{isAuthenticated ? 'Order from this Zone' : 'Sign in to Order'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Coverage Demand Callout */}
      <section className={`rounded-3xl border p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark ? 'bg-card border-border' : 'bg-slate-900 text-white border-transparent'
      }`}>
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="h-4 w-4" />
            <span>Expansion Pipeline</span>
          </div>
          <h3 className="text-2xl font-black">Don&apos;t see your area listed?</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We launch new operational delivery zones every week based on aggregated farmer and customer votes. Submit a request to bring FarmEazy to your town.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            const input = document.querySelector('input[type="text"]')
            if (input) input.focus()
          }}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all shrink-0 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Request Coverage for Your Area</span>
        </button>
      </section>

    </div>
  )
}
