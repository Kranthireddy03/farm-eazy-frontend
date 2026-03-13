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

/**
 * Root App Component
 * 
 * Sets up the routing structure for the entire application:
 * - Public routes: Login, Register
 * - Protected routes: Dashboard, Farms, Crops, Irrigation
 * - Redirect unauthenticated users to login
 * - Professional session management with AuthContext
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AuthService from './services/AuthService'
import { CoinProvider } from './context/CoinContext';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import SessionWarningModal from './components/SessionWarningModal';
import './i18n';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import DarkModeToggle from './components/DarkModeToggle';
const UserPreferences = lazy(() => import('./pages/UserPreferences'));
const CommunicationPreferences = lazy(() => import('./pages/CommunicationPreferences'));
import OnboardingTour from './components/OnboardingTour';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const RedirectReset = lazy(() => import('./pages/RedirectReset'));
const EmailError = lazy(() => import('./pages/EmailError'));
const Home = lazy(() => import('./pages/Home'));
const LandingHome = lazy(() => import('./pages/LandingHome'));
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
const RefundDetails = lazy(() => import('./pages/RefundDetails'));
const Support = lazy(() => import('./pages/Support'));
const IrrigationServices = lazy(() => import('./pages/IrrigationServices'));
const Activities = lazy(() => import('./pages/Activities'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Services = lazy(() => import('./pages/Services'));
const Blog = lazy(() => import('./pages/Blog'));
const ServiceRequests = lazy(() => import('./pages/ServiceRequests'));
const ServiceRequestDetail = lazy(() => import('./pages/ServiceRequestDetail'));
const BankVerification = lazy(() => import('./pages/BankVerification'));
const IrrigationSensorDashboard = lazy(() => import('./pages/IrrigationSensorDashboard'));
const SessionExpired = lazy(() => import('./pages/SessionExpired'));

/**
 * ProtectedRoute Component
 * Uses AuthContext for consistent session management
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * AppContent Component
 * Main app content that uses auth context
 */
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check for onboarding on auth state change
  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('onboardingComplete')) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner">
          <svg
            className="w-10 h-10 text-green-600 animate-spin"
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
    );
  }

  return (
    <>
      {/* Session Warning Modal */}
      <SessionWarningModal />
      
      {/* Floating Theme Toggle - Always visible on all pages */}
      <DarkModeToggle floating />
      
      {showOnboarding && (
        <OnboardingTour onFinish={() => {
          setShowOnboarding(false);
          localStorage.setItem('onboardingComplete', 'true');
        }} />
      )}
      
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900">Loading page...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Home /> : <LandingHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/r/:shortCode" element={<RedirectReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-error" element={<EmailError />} />
          <Route path="/session-expired" element={<SessionExpired />} />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout onShowTour={() => setShowOnboarding(true)} />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardEnhanced />} />
            <Route path="/settings" element={<ProtectedRoute><UserPreferences /></ProtectedRoute>} />
            <Route path="/communication-preferences" element={<CommunicationPreferences />} />
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
            <Route path="/refund-details" element={<RefundDetails />} />
            <Route path="/support" element={<Support />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/service-requests" element={<ServiceRequests />} />
            <Route path="/service-requests/:requestNumber" element={<ServiceRequestDetail />} />
            <Route path="/bank-verification" element={<BankVerification />} />
            <Route path="/irrigation-sensors" element={<IrrigationSensorDashboard />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

/**
 * App Component
 * Main routing configuration with all providers
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <LoaderProvider>
            <CoinProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </CoinProvider>
          </LoaderProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App
