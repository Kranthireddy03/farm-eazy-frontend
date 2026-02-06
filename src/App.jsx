/**
 * Root App Component
 * 
 * Sets up the routing structure for the entire application:
 * - Public routes: Login, Register
 * - Protected routes: Dashboard, Farms, Crops, Irrigation
 * - Redirect unauthenticated users to login
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AuthService from './services/AuthService'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import RedirectReset from './pages/RedirectReset'
import EmailError from './pages/EmailError'
import Home from './pages/Home'
import DashboardEnhanced from './pages/DashboardEnhanced'
import Farms from './pages/Farms'
import FarmDetail from './pages/FarmDetail'
import Crops from './pages/Crops'
import IrrigationSchedules from './pages/IrrigationSchedules'
import Selling from './pages/Selling'
import Buying from './pages/Buying'
import Cart from './pages/Cart'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import ChangePassword from './pages/ChangePassword'
import Orders from './pages/Orders'
import OrderConfirmation from './pages/OrderConfirmation'
import Support from './pages/Support'
import IrrigationServices from './pages/IrrigationServices'
import Activities from './pages/Activities'
import Layout from './components/Layout'

/**
 * ProtectedRoute Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const isLoggedIn = AuthService.isLoggedIn()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

/**
 * App Component
 * Main routing configuration
 */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on app load
  useEffect(() => {
    setIsLoggedIn(AuthService.isLoggedIn())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <CoinProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
      <Route path="/register" element={<Register onRegisterSuccess={() => setIsLoggedIn(true)} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/r/:shortCode" element={<RedirectReset />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-error" element={<EmailError />} />

      {/* Protected Routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashboardEnhanced />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/farms/:farmId" element={<FarmDetail />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/irrigation" element={<IrrigationSchedules />} />
        <Route path="/irrigation-services" element={<IrrigationServices />} />
        <Route path="/selling" element={<Selling />} />
        <Route path="/buying" element={<Buying />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/support" element={<Support />} />
        <Route path="/activities" element={<Activities />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CoinProvider>
  )
}

export default App
