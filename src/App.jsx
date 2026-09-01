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
import ActiveLocationsPage from './pages/ActiveLocationsPage';
import apiClient from './services/apiClient';

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
      const errorText = this.state.error?.message || String(this.state.error);
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(circle_at_20%_0%,#1e3a5f_0%,#0f172a_50%,#020617_85%)] text-foreground px-6">
          <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl text-center">
            <h1 className="text-2xl font-black text-white">Something went wrong</h1>
            <p className="text-slate-300 mt-3 text-sm leading-relaxed">
              Your session is safe. Retry the page or open resilience mode while we recover.
            </p>
            <p className="mt-4 text-xs text-red-200/90 bg-red-950/40 border border-red-400/30 rounded-xl px-3 py-2">
              {errorText}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl px-4 py-2 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100"
              >
                Reload page
              </button>
              <button
                onClick={() => window.location.assign('/fallback')}
                className="rounded-xl px-4 py-2 bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
              >
                Resilience mode
              </button>
            </div>
          </div>
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
import { CoinProvider } from './context/CoinContext';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import { useLocationContext } from './context/LocationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import SessionBootstrapGate from './components/session/SessionBootstrapGate';
import LocationWizard from './components/location/LocationWizard';
import RateLimitOverlay from './components/RateLimitOverlay';
import ServiceDegradedNotifier from './components/ServiceDegradedNotifier';
import { STORAGE_KEYS } from './config/api';
import { buildSupportPortalUrl, prepareSupportPortalHandoff } from './utils/supportPortal';
import './i18n';
import Layout from './components/layout/AppShell';
import PublicLayout from './components/layout/ProductPublicLayout';
import GlobalFloatingThemeToggle from './components/GlobalFloatingThemeToggle';
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
const VendorBidsPage = lazy(() => import('./pages/VendorBidsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const MyBids = lazy(() => import('./pages/MyBids'));
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
const Products = lazy(() => import('./pages/Products'));
const ProductAnalyticsPage = lazy(() => import('./pages/ProductAnalyticsPage'));
const ServiceAnalyticsPage = lazy(() => import('./pages/ServiceAnalyticsPage'));
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
function ProtectedRoute({ children, skipSessionBootstrap = false }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const profileCompletionRequired = localStorage.getItem(STORAGE_KEYS.USER_PROFILE_COMPLETION_REQUIRED) === 'true';
  
  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && profileCompletionRequired && location.pathname !== '/complete-google-profile') {
    return <Navigate to="/complete-google-profile" replace />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (skipSessionBootstrap) {
    return children;
  }

  return (
    <SessionBootstrapGate>
      {children}
    </SessionBootstrapGate>
  );
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
    <div className="flex items-center justify-center h-screen bg-white dark:bg-card">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground dark:text-slate-300">Redirecting to Support Portal...</p>
      </div>
    </div>
  );
}

function LogoutRoute() {
  const { logout } = useAuth();

  useEffect(() => {
    logout('user');
  }, [logout]);

  return <PageLoader message="Signing out…" />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, getUserId, getUserEmail, isAdmin, getUserRoles } = useAuth();
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
        <ProtectedRoute skipSessionBootstrap>
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

  useEffect(() => {
    const checkLocationAccess = async () => {
      // Only check location for authenticated users
      if (!isAuthenticated) return;

      // If user is admin/support, bypass location check
      const isExcludedRole = isAdmin?.() || (getUserRoles?.() || []).some(r => ['SUPPORT', 'ROLE_SUPPORT'].includes(r));
      if (isExcludedRole) return;

      // If they are already on /service-unavailable, don't check
      if (location.pathname === '/service-unavailable') return;

      // If they are on fallback, complete-google-profile or logout reasons, bypass
      if (['/fallback', '/complete-google-profile', '/coverage', '/active-locations', '/locations'].includes(location.pathname)) return;

      try {
        const res = await apiClient.get('/location-access/status');
        if (res.data && !res.data.allowed) {
          const isNotAvailable = res.data.message?.includes('not yet available') || res.data.message?.includes('not live');
          if (isNotAvailable) {
            navigate('/service-unavailable', { replace: true, state: { message: res.data.message } });
          }
        }
      } catch (err) {
        // ignore public errors to prevent blocking the app
      }
    };

    checkLocationAccess();
  }, [location.pathname, locationVersion, isAuthenticated, navigate, isAdmin, getUserRoles]);

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
          <Route path="/logout" element={<LogoutRoute />} />
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

        <Route path="/coverage" element={renderContextAwarePage(ActiveLocationsPage)} />
        <Route path="/active-locations" element={renderContextAwarePage(ActiveLocationsPage)} />
        <Route path="/locations" element={renderContextAwarePage(ActiveLocationsPage)} />
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
              ? (
                <ProtectedRoute>
                  <Layout>
                    <Support />
                  </Layout>
                </ProtectedRoute>
              )
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
          <Route path="/profile" element={<Navigate to="/settings" replace />} />
          <Route path="/communication-preferences" element={<CommunicationPreferences />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/farms/:farmId" element={<FarmDetail />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/irrigation" element={<IrrigationSchedules />} />
          <Route path="/irrigation-services" element={<Navigate to="/services" replace />} />
          <Route path="/selling" element={<Selling />} />
          <Route path="/selling/bids/:listingType/:listingId" element={<VendorBidsPage />} />
          <Route path="/messages/:displayId" element={<MessagesPage />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/buying" element={<Buying />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/product/:id/analytics" element={<ProductAnalyticsPage />} />
          <Route path="/products/:id/analytics" element={<ProductAnalyticsPage />} />
          <Route path="/selling/product/:id/analytics" element={<ProductAnalyticsPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/post" element={<Products />} />
          <Route path="/products/listings" element={<Products />} />
          <Route path="/products/orders" element={<Products />} />
          <Route path="/products/saved" element={<Products />} />
          <Route path="/products/sales" element={<Products />} />
          <Route path="/products/history" element={<Products />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/user/address" element={<AddressBook />} />
          <Route path="/user/contact" element={<ContactSettings />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/refund-details" element={<RefundDetails />} />
          <Route path="/address-book" element={<AddressBook />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/post" element={<Services />} />
          <Route path="/services/posted" element={<Services />} />
          <Route path="/services/bookings" element={<Services />} />
          <Route path="/services/requests" element={<Services />} />
          <Route path="/services/history" element={<Services />} />
          <Route path="/services/provider-history" element={<Services />} />
          <Route path="/services/:id/analytics" element={<ServiceAnalyticsPage />} />
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

        <Route path="/irrigation/schedules" element={<Navigate to="/irrigation" replace />} />
        <Route path="/irrigation/sensors" element={<Navigate to="/irrigation-sensors" replace />} />
        <Route path="/irrigation/services" element={<Navigate to="/services" replace />} />

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
            <SessionProvider>
              <LocationProvider>
                <LoaderProvider>
                  <CoinProvider>
                    <ToastProvider>
                      <ShellProvider>
                        <AppContent />
                        <LocationWizard />
                        <RateLimitOverlay />
                        <ServiceDegradedNotifier />
                        <GlobalFloatingThemeToggle />
                        <Toaster richColors closeButton position="top-right" theme="system" />
                      </ShellProvider>
                    </ToastProvider>
                  </CoinProvider>
                </LoaderProvider>
              </LocationProvider>
            </SessionProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App


