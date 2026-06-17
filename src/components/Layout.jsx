/**
 * Layout Component
 * 
 * Main layout with:
 * - Header with FarmEazy branding
 * - Navigation menu
 * - User profile menu
 * - Logout functionality with AuthContext
 * - Page content outlet
 * - Professional session management
 */

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import NotificationCenter, { sendNotification } from './NotificationCenter';
import DarkModeToggle from './DarkModeToggle';
import ChatSupport from './ChatSupport';
// Add prop for triggering onboarding tour
// ...existing code...
import AuthService from '../services/AuthService'
import apiClient from '../services/apiClient'
import useSessionTimeout from '../hooks/useSessionTimeout'
import InactivityWarning from './InactivityWarning'
import { useToast } from '../hooks/useToast'
import Toast from './Toast'
import { useCoin } from '../context/CoinContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { buildSupportPortalUrl, prepareSupportPortalHandoff } from '../utils/supportPortal'
import AppOpenLocationModal from './AppOpenLocationModal'

function Layout({ onShowTour, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark } = useTheme()

  const scrollToTopPage = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    })
  }

  useEffect(() => {
    scrollToTopPage()
  }, [location.pathname])
  const { logout: authLogout, getUserEmail, getUserName, isAdmin, hasRole, isAuthenticated } = useAuth()
  const [selectedLocationLabel, setSelectedLocationLabel] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { coins, refreshCoins } = useCoin()
  const [coinsLoading, setCoinsLoading] = useState(false)
  const [sessionCoinsEarned, setSessionCoinsEarned] = useState(0)
  const [showSessionCoinBonus, setShowSessionCoinBonus] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [vendorUnlocked, setVendorUnlocked] = useState(false)
  const [showNavLeftFade, setShowNavLeftFade] = useState(false)
  const [showNavRightFade, setShowNavRightFade] = useState(false)
  const hasFetchedCoinsRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const userMenuWrapperRef = useRef(null)
  const navScrollRef = useRef(null)
  // Use AuthContext for user info instead of direct localStorage
  const userEmail = getUserEmail()
  const userUsername = localStorage.getItem('farmEazy_username') || getUserName()
  const userId = localStorage.getItem('farmEazy_userId')
  // Format user ID as 5-digit display (e.g., 00001, 00123)
  const userDisplayId = userId ? String(userId).padStart(5, '0') : '-----'
  const { toast, showToast, closeToast } = useToast()

  const openLocationSelector = () => {
    window.dispatchEvent(new CustomEvent('farmeazy:open-location-modal'))
  }

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
  // Read selected location from storage and listen for changes
  useEffect(() => {
    const readSelection = () => {
      try {
        const sel = localStorage.getItem('farmeazy_selected_location')
        if (!sel) { setSelectedLocationLabel(null); return }
        const parsed = JSON.parse(sel)
        if (parsed) {
          if (parsed.type === 'coords') setSelectedLocationLabel(`${parsed.latitude.toFixed ? parsed.latitude.toFixed(3) : parsed.latitude}, ${parsed.longitude.toFixed ? parsed.longitude.toFixed(3) : parsed.longitude}`)
          else if (parsed.label) setSelectedLocationLabel(parsed.label)
          else if (parsed.id) setSelectedLocationLabel(`Address #${parsed.id}`)
        }
      } catch { setSelectedLocationLabel(null) }
    }
    readSelection()
    const onChange = () => { readSelection() }
    window.addEventListener('farmeazy:location-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('farmeazy:location-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  // Check if user is authenticated on mount
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) return

    const token = localStorage.getItem('farmEazy_token')
    const email = localStorage.getItem('farmEazy_email')

    if (!token || !email) {
      hasRedirectedRef.current = true
      // User data missing, redirect to login (no alert to avoid loop)
      sessionStorage.setItem('logoutReason', 'Session expired. Please login again.')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return

    const handleClickOutside = (event) => {
      if (userMenuWrapperRef.current && !userMenuWrapperRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])
  
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
          sendNotification(`+${earned} coins daily login bonus!`, 'success', '🪙')
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

  useEffect(() => {
    const detectVendorAccess = async () => {
      const token = localStorage.getItem('farmEazy_token')
      const email = localStorage.getItem('farmEazy_email')
      if (!token || !email) {
        setVendorUnlocked(false)
        return
      }

      try {
          const eligibilityResp = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', {
            validateStatus: (status) => status < 500,
          })
          setVendorUnlocked(Boolean(eligibilityResp?.data?.eligible) && eligibilityResp.status === 200)
      } catch (_error) {
        setVendorUnlocked(false)
      }
    }

    if (isAuthenticated) {
      detectVendorAccess()
    }
  }, [isAuthenticated])

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
    // Use AuthContext logout for proper session cleanup
    authLogout('user')
    navigate('/login')
  }
  
  const handleStayOnline = () => {
    resetTimer()
  }

  // Determine timer color based on remaining time
  const getTimerStatusColor = () => {
    if (timeRemaining <= 120) {
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
    { name: 'Support', path: '/support' },
  ]

  if (isAuthenticated) {
    menuItems.splice(7, 0, { name: 'Vendor', path: '/vendor-dashboard' })
  }

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const hasAdminAccess =
    (typeof isAdmin === 'function' && isAdmin()) ||
    (typeof hasRole === 'function' && (hasRole('ADMIN') || hasRole('ROLE_ADMIN') || hasRole('SUPERADMIN') || hasRole('ROLE_SUPERADMIN')))

  const openSupportPortal = (portalPath, modeOverride) => {
    const adminContext = location.pathname.startsWith('/admin/')
    const preferredMode = modeOverride || (adminContext ? 'admin' : 'user')
    const mode = preferredMode === 'admin' && hasAdminAccess ? 'admin' : 'user'
    const targetPath = portalPath || (mode === 'admin' ? '/dashboard' : '/user/dashboard')

    const handoffReady = prepareSupportPortalHandoff({ mode, redirect: targetPath, theme: isDark ? 'dark' : 'light' })
    if (!handoffReady) {
      navigate('/login')
      return
    }
    const url = buildSupportPortalUrl({ portalPath: targetPath, mode, redirect: targetPath, theme: isDark ? 'dark' : 'light' })
    if (url) {
      window.location.assign(url)
      return
    }
    navigate('/login')
  }

  useEffect(() => {
    const updateNavFade = () => {
      const node = navScrollRef.current
      if (!node) return

      const { scrollLeft, scrollWidth, clientWidth } = node
      const hasOverflow = scrollWidth > clientWidth + 2
      if (!hasOverflow) {
        setShowNavLeftFade(false)
        setShowNavRightFade(false)
        return
      }

      setShowNavLeftFade(scrollLeft > 4)
      setShowNavRightFade(scrollLeft + clientWidth < scrollWidth - 4)
    }

    updateNavFade()

    const node = navScrollRef.current
    if (node) {
      node.addEventListener('scroll', updateNavFade, { passive: true })
    }
    window.addEventListener('resize', updateNavFade)

    return () => {
      if (node) {
        node.removeEventListener('scroll', updateNavFade)
      }
      window.removeEventListener('resize', updateNavFade)
    }
  }, [menuItems.length, location.pathname])
  
  // Irrigation sub-menu items (for future dropdown)
  const irrigationSubItems = [
    { name: 'Schedules', path: '/irrigation' },
    { name: 'Sensors', path: '/irrigation-sensors' },
  ]

  const getLayoutVariant = (pathname) => {
    if (pathname.startsWith('/admin')) return 'theme-command'
    if (pathname.startsWith('/dashboard')) return 'theme-analytics'
    if (pathname.startsWith('/irrigation')) return 'theme-cyber'
    if (pathname.startsWith('/buying') || pathname.startsWith('/cart') || pathname.startsWith('/checkout') || pathname.startsWith('/product')) return 'theme-glass'
    if (pathname.startsWith('/selling') || pathname.startsWith('/vendor')) return 'theme-neumorph'
    if (pathname.startsWith('/farms') || pathname.startsWith('/crops')) return 'theme-bento'
    if (pathname.startsWith('/orders') || pathname.startsWith('/activities') || pathname.startsWith('/notifications')) return 'theme-table'
    if (pathname.startsWith('/services') || pathname.startsWith('/blog')) return 'theme-immersive'
    return 'theme-motion'
  }

  const layoutVariant = getLayoutVariant(location.pathname)

  return (
    <div className={`premium-shell layout-variant ${layoutVariant} min-h-screen relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'}`}>
      <div className={`pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-700/25' : 'bg-emerald-300/45'}`} />
      <div className={`pointer-events-none absolute top-16 -right-20 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-cyan-700/20' : 'bg-cyan-200/55'}`} />
      <div className={`pointer-events-none absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-[0.06]'}`} style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: '30px 30px',
      }} />

      <div className="relative z-10 min-h-screen flex flex-col">
      {/* Toast Notification - Fixed bottom-right positioning */}
      {toast && (
        <div className="fixed bottom-6 left-2 right-2 sm:left-auto sm:right-6 z-[100] flex justify-end">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        </div>
      )}

      {/* Inactivity Warning Modal */}
      <InactivityWarning 
        showWarning={showWarning} 
        timeRemaining={timeRemaining} 
        onStayOnline={handleStayOnline}
      />
      
      {/* Modern Header with Gradient */}
      <header className="sticky top-0 z-50">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"></div>
        {/* Animated Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        
        <div className="relative container-main">
          <div className="flex justify-between items-center py-3 gap-3">
            {/* Logo Section */}
            <Link to="/" className="flex items-center space-x-3 group shrink-0">
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
            <div className="hidden lg:block flex-1 min-w-0 relative">
              <nav
                ref={navScrollRef}
                className="flex items-center justify-start min-w-0 bg-white/10 backdrop-blur-md rounded-full px-2 py-1 border border-white/20 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {menuItems.map((item, index) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-tour={`nav-${item.name.toLowerCase()}`}
                    aria-current={isActivePath(item.path) ? 'page' : undefined}
                    className={`relative shrink-0 px-3 py-2 font-medium text-sm transition-all duration-300 rounded-full whitespace-nowrap ${isActivePath(item.path) ? 'text-white bg-white/30 shadow-inner ring-1 ring-white/40' : 'text-white/90 hover:text-white hover:bg-white/20'}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {showNavLeftFade && (
                <div className="pointer-events-none absolute left-1 top-1 bottom-1 w-8 rounded-l-full bg-gradient-to-r from-emerald-700/95 to-transparent" />
              )}
              {showNavRightFade && (
                <div className="pointer-events-none absolute right-1 top-1 bottom-1 w-8 rounded-r-full bg-gradient-to-l from-cyan-700/95 to-transparent" />
              )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Tour Button - Compact */}
              <button
                data-tour="tour-button"
                className="hidden sm:flex items-center gap-1 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all border border-white/20"
                onClick={onShowTour}
                aria-label="Show onboarding tour"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tour</span>
              </button>

              <button
                onClick={openLocationSelector}
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
                title={selectedLocationLabel ? `Current location: ${selectedLocationLabel}` : 'Select location'}
              >
                <span>📍</span>
                <span className="max-w-[10rem] truncate">{selectedLocationLabel || 'Set location'}</span>
              </button>

              {/* Notification Bell - API-based */}
              <NotificationBell />

              {/* Shopping Cart - Floating Badge */}
              <button
                data-tour="cart-button"
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
                timeRemaining <= 120 ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 
                timeRemaining <= 300 ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/30' : 
                'bg-white/15 text-white border border-white/20'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">{formatTimeDisplay(timeRemaining)}</span>
              </div>

              {/* User Profile - Avatar Style */}
              <div ref={userMenuWrapperRef} className="relative">
                <button
                  data-tour="profile-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full transition-all border border-white/20"
                >
                  {selectedLocationLabel && (
                    <div className="hidden sm:flex items-center mr-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">{selectedLocationLabel}</div>
                  )}
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {(userUsername || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-mono font-semibold text-white">#{userDisplayId}</span>
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Modern User Dropdown */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-3 w-[min(18rem,calc(100vw-1rem))] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-[100] max-h-[80vh] overflow-y-auto custom-scrollbar`} style={{ top: '100%' }}>
                    {/* User Info Header */}
                    <div className="px-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-500">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {(userUsername || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">@{userUsername || 'User'}</p>
                          <p className="text-xs text-white/70 font-mono">ID: #{userId ? String(userId).padStart(5, '0') : '-----'}</p>
                          <p className="text-xs text-white/60 truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className={`flex items-center justify-around py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-400">🪙 {coins?.totalCoins || 0}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Coins</div>
                      </div>
                      <div className={`w-px h-8 ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">🛒 {cartCount}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>In Cart</div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/address-book')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-cyan-900/50' : 'bg-cyan-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🏠</span>
                        <div>
                          <span className="font-medium block">Manage Addresses</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>View, edit, delete, and add addresses</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/user/contact')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>✉️</span>
                        <div>
                          <span className="font-medium block">Contact Details</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Update email and phone</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/change-password')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🔐</span>
                        <div>
                          <span className="font-medium block">Change Password</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Update your security</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/orders')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>📦</span>
                        <div>
                          <span className="font-medium block">My Orders</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Track your purchases</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          openSupportPortal()
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-green-900/50' : 'bg-green-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>💬</span>
                        <div>
                          <span className="font-medium block">Support</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Get help anytime</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/service-requests')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-cyan-900/50' : 'bg-cyan-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>📝</span>
                        <div>
                          <span className="font-medium block">Service Requests</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage your requests</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/bank-verification')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-teal-900/50' : 'bg-teal-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🏦</span>
                        <div>
                          <span className="font-medium block">Bank Verification</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Verify bank details</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/activities')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-amber-900/50' : 'bg-amber-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>📜</span>
                        <div>
                          <span className="font-medium block">My Activities</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>View recent actions</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/communication-preferences')
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>📬</span>
                        <div>
                          <span className="font-medium block">Communication</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Email & SMS preferences</span>
                        </div>
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            navigate('/vendor-dashboard')
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                        >
                          <span className={`w-9 h-9 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🏪</span>
                          <div>
                            <span className="font-medium block">Vendor Dashboard</span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage sales and services</span>
                          </div>
                        </button>
                      )}
                      {/* Admin Menu - Only visible for ADMIN role */}
                      {isAdmin() && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            navigate('/admin/notifications')
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                        >
                          <span className={`w-9 h-9 ${isDark ? 'bg-rose-900/50' : 'bg-rose-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🔔</span>
                          <div>
                            <span className="font-medium block">Admin Notifications</span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Send broadcasts & alerts</span>
                          </div>
                        </button>
                      )}
                      {isAdmin() && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            openSupportPortal('/access-control', 'admin')
                          }}
                          className={`w-full text-left mt-2 px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                        >
                          <span className={`w-9 h-9 ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🛠️</span>
                          <div>
                            <span className="font-medium block">Access Control</span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage roles in Support Portal</span>
                          </div>
                        </button>
                      )}
                      {isAdmin() && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            navigate('/admin/blog-posts')
                          }}
                          className={`w-full text-left mt-2 px-4 py-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3 group`}
                        >
                          <span className={`w-9 h-9 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>📝</span>
                          <div>
                            <span className="font-medium block">Blog Management</span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Create and publish posts</span>
                          </div>
                        </button>
                      )}
                    </div>
                    
                    {/* Logout Button */}
                    <div className={`p-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-3 rounded-xl text-red-400 ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} transition-colors flex items-center gap-3 group`}
                      >
                        <span className={`w-9 h-9 ${isDark ? 'bg-red-900/50' : 'bg-red-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>🚪</span>
                        <div>
                          <span className="font-medium block">Logout</span>
                          <span className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-400'}`}>End your session</span>
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

      {/* App-open location prompt */}
      <AppOpenLocationModal />

      {/* Inactivity Warning Modal - Remove from here */}

      {/* Mobile Navigation - Slide Down */}
      <div className="xl:hidden bg-gradient-to-r from-emerald-700 to-teal-700 border-b border-white/10">
        <div className="container-main py-2">
          <nav className="flex flex-wrap gap-2 pb-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-tour={`nav-${item.name.toLowerCase()}`}
                aria-current={isActivePath(item.path) ? 'page' : undefined}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActivePath(item.path) ? 'text-white bg-white/30 ring-1 ring-white/40' : 'text-white/90 hover:text-white hover:bg-white/20'}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container-main py-4 md:py-5">
        <div className={`variant-surface content-dense ${layoutVariant} rounded-2xl shadow-xl transition-all duration-500 ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'} border p-4 md:p-6 lg:p-7 min-h-auto animate-[fadeIn_.45s_ease-out]`}>
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'} border-t mt-4 shadow-inner backdrop-blur-md`}>
        <div className="container-main py-8">
          <div className="flex justify-between items-center">
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-sm`}>
                © 2026 FarmEazy. Smart Farm Management.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>About</Link>
                <Link to="/privacy-policy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>Privacy Policy</Link>
                <Link to="/terms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>Terms & Conditions</Link>
                <Link to="/refund-policy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>Refund Policy</Link>
                <Link to="/shipping-policy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>Shipping Policy</Link>
                <Link to="/marketplace-disclosure" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>Marketplace Disclosure</Link>
                <Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} text-sm underline`}>Contact Us</Link>
              </div>
          </div>
        </div>
      </footer>

      <DarkModeToggle floating />
      <ChatSupport />
      </div>
    </div>
  )
}

export default Layout
