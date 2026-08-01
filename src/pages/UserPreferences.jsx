import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AppPage from '../components/layout/AppPage';

const defaultPrefs = {
  notifications: true,
  language: 'en',
  theme: 'system',
  dashboardTips: true,
  pushAlerts: false,
};

const UserPreferences = () => {
  const { setTheme } = useTheme();

  const startGuidedTour = () => {
    window.dispatchEvent(new Event('start-onboarding-tour'));
  };

  const applyThemePreference = (themePreference) => {
    if (themePreference === 'dark') {
      setTheme('dark');
      return;
    }
    if (themePreference === 'light') {
      setTheme('light');
      return;
    }

    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemDark ? 'dark' : 'light');
  };

  const [prefs, setPrefs] = useState(() => {
    try {
      const savedPrefs = JSON.parse(localStorage.getItem('userPrefs')) || defaultPrefs;
      return { ...defaultPrefs, ...savedPrefs };
    } catch {
      return defaultPrefs;
    }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    applyThemePreference(prefs.theme || 'system');
    // Run once on mount with stored preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrefs((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      localStorage.setItem('userPrefs', JSON.stringify(updated));
      if (name === 'theme') {
        applyThemePreference(updated.theme);
      }
      return updated;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const preferenceGroups = [
    {
      title: 'Notifications',
      icon: '🔔',
      items: [
        { name: 'notifications', label: 'Email Notifications', type: 'checkbox', description: 'Receive updates about your farms and orders' },
        { name: 'pushAlerts', label: 'Push Alerts', type: 'checkbox', description: 'Real-time browser notifications' },
      ]
    },
    {
      title: 'Appearance',
      icon: '🎨',
      items: [
        { name: 'theme', label: 'Theme', type: 'select', options: [{ value: 'system', label: 'System Default' }, { value: 'light', label: 'Light Mode' }, { value: 'dark', label: 'Dark Mode' }] },
        { name: 'language', label: 'Language', type: 'select', options: [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'te', label: 'Telugu' }] },
      ]
    },
    {
      title: 'Dashboard',
      icon: '📊',
      items: [
        { name: 'dashboardTips', label: 'Show Dashboard Tips', type: 'checkbox', description: 'Display helpful tips on your dashboard' },
      ]
    }
  ];

  return (
    <AppPage title="User Preferences" description="Customize your FarmEazy experience.">
      <div className="max-w-2xl mx-auto">
        {/* Saved Toast */}
        {saved && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 text-green-400 rounded-lg text-center animate-pulse">
            ✅ Preferences saved automatically
          </div>
        )}

        <div className={`mb-6 ops-panel interactive-card overflow-hidden ${isDark ? 'border border-border' : 'border border-cyan-100'}`}>
          <div className="bg-gradient-to-r from-primary/50 to-blue-500 px-6 py-4 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🧭</span> Quick Help Guide
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Choose settings based on your goal:</p>
            <ul className={`text-sm space-y-2 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
              <li>• Theme: Choose Light, Dark, or System. This preference is also carried to Support Portal redirects.</li>
              <li>• Notifications: Turn on email and push alerts so you do not miss important farm updates.</li>
              <li>• Language: Pick your preferred language for easier day-to-day usage.</li>
              <li>• Dashboard Tips: Keep this on if you are new and want contextual guidance.</li>
            </ul>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startGuidedTour}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-500 transition-colors"
              >
                Start Guided Tour
              </button>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-muted text-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted'}`}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Preference Groups */}
        <div className="space-y-6">
          {preferenceGroups.map((group) => (
            <div key={group.title} className={`ops-panel interactive-card overflow-hidden ${isDark ? 'border border-border' : 'border border-indigo-100'}`}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>{group.icon}</span> {group.title}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {group.items.map((item) => (
                  <div key={item.name} className={`flex items-center justify-between py-3 border-b last:border-0 ${isDark ? 'border-border' : 'border-border'}`}>
                    <div className="flex-1">
                      <label className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>{item.label}</label>
                      {item.description && (
                        <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{item.description}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {item.type === 'checkbox' ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name={item.name}
                            checked={prefs[item.name]}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${isDark ? 'bg-muted peer-focus:ring-indigo-700 peer-checked:after:border-border after:bg-muted after:border-border' : 'bg-muted peer-focus:ring-indigo-300 peer-checked:after:border-white after:bg-background after:border-border'}`}></div>
                        </label>
                      ) : (
                        <div className="space-y-1">
                          <select
                            name={item.name}
                            value={prefs[item.name]}
                            onChange={handleChange}
                            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'border-border bg-muted text-white' : 'border-border bg-background text-foreground'}`}
                          >
                            {item.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {item.name === 'theme' && (
                            <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Tip: Use System to follow your device mode automatically.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Payment & Refund Section */}
          <div className={`ops-panel interactive-card overflow-hidden ${isDark ? 'border border-border' : 'border border-border/60'}`}>
            <div className="bg-gradient-to-r from-primary to-primary px-6 py-4 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>💳</span> Payment & Refunds
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-border' : 'border-border'}`}>
                <div className="flex-1">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>Refund Details</span>
                  <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Manage your bank/UPI details for refunds</p>
                </div>
                <div className="ml-4">
                  <Link 
                    to="/refund-details" 
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>My Orders</span>
                  <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>View orders, cancellations and refund status</p>
                </div>
                <div className="ml-4">
                  <Link 
                    to="/orders" 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setPrefs(defaultPrefs);
              localStorage.setItem('userPrefs', JSON.stringify(defaultPrefs));
              applyThemePreference(defaultPrefs.theme);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark ? 'bg-muted text-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted'}`}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </AppPage>
  );
};

export default UserPreferences;
