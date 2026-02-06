/**
 * Layout Component
 * 
 * Main layout with:
 * - Header with FarmEazy branding
 * - Navigation menu
 * - User profile menu
 * - Logout functionality
 * - Page content outlet
 */

import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import AuthService from '../services/AuthService'
import apiClient from '../services/apiClient'
import useSessionTimeout from '../hooks/useSessionTimeout'
import InactivityWarning from './InactivityWarning'
import { useToast } from '../hooks/useToast'
import Toast from './Toast'

function Layout() {
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [coins, setCoins] = useState(null)
  const [coinsLoading, setCoinsLoading] = useState(true)
  const [sessionCoinsEarned, setSessionCoinsEarned] = useState(0)
  const [showSessionCoinBonus, setShowSessionCoinBonus] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const hasFetchedCoinsRef = useRef(false)
  const userEmail = AuthService.getUserEmail()
  const userUsername = localStorage.getItem('farmEazy_username')
  const userFullName = localStorage.getItem('farmEazy_fullName')
  const { toast, showToast, closeToast } = useToast()
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('farmEazy_token')
    const email = localStorage.getItem('farmEazy_email')
    
    if (!token || !email) {
      // User data missing, redirect to login
      alert('Session expired. Please login again.')
      navigate('/login')
    }
  }, [navigate])
  
  // Session timeout hook
  // Total session: 15 minutes (900 seconds) with MM:SS countdown display
  const { timeRemaining, showWarning, resetTimer, formatTimeDisplay } = useSessionTimeout()

  // Fetch user coins and process login bonus
  useEffect(() => {
    const fetchCoinsAndLoginBonus = async () => {
      if (hasFetchedCoinsRef.current) return
      hasFetchedCoinsRef.current = true

      const token = localStorage.getItem('farmEazy_token')
      if (!token) {
        setCoinsLoading(false)
        return
      }

      try {
        // Process login bonus (gives coins if eligible)
        const response = await apiClient.post('/coins/login-bonus')
        setCoins(response.data)
        
        // Show notification if coins were earned
        const lastLoginBonus = localStorage.getItem('lastLoginBonusDate')
        const today = new Date().toDateString()
        
        if (lastLoginBonus !== today && response.data.loginCountToday > 0) {
          const earned = 5
          setSessionCoinsEarned(earned)
          setShowSessionCoinBonus(true)
          showToast(`🪙 +${earned} coins! Daily login bonus earned`, 'success')
          localStorage.setItem('lastLoginBonusDate', today)
          // Hide session coin bonus after 5 seconds
          setTimeout(() => {
            setShowSessionCoinBonus(false)
          }, 5000)
        } else {
          setSessionCoinsEarned(0)
          setShowSessionCoinBonus(false)
        }
      } catch (error) {
        console.error('Error fetching coins:', error)
        // Fallback: just fetch coins without bonus
        try {
          const response = await apiClient.get('/coins')
          setCoins(response.data)
        } catch (err) {
          console.error('Error fetching coins:', err)
        }
      } finally {
        setCoinsLoading(false)
      }
    }

    fetchCoinsAndLoginBonus()
  }, [showToast])

  // Listen for 2-minute warning event
  useEffect(() => {
    const handleTimeWarning = (event) => {
      showToast(event.detail.message, 'warning')
    }
    
    window.addEventListener('session-time-warning', handleTimeWarning)
    
    return () => {
      window.removeEventListener('session-time-warning', handleTimeWarning)
    }
  }, [showToast])

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]')
      const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
      setCartCount(total)
    }

    // Initial load
    updateCartCount()

    // Listen for storage changes (when cart is updated)
    window.addEventListener('storage', updateCartCount)
    // Also listen for custom event from cart updates
    window.addEventListener('cart-updated', updateCartCount)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cart-updated', updateCartCount)
    }
  }, [])

  const handleLogout = () => {
    AuthService.logout()
    navigate('/login')
  }
  
  const handleStayOnline = () => {
    resetTimer()
  }

  // Determine timer color based on remaining time
  const getTimerStatusColor = () => {
    if (timeRemaining <= 90) {
      return 'text-red-600 bg-red-50 border-red-200'
    } else if (timeRemaining <= 300) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Farms', path: '/farms' },
    { name: 'Crops', path: '/crops' },
    { name: 'Irrigation', path: '/irrigation' },
    { name: 'Services', path: '/irrigation-services' },
    { name: 'Shopping', path: '/buying' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Inactivity Warning Modal */}
      <InactivityWarning 
        showWarning={showWarning} 
        timeRemaining={timeRemaining} 
        onStayOnline={handleStayOnline}
      />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container-main">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🌾</span>
              </div>
              <span className="text-2xl font-bold text-green-600">FarmEazy</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu & Session Timer */}
            <div className="relative flex items-center space-x-4">
              {/* Shopping Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                className="relative px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span className="text-lg">🛒</span>
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Coins Display */}
              {!coinsLoading && coins && (
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg border-2 border-yellow-300 text-center">
                  <div className="text-xs text-yellow-800 font-medium">Your Coins</div>
                  <div className="text-xl font-bold text-yellow-900 flex items-center justify-center gap-1">
                    <span>🪙</span>
                    <span>{coins.totalCoins}</span>
                  </div>
                  {sessionCoinsEarned > 0 && showSessionCoinBonus && (
                    <div className="text-xs text-green-700 mt-1">
                      +{sessionCoinsEarned} credited this session
                    </div>
                  )}
                  {coins.dailyLoginCoinsAvailable > 0 && (
                    <div className="text-xs text-yellow-700 mt-1">
                      +{coins.dailyLoginCoinsAvailable * 5} more today
                    </div>
                  )}
                </div>
              )}

              {/* Session Timer Display */}
              <div className={`px-4 py-2 rounded-lg border-2 text-center font-mono text-sm transition-colors ${getTimerStatusColor()}`}>
                <div className="text-xs opacity-75">Session</div>
                <div className="text-lg font-bold">{formatTimeDisplay(timeRemaining)}</div>
              </div>

              {/* User Email & Menu */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
              >
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">👤</span>
                </span>
                <div className="text-left">
                  <span className="text-xs text-gray-500 block">@{userUsername || 'user'}</span>
                  <span className="text-sm font-medium">{userFullName || userEmail}</span>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100" style={{top: '100%'}}>
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <p className="text-xs text-gray-500">Logged in as</p>
                    <p className="font-semibold text-gray-800">@{userUsername || 'user'}</p>
                    <p className="text-sm text-gray-600 truncate">{userEmail}</p>
                  </div>
                  <div className="px-2 py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/change-password')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <span>🔒</span>
                      <span>Change Password</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/orders')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <span>📦</span>
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/support')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <span>💬</span>
                      <span>Support</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/activities')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <span>📜</span>
                      <span>My Activities</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-2 pb-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Inactivity Warning Modal - Remove from here */}

      {/* Mobile Menu */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="container-main py-2">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-main py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container-main py-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2024 FarmEazy. Smart Farm Management.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-gray-600 text-sm">
                Contact: support@farmeazy.com
              </p>
              <a href="https://instagram.com/kranthireddy0309" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-600 hover:text-pink-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0a1 1 0 0 1 2 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
