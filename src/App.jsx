import React from 'react';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import MarketplaceDisclosure from './pages/MarketplaceDisclosure';
import RaiseTicket from './pages/RaiseTicket';
import LandingHome from './pages/LandingHome';
import PublicHome from './pages/PublicHome';
import AskQuestion from './pages/AskQuestion';
import PublicServices from './pages/PublicServices';

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

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'
import AuthService from './services/AuthService'
import { CoinProvider } from './context/CoinContext';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { buildSupportPortalUrl, prepareSupportPortalHandoff } from './utils/supportPortal';
import SessionWarningModal from './components/SessionWarningModal';
import './i18n';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
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
import OrderConfirmation from './pages/OrderConfirmation';
const RefundDetails = lazy(() => import('./pages/RefundDetails'));
const AddressBook = lazy(() => import('./pages/AddressBook'));
const Support = lazy(() => import('./pages/Support'));
const IrrigationServices = lazy(() => import('./pages/IrrigationServices'));
const Activities = lazy(() => import('./pages/Activities'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Services = lazy(() => import('./pages/Services'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const BlogSubmit = lazy(() => import('./pages/BlogSubmit'));
const MyBlogSubmissions = lazy(() => import('./pages/MyBlogSubmissions'));
const ServiceRequests = lazy(() => import('./pages/ServiceRequests'));
const ServiceRequestDetail = lazy(() => import('./pages/ServiceRequestDetail'));
const BankVerification = lazy(() => import('./pages/BankVerification'));
const IrrigationSensorDashboard = lazy(() => import('./pages/IrrigationSensorDashboard'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const SessionExpired = lazy(() => import('./pages/SessionExpired'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
// Admin support UI has been moved to a standalone admin-support portal.
// Import removed to decouple from main FarmEazy flow.
const AdminBlogManagement = lazy(() => import('./pages/admin/AdminBlogManagement'));
// user ticket pages removed; users should use /support page

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

function SupportPortalRedirect({
  portalPath = '/user/dashboard',
  adminPortalPath = '/dashboard',
  requireAdmin = false,
}) {
  const { isAuthenticated, isAdmin, hasRole } = useAuth();
  const location = useLocation();

  const hasAdminAccess =
    (typeof isAdmin === 'function' && isAdmin()) ||
    (typeof hasRole === 'function' && (hasRole('ADMIN') || hasRole('ROLE_ADMIN') || hasRole('SUPERADMIN') || hasRole('ROLE_SUPERADMIN')));

  const isAdminRouteContext = String(location?.pathname || '').startsWith('/admin/');
  const preferredMode = requireAdmin ? 'admin' : (isAdminRouteContext ? 'admin' : 'user');
  const mode = preferredMode === 'admin' && hasAdminAccess ? 'admin' : 'user';
  const targetPath = mode === 'admin' ? adminPortalPath : portalPath;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (requireAdmin && !hasAdminAccess) return;

    const handoffReady = prepareSupportPortalHandoff({ mode, redirect: targetPath });
    if (!handoffReady) return;
    const supportUrl = buildSupportPortalUrl({ portalPath: targetPath, mode, redirect: targetPath });
    if (supportUrl) {
      window.location.assign(supportUrl);
    }
  }, [adminPortalPath, hasAdminAccess, isAuthenticated, mode, portalPath, requireAdmin, targetPath]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !hasAdminAccess) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-700 dark:text-slate-300">Redirecting to Support Portal...</p>
      </div>
    </div>
  );
}

/**
 * AppContent Component
 * Main app content that uses auth context
 */
function AppContent() {
  const { isAuthenticated, isLoading, getUserId, getUserEmail } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const getOnboardingStorageKey = () => {
    const userId = getUserId?.();
    const email = getUserEmail?.();
    const identity = userId || email || 'anonymous';
    return `onboardingComplete_${identity}`;
  };

  const renderContextAwarePage = (PageComponent) => {
    if (isAuthenticated) {
      return (
        <ProtectedRoute>
          <Layout onShowTour={() => setShowOnboarding(true)}>
            <PageComponent />
          </Layout>
        </ProtectedRoute>
      );
    }

    return (
      <PublicLayout>
        <PageComponent />
      </PublicLayout>
    );
  };

  // Check for onboarding on auth state change
  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem(getOnboardingStorageKey())) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, getUserEmail, getUserId]);

  useEffect(() => {
    const openTour = () => setShowOnboarding(true);
    window.addEventListener('start-onboarding-tour', openTour);
    return () => window.removeEventListener('start-onboarding-tour', openTour);
  }, []);

  const handleOnboardingFinish = () => {
    localStorage.setItem(getOnboardingStorageKey(), 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner">
          <svg className="w-10 h-10 text-green-600 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900">Loading page...</div>}>
      <>
      <Routes>
        {/* Public landing page for unauthenticated users. Authenticated users get Home inside the main Layout */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <Layout onShowTour={() => setShowOnboarding(true)}>
                  <Home />
                </Layout>
              </ProtectedRoute>
            ) : (
              <PublicLayout>
                <LandingHome />
              </PublicLayout>
            )
          }
        />
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/r/:shortCode" element={<RedirectReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-error" element={<EmailError />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/marketplace-disclosure" element={<MarketplaceDisclosure />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/public-services" element={<PublicServices />} />
        </Route>

        <Route
          path="/support"
          element={
            isAuthenticated
              ? <SupportPortalRedirect portalPath="/user/dashboard" adminPortalPath="/dashboard" />
              : renderContextAwarePage(Support)
          }
        />
        <Route
          path="/faq"
          element={
            isAuthenticated
              ? <SupportPortalRedirect portalPath="/user/faq" adminPortalPath="/faq-review" />
              : renderContextAwarePage(Support)
          }
        />
        <Route
          path="/ask-question"
          element={
            isAuthenticated
              ? <SupportPortalRedirect portalPath="/user/faq" adminPortalPath="/faq-review" />
              : renderContextAwarePage(AskQuestion)
          }
        />
        <Route
          path="/support/ticket"
          element={
            isAuthenticated
              ? <SupportPortalRedirect portalPath="/user/create" adminPortalPath="/tickets/create" />
              : renderContextAwarePage(RaiseTicket)
          }
        />
        <Route path="/blog" element={renderContextAwarePage(Blog)} />
        <Route path="/blog/:slug" element={renderContextAwarePage(BlogDetail)} />

        {/* Protected Routes: Only after login */}
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
          <Route path="/address-book" element={<AddressBook />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/services" element={<Services />} />
          <Route path="/blog/submit" element={<BlogSubmit />} />
          <Route path="/blog/my-submissions" element={<MyBlogSubmissions />} />
          <Route path="/service-requests" element={<ServiceRequests />} />
          <Route path="/service-requests/:requestNumber" element={<ServiceRequestDetail />} />
          <Route path="/bank-verification" element={<BankVerification />} />
          <Route path="/vendor-verification" element={<BankVerification />} />
          <Route path="/irrigation-sensors" element={<IrrigationSensorDashboard />} />
          <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/roles" element={<SupportPortalRedirect adminPortalPath="/access-control" requireAdmin />} />
          <Route path="/admin/blog-posts" element={<AdminBlogManagement />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showOnboarding && (
        <OnboardingTour onFinish={handleOnboardingFinish} />
      )}
      </>
    </Suspense>
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


