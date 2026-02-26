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
import { useRef, useState, useEffect } from 'react';
// Add prop for triggering onboarding tour
// ...existing code...
import AuthService from '../services/AuthService'
import apiClient from '../services/apiClient'
import useSessionTimeout from '../hooks/useSessionTimeout'
import InactivityWarning from './InactivityWarning'
import { useToast } from '../hooks/useToast'
import Toast from './Toast'
import { useCoin } from '../context/CoinContext'

function Layout({ onShowTour }) {
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { coins, refreshCoins } = useCoin()
  const [coinsLoading, setCoinsLoading] = useState(false)
  const [sessionCoinsEarned, setSessionCoinsEarned] = useState(0)
  const [showSessionCoinBonus, setShowSessionCoinBonus] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const hasFetchedCoinsRef = useRef(false)
  const userEmail = AuthService.getUserEmail()
  const userUsername = localStorage.getItem('farmEazy_username')
  const userFullName = localStorage.getItem('farmEazy_fullName')
  const { toast, showToast, closeToast } = useToast()

  // Refresh coins manually
  const handleRefreshCoins = async () => {
    setCoinsLoading(true)
    try {
      await refreshCoins()
      showToast('Coins refreshed successfully!', 'success')
    } catch (error) {
      console.error('Error refreshing coins:', error)
      showToast('Failed to refresh coins', 'error')
    } finally {
      setCoinsLoading(false)
    }
  }

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
      const email = localStorage.getItem('farmEazy_email')
      if (!token || !email) {
        console.log('No valid session, skipping coin fetch');
        setCoinsLoading(false)
        return
      }

      try {
        // Process login bonus (gives coins if eligible)
        const response = await apiClient.post('/coins/login-bonus')

        // Refresh coins from context to get updated balance
        await refreshCoins()

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
        // Fallback: just refresh coins from context
        try {
          await refreshCoins()
        } catch (err) {
          console.error('Error fetching coins:', err)
        }
      } finally {
        setCoinsLoading(false)
      }
    }

    fetchCoinsAndLoginBonus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Farms', path: '/farms' },
    { name: 'Crops', path: '/crops' },
    { name: 'Irrigation', path: '/irrigation' },
    { name: 'Services', path: '/irrigation-services' },
    { name: 'Shopping', path: '/buying' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
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
      
      {/* Modern Header with Gradient */}
      <header className="relative z-50">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"></div>
        {/* Animated Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        
        <div className="relative container-main">
          <div className="flex justify-between items-center py-3">
            {/* Logo Section */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl">🌾</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">FarmEazy</span>
                <span className="block text-xs text-white/70 font-medium -mt-1">Smart Farm Management</span>
              </div>
            </Link>

            {/* Center Navigation - Glass Morphism Pills */}
            <nav className="hidden lg:flex items-center bg-white/10 backdrop-blur-md rounded-full px-2 py-1 border border-white/20">
              {menuItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 text-white/90 hover:text-white font-medium text-sm transition-all duration-300 rounded-full hover:bg-white/20"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              {/* Tour Button - Compact */}
              <button
                className="hidden sm:flex items-center gap-1 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all border border-white/20"
                onClick={onShowTour}
                aria-label="Show onboarding tour"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tour</span>
              </button>

              {/* Shopping Cart - Floating Badge */}
              <button
                onClick={() => navigate('/cart')}
                className="relative w-10 h-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 rounded-full transition-all shadow-lg shadow-orange-500/30"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Coins Display - Compact Golden Card */}
              {!coinsLoading && coins && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg shadow-yellow-500/30">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-bold text-amber-900">{coins.totalCoins}</span>
                  <button
                    onClick={handleRefreshCoins}
                    className="text-amber-800 hover:text-amber-950 transition-transform hover:rotate-180 duration-500"
                    title="Refresh coins"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Session Timer - Pill Style */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs transition-colors ${
                timeRemaining <= 90 ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 
                timeRemaining <= 300 ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/30' : 
                'bg-white/15 text-white border border-white/20'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">{formatTimeDisplay(timeRemaining)}</span>
              </div>

              {/* User Profile - Avatar Style */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full transition-all border border-white/20"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {(userFullName || userUsername || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <span className="text-xs text-white/70 block leading-tight">@{userUsername || 'user'}</span>
                    <span className="text-sm font-medium text-white leading-tight">{userFullName?.split(' ')[0] || 'User'}</span>
                  </div>
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Modern User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-72 bg-slate-800 border border-slate-700 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden" style={{top: '100%'}}>
                    {/* User Info Header */}
                    <div className="px-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-500">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {(userFullName || userUsername || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{userFullName || 'User'}</p>
                          <p className="text-sm text-white/80">@{userUsername || 'user'}</p>
                          <p className="text-xs text-white/60 truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center justify-around py-3 border-b border-slate-700">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-400">🪙 {coins?.totalCoins || 0}</div>
                        <div className="text-xs text-slate-400">Coins</div>
                      </div>
                      <div className="w-px h-8 bg-slate-600"></div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">🛒 {cartCount}</div>
                        <div className="text-xs text-slate-400">In Cart</div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/change-password')
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3 group"
                      >
                        <span className="w-9 h-9 bg-blue-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">🔐</span>
                        <div>
                          <span className="font-medium block">Change Password</span>
                          <span className="text-xs text-slate-400">Update your security</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/orders')
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3 group"
                      >
                        <span className="w-9 h-9 bg-purple-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">📦</span>
                        <div>
                          <span className="font-medium block">My Orders</span>
                          <span className="text-xs text-slate-400">Track your purchases</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/support')
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3 group"
                      >
                        <span className="w-9 h-9 bg-green-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">💬</span>
                        <div>
                          <span className="font-medium block">Support</span>
                          <span className="text-xs text-slate-400">Get help anytime</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/activities')
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3 group"
                      >
                        <span className="w-9 h-9 bg-amber-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">📜</span>
                        <div>
                          <span className="font-medium block">My Activities</span>
                          <span className="text-xs text-slate-400">View recent actions</span>
                        </div>
                      </button>
                    </div>
                    
                    {/* Logout Button */}
                    <div className="p-2 border-t border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/30 transition-colors flex items-center gap-3 group"
                      >
                        <span className="w-9 h-9 bg-red-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">🚪</span>
                        <div>
                          <span className="font-medium block">Logout</span>
                          <span className="text-xs text-red-400/70">End your session</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Inactivity Warning Modal - Remove from here */}

      {/* Mobile Navigation - Slide Down */}
      <div className="lg:hidden bg-gradient-to-r from-emerald-700 to-teal-700 border-b border-white/10">
        <div className="container-main py-2">
          <nav className="flex flex-wrap gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-full text-sm font-medium transition-all"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-main py-8">
        <div className="rounded-2xl shadow-xl bg-slate-800/90 border border-slate-700 p-6 md:p-10 min-h-[60vh]">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/90 border-t border-slate-700 mt-12 shadow-inner backdrop-blur-md">
        <div className="container-main py-8">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2024 FarmEazy. Smart Farm Management.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-slate-400 text-sm">
                Contact: support@farmeazy.com
              </p>
              <a href="https://instagram.com/kranthireddy0309" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 hover:text-pink-400">
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
