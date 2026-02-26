import { useTranslation } from 'react-i18next';
// Global Language Switcher
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
      <button className="btn btn-sm mr-2" onClick={() => setLang('en')}>English</button>
      <button className="btn btn-sm mr-2" onClick={() => setLang('hi')}>हिन्दी</button>
      <button className="btn btn-sm" onClick={() => setLang('te')}>తెలుగు</button>
    </div>
  );
}
import React from 'react';

// Global Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service if needed
    // console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
          <h1 className="text-3xl font-bold text-red-700 mb-4">Something went wrong</h1>
          <p className="text-red-600 mb-2">An unexpected error occurred. Please try refreshing the page.</p>
          <details className="text-xs text-gray-500 whitespace-pre-wrap max-w-xl mx-auto">
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
import NotificationCenter from './components/NotificationCenter';
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
import { CoinProvider } from './context/CoinContext';
import { LoaderProvider } from './context/LoaderContext';
import './i18n';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
const UserPreferences = lazy(() => import('./pages/UserPreferences'));
import OnboardingTour from './components/OnboardingTour';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const RedirectReset = lazy(() => import('./pages/RedirectReset'));
const EmailError = lazy(() => import('./pages/EmailError'));
const Home = lazy(() => import('./pages/Home'));
const DashboardEnhanced = lazy(() => import('./pages/DashboardEnhanced'));
const Farms = lazy(() => import('./pages/Farms'));
const FarmDetail = lazy(() => import('./pages/FarmDetail'));
const Crops = lazy(() => import('./pages/Crops'));
const IrrigationSchedules = lazy(() => import('./pages/IrrigationSchedules'));
const Selling = lazy(() => import('./pages/Selling'));
const Buying = lazy(() => import('./pages/Buying'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Support = lazy(() => import('./pages/Support'));
const IrrigationServices = lazy(() => import('./pages/IrrigationServices'));
const Activities = lazy(() => import('./pages/Activities'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Services = lazy(() => import('./pages/Services'));
const Blog = lazy(() => import('./pages/Blog'));

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
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user is logged in on app load
  useEffect(() => {
    const loggedIn = AuthService.isLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn && !localStorage.getItem('onboardingComplete')) {
      setShowOnboarding(true);
    }
    setLoading(false);
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
    <ErrorBoundary>
      <LoaderProvider>
        <CoinProvider>
          <NotificationCenter />
          <LanguageSwitcher />
          {showOnboarding && (
            <OnboardingTour onFinish={() => {
              setShowOnboarding(false);
              localStorage.setItem('onboardingComplete', 'true');
            }} />
          )}
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500">Loading page...</div>}>
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
                    <Layout onShowTour={() => setShowOnboarding(true)} />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/settings" element={<ProtectedRoute><UserPreferences /></ProtectedRoute>} />
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
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/blog" element={<Blog />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </CoinProvider>
      </LoaderProvider>
    </ErrorBoundary>
  )
}

export default App
