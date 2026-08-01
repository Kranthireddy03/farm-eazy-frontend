/**
 * Home Page Component
 *
 * Dashboard with 3 main sections:
 * 1. Farms Management - Manage farms and crops
 * 2. Selling Section - List and sell products
 * 3. Buying Section - Browse and purchase products
 *
 * Features:
 * - Username and greeting display
 * - Quick navigation cards
 * - Section descriptions
 * - Call-to-action buttons
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Sprout, ShoppingCart, Store, Droplets, LifeBuoy, BarChart3 } from 'lucide-react'
import apiClient from '../services/apiClient'
import { useCoin } from '../context/CoinContext'
import { useLoader } from '../context/LoaderContext'
import AppPage from '../components/layout/AppPage'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'

// Animated count hook for smooth number transitions
function useAnimatedCount(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    let start
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
      else setCount(target)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}

function Home() {
  const navigate = useNavigate()
  const [userUsername, setUserUsername] = useState('')
  const { coins } = useCoin()
  const { show: showLoader, hide: hideLoader } = useLoader()
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalProducts: 0,
    totalServices: 0,
    availableProducts: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [coinsLoading, setCoinsLoading] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [currentInsight, setCurrentInsight] = useState(0)

  useEffect(() => {
    const username = localStorage.getItem('farmEazy_username')
    const email = localStorage.getItem('farmEazy_email')
    const displayName = username || (email ? email.split('@')[0] : 'Farmer')
    setUserUsername(displayName)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('farmEazy_token')
      if (!token) {
        setStatsLoading(false)
        return
      }

      try {
        setStatsLoading(true)
        showLoader()

        let vendorEligible = false
        try {
          const eligibilityRes = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', {
            validateStatus: (status) => status < 500,
          })
          vendorEligible = Boolean(eligibilityRes?.data?.eligible) && eligibilityRes.status === 200
        } catch (_eligibilityError) {
          vendorEligible = false
        }

        const [farmsRes, allProductsRes] = await Promise.allSettled([
          apiClient.get('/farms'),
          apiClient.get('/products'),
        ])

        let productsRes = { status: 'rejected' }
        let servicesRes = { status: 'rejected' }

        if (vendorEligible) {
          const vendorResults = await Promise.allSettled([
            apiClient.get('/products/my-products'),
            apiClient.get('/services/listings/my')
          ])
          productsRes = vendorResults[0]
          servicesRes = vendorResults[1]
        }

        const nextStats = { totalFarms: 0, totalProducts: 0, totalServices: 0, availableProducts: 0 }

        if (farmsRes.status === 'fulfilled') {
          const data = farmsRes.value.data
          nextStats.totalFarms = Array.isArray(data) ? data.length : (data?.totalFarms || data?.count || 0)
        }

        if (productsRes.status === 'fulfilled') {
          const data = productsRes.value.data
          nextStats.totalProducts = Array.isArray(data) ? data.length : (data?.totalProducts || data?.count || 0)
        }

        if (servicesRes.status === 'fulfilled') {
          const data = servicesRes.value.data
          if (data?.content && Array.isArray(data.content)) {
            nextStats.totalServices = data.totalElements || data.content.length
          } else if (Array.isArray(data)) {
            nextStats.totalServices = data.length
          } else {
            nextStats.totalServices = 0
          }
        }

        if (allProductsRes.status === 'fulfilled') {
          const allProducts = allProductsRes.value.data
          const allCount = Array.isArray(allProducts) ? allProducts.length : 0
          nextStats.availableProducts = Math.max(0, allCount - nextStats.totalProducts)
        }

        setStats(nextStats)
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setStatsLoading(false)
        hideLoader()
      }
    }

    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoader, hideLoader])

  useEffect(() => {
    const onLocationChanged = () => {
      fetchStats()
    }
    window.addEventListener('farmeazy:location-changed', onLocationChanged)
    window.addEventListener('storage', onLocationChanged)
    return () => {
      window.removeEventListener('farmeazy:location-changed', onLocationChanged)
      window.removeEventListener('storage', onLocationChanged)
    }
  }, [])

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentInsight((prev) => (prev + 1) % 3)
      }, 4500)
      return () => clearInterval(timer)
    }, [])

  const farmsCount = useAnimatedCount(Number(stats.totalFarms) || 0)
  const productsCount = useAnimatedCount(Number(stats.totalProducts) || 0)
  const servicesCount = useAnimatedCount(Number(stats.totalServices) || 0)
  const availableProductsCount = useAnimatedCount(Number(stats.availableProducts) || 0)

  const insightSlides = [
    {
      title: 'Growth pulse',
      text: stats.totalFarms > 0
        ? `${stats.totalFarms} farm${stats.totalFarms > 1 ? 's are' : ' is'} active. Keep crop and irrigation logs updated.`
        : 'Start your first farm profile to unlock analytics and irrigation planning.',
    },
    {
      title: 'Market opportunity',
      text: availableProductsCount > 0
        ? `${availableProductsCount} listings are available in the marketplace.`
        : 'Add your first product and test buyer demand.',
    },
    {
      title: 'Service momentum',
      text: servicesCount > 0
        ? `${servicesCount} service listing${servicesCount > 1 ? 's are' : ' is'} active.`
        : 'Publish irrigation and equipment offers to create recurring revenue.',
    },
  ]

  return (
    <AppPage
      title={`Welcome back, ${userUsername || 'Farmer'}`}
      description="Your operations hub for farms, marketplace listings, and support."
      actions={
        <>
          <Button onClick={() => navigate('/dashboard')}>Open analytics</Button>
          <Button variant="outline" onClick={() => navigate('/selling')}>Manage listings</Button>
        </>
      }
    >
      <Card className="mb-6">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">{insightSlides[currentInsight].title}</p>
            <p className="text-sm text-muted-foreground mt-1">{insightSlides[currentInsight].text}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setCurrentInsight((p) => (p === 0 ? insightSlides.length - 1 : p - 1))}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentInsight((p) => (p + 1) % insightSlides.length)}>Next</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Active farms" value={statsLoading ? '…' : farmsCount} hint="Operational inventory" icon={Sprout} />
        <KpiCard title="Products listed" value={statsLoading ? '…' : productsCount} hint="Your vendor listings" icon={Store} />
        <KpiCard title="Service listings" value={statsLoading ? '…' : servicesCount} hint="Bookable services" icon={Droplets} />
        <KpiCard title="Coins balance" value={coinsLoading ? '…' : (coins?.totalCoins || 0)} hint="Rewards balance" icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {[
          { to: '/farms', title: 'Farms & crops', desc: 'Manage plots, crops, and irrigation schedules.', stat: `${farmsCount} active`, icon: Sprout },
          { to: '/selling', title: 'Sell products', desc: 'Publish listings and monitor inventory.', stat: `${productsCount} listing(s)`, icon: Store },
          { to: '/buying', title: 'Buy products', desc: 'Discover marketplace inventory near you.', stat: `${availableProductsCount} available`, icon: ShoppingCart },
        ].map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className="rounded-lg border border-border bg-card p-5 text-left hover:bg-accent transition-colors"
          >
            <item.icon className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            <p className="text-sm font-medium text-primary mt-3">{item.stat}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <button type="button" onClick={() => navigate('/irrigation-services')} className="rounded-lg border border-border bg-card p-5 text-left hover:bg-accent transition-colors">
          <Droplets className="h-5 w-5 text-primary mb-2" />
          <p className="font-medium text-foreground">Irrigation services</p>
          <p className="text-sm text-muted-foreground mt-1">Coordinate tasks with crop stages.</p>
        </button>
        <button type="button" onClick={() => setShowSupport(true)} className="rounded-lg border border-border bg-card p-5 text-left hover:bg-accent transition-colors">
          <LifeBuoy className="h-5 w-5 text-primary mb-2" />
          <p className="font-medium text-foreground">Priority support</p>
          <p className="text-sm text-muted-foreground mt-1">Account, listing, and payment help.</p>
        </button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How this hub works</CardTitle>
          <CardDescription>Three steps to get the most from FarmEazy.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground">1. Build farm data</p>
            <p className="text-muted-foreground mt-1">Keep farms and crop records current for accurate planning.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">2. Activate commerce</p>
            <p className="text-muted-foreground mt-1">List products and services for your service area.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">3. Optimize returns</p>
            <p className="text-muted-foreground mt-1">Use analytics and coins to compound growth.</p>
          </div>
        </CardContent>
      </Card>

      {showSupport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle>Contact support</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowSupport(false)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">6301630368</p>
                <a href="tel:6301630368" className="mt-2 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  Call now
                </a>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">Email</p>
                <a href="mailto:support@farm-eazy.com" className="font-medium text-primary hover:underline">support@farm-eazy.com</a>
              </div>
              <p className="text-xs text-muted-foreground">Support available 9 AM – 6 PM IST</p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppPage>
  )
}

export default Home
