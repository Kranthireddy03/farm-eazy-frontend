import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

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
        const eligibilityResponse = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT')
        const eligibilityData = eligibilityResponse?.data || null
        setEligibility(eligibilityData)

        if (!eligibilityData?.vendorDashboardEligible) {
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

  const getRequirementAction = (requirement, verificationPath) => {
    const text = String(requirement || '').toLowerCase()

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
        to: '/address-book',
        label: 'Update Address',
      }
    }

    if (text.includes('phone')) {
      return {
        to: '/support',
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
      <div className="flex items-center justify-center h-72">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
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
      <div className="space-y-6">
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-100 text-slate-700 shadow-sm'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Vendor Access Locked</p>
          <h1 className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete vendor verification first</h1>
          <p className="mt-2 text-sm">
            {eligibility?.verificationMessage || 'To access vendor dashboard and paid product/service listings, complete vendor verification first.'}
          </p>
          {eligibility?.verificationInProgress && (
            <p className={`mt-2 text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              Verification is in progress. After successful verification, vendor dashboard will unlock and you can list products/services.
            </p>
          )}
          {missingRequirements.length > 0 && (
            <div className={`mt-4 rounded-xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Complete these steps:</p>
              <ul className="mt-2 space-y-2 text-sm">
                {missingRequirements.map((item, idx) => {
                  const action = getRequirementAction(item, eligibility?.verificationRedirectPath)
                  return (
                    <li
                      key={`${item}-${idx}`}
                      className={`rounded-lg border p-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-white'}`}
                    >
                      <span>{item}</span>
                      <Link
                        to={action.to}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                      >
                        {action.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            {!hasVerificationStep && (
              <Link to={eligibility?.verificationRedirectPath || '/vendor-verification'} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Start Vendor Verification</Link>
            )}
            <Link to="/settings" className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Update Profile</Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-md'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Vendor Command Center</p>
            <h1 className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Vendor Dashboard</h1>
            <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Track your listings, booking demand, and marketplace execution in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/selling" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Manage Products</Link>
            <Link to="/irrigation-services" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold">Manage Services</Link>
          </div>
        </div>
      </div>

      {eligibility?.vendorDashboardEligible && !hasListings && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-100 text-slate-700 shadow-sm'}`}>
          <h2 className="text-xl font-bold">Vendor workspace is active</h2>
          <p className="mt-2 text-sm">
            Your verification is complete. Add your first product or service listing to populate analytics and booking controls.
          </p>
          <div className="mt-4 flex gap-3">
            <Link to="/selling" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Add Product</Link>
            <Link to="/irrigation-services" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold">Add Service</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-cyan-500 font-semibold">Products</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.products}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total listed</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-emerald-500 font-semibold">Active Products</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.activeProducts}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ready for buyers</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">Services</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.services}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active service listings</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-amber-500 font-semibold">Pending Requests</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.pendingBookings}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Need your response</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <p className="text-xs uppercase tracking-wide text-green-500 font-semibold">Approved</p>
          <p className={`text-3xl font-extrabold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.approvedBookings}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Service jobs approved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/selling" className={`rounded-xl border p-5 transition hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-700 hover:border-emerald-400' : 'bg-white border-slate-100 hover:border-emerald-300 shadow-sm'}`}>
          <p className="text-2xl">🛒</p>
          <h3 className={`font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Product Studio</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Create, optimize, and update your marketplace catalog.</p>
        </Link>
        <Link to="/irrigation-services" className={`rounded-xl border p-5 transition hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-700 hover:border-cyan-400' : 'bg-white border-slate-100 hover:border-cyan-300 shadow-sm'}`}>
          <p className="text-2xl">🚜</p>
          <h3 className={`font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Service Operations</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage listing quality, booking flow, and response SLA.</p>
        </Link>
        <Link to="/notifications" className={`rounded-xl border p-5 transition hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-700 hover:border-indigo-400' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-sm'}`}>
          <p className="text-2xl">🔔</p>
          <h3 className={`font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Alert Center</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Track buyer orders, booking approvals, and business alerts.</p>
        </Link>
      </div>
    </div>
  )
}

export default VendorDashboard
