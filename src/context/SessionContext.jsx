/**
 * SessionProvider — single source of truth for profile, permissions, and effective location.
 * Coordinates session bootstrap via GET /api/users/me after authentication.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { STORAGE_KEYS } from '../config/api';
import { useAuth } from './AuthContext';
import {
  loadSessionProfile,
  effectiveLocationToSelection,
} from '../services/sessionBootstrapService';
import {
  registerLocationApiHandlers,
  unregisterLocationApiHandlers,
  flushLocationRetryQueue,
} from '../services/locationApiBridge';
import NotificationService from '../services/NotificationService';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [effectiveLocation, setEffectiveLocation] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState(null);
  const bootstrapRunRef = useRef(0);

  const hasEffectiveLocation = Boolean(effectiveLocation?.present);
  const isSessionReady = Boolean(profile) && hasEffectiveLocation;

  const applyProfileResult = useCallback((result) => {
    setProfile(result.profile);
    setEffectiveLocation(result.effectiveLocation);
    setBootstrapError(null);
    return result;
  }, []);

  const refreshNotificationCount = useCallback(async () => {
    if (!localStorage.getItem(STORAGE_KEYS.USER_TOKEN)) {
      setNotificationCount(0);
      return;
    }
    try {
      const countPayload = await NotificationService.getUnreadCount();
      const count = typeof countPayload === 'number'
        ? countPayload
        : Number(countPayload?.unreadCount ?? countPayload?.count ?? 0);
      setNotificationCount(count);
    } catch {
      // Non-blocking badge fetch
    }
  }, []);

  const bootstrapSession = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    if (!token) {
      setProfile(null);
      setEffectiveLocation(null);
      setNotificationCount(0);
      setBootstrapError(null);
      setIsBootstrapping(false);
      return null;
    }

    const runId = ++bootstrapRunRef.current;
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const result = applyProfileResult(await loadSessionProfile());
      if (runId !== bootstrapRunRef.current) return null;

      window.dispatchEvent(
        new CustomEvent('farmeazy:profile-loaded', {
          detail: {
            profile: result.profile,
            effectiveLocation: result.effectiveLocation,
            locationSelection: result.locationSelection,
          },
        })
      );

      if (!result.hasEffectiveLocation) {
        window.dispatchEvent(
          new CustomEvent('farmeazy:open-location-modal', {
            detail: { reason: 'MISSING_ON_BOOTSTRAP', blocking: true },
          })
        );
      }

      await refreshNotificationCount();
      return result;
    } catch (error) {
      if (runId !== bootstrapRunRef.current) return null;
      const message = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || error?.message
        || 'Unable to load your profile';
      setBootstrapError(message);
      throw error;
    } finally {
      if (runId === bootstrapRunRef.current) {
        setIsBootstrapping(false);
      }
    }
  }, [applyProfileResult, refreshNotificationCount]);

  const refreshProfile = useCallback(async () => {
    const result = await bootstrapSession();
    if (result?.hasEffectiveLocation) {
      await flushLocationRetryQueue();
    }
    return result;
  }, [bootstrapSession]);

  const clearSessionState = useCallback(() => {
    bootstrapRunRef.current += 1;
    setProfile(null);
    setEffectiveLocation(null);
    setNotificationCount(0);
    setBootstrapError(null);
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      clearSessionState();
      return;
    }

    bootstrapSession().catch(() => {
      // bootstrapError already set
    });
  }, [isAuthenticated, authLoading, bootstrapSession, clearSessionState]);

  useEffect(() => {
    const onLogin = () => {
      bootstrapSession().catch(() => undefined);
    };
    const onLogout = () => clearSessionState();

    window.addEventListener('farmeazy:auth-login', onLogin);
    window.addEventListener('farmeazy:auth-logout', onLogout);
    return () => {
      window.removeEventListener('farmeazy:auth-login', onLogin);
      window.removeEventListener('farmeazy:auth-logout', onLogout);
    };
  }, [bootstrapSession, clearSessionState]);

  useEffect(() => {
    registerLocationApiHandlers({
      openWizard: (detail) => {
        window.dispatchEvent(new CustomEvent('farmeazy:open-location-modal', { detail }));
      },
      onLocationReady: () => refreshNotificationCount(),
    });
    return () => unregisterLocationApiHandlers();
  }, [refreshNotificationCount]);

  const permissions = useMemo(() => {
    const roles = profile?.roles || [];
    const roleList = Array.isArray(roles) ? roles : [];
    const isAdmin = roleList.some((role) =>
      ['ADMIN', 'ROLE_ADMIN', 'SUPERADMIN', 'ROLE_SUPERADMIN'].includes(role)
    );
    return {
      roles: roleList,
      isAdmin,
      hasRole: (role) => roleList.includes(role),
    };
  }, [profile]);

  const value = useMemo(
    () => ({
      profile,
      effectiveLocation,
      hasEffectiveLocation,
      isBootstrapping,
      isSessionReady,
      bootstrapError,
      notificationCount,
      permissions,
      bootstrapSession,
      refreshProfile,
      refreshNotificationCount,
      getLocationSelection: () => effectiveLocationToSelection(effectiveLocation),
      getUserEmail: () => profile?.email || localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '',
      getUserId: () => profile?.id?.toString() || localStorage.getItem(STORAGE_KEYS.USER_ID) || '',
      getUserName: () => profile?.username || localStorage.getItem(STORAGE_KEYS.USER_USERNAME) || '',
    }),
    [
      profile,
      effectiveLocation,
      hasEffectiveLocation,
      isBootstrapping,
      isSessionReady,
      bootstrapError,
      notificationCount,
      permissions,
      bootstrapSession,
      refreshProfile,
      refreshNotificationCount,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

export default SessionContext;
