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
  const [userFullName, setUserFullName] = useState('')
  const [userUsername, setUserUsername] = useState('')
  const { coins, refreshCoins } = useCoin()
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalProducts: 0,
    totalServices: 0
  })
  const [showSupport, setShowSupport] = useState(false)
  const { show: showLoader, hide: hideLoader } = useLoader();
  const [statsLoading, setStatsLoading] = useState(true);
  const [coinsLoading, setCoinsLoading] = useState(false); // If you want to show coin loading, otherwise remove

  // Fetch user info from localStorage on mount
  useEffect(() => {
    const fullName = localStorage.getItem('farmEazy_fullName');
    const username = localStorage.getItem('farmEazy_username');
    const email = localStorage.getItem('farmEazy_email');
    // Use fullName, fallback to username, then email prefix
    const displayName = fullName || username || (email ? email.split('@')[0] : 'Farmer');
    setUserFullName(displayName);
    setUserUsername(username || 'user');
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
        const [farmsRes, productsRes, servicesRes] = await Promise.allSettled([
          apiClient.get('/farms'),
          apiClient.get('/products/my-products'),
          apiClient.get('/services/listings/my')
        ])

        const nextStats = { totalFarms: 0, totalProducts: 0, totalServices: 0 }

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

  // Debug: log stats before using animated counters
  console.log('Animated Counter Stats:', stats);
  const farmsCount = useAnimatedCount(Number(stats.totalFarms) || 0);
  const productsCount = useAnimatedCount(Number(stats.totalProducts) || 0);
  const servicesCount = useAnimatedCount(Number(stats.totalServices) || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 -m-6 p-6">
      {/* Section Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Quick Overview
        </h2>
        <p className="text-slate-400">Your farm at a glance. Click on any card to manage that section, or view detailed analytics on the Dashboard.</p>
      </div>

      {/* Hero Section with fade-in animation */}
      <div className="mb-10 rounded-3xl bg-gradient-to-r from-green-900 via-blue-900 to-slate-800 p-8 md:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in border border-slate-700">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-300 mb-3 drop-shadow-lg">Welcome, {userFullName || userUsername || 'Farmer'}!</h1>
          <p className="text-lg md:text-2xl text-slate-300 mb-4">Manage your smart farm with ease and efficiency.</p>
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
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {statsLoading ? '...' : farmsCount}
          </div>
          <p className="text-slate-300 text-sm">Active Farms</p>
          <p className="text-slate-500 text-xs mt-1">
            {statsLoading
              ? 'Loading...'
              : (stats.totalFarms === 0 ? 'Add your first farm' : 'Farms active')}
          </p>
        </div>
        {/* Products */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {statsLoading ? '...' : productsCount}
          </div>
          <p className="text-slate-300 text-sm">Products Listed</p>
          <p className="text-slate-500 text-xs mt-1">
            {statsLoading
              ? 'Loading...'
              : (stats.totalProducts === 0 ? 'List your first product' : 'Products available')}
          </p>
        </div>
        {/* Services */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="text-3xl font-bold text-purple-400 mb-2 flex items-center gap-2">
            {statsLoading ? '...' : (
              <>
                <span>🚜</span>
                <span>{servicesCount}</span>
              </>
            )}
          </div>
          <p className="text-slate-300 text-sm">Service Listings</p>
          <p className="text-slate-500 text-xs mt-1">
            {statsLoading
              ? 'Loading...'
              : (stats.totalServices === 0 ? 'List equipment/workers' : 'Services available')}
          </p>
        </div>
        {/* Coins */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <div className="text-3xl font-bold text-orange-400 mb-2 flex items-center gap-2">
            {coinsLoading ? '...' : (
              <>
                <span>🪙</span>
                <span>{coins?.totalCoins || 0}</span>
              </>
            )}
          </div>
          <p className="text-slate-300 text-sm">Coins Balance</p>
          {!coinsLoading && coins?.dailyLoginCoinsAvailable > 0 && (
            <p className="text-orange-400 text-xs mt-1">+{coins.dailyLoginCoinsAvailable * 5} more today</p>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards with entrance animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Farms Management Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border border-green-900 group animate-slide-up" onClick={() => navigate('/farms')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏡</span>
          <h2 className="text-2xl font-bold mb-2 text-green-400">Farms Management</h2>
          <p className="text-slate-400 mb-3 text-center">Manage your farms and crops efficiently.</p>
          <span className="text-base text-green-400 font-bold">{farmsCount} Farms</span>
        </div>
        {/* Selling Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border border-blue-900 group animate-slide-up delay-100" onClick={() => navigate('/selling')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🛒</span>
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Sell Products</h2>
          <p className="text-slate-400 mb-3 text-center">List your products for sale to other farmers.</p>
          <span className="text-base text-blue-400 font-bold">{productsCount} Products</span>
        </div>
        {/* Buying Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border border-purple-900 group animate-slide-up delay-200" onClick={() => navigate('/buying')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🛍️</span>
          <h2 className="text-2xl font-bold mb-2 text-purple-400">Buy Products</h2>
          <p className="text-slate-400 mb-3 text-center">Browse and purchase products for your farm.</p>
          <span className="text-base text-purple-400 font-bold">{productsCount} Available</span>
        </div>
      </div>

      {/* Services & Support Cards */}
      <div className="mt-12 flex flex-col md:flex-row gap-8">
        {/* Services Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 flex-1 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border border-cyan-900 group animate-slide-up" onClick={() => navigate('/irrigation-services')}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">💧</span>
          <h2 className="text-2xl font-bold mb-2 text-cyan-400">Irrigation Services</h2>
          <p className="text-slate-400 mb-3 text-center">Schedule and manage irrigation for your crops.</p>
          <span className="text-base text-cyan-400 font-bold">{servicesCount} Services</span>
        </div>
        {/* Support Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 flex-1 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all cursor-pointer border border-pink-900 group animate-slide-up delay-100" onClick={() => setShowSupport(true)}>
          <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">💬</span>
          <h2 className="text-2xl font-bold mb-2 text-pink-400">Support</h2>
          <p className="text-slate-400 mb-3 text-center">Get help and chat with our support team.</p>
          <span className="text-base text-pink-400 font-bold">24/7 Chat</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-12 bg-blue-900/30 border border-blue-800 rounded-lg p-8">
        <h3 className="text-xl font-bold text-blue-300 mb-4">
          💡 How FarmEazy Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="text-3xl">🌱</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Farms</h4>
              <p className="text-sm text-slate-400">
                Manage your farming operations efficiently with real-time monitoring of crops and irrigation.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-3xl">🎯</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Sell Smart</h4>
              <p className="text-sm text-slate-400">
                List your products and reach customers directly. Build your brand and grow your business.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-3xl">🪙</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Earn Coins</h4>
              <p className="text-sm text-slate-400">
                Every purchase earns coins! Use them for discounts, free shipping, or special offers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 text-center text-sm text-slate-400">
        <p>
          Need help?{' '}
          <button
            className="text-green-400 hover:text-green-300 font-semibold"
            onClick={() => setShowSupport(true)}
          >
            Contact Support
          </button>
        </p>
      </div>

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Contact Support</h3>
              <button
                className="text-slate-400 hover:text-white"
                onClick={() => setShowSupport(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400">Phone Support</p>
                <p className="text-lg font-semibold text-white">6301630368</p>
                <a
                  href="tel:6301630368"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📞 Call Now
                </a>
              </div>
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400">Email Support</p>
                <div className="space-y-2">
                  <a
                    href="mailto:kranthijambuluri@gmail.com"
                    className="block text-blue-400 font-semibold hover:underline"
                  >
                    kranthijambuluri@gmail.com
                  </a>
                  <a
                    href="mailto:kranthir520@gmail.com"
                    className="block text-blue-400 font-semibold hover:underline"
                  >
                    kranthir520@gmail.com
                  </a>
                </div>
              </div>
              <p className="text-xs text-slate-500">Support available 9 AM - 6 PM IST</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Home;
