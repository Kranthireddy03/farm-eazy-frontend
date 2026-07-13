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
import { useTheme } from '../context/ThemeContext'
import apiClient from '../services/apiClient'
import { useCoin } from '../context/CoinContext'
import { useLoader } from '../context/LoaderContext'

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
  const { isDark } = useTheme()
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
      title: 'Smart Growth Pulse',
      text: stats.totalFarms > 0
        ? `${stats.totalFarms} farm${stats.totalFarms > 1 ? 's are' : ' is'} active. Keep crop and irrigation logs updated for better yield visibility.`
        : 'Start your first farm profile to unlock analytics, crop logs, and irrigation planning.',
      accent: isDark ? 'from-emerald-500/30 to-teal-500/20' : 'from-emerald-200 to-teal-100',
    },
    {
      title: 'Market Opportunity',
      text: availableProductsCount > 0
        ? `${availableProductsCount} product listings are available in the marketplace. Compare pricing and demand trends before listing.`
        : 'Marketplace is waiting for fresh listings. Add your first product and test buyer demand quickly.',
      accent: isDark ? 'from-blue-500/30 to-cyan-500/20' : 'from-blue-200 to-cyan-100',
    },
    {
      title: 'Service Momentum',
      text: servicesCount > 0
        ? `${servicesCount} service listing${servicesCount > 1 ? 's are' : ' is'} active. Keep slots updated to improve booking conversion.`
        : 'No service listing yet. Publish irrigation and equipment support offers to create recurring revenue.',
      accent: isDark ? 'from-fuchsia-500/30 to-violet-500/20' : 'from-fuchsia-200 to-violet-100',
    },
  ]

  return (
    <div className={`min-h-screen overflow-hidden relative ${isDark ? 'bg-slate-950' : 'bg-[#f2f8f1]'}`}>
      <div className={`pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-700/30' : 'bg-emerald-300/50'}`} />
      <div className={`pointer-events-none absolute top-20 -right-28 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-cyan-700/25' : 'bg-cyan-200/60'}`} />

      <main className="app-shell-wrap py-8 relative z-10">
        <div className={`rounded-[2rem] p-6 md:p-8 shadow-2xl border ${isDark ? 'bg-slate-900/75 border-slate-700' : 'bg-white/85 border-emerald-100'} backdrop-blur-sm`}>
          <section className={`rounded-3xl p-6 md:p-10 border shadow-xl mb-8 ${isDark ? 'bg-gradient-to-r from-emerald-900/70 via-cyan-900/60 to-slate-900 border-slate-700' : 'bg-gradient-to-r from-[#dff6d4] via-[#d8f3ff] to-[#f0f7ff] border-emerald-200'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <p className={`text-xs md:text-sm tracking-[0.18em] uppercase font-semibold mb-3 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  FarmEazy Control Deck
                </p>
                <h1 className={`text-3xl md:text-5xl font-extrabold leading-tight mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Welcome back, {userUsername || 'Farmer'}
                </h1>
                <p className={`text-sm md:text-lg max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Run your farm like an operations studio. Track production, activate listings, and move from planning to profit in one flow.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${isDark ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}
                  >
                    Open Analytics
                  </button>
                  <button
                    onClick={() => navigate('/selling')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 border ${isDark ? 'border-slate-500 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                  >
                    Manage Listings
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border p-4 md:p-5 ${isDark ? 'bg-slate-900/60 border-slate-600' : 'bg-white/80 border-white'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Insight Board</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentInsight((prev) => (prev === 0 ? insightSlides.length - 1 : prev - 1))}
                      className={`h-8 w-8 rounded-full text-sm ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      {'<'}
                    </button>
                    <button
                      onClick={() => setCurrentInsight((prev) => (prev + 1) % insightSlides.length)}
                      className={`h-8 w-8 rounded-full text-sm ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      {'>'}
                    </button>
                  </div>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br transition-all duration-500 ${insightSlides[currentInsight].accent}`}>
                  <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{insightSlides[currentInsight].title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{insightSlides[currentInsight].text}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  {insightSlides.map((_, index) => (
                    <span
                      key={`insight-dot-${index}`}
                      className={`h-1.5 rounded-full transition-all ${currentInsight === index ? 'w-7 bg-emerald-500' : isDark ? 'w-4 bg-slate-600' : 'w-4 bg-slate-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <article className={`rounded-2xl p-5 border shadow-lg ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Farms</p>
              <h3 className={`text-4xl font-extrabold mt-2 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{statsLoading ? '...' : farmsCount}</h3>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{statsLoading ? 'Loading...' : (stats.totalFarms ? 'Operational inventory is healthy' : 'Create your first farm profile')}</p>
            </article>

            <article className={`rounded-2xl p-5 border shadow-lg ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'}`}>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Products Listed</p>
              <h3 className={`text-4xl font-extrabold mt-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{statsLoading ? '...' : productsCount}</h3>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{statsLoading ? 'Loading...' : (stats.totalProducts ? 'Listings are live in your vendor profile' : 'Publish your first product')}</p>
            </article>

            <article className={`rounded-2xl p-5 border shadow-lg ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-fuchsia-100'}`}>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Service Listings</p>
              <h3 className={`text-4xl font-extrabold mt-2 ${isDark ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>{statsLoading ? '...' : servicesCount}</h3>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{statsLoading ? 'Loading...' : (stats.totalServices ? 'Service catalog is visible to buyers' : 'Add irrigation and labor services')}</p>
            </article>

            <article className={`rounded-2xl p-5 border shadow-lg ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-amber-100'}`}>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Coins Balance</p>
              <h3 className={`text-4xl font-extrabold mt-2 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{coinsLoading ? '...' : (coins?.totalCoins || 0)}</h3>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{!coinsLoading && coins?.dailyLoginCoinsAvailable > 0 ? `+${coins.dailyLoginCoinsAvailable * 5} coins still available today` : 'Use coins for future rewards'}</p>
            </article>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <button onClick={() => navigate('/farms')} className={`text-left rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'bg-slate-800 border-emerald-900' : 'bg-white border-emerald-200'}`}>
              <p className="text-3xl mb-3">Field Operations</p>
              <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Farms & Crops</h4>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Manage plots, crops, and irrigation schedules with status visibility by season.</p>
              <p className={`mt-4 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{farmsCount} active unit(s)</p>
            </button>

            <button onClick={() => navigate('/selling')} className={`text-left rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'bg-slate-800 border-blue-900' : 'bg-white border-blue-200'}`}>
              <p className="text-3xl mb-3">Commerce Engine</p>
              <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Sell Products</h4>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Publish listings, optimize pricing, and monitor inventory performance from one hub.</p>
              <p className={`mt-4 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{productsCount} listing(s) live</p>
            </button>

            <button onClick={() => navigate('/buying')} className={`text-left rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'bg-slate-800 border-violet-900' : 'bg-white border-violet-200'}`}>
              <p className="text-3xl mb-3">Supply Channel</p>
              <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>Buy Products</h4>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Discover verified marketplace inventory and secure better sourcing decisions.</p>
              <p className={`mt-4 font-semibold ${isDark ? 'text-violet-400' : 'text-violet-700'}`}>{availableProductsCount} available</p>
            </button>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <button onClick={() => navigate('/irrigation-services')} className={`text-left rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'bg-slate-800 border-cyan-900' : 'bg-white border-cyan-200'}`}>
              <h4 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Irrigation Services</h4>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Coordinate irrigation tasks and keep service slots synchronized with crop stages.</p>
              <p className={`mt-4 font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{servicesCount} service channel(s)</p>
            </button>

            <button onClick={() => setShowSupport(true)} className={`text-left rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'bg-slate-800 border-rose-900' : 'bg-white border-rose-200'}`}>
              <h4 className={`text-2xl font-bold mb-2 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>Priority Support</h4>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Reach support quickly for account, listing, payment, and operational assistance.</p>
              <p className={`mt-4 font-semibold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>Response window: 9 AM - 6 PM IST</p>
            </button>
          </section>

          <section className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>How This Control Deck Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <h4 className={`font-semibold mb-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>1. Build Farm Data</h4>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Keep farms and crop records current to power accurate planning and activity history.</p>
              </div>
              <div>
                <h4 className={`font-semibold mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>2. Activate Commerce</h4>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>List products and services strategically to grow demand and improve visibility.</p>
              </div>
              <div>
                <h4 className={`font-semibold mb-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>3. Optimize Returns</h4>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Use analytics and coin incentives to compound growth and customer retention.</p>
              </div>
            </div>
          </section>

          {showSupport && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
              <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Contact Support</h3>
                  <button
                    className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    onClick={() => setShowSupport(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className={`rounded-lg p-4 border ${isDark ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Phone Support</p>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>6301630368</p>
                    <a
                      href="tel:6301630368"
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      📞 Call Now
                    </a>
                  </div>
                  <div className={`rounded-lg p-4 border ${isDark ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email Support</p>
                    <a
                      href="mailto:support@farm-eazy.com"
                      className={`block font-semibold hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                      support@farm-eazy.com
                    </a>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Support available 9 AM - 6 PM IST</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Home
