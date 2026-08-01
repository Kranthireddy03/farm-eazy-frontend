/**
 * Home — premium operations hub with hero, insights, and quick actions.
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Sprout, ShoppingCart, Store, Droplets, LifeBuoy, BarChart3, Sparkles } from 'lucide-react'
import apiClient from '../services/apiClient'
import { useCoin } from '../context/CoinContext'
import { useLoader } from '../context/LoaderContext'
import AppPage from '../components/layout/AppPage'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { PremiumHero, BentoGrid, BentoCell, QuickActionTile } from '../components/platform'

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
  const [showSupport, setShowSupport] = useState(false)
  const [currentInsight, setCurrentInsight] = useState(0)

  useEffect(() => {
    const username = localStorage.getItem('farmEazy_username')
    const email = localStorage.getItem('farmEazy_email')
    const displayName = username || (email ? email.split('@')[0] : 'Farmer')
    setUserUsername(displayName)
  }, [])

  const fetchStats = useCallback(async () => {
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
      } catch {
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
          apiClient.get('/services/listings/my'),
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
  }, [showLoader, hideLoader])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const onLocationChanged = () => fetchStats()
    window.addEventListener('farmeazy:location-changed', onLocationChanged)
    window.addEventListener('storage', onLocationChanged)
    return () => {
      window.removeEventListener('farmeazy:location-changed', onLocationChanged)
      window.removeEventListener('storage', onLocationChanged)
    }
  }, [fetchStats])

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
      text:
        stats.totalFarms > 0
          ? `${stats.totalFarms} farm${stats.totalFarms > 1 ? 's are' : ' is'} active. Keep crop and irrigation logs updated.`
          : 'Start your first farm profile to unlock analytics and irrigation planning.',
    },
    {
      title: 'Market opportunity',
      text:
        availableProductsCount > 0
          ? `${availableProductsCount} listings are available in the marketplace.`
          : 'Add your first product and test buyer demand.',
    },
    {
      title: 'Service momentum',
      text:
        servicesCount > 0
          ? `${servicesCount} service listing${servicesCount > 1 ? 's are' : ' is'} active.`
          : 'Publish irrigation and equipment offers to create recurring revenue.',
    },
  ]

  return (
    <AppPage noMotion>
      <PremiumHero
        eyebrow="Operations hub"
        title={`Welcome back, ${userUsername || 'Farmer'}`}
        description="Your command center for farms, marketplace listings, irrigation, and support — designed for clarity at every step."
        actions={
          <>
            <Button onClick={() => navigate('/dashboard')} className="shadow-md shadow-primary/20">
              Open analytics
            </Button>
            <Button variant="outline" onClick={() => navigate('/selling')}>Manage listings</Button>
          </>
        }
        stats={[
          { label: 'Active farms', value: statsLoading ? '…' : farmsCount },
          { label: 'Your listings', value: statsLoading ? '…' : productsCount },
          { label: 'Coins', value: coins?.totalCoins ?? 0 },
        ]}
        media={
          <div className="fe-surface fe-gradient-border p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">Live insight</span>
            </div>
            <p className="font-semibold text-foreground">{insightSlides[currentInsight].title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insightSlides[currentInsight].text}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentInsight((p) => (p === 0 ? insightSlides.length - 1 : p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentInsight((p) => (p + 1) % insightSlides.length)}
              >
                Next
              </Button>
            </div>
          </div>
        }
      />

      <BentoGrid className="mt-8">
        <BentoCell span={3}>
          <KpiCard title="Active farms" value={statsLoading ? '…' : farmsCount} hint="Operational inventory" icon={Sprout} />
        </BentoCell>
        <BentoCell span={3}>
          <KpiCard title="Products listed" value={statsLoading ? '…' : productsCount} hint="Your vendor listings" icon={Store} />
        </BentoCell>
        <BentoCell span={3}>
          <KpiCard title="Service listings" value={statsLoading ? '…' : servicesCount} hint="Bookable services" icon={Droplets} />
        </BentoCell>
        <BentoCell span={3}>
          <KpiCard title="Coins balance" value={coins?.totalCoins || 0} hint="Rewards balance" icon={BarChart3} />
        </BentoCell>

        <BentoCell span={4}>
          <QuickActionTile
            icon={Sprout}
            title="Farms & crops"
            description="Manage plots, crops, and irrigation schedules."
            stat={`${farmsCount} active`}
            onClick={() => navigate('/farms')}
          />
        </BentoCell>
        <BentoCell span={4}>
          <QuickActionTile
            icon={Store}
            title="Sell products"
            description="Publish listings and monitor inventory."
            stat={`${productsCount} listing(s)`}
            onClick={() => navigate('/selling')}
          />
        </BentoCell>
        <BentoCell span={4}>
          <QuickActionTile
            icon={ShoppingCart}
            title="Buy products"
            description="Discover marketplace inventory near you."
            stat={`${availableProductsCount} available`}
            onClick={() => navigate('/buying')}
          />
        </BentoCell>

        <BentoCell span={6}>
          <QuickActionTile
            icon={Droplets}
            title="Irrigation services"
            description="Coordinate tasks with crop stages and sensor data."
            onClick={() => navigate('/irrigation-services')}
          />
        </BentoCell>
        <BentoCell span={6}>
          <QuickActionTile
            icon={LifeBuoy}
            title="Priority support"
            description="Account, listing, and payment help when you need it."
            onClick={() => setShowSupport(true)}
          />
        </BentoCell>

        <BentoCell span={12} className="!p-0 overflow-hidden">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg fe-display">How this hub works</CardTitle>
              <CardDescription>Three steps to get the most from FarmEazy.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="font-semibold text-foreground">1. Build farm data</p>
                <p className="text-muted-foreground mt-1">Keep farms and crop records current for accurate planning.</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="font-semibold text-foreground">2. Activate commerce</p>
                <p className="text-muted-foreground mt-1">List products and services for your service area.</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="font-semibold text-foreground">3. Optimize returns</p>
                <p className="text-muted-foreground mt-1">Use analytics and coins to compound growth.</p>
              </div>
            </CardContent>
          </Card>
        </BentoCell>
      </BentoGrid>

      {showSupport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="max-w-md w-full fe-surface-hero shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="fe-display text-xl">Contact support</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowSupport(false)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">6301630368</p>
                <a
                  href="tel:6301630368"
                  className="mt-2 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Call now
                </a>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="text-muted-foreground">Email</p>
                <a href="mailto:support@farm-eazy.com" className="font-medium text-primary hover:underline">
                  support@farm-eazy.com
                </a>
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
