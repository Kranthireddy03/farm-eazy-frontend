import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { 
  getPreferences, 
  updatePreferences, 
  CHANNEL_OPTIONS, 
  NOTIFICATION_TYPES 
} from '../services/CommunicationPreferencesService';

function CommunicationPreferences() {
  const { isDark } = useTheme();
  const { toast, showToast, closeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    otpChannel: 'EMAIL_ONLY',
    orderChannel: 'EMAIL_ONLY',
    serviceChannel: 'EMAIL_ONLY',
    irrigationChannel: 'EMAIL_ONLY',
    marketingChannel: 'EMAIL_ONLY',
    smsConsent: false,
  });
  // Track saved preferences to detect changes
  const savedPreferencesRef = useRef(null);
  
  // Check if there are unsaved changes
  const hasChanges = savedPreferencesRef.current && 
    JSON.stringify(preferences) !== JSON.stringify(savedPreferencesRef.current);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPreferences();
      const loadedPrefs = {
        otpChannel: data.otpChannel || 'EMAIL_ONLY',
        orderChannel: data.orderChannel || 'EMAIL_ONLY',
        serviceChannel: data.serviceChannel || 'EMAIL_ONLY',
        irrigationChannel: data.irrigationChannel || 'EMAIL_ONLY',
        marketingChannel: data.marketingChannel || 'EMAIL_ONLY',
        smsConsent: data.smsConsent || false,
      };
      setPreferences(loadedPrefs);
      savedPreferencesRef.current = loadedPrefs;
    } catch (err) {
      // If 404, user has no preferences yet - use defaults
      if (err.response?.status === 404) {
        const defaultPrefs = {
          otpChannel: 'EMAIL_ONLY',
          orderChannel: 'EMAIL_ONLY',
          serviceChannel: 'EMAIL_ONLY',
          irrigationChannel: 'EMAIL_ONLY',
          marketingChannel: 'EMAIL_ONLY',
          smsConsent: false,
        };
        setPreferences(defaultPrefs);
        savedPreferencesRef.current = defaultPrefs;
      } else {
        setError('Failed to load preferences. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
      // Auto-enable SMS consent if any SMS channel is selected
      smsConsent: value !== 'EMAIL_ONLY' ? true : prev.smsConsent,
    }));
  };

  const handleSmsConsentChange = (checked) => {
    if (!checked) {
      // Reset all channels to EMAIL_ONLY if consent revoked
      setPreferences({
        otpChannel: 'EMAIL_ONLY',
        orderChannel: 'EMAIL_ONLY',
        serviceChannel: 'EMAIL_ONLY',
        irrigationChannel: 'EMAIL_ONLY',
        marketingChannel: 'EMAIL_ONLY',
        smsConsent: false,
      });
    } else {
      setPreferences(prev => ({ ...prev, smsConsent: true }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const data = await updatePreferences(preferences);
      
      // Update saved reference to match current
      savedPreferencesRef.current = { ...preferences };
      
      // Show success toast
      showToast('Preferences saved successfully!', 'success');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save preferences. Please try again.');
      showToast('Failed to save preferences', 'error');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} py-8 px-4`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        </div>
      )}
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">📬</span>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>
            Communication Preferences
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
            Choose how you want to receive notifications
          </p>
        </div>



        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-400 rounded-xl flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        {/* SMS Consent Section */}
        <div className={`mb-6 p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} shadow-lg`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                SMS Notifications
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Enable SMS to receive instant alerts on your phone.
              </p>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.smsConsent}
                    onChange={(e) => handleSmsConsentChange(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    preferences.smsConsent 
                      ? 'bg-green-500' 
                      : isDark ? 'bg-slate-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      preferences.smsConsent ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  I consent to receive SMS notifications (charges apply)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Channel Preferences */}
        <div className="space-y-4 mb-6">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className={`p-6 rounded-xl transition-all ${
                isDark 
                  ? 'bg-slate-800 border border-slate-700 hover:border-slate-600' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              } shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  type.critical 
                    ? isDark ? 'bg-red-900/30' : 'bg-red-100'
                    : isDark ? 'bg-slate-700' : 'bg-gray-100'
                }`}>
                  <span className="text-2xl">{type.icon}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {type.title}
                    </h3>
                    {type.critical && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-500 rounded-full">
                        Important
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {type.description}
                  </p>
                  
                  {/* Channel Selection */}
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((option) => {
                      const isSelected = preferences[type.key] === option.value;
                      const isDisabled = option.value !== 'EMAIL_ONLY' && !preferences.smsConsent;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => !isDisabled && handleChannelChange(type.key, option.value)}
                          disabled={isDisabled}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isSelected
                              ? 'bg-green-500 text-white shadow-lg'
                              : isDisabled
                                ? isDark 
                                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isDark
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>



        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all transform ${
              saving || !hasChanges
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed scale-100'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-green-500/25 hover:scale-105'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>💾</span> Save Preferences
              </span>
            )}
          </button>
        </div>

        {/* Info Note */}
        <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-100 border border-gray-200'}`}>
          <p className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            <span className="mr-2">ℹ️</span>
            Your preferences are synced across all devices. Critical security notifications may still be sent via multiple channels for your protection.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CommunicationPreferences;
