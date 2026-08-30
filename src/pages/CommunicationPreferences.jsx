import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import AppPage from '../components/layout/AppPage';
import { 
  getPreferences, 
  updatePreferences, 
  CHANNEL_OPTIONS, 
  NOTIFICATION_TYPES 
} from '../services/CommunicationPreferencesService';

function CommunicationPreferences() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
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
      <AppPage title="Communication Preferences" description="Choose how you want to receive notifications.">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage title="Communication Preferences" description="Choose how you want to receive notifications.">
      <div className="max-w-3xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-400 rounded-xl flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        {/* SMS Consent Section */}
        <div className={`mb-6 p-6 rounded-xl ops-panel interactive-card ${isDark ? 'border border-border' : 'border border-amber-100'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                SMS Notifications
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
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
                      ? 'bg-primary' 
                      : isDark ? 'bg-muted' : 'bg-border'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform shadow ${
                      preferences.smsConsent ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
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
                  ? 'ops-panel border border-border hover:border-border' 
                  : 'ops-panel border border-indigo-100 hover:border-indigo-200'
              } shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  type.critical 
                    ? isDark ? 'bg-red-900/30' : 'bg-red-100'
                    : isDark ? 'bg-muted' : 'bg-muted'
                }`}>
                  <span className="text-2xl">{type.icon}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                      {type.title}
                    </h3>
                    {type.critical && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-500 rounded-full">
                        Important
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-4 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
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
                              ? 'bg-primary text-white shadow-lg'
                              : isDisabled
                                ? isDark 
                                  ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' 
                                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                                : isDark
                                  ? 'bg-muted text-muted-foreground hover:bg-muted'
                                  : 'bg-muted text-foreground hover:bg-muted'
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
                ? 'bg-muted/500 text-muted-foreground cursor-not-allowed scale-100'
                : 'bg-gradient-to-r from-primary to-primary text-white hover:from-primary/90 hover:to-primary/90 shadow-lg hover:shadow-primary/20 hover:scale-105'
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
        <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-muted/50 border border-border' : 'bg-muted border border-border'}`}>
          <p className={`text-sm text-center ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            <span className="mr-2">ℹ️</span>
            Your preferences are synced across all devices. Critical security notifications may still be sent via multiple channels for your protection.
          </p>
        </div>
      </div>
    </AppPage>
  );
}

export default CommunicationPreferences;
