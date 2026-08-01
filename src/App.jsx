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
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-6">
          <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
          <p className="text-muted-foreground mb-4 text-center max-w-xl">
            Your session is preserved. You can retry or open resilience mode.
          </p>
          <button
            onClick={() => window.location.assign('/fallback')}
            className="mb-4 rounded-md px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Open resilience mode
          </button>
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

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'
import AuthService from './services/AuthService'
import apiClient from './services/apiClient'
import { CoinProvider } from './context/CoinContext';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import { useLocationContext } from './context/LocationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { STORAGE_KEYS } from './config/api';
import { buildSupportPortalUrl, prepareSupportPortalHandoff } from './utils/supportPortal';
import SessionWarningModal from './components/SessionWarningModal';
import './i18n';
import Layout from './components/layout/AppShell';
import PublicLayout from './components/layout/ProductPublicLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
const UserPreferences = lazy(() => import('./pages/UserPreferences'));
const CommunicationPreferences = lazy(() => import('./pages/CommunicationPreferences'));
import { ShellProvider } from './components/shell/ShellContext';
import CommandPalette from './components/shell/CommandPalette';
import PageLoader from './components/shell/PageLoader';
import OnboardingTour from './components/OnboardingTour';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const RedirectReset = lazy(() => import('./pages/RedirectReset'));
const EmailError = lazy(() => import('./pages/EmailError'));
const CompleteGoogleProfile = lazy(() => import('./pages/CompleteGoogleProfile'));
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
const Wishlist = lazy(() => import('./pages/Wishlist'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const RefundDetails = lazy(() => import('./pages/RefundDetails'));
const AddressBook = lazy(() => import('./pages/AddressBook'));
const ContactSettings = lazy(() => import('./pages/ContactSettings'));
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
const VendorOnboarding = lazy(() => import('./pages/VendorOnboarding'));
const IrrigationSensorDashboard = lazy(() => import('./pages/IrrigationSensorDashboard'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const SessionExpired = lazy(() => import('./pages/SessionExpired'));
const PremiumFallback = lazy(() => import('./pages/PremiumFallback'));
const ServiceUnavailableLocation = lazy(() => import('./pages/ServiceUnavailableLocation'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
// Admin support UI has been moved to a standalone admin-support portal.
// Import removed to decouple from main FarmEazy flow.
const AdminBlogManagement = lazy(() => import('./pages/admin/AdminBlogManagement'));
// user ticket pages removed; users should use /support page

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

/**
 * ProtectedRoute Component
 * Uses AuthContext for consistent session management
 */
function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const profileCompletionRequired = localStorage.getItem(STORAGE_KEYS.USER_PROFILE_COMPLETION_REQUIRED) === 'true';
  
  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && profileCompletionRequired && location.pathname !== '/complete-google-profile') {
    return <Navigate to="/complete-google-profile" replace />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
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

function LocationAccessRoute({ children }) {
  const { hasSelectedLocation, openSelector } = useLocationContext()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!hasSelectedLocation) {
      setAllowed(false)
      setMessage('Please select your location to continue.')
      setChecking(false)
      openSelector()
      return
    }

    let active = true

    const runCheck = async () => {
      try {
        const response = await apiClient.get('/location-access/status', { _skipFallback: true })
        if (!active) return
        const isAllowed = Boolean(response?.data?.allowed)
        setAllowed(isAllowed)
        setMessage(response?.data?.message || '')
      } catch (_err) {
        if (!active) return
        setAllowed(false)
        setMessage('Unable to verify location access at the moment.')
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }

    runCheck()
    return () => {
      active = false
    }
  }, [hasSelectedLocation, openSelector])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!allowed) {
    openSelector()
    return <Navigate to="/service-unavailable" replace state={{ message }} />
  }

  return children
}

/**
 * AppContent Component
 * Main app content that uses auth context
 */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, getUserId, getUserEmail } = useAuth();
  const { locationVersion } = useLocationContext();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const getOnboardingStorageKey = () => {
    const userId = getUserId?.();
    const email = getUserEmail?.();
    const identity = userId || email || 'anonymous';
    return `onboardingComplete_${identity}`;
  };

  const scrollToTopPage = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    });
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
    if (isAuthenticated && location.pathname !== '/complete-google-profile' && !localStorage.getItem(getOnboardingStorageKey())) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, getUserEmail, getUserId, location.pathname]);

  useEffect(() => {
    const openTour = () => setShowOnboarding(true);
    window.addEventListener('start-onboarding-tour', openTour);
    return () => window.removeEventListener('start-onboarding-tour', openTour);
  }, []);

  useEffect(() => {
    scrollToTopPage();
  }, [location.pathname]);

  useEffect(() => {
    const handleFallback = (event) => {
      if (location.pathname === '/fallback') {
        return;
      }
      navigate('/fallback', { state: event.detail || {}, replace: false });
    };

    window.addEventListener('farmeazy:fallback', handleFallback);
    return () => window.removeEventListener('farmeazy:fallback', handleFallback);
  }, [location.pathname, navigate]);

  const handleOnboardingFinish = () => {
    localStorage.setItem(getOnboardingStorageKey(), 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <>
      <CommandPalette />
      <Routes key={isAuthenticated ? `loc-${locationVersion}` : 'public'}>
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
                <PublicHome />
              </PublicLayout>
            )
          }
        />
        <Route
          path="/landing"
          element={
            <PublicLayout>
              <LandingHome />
            </PublicLayout>
          }
        />
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-google-profile" element={<ProtectedRoute><CompleteGoogleProfile /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/r/:shortCode" element={<RedirectReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-error" element={<EmailError />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/fallback" element={<PremiumFallback />} />
        </Route>

        <Route
          path="/service-unavailable"
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <Layout>
                  <ServiceUnavailableLocation />
                </Layout>
              </ProtectedRoute>
            ) : (
              <PublicLayout>
                <ServiceUnavailableLocation />
              </PublicLayout>
            )
          }
        />

        <Route path="/privacy-policy" element={renderContextAwarePage(PrivacyPolicy)} />
        <Route path="/terms" element={renderContextAwarePage(Terms)} />
        <Route path="/refund-policy" element={renderContextAwarePage(RefundPolicy)} />
        <Route path="/shipping-policy" element={renderContextAwarePage(ShippingPolicy)} />
        <Route path="/marketplace-disclosure" element={renderContextAwarePage(MarketplaceDisclosure)} />
        <Route path="/about" element={renderContextAwarePage(About)} />
        <Route path="/contact" element={renderContextAwarePage(Contact)} />
        <Route path="/public-services" element={renderContextAwarePage(PublicServices)} />

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
              <LocationAccessRoute>
                <Layout onShowTour={() => setShowOnboarding(true)} />
              </LocationAccessRoute>
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
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/user/address" element={<AddressBook />} />
          <Route path="/user/contact" element={<ContactSettings />} />
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
          <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
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
      {showOnboarding && location.pathname !== '/complete-google-profile' && (
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
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <LocationProvider>
              <LoaderProvider>
                <CoinProvider>
                  <ToastProvider>
                    <ShellProvider>
                      <AppContent />
                      <Toaster richColors closeButton position="top-right" theme="system" />
                    </ShellProvider>
                  </ToastProvider>
                </CoinProvider>
              </LoaderProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App


