import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

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
    <div className={`premium-shell min-h-screen py-8 px-4 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-cyan-50 via-white to-indigo-50'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <section className="page-hero interactive-card text-center mb-8">
          <span className="text-5xl mb-4 block">⚙️</span>
          <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>User Preferences</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Customize your FarmEazy experience</p>
        </section>

        {/* Saved Toast */}
        {saved && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 text-green-400 rounded-lg text-center animate-pulse">
            ✅ Preferences saved automatically
          </div>
        )}

        <div className={`mb-6 glass-card interactive-card overflow-hidden ${isDark ? 'border border-slate-700' : 'border border-cyan-100'}`}>
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🧭</span> Quick Help Guide
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Choose settings based on your goal:</p>
            <ul className={`text-sm space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Preference Groups */}
        <div className="space-y-6">
          {preferenceGroups.map((group) => (
            <div key={group.title} className={`glass-card interactive-card overflow-hidden ${isDark ? 'border border-slate-700' : 'border border-indigo-100'}`}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>{group.icon}</span> {group.title}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {group.items.map((item) => (
                  <div key={item.name} className={`flex items-center justify-between py-3 border-b last:border-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="flex-1">
                      <label className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</label>
                      {item.description && (
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
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
                          <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${isDark ? 'bg-slate-600 peer-focus:ring-indigo-700 peer-checked:after:border-slate-600 after:bg-slate-300 after:border-slate-500' : 'bg-slate-300 peer-focus:ring-indigo-300 peer-checked:after:border-white after:bg-white after:border-slate-200'}`}></div>
                        </label>
                      ) : (
                        <div className="space-y-1">
                          <select
                            name={item.name}
                            value={prefs[item.name]}
                            onChange={handleChange}
                            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                          >
                            {item.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {item.name === 'theme' && (
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tip: Use System to follow your device mode automatically.</p>
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
          <div className={`glass-card interactive-card overflow-hidden ${isDark ? 'border border-slate-700' : 'border border-emerald-100'}`}>
            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>💳</span> Payment & Refunds
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex-1">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Refund Details</span>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage your bank/UPI details for refunds</p>
                </div>
                <div className="ml-4">
                  <Link 
                    to="/refund-details" 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>My Orders</span>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>View orders, cancellations and refund status</p>
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
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
