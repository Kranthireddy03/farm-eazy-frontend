/**
 * Session Expired Page
 * 
 * Displayed when user is logged out due to:
 * - Inactivity timeout (120 seconds + 30 second warning)
 * - Token expiration
 * - Unauthorized access attempt
 * 
 * Provides clear messaging about why they were logged out and how to continue.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

function SessionExpired() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { clearLogoutReason } = useAuth();
  
  // Get reason from location state or URL params
  const reason = location.state?.reason || new URLSearchParams(location.search).get('reason') || 'unknown';

  // Clear logout reason when leaving this page
  useEffect(() => {
    return () => {
      if (clearLogoutReason) clearLogoutReason();
    };
  }, [clearLogoutReason]);

  const getReasonDetails = () => {
    switch (reason) {
      case 'inactivity':
        return {
          icon: '⏰',
          title: 'Session Expired',
          message: 'You have been logged out due to inactivity.',
          details: 'As you were inactive for 2 minutes without responding to the session warning, your session has expired for security reasons.',
          color: 'orange'
        };
      case 'expired':
        return {
          icon: '🔐',
          title: 'Session Expired',
          message: 'Your session has expired due to token expiration.',
          details: 'For security reasons, sessions are time-limited. Please log in again to continue.',
          color: 'blue'
        };
      case 'unauthorized':
        return {
          icon: '🚫',
          title: 'Unauthorized Access',
          message: 'Your session could not be verified.',
          details: 'This may happen if you logged in from another device or your session was invalidated.',
          color: 'red'
        };
      default:
        return {
          icon: '👋',
          title: 'Logged Out',
          message: 'Your session has ended.',
          details: 'Please log in again to continue using FarmEazy.',
          color: 'emerald'
        };
    }
  };

  const { icon, title, message, details, color } = getReasonDetails();

  const colorClasses = {
    orange: {
      bg: isDark ? 'from-orange-900/50 via-red-900/30' : 'from-orange-100 via-yellow-50',
      iconBg: 'from-orange-500 to-red-500',
      badge: isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700',
      border: isDark ? 'border-orange-700' : 'border-orange-200'
    },
    blue: {
      bg: isDark ? 'from-blue-900/50 via-indigo-900/30' : 'from-blue-100 via-indigo-50',
      iconBg: 'from-blue-500 to-indigo-500',
      badge: isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700',
      border: isDark ? 'border-blue-700' : 'border-blue-200'
    },
    red: {
      bg: isDark ? 'from-red-900/50 via-rose-900/30' : 'from-red-100 via-rose-50',
      iconBg: 'from-red-500 to-rose-500',
      badge: isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700',
      border: isDark ? 'border-red-700' : 'border-red-200'
    },
    emerald: {
      bg: isDark ? 'from-emerald-900/50 via-teal-900/30' : 'from-emerald-100 via-teal-50',
      iconBg: 'from-emerald-500 to-teal-500',
      badge: isDark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
      border: isDark ? 'border-emerald-700' : 'border-emerald-200'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      isDark 
        ? `bg-gradient-to-br ${colors.bg} to-slate-900` 
        : `bg-gradient-to-br ${colors.bg} to-white`
    }`}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 -left-4 w-72 h-72 ${isDark ? 'bg-emerald-800/20' : 'bg-emerald-200/30'} rounded-full mix-blend-multiply filter blur-xl`}></div>
        <div className={`absolute -bottom-8 right-20 w-72 h-72 ${isDark ? 'bg-teal-900/20' : 'bg-teal-200/30'} rounded-full mix-blend-multiply filter blur-xl`}></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Card */}
        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 ${
          isDark 
            ? `bg-slate-800/90 ${colors.border}` 
            : `bg-white/90 ${colors.border}`
        }`}>
          {/* Icon */}
          <div className={`w-24 h-24 bg-gradient-to-br ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <span className="text-5xl">{icon}</span>
          </div>

          {/* Title */}
          <h1 className={`text-3xl font-extrabold text-center mb-4 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            {title}
          </h1>

          {/* Message */}
          <p className={`text-center text-lg mb-4 ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Details Badge */}
          <div className={`rounded-xl p-4 mb-8 ${colors.badge}`}>
            <p className="text-sm text-center">
              ℹ️ {details}
            </p>
          </div>

          {/* Session Info (for inactivity) */}
          {reason === 'inactivity' && (
            <div className={`rounded-xl p-4 mb-6 ${
              isDark ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                What happened?
              </h3>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <li>• You were inactive for 120 seconds (2 minutes)</li>
                <li>• A 30-second warning was displayed</li>
                <li>• No response was received during the countdown</li>
                <li>• Your session was securely terminated</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              <span>Log In Again</span>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Go to Home
            </button>
          </div>

          {/* Footer */}
          <p className={`text-center text-xs mt-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            🌾 FarmEazy - Smart Farm Management
          </p>
        </div>
      </div>
    </div>
  );
}

export default SessionExpired;
