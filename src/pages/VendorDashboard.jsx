import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Store, Tractor } from 'lucide-react'
import apiClient from '../services/apiClient'
import AppPage from '../components/layout/AppPage'
import { KpiSection } from '../components/app/KpiSection'
import { KpiCard } from '../components/ui/kpi-card'
import { QuickActionTile } from '../components/platform/QuickActionTile'
import { DetailPanel } from '../components/platform/DetailPanel'
import { InfoPanel } from '../components/platform/InfoPanel'
import { Button, buttonVariants } from '../components/ui/button'
import { PageSkeleton } from '../components/ui/Skeleton'

function VendorDashboard() {
  const navigate = useNavigate()
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
      <AppPage title="Vendor dashboard" description="Loading vendor workspace…">
        <PageSkeleton variant="cards" />
      </AppPage>
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
      <AppPage
        title="Vendor access locked"
        description={eligibility?.verificationMessage || 'Complete vendor verification to unlock the seller workspace.'}
      >
        {eligibility?.verificationInProgress && (
          <InfoPanel
            variant="warning"
            title="Verification in progress"
            description="Your command center will unlock automatically after approval."
          />
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          {!hasVerificationStep && (
            <Link
              to={eligibility?.verificationRedirectPath || '/vendor-verification'}
              className={buttonVariants()}
            >
              Start vendor verification
            </Link>
          )}
          <Link to="/settings" className={buttonVariants({ variant: 'outline' })}>
            Update profile
          </Link>
          <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
            Refresh status
          </Button>
        </div>

        {missingRequirements.length > 0 && (
          <DetailPanel title="Verification checklist" description="Complete each item to unlock listings and bookings.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {missingRequirements.map((item, idx) => {
                const action = getRequirementAction(item, eligibility?.verificationRedirectPath)
                return (
                  <div
                    key={`${item}-${idx}`}
                    className="rounded-xl border border-border bg-muted/30 p-3 flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-foreground">{item}</span>
                    <Link to={action.to} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                      {action.label}
                    </Link>
                  </div>
                )
              })}
            </div>
          </DetailPanel>
        )}
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Vendor Dashboard"
      description="Monitor catalog velocity, booking performance, and demand signals."
      actions={(
        <>
          <Link to="/products/listings" className={buttonVariants({ size: 'sm' })}>Manage products</Link>
          <Link to="/services" className={buttonVariants({ size: 'sm', variant: 'secondary' })}>
            Manage services
          </Link>
        </>
      )}
    >
      <div className="space-y-8">
        <KpiSection columns={3}>
          <KpiCard title="Market presence" value={marketPresence} hint="Composite score" />
          <KpiCard title="Approval rate" value={`${approvalRate}%`} hint="Booking approvals" />
          <KpiCard title="Live assets" value={stats.activeProducts + stats.services} hint="Products + services" />
        </KpiSection>

      {eligibility?.vendorDashboardEligible && !hasListings && (
        <InfoPanel
          title="Vendor workspace is active"
          description="Your verification is complete. Add your first product or service listing to populate analytics and booking controls."
        >
          <div className="flex flex-wrap gap-2">
            <Link to="/products/post" className={buttonVariants({ size: 'sm' })}>Add product</Link>
            <Link to="/services" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              Add service
            </Link>
          </div>
        </InfoPanel>
      )}

      <KpiSection className="xl:grid-cols-5">
        <KpiCard title="Products" value={stats.products} hint="Total listed" />
        <KpiCard title="Active products" value={stats.activeProducts} hint="Ready for buyers" />
        <KpiCard title="Services" value={stats.services} hint="Active listings" />
        <KpiCard title="Pending requests" value={stats.pendingBookings} hint="Need response" />
        <KpiCard title="Approved" value={stats.approvedBookings} hint="Service jobs approved" />
      </KpiSection>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionTile
          icon={Store}
          title="Product studio"
          description="Create, optimize, and update your marketplace catalog."
          onClick={() => navigate('/products/listings')}
        />
        <QuickActionTile
          icon={Tractor}
          title="Service operations"
          description="Manage listing quality, booking flow, and response SLA."
          onClick={() => navigate('/services')}
        />
        <QuickActionTile
          icon={Bell}
          title="Alert center"
          description="Track buyer orders, booking approvals, and business alerts."
          onClick={() => navigate('/notifications')}
        />
      </section>
      </div>
    </AppPage>
  )
}

export default VendorDashboard
