import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'
import AppPage from '../components/layout/AppPage'

function VendorDashboard() {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [eligibilityLoading, setEligibilityLoading] = useState(true)
  const [eligibility, setEligibility] = useState(null)
  const [stats, setStats] = useState({
    products: 0,
    activeProducts: 0,
    services: 0,
    pendingBookings: 0,
    approvedBookings: 0,
  })

  useEffect(() => {
    const loadVendorDashboard = async () => {
      try {
        setLoading(true)
        setEligibilityLoading(true)

        const eligibilityResponse = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', {
          validateStatus: (status) => status < 500,
        })
        const eligibilityData = eligibilityResponse?.data || null
        setEligibility(eligibilityData)

        if (eligibilityResponse.status !== 200 || !eligibilityData?.vendorDashboardEligible) {
          setStats({
            products: 0,
            activeProducts: 0,
            services: 0,
            pendingBookings: 0,
            approvedBookings: 0,
          })
          return
        }

        const [productsResult, servicesResult, providerBookingsResult] = await Promise.allSettled([
          apiClient.get('/products/my-products'),
          apiClient.get('/services/listings/my'),
          apiClient.get('/services/bookings/my-listings')
        ])

        const productsResp = productsResult.status === 'fulfilled' ? productsResult.value : null
        const servicesResp = servicesResult.status === 'fulfilled' ? servicesResult.value : null
        const providerBookingsResp = providerBookingsResult.status === 'fulfilled' ? providerBookingsResult.value : null

        const products = Array.isArray(productsResp?.data) ? productsResp.data : []
        const servicePayload = servicesResp?.data
        const services = Array.isArray(servicePayload?.content)
          ? servicePayload.content
          : (Array.isArray(servicePayload) ? servicePayload : [])

        const bookingPayload = providerBookingsResp?.data
        const providerBookings = Array.isArray(bookingPayload?.content)
          ? bookingPayload.content
          : (Array.isArray(bookingPayload) ? bookingPayload : [])

        setStats({
          products: products.length,
          activeProducts: products.filter(item => item.status === 'ACTIVE').length,
          services: services.length,
          pendingBookings: providerBookings.filter(item => item.status === 'PENDING').length,
          approvedBookings: providerBookings.filter(item => item.status === 'APPROVED').length,
        })
      } catch (_error) {
        setEligibility({
          eligible: false,
          verificationInProgress: false,
          verificationMessage: 'Unable to validate vendor verification right now. Please complete or retry verification.',
          verificationRedirectPath: '/vendor-verification'
        })
        setStats({
          products: 0,
          activeProducts: 0,
          services: 0,
          pendingBookings: 0,
          approvedBookings: 0,
        })
      } finally {
        setEligibilityLoading(false)
        setLoading(false)
      }
    }

    loadVendorDashboard()
  }, [])

  const hasListings = useMemo(() => (stats.products + stats.services) > 0, [stats])
  const approvalRate = useMemo(() => {
    const denominator = stats.approvedBookings + stats.pendingBookings
    if (!denominator) return 0
    return Math.round((stats.approvedBookings / denominator) * 100)
  }, [stats.approvedBookings, stats.pendingBookings])

  const marketPresence = useMemo(() => {
    return stats.activeProducts * 5 + stats.services * 7 + stats.approvedBookings * 3
  }, [stats.activeProducts, stats.services, stats.approvedBookings])

  const getRequirementAction = (requirement, verificationPath) => {
    const text = String(requirement || '').toLowerCase()

    if (text.includes('email')) {
      return {
        to: '/vendor-onboarding',
        label: 'Review Email Profile',
      }
    }

    if (text.includes('bank verification')) {
      return {
        to: verificationPath || '/vendor-verification',
        label: 'Verify Bank',
      }
    }

    if (text.includes('vendor details') || text.includes('vendor verification')) {
      return {
        to: verificationPath || '/vendor-verification',
        label: 'Complete Vendor Verification',
      }
    }

    if (text.includes('profile location') || text.includes('city and state') || text.includes('address')) {
      return {
        to: '/vendor-onboarding',
        label: 'Complete Address',
      }
    }

    if (text.includes('phone')) {
      return {
        to: '/vendor-onboarding',
        label: 'Update Phone',
      }
    }

    return {
      to: verificationPath || '/vendor-verification',
      label: 'Complete Step',
    }
  }

  if (loading || eligibilityLoading) {
    return (
      <div className={`premium-shell min-h-[18rem] flex items-center justify-center ${isDark ? 'bg-background' : 'bg-gradient-to-br from-primary/5 via-white to-primary/5'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!eligibility?.vendorDashboardEligible) {
    const missingRequirementsRaw = Array.isArray(eligibility?.missingRequirements)
      ? eligibility.missingRequirements
      : []

    const getRequirementBucket = (requirement) => {
      const text = String(requirement || '').toLowerCase()
      if (text.includes('bank verification') || text.includes('vendor details') || text.includes('vendor verification')) {
        return 'verification'
      }
      if (text.includes('profile location') || text.includes('city and state') || text.includes('address')) {
        return 'address'
      }
      if (text.includes('phone')) {
        return 'phone'
      }
      return text.trim() || 'other'
    }

    const seenBuckets = new Set()
    const missingRequirements = missingRequirementsRaw.filter((item) => {
      const bucket = getRequirementBucket(item)
      if (seenBuckets.has(bucket)) {
        return false
      }
      seenBuckets.add(bucket)
      return true
    })

    const hasVerificationStep = missingRequirements.some((item) => getRequirementBucket(item) === 'verification')

    return (
      <div className={`premium-shell min-h-screen -m-6 p-6 space-y-8 ${isDark ? 'bg-background' : 'bg-gradient-to-br from-amber-50 via-white to-orange-50'}`}>
        <section className={`page-hero rounded-3xl overflow-hidden border ${isDark ? 'bg-card border-border' : 'bg-background border-border shadow-xl'}`}>
          <div className={`p-8 md:p-10 ${isDark ? 'bg-gradient-to-r from-amber-900/50 via-card to-background' : 'bg-gradient-to-r from-amber-100 via-orange-50 to-white'}`}>
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Vendor Access Locked</p>
            <h1 className={`mt-2 text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-foreground'}`}>Complete Verification To Unlock Seller Engine</h1>
            <p className={`mt-3 text-sm md:text-base max-w-2xl ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
              {eligibility?.verificationMessage || 'To access vendor dashboard and paid product/service listings, complete vendor verification first.'}
            </p>
            {eligibility?.verificationInProgress && (
              <p className={`mt-3 text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                Verification is in progress. Your command center will unlock automatically after approval.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {!hasVerificationStep && (
                <Link to={eligibility?.verificationRedirectPath || '/vendor-verification'} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold">Start Vendor Verification</Link>
              )}
              <Link to="/settings" className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-card text-white hover:bg-muted'}`}>Update Profile</Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted'}`}
              >
                Refresh Status
              </button>
            </div>
          </div>
          {missingRequirements.length > 0 && (
            <div className={`p-6 md:p-8 border-t ${isDark ? 'border-border bg-card' : 'border-border bg-muted/30'}`}>
              <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Verification Checklist</p>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {missingRequirements.map((item, idx) => {
                  const action = getRequirementAction(item, eligibility?.verificationRedirectPath)
                  return (
                    <div
                      key={`${item}-${idx}`}
                      className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${isDark ? 'border-border bg-muted' : 'border-border bg-background'}`}
                    >
                      <span className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>{item}</span>
                      <Link
                        to={action.to}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${isDark ? 'bg-muted text-foreground hover:bg-muted' : 'bg-card text-white hover:bg-muted'}`}
                      >
                        {action.label}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <AppPage
      title="Vendor Dashboard"
      description="Monitor catalog velocity, booking performance, and demand signals."
      actions={(
        <>
          <Link to="/selling" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold">Manage Products</Link>
          <Link to="/irrigation-services" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold">Manage Services</Link>
        </>
      )}
    >
      <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-muted/40 border-border text-foreground' : 'bg-background/80 border-border text-foreground'}`}>
              <p className="text-xs uppercase tracking-wide text-cyan-500 font-semibold">Market Presence Score</p>
              <p className="text-2xl font-black mt-1">{marketPresence}</p>
            </div>
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-muted/40 border-border text-foreground' : 'bg-background/80 border-border text-foreground'}`}>
              <p className="text-xs uppercase tracking-wide text-primary font-semibold">Approval Rate</p>
              <p className="text-2xl font-black mt-1">{approvalRate}%</p>
            </div>
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-muted/40 border-border text-foreground' : 'bg-background/80 border-border text-foreground'}`}>
              <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">Total Live Assets</p>
              <p className="text-2xl font-black mt-1">{stats.activeProducts + stats.services}</p>
            </div>
          </div>

      {eligibility?.vendorDashboardEligible && !hasListings && (
        <div className={`ops-panel interactive-card rounded-2xl border p-6 ${isDark ? 'border-border text-muted-foreground' : 'border-border text-foreground shadow-sm'}`}>
          <h2 className="text-xl font-bold">Vendor workspace is active</h2>
          <p className="mt-2 text-sm">
            Your verification is complete. Add your first product or service listing to populate analytics and booking controls.
          </p>
          <div className="mt-4 flex gap-3">
            <Link to="/selling" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold">Add Product</Link>
            <Link to="/irrigation-services" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold">Add Service</Link>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-cyan-500 font-semibold">Products</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>{stats.products}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Total listed</p>
        </div>
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">Active Products</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>{stats.activeProducts}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Ready for buyers</p>
        </div>
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">Services</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>{stats.services}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Active service listings</p>
        </div>
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-amber-500 font-semibold">Pending Requests</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>{stats.pendingBookings}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Need your response</p>
        </div>
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-green-500 font-semibold">Approved</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>{stats.approvedBookings}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Service jobs approved</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/selling" className={`ops-panel interactive-card rounded-xl border p-5 transition hover:-translate-y-1 ${isDark ? 'border-border hover:border-primary' : 'border-border hover:border-primary/30 shadow-sm'}`}>
          <p className="text-2xl">🛒</p>
          <h3 className={`font-bold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>Product Studio</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Create, optimize, and update your marketplace catalog.</p>
        </Link>
        <Link to="/irrigation-services" className={`ops-panel interactive-card rounded-xl border p-5 transition hover:-translate-y-1 ${isDark ? 'border-border hover:border-cyan-400' : 'border-border hover:border-cyan-300 shadow-sm'}`}>
          <p className="text-2xl">🚜</p>
          <h3 className={`font-bold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>Service Operations</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Manage listing quality, booking flow, and response SLA.</p>
        </Link>
        <Link to="/notifications" className={`ops-panel interactive-card rounded-xl border p-5 transition hover:-translate-y-1 ${isDark ? 'border-border hover:border-indigo-400' : 'border-border hover:border-indigo-300 shadow-sm'}`}>
          <p className="text-2xl">🔔</p>
          <h3 className={`font-bold mt-2 ${isDark ? 'text-white' : 'text-foreground'}`}>Alert Center</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Track buyer orders, booking approvals, and business alerts.</p>
        </Link>
      </section>
      </div>
    </AppPage>
  )
}

export default VendorDashboard
