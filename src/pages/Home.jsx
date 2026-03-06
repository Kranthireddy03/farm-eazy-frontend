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
// Animated Counter Hook
function useAnimatedCount(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef();
  useEffect(() => {
    let start;
    function animate(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else setCount(target);
    }
    raf.current = requestAnimationFrame(animate);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}
import AuthService from '../services/AuthService'
import apiClient from '../services/apiClient'
import { useCoin } from '../context/CoinContext'
import { useLoader } from '../context/LoaderContext'

function Home() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [userUsername, setUserUsername] = useState('')
  const { coins, refreshCoins } = useCoin()
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalProducts: 0,  // User's own products (for Sell Products card)
    totalServices: 0,
    availableProducts: 0  // Products available to buy (excluding user's own)
  })
  const [showSupport, setShowSupport] = useState(false)
  const { show: showLoader, hide: hideLoader } = useLoader();
  const [statsLoading, setStatsLoading] = useState(true);
  const [coinsLoading, setCoinsLoading] = useState(false); // If you want to show coin loading, otherwise remove

  // Fetch user info from localStorage on mount
  useEffect(() => {
    const username = localStorage.getItem('farmEazy_username');
    const email = localStorage.getItem('farmEazy_email');
    // Use username, fallback to email prefix
    const displayName = username || (email ? email.split('@')[0] : 'Farmer');
    setUserUsername(displayName);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      // Check if user is authenticated before fetching
      const token = localStorage.getItem('farmEazy_token');
      if (!token) {
        console.log('No token found, skipping stats fetch');
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        showLoader();
        // Fetch user-specific counts for dashboard stats
        const [farmsRes, productsRes, servicesRes, allProductsRes] = await Promise.allSettled([
          apiClient.get('/farms'),
          apiClient.get('/products/my-products'),
          apiClient.get('/services/listings/my'),
          apiClient.get('/products')  // All products for Buy Products card
        ])

        const nextStats = { totalFarms: 0, totalProducts: 0, totalServices: 0, availableProducts: 0 }

        if (farmsRes.status === 'fulfilled') {
          const data = farmsRes.value.data
          nextStats.totalFarms = Array.isArray(data)
            ? data.length
            : (data?.totalFarms || data?.count || 0)
        }

        if (productsRes.status === 'fulfilled') {
          const data = productsRes.value.data
          nextStats.totalProducts = Array.isArray(data)
            ? data.length
            : (data?.totalProducts || data?.count || 0)
        }

        if (servicesRes.status === 'fulfilled') {
          const data = servicesRes.value.data
          // Handle paginated response
          if (data.content && Array.isArray(data.content)) {
            nextStats.totalServices = data.totalElements || data.content.length
          } else if (Array.isArray(data)) {
            nextStats.totalServices = data.length
          } else {
            nextStats.totalServices = 0
          }
        }

        // Calculate available products (all products minus user's own)
        if (allProductsRes.status === 'fulfilled') {
          const allProducts = allProductsRes.value.data
          const allCount = Array.isArray(allProducts) ? allProducts.length : 0
          // Available = All products - User's own products
          nextStats.availableProducts = Math.max(0, allCount - nextStats.totalProducts)
        }

        setStats(nextStats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setStatsLoading(false);
        hideLoader();
      }
    };
    fetchStats();
    // eslint-disable-next-line
  }, [showLoader, hideLoader])

  const farmsCount = useAnimatedCount(Number(stats.totalFarms) || 0);
  const productsCount = useAnimatedCount(Number(stats.totalProducts) || 0);
  const servicesCount = useAnimatedCount(Number(stats.totalServices) || 0);
  const availableProductsCount = useAnimatedCount(Number(stats.availableProducts) || 0);

  return (
    <div className={`min-h-screen -m-6 p-6 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      {/* Section Title */}
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Quick Overview
        </h2>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Your farm at a glance. Click on any card to manage that section, or view detailed analytics on the Dashboard.</p>
      </div>

      {/* Hero Section with fade-in animation */}
      <div className={`mb-10 rounded-3xl p-8 md:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in border ${isDark ? 'bg-gradient-to-r from-green-900 via-blue-900 to-slate-800 border-slate-700' : 'bg-gradient-to-r from-emerald-100 via-teal-100 to-blue-100 border-emerald-200'}`}>
        <div>
          <h1 className={`text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-lg ${isDark ? 'text-green-300' : 'text-emerald-700'}`}>Welcome, {userUsername || 'Farmer'}!</h1>
          <p className={`text-lg md:text-2xl mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Manage your smart farm with ease and efficiency.</p>
          <button
            className="mt-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg transition-all"
            onClick={() => navigate('/dashboard')}
          >
            📊 View Analytics Dashboard
          </button>
        </div>
        <div className="hidden md:block animate-fade-in-slow">
          <img
            src="/farm-hero.svg"
            alt="FarmEazy Hero"
            className="w-64 h-64 object-contain drop-shadow-2xl"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="w-64 h-64 flex items-center justify-center text-6xl text-green-300 dark:text-green-900" style={{display: 'none'}}>
            🌾
          </div>
        </div>
      </div>

      {/* Animated Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* Farms */}
        <div className={`rounded-lg shadow-lg p-6 border-l-4 border-green-500 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {statsLoading ? '...' : farmsCount}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Active Farms</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {statsLoading
              ? 'Loading...'
              : (stats.totalFarms === 0 ? 'Add your first farm' : 'Farms active')}
          </p>
        </div>
        {/* Products */}
        <div className={`rounded-lg shadow-lg p-6 border-l-4 border-blue-500 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {statsLoading ? '...' : productsCount}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Products Listed</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {statsLoading
              ? 'Loading...'
              : (stats.totalProducts === 0 ? 'List your first product' : 'Products available')}
          </p>
        </div>
        {/* Services */}
        <div className={`rounded-lg shadow-lg p-6 border-l-4 border-purple-500 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className={`text-3xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {statsLoading ? '...' : (
              <>
                <span>🚜</span>
                <span>{servicesCount}</span>
              </>
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Service Listings</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {statsLoading
              ? 'Loading...'
              : (stats.totalServices === 0 ? 'List equipment/workers' : 'Services available')}
          </p>
        </div>
        {/* Coins */}
        <div className={`rounded-lg shadow-lg p-6 border-l-4 border-orange-500 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className={`text-3xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            {coinsLoading ? '...' : (
              <>
                <span>🪙</span>
                <span>{coins?.totalCoins || 0}</span>
              </>
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Coins Balance</p>
          {!coinsLoading && coins?.dailyLoginCoinsAvailable > 0 && (
            <p className={`text-xs mt-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>+{coins.dailyLoginCoinsAvailable * 5} more today</p>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards with entrance animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Farms Management Card */}
        <div className={`rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border group animate-slide-up ${isDark ? 'bg-slate-800 border-green-900' : 'bg-white border-emerald-200'}`} onClick={() => navigate('/farms')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏡</span>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-green-400' : 'text-emerald-600'}`}>Farms Management</h2>
          <p className={`mb-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage your farms and crops efficiently.</p>
          <span className={`text-base font-bold ${isDark ? 'text-green-400' : 'text-emerald-600'}`}>{farmsCount} Farms</span>
        </div>
        {/* Selling Card */}
        <div className={`rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border group animate-slide-up delay-100 ${isDark ? 'bg-slate-800 border-blue-900' : 'bg-white border-blue-200'}`} onClick={() => navigate('/selling')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🛒</span>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Sell Products</h2>
          <p className={`mb-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>List your products for sale to other farmers.</p>
          <span className={`text-base font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{productsCount} Products</span>
        </div>
        {/* Buying Card */}
        <div className={`rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border group animate-slide-up delay-200 ${isDark ? 'bg-slate-800 border-purple-900' : 'bg-white border-purple-200'}`} onClick={() => navigate('/buying')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🛍️</span>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Buy Products</h2>
          <p className={`mb-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Browse and purchase products for your farm.</p>
          <span className={`text-base font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{availableProductsCount} Available</span>
        </div>
      </div>

      {/* Services & Support Cards */}
      <div className="mt-12 flex flex-col md:flex-row gap-8">
        {/* Services Card */}
        <div className={`rounded-2xl shadow-xl p-8 flex-1 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border group animate-slide-up ${isDark ? 'bg-slate-800 border-cyan-900' : 'bg-white border-cyan-200'}`} onClick={() => navigate('/irrigation-services')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">💧</span>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>Irrigation Services</h2>
          <p className={`mb-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Schedule and manage irrigation for your crops.</p>
          <span className={`text-base font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{servicesCount} Services</span>
        </div>
        {/* Support Card */}
        <div className={`rounded-2xl shadow-xl p-8 flex-1 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border group animate-slide-up delay-100 ${isDark ? 'bg-slate-800 border-pink-900' : 'bg-white border-pink-200'}`} onClick={() => setShowSupport(true)}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">💬</span>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>Support</h2>
          <p className={`mb-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Get help and chat with our support team.</p>
          <span className={`text-base font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>24/7 Chat</span>
        </div>
      </div>

      {/* Info Section */}
      <div className={`mt-12 rounded-lg p-8 border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          💡 How FarmEazy Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="text-3xl">🌱</div>
            <div>
              <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>Farms</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Manage your farming operations efficiently with real-time monitoring of crops and irrigation.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-3xl">🎯</div>
            <div>
              <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>Sell Smart</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                List your products and reach customers directly. Build your brand and grow your business.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-3xl">🪙</div>
            <div>
              <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>Earn Coins</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Every purchase earns coins! Use them for discounts, free shipping, or special offers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className={`mt-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <p>
          Need help?{' '}
          <button
            className={`font-semibold ${isDark ? 'text-green-400 hover:text-green-300' : 'text-emerald-600 hover:text-emerald-500'}`}
            onClick={() => setShowSupport(true)}
          >
            Contact Support
          </button>
        </p>
      </div>

      {/* Support Modal */}
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
  )
}
export default Home;
