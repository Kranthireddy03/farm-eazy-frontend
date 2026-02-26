import React, { useState } from 'react';

const defaultPrefs = {
  notifications: true,
  language: 'en',
  theme: 'system',
  dashboardTips: true,
  pushAlerts: false,
};

const UserPreferences = () => {
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userPrefs')) || defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrefs((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      localStorage.setItem('userPrefs', JSON.stringify(updated));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">⚙️</span>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Preferences</h1>
          <p className="text-gray-600">Customize your FarmEazy experience</p>
        </div>

        {/* Saved Toast */}
        {saved && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 text-green-400 rounded-lg text-center animate-pulse">
            ✅ Preferences saved automatically
          </div>
        )}

        {/* Preference Groups */}
        <div className="space-y-6">
          {preferenceGroups.map((group) => (
            <div key={group.title} className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>{group.icon}</span> {group.title}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {group.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                    <div className="flex-1">
                      <label className="font-medium text-white">{item.label}</label>
                      {item.description && (
                        <p className="text-sm text-slate-400 mt-1">{item.description}</p>
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
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      ) : (
                        <select
                          name={item.name}
                          value={prefs[item.name]}
                          onChange={handleChange}
                          className="px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-700 text-white"
                        >
                          {item.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reset Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setPrefs(defaultPrefs);
              localStorage.setItem('userPrefs', JSON.stringify(defaultPrefs));
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
