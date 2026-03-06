/**
 * Session Warning Modal Component
 * 
 * Displays a countdown warning when user is about to be logged out due to inactivity.
 * Shows remaining seconds and allows user to extend their session.
 */

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function SessionWarningModal() {
  const { isDark } = useTheme();
  const { sessionWarning, warningCountdown, extendSession } = useAuth();

  if (!sessionWarning) return null;

  const handleStayLoggedIn = () => {
    extendSession();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border-2 overflow-hidden ${
        isDark 
          ? 'bg-slate-800 border-orange-500/50' 
          : 'bg-white border-orange-400'
      }`}>
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Session Expiring Soon</h2>
              <p className="text-orange-100 text-sm">Your session will end due to inactivity</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Countdown Timer */}
          <div className={`text-center mb-6 p-6 rounded-xl ${
            isDark ? 'bg-slate-700/50' : 'bg-orange-50'
          }`}>
            <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-orange-600'}`}>
              You will be logged out in
            </p>
            <div className={`text-6xl font-bold font-mono ${
              warningCountdown <= 10 
                ? 'text-red-500 animate-pulse' 
                : isDark ? 'text-orange-400' : 'text-orange-600'
            }`}>
              {warningCountdown}
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-orange-600'}`}>
              seconds
            </p>
          </div>

          {/* Info Message */}
          <div className={`text-center mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            <p className="text-sm">
              You have been inactive for 2 minutes. Click below to continue your session.
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Session will end after 30 seconds without response
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStayLoggedIn}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>✅</span>
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionWarningModal;
