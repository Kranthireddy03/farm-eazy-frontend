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
import { useState, useEffect } from 'react'
import AuthService from '../services/AuthService'
import apiClient from '../services/apiClient'
import { useCoin } from '../context/CoinContext'

function Home() {
  const navigate = useNavigate()
  const [userFullName, setUserFullName] = useState('')
  const [userUsername, setUserUsername] = useState('')
  const { coins, loading: coinsLoading, refreshCoins } = useCoin()
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalProducts: 0,
    totalServices: 0
  })
  const [showSupport, setShowSupport] = useState(false)

  useEffect(() => {
    // Get user info from localStorage
    const fullName = localStorage.getItem('farmEazy_fullName')
    const username = localStorage.getItem('farmEazy_username')
    setUserFullName(fullName || 'Farmer')
    setUserUsername(username || 'user')
    fetchStats()
  }, [])
  
  const fetchCoins = async () => {
    // Removed: now handled by CoinContext
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const [farmsRes, productsRes, servicesRes] = await Promise.allSettled([
        apiClient.get('/farms'),
        apiClient.get('/products'),
        apiClient.get('/services/listings')
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
      setStatsLoading(false)
    }
  }

  // Section data with icons and descriptions
  const sections = [
    {
      id: 'farms',
      title: 'Farm Management',
      description: 'Manage your farms, monitor crops, track irrigation schedules, and optimize your farming operations.',
      icon: '🌾',
      color: 'from-green-500 to-green-600',
      lightColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      features: [
        '📍 View all your farms',
        '🌱 Track crop progress',
        '💧 Monitor irrigation',
        '📊 Farm analytics',
      ],
      actionText: 'Go to Farms',
      path: '/farms',
    },
    {
      id: 'selling',
      title: 'Selling',
      description: 'List your agricultural products for sale. Set prices, manage inventory, and reach buyers across the region.',
      icon: '📦',
      color: 'from-blue-500 to-blue-600',
      lightColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      features: [
        '🏷️ List products',
        '💰 Set competitive prices',
        '📸 Upload product images',
        '⭐ Manage ratings',
      ],
      actionText: 'Start Selling',
      path: '/selling',
    },
    {
      id: 'buying',
      title: 'Buying',
      description: 'Browse quality agricultural products from verified sellers. Earn coins on every purchase and unlock exclusive deals.',
      icon: '🛒',
      color: 'from-orange-500 to-orange-600',
      lightColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
      features: [
        '🔍 Browse products',
        '💳 Secure checkout',
        '🪙 Earn coins',
        '🎁 Special offers',
      ],
      actionText: 'Start Shopping',
      path: '/buying',
    },
    {
      id: 'services',
      title: 'Irrigation Services',
      description: 'Connect with equipment owners and skilled workers. Rent machinery or hire labor for your farming needs.',
      icon: '🚜',
      color: 'from-purple-500 to-purple-600',
      lightColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      features: [
        '🔧 Rent equipment',
        '👷 Hire workers',
        '📋 Post your services',
        '💼 Manage bookings',
      ],
      actionText: 'Explore Services',
      path: '/irrigation-services',
      isServices: true,
    },
  ]

  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header with Welcome Message */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {userFullName}! 👋
          </h1>
          <p className="text-green-100 text-lg flex items-center gap-2">
            <span className="text-2xl">@{userUsername}</span>
            <span>•</span>
            <span>Your farming dashboard is ready</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {statsLoading ? '...' : stats.totalFarms}
            </div>
            <p className="text-gray-700 text-sm">Active Farms</p>
            <p className="text-gray-500 text-xs mt-1">
              {statsLoading
                ? 'Loading...'
                : (stats.totalFarms === 0 ? 'Add your first farm' : 'Farms active')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {statsLoading ? '...' : stats.totalProducts}
            </div>
            <p className="text-gray-700 text-sm">Products Listed</p>
            <p className="text-gray-500 text-xs mt-1">
              {statsLoading
                ? 'Loading...'
                : (stats.totalProducts === 0 ? 'List your first product' : 'Products available')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600 mb-2 flex items-center gap-2">
              {statsLoading ? '...' : (
                <>
                  <span>🚜</span>
                  <span>{stats.totalServices}</span>
                </>
              )}
            </div>
            <p className="text-gray-700 text-sm">Service Listings</p>
            <p className="text-gray-500 text-xs mt-1">
              {statsLoading
                ? 'Loading...'
                : (stats.totalServices === 0 ? 'List equipment/workers' : 'Services available')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-orange-600 mb-2 flex items-center gap-2">
              {coinsLoading ? '...' : (
                <>
                  <span>🪙</span>
                  <span>{coins?.totalCoins || 0}</span>
                </>
              )}
            </div>
            <p className="text-gray-700 text-sm">Coins Balance</p>
            {!coinsLoading && coins?.dailyLoginCoinsAvailable > 0 && (
              <p className="text-orange-500 text-xs mt-1">+{coins.dailyLoginCoinsAvailable * 5} more today</p>
            )}
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Choose Your Path
          </h2>
          <p className="text-gray-600">
            Select a section to start managing your farming business
          </p>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`
                bg-white rounded-xl shadow-lg overflow-hidden
                border-2 ${section.borderColor}
                hover:shadow-2xl transition-all duration-300
                transform hover:-translate-y-1
              `}
            >
              {/* Section Header with Background */}
              <div
                className={`
                  bg-gradient-to-r ${section.color}
                  ${section.hoverColor}
                  text-white p-8 text-center
                  transition-all duration-300
                `}
              >
                <div className="text-6xl mb-3">{section.icon}</div>
                <h3 className="text-2xl font-bold">{section.title}</h3>
              </div>

              {/* Section Content */}
              <div className="p-6">
                {/* Description */}
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  {section.description}
                </p>

                {/* Features List */}
                <div className={`${section.lightColor} rounded-lg p-4 mb-6`}>
                  <p className={`${section.textColor} text-xs font-semibold mb-3`}>
                    Key Features:
                  </p>
                  <ul className="space-y-2">
                    {section.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span className="text-lg">{feature.split(' ')[0]}</span>
                        <span>{feature.substring(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleNavigate(section.path)}
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold
                    text-white bg-gradient-to-r ${section.color}
                    ${section.hoverColor}
                    transition-all duration-300
                    transform hover:scale-105
                    active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${section.color === 'from-green-500 to-green-600'
                      ? 'focus:ring-green-500'
                      : section.color === 'from-blue-500 to-blue-600'
                      ? 'focus:ring-blue-500'
                      : section.color === 'from-purple-500 to-purple-600'
                      ? 'focus:ring-purple-500'
                      : 'focus:ring-orange-500'
                    }
                  `}
                >
                  {section.actionText} →
                </button>
              </div>

              {/* Footer badge */}
              <div className={`${section.lightColor} px-6 py-3 text-center`}>
                <span className={`${section.textColor} text-xs font-semibold`}>
                  ✓ Available
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">
            💡 How FarmEazy Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">🌱</div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Farms</h4>
                <p className="text-sm text-gray-700">
                  Manage your farming operations efficiently with real-time monitoring of crops and irrigation.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Sell Smart</h4>
                <p className="text-sm text-gray-700">
                  List your products and reach customers directly. Build your brand and grow your business.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🪙</div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Earn Coins</h4>
                <p className="text-sm text-gray-700">
                  Every purchase earns coins! Use them for discounts, free shipping, or special offers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <button
              className="text-green-600 hover:text-green-700 font-semibold"
              onClick={() => setShowSupport(true)}
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Contact Support</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowSupport(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Phone Support</p>
                <p className="text-lg font-semibold text-gray-800">6301630368</p>
                <a
                  href="tel:6301630368"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📞 Call Now
                </a>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Email Support</p>
                <div className="space-y-2">
                  <a
                    href="mailto:kranthijambuluri@gmail.com"
                    className="block text-blue-700 font-semibold hover:underline"
                  >
                    kranthijambuluri@gmail.com
                  </a>
                  <a
                    href="mailto:kranthir520@gmail.com"
                    className="block text-blue-700 font-semibold hover:underline"
                  >
                    kranthir520@gmail.com
                  </a>
                </div>
              </div>
              <p className="text-xs text-gray-500">Support available 9 AM - 6 PM IST</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
