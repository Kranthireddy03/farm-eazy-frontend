/**
 * Dashboard Page Component
 * 
 * Features:
 * - Overview statistics (total farms, crops, irrigation schedules)
 * - Quick action buttons
 * - Recent activities section
 * - Responsive grid layout
 */

import { useState, useEffect, Suspense, lazy } from 'react'
import OnboardingTour from '../components/OnboardingTour';
// NotificationBell removed; notifications only in header
import DarkModeToggle from '../components/DarkModeToggle'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useTranslation } from 'react-i18next'
import ChatSupport from '../components/ChatSupport'
const DashboardCharts = lazy(() => import('../components/DashboardCharts'))

function Dashboard() {
  // Onboarding tour state
  const [showTour, setShowTour] = useState(false);

  // Show tour on first login only
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  // Handler for finishing/skipping the tour
  const handleTourFinish = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
  };
    // Example notifications, replace with real data from backend
    const [notifications, setNotifications] = useState([
      { message: 'Upcoming irrigation scheduled for Farm #2', time: '2 hours ago' },
      { message: 'Crop status updated: Wheat is READY', time: 'Yesterday' }
    ]);
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalCrops: 0,
    totalIrrigations: 0,
    activeAlerts: 0,
    totalProducts: 0,
  })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [weather, setWeather] = useState({ temp: '--', desc: 'Loading...' });

  const { t, i18n } = useTranslation();

  const [search, setSearch] = useState('');
  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Optionally filter farms/crops here
  };

  /**
   * Generate and download farm report as text file
   */
  const generateReport = () => {
    setGeneratingReport(true)
    
    try {
      const timestamp = new Date().toLocaleString()
      const reportContent = `
╔════════════════════════════════════════════════════════════════╗
║              FARMEAZY - FARM MANAGEMENT REPORT                 ║
╚════════════════════════════════════════════════════════════════╝

Generated: ${timestamp}

═══════════════════════════════════════════════════════════════════
FARM OVERVIEW SUMMARY
═══════════════════════════════════════════════════════════════════

Total Farms:              ${stats.totalFarms}
Total Crops Planted:      ${stats.totalCrops}
Irrigation Schedules:     ${stats.totalIrrigations}
Upcoming Irrigations:     ${stats.activeAlerts}

═══════════════════════════════════════════════════════════════════
RECENT ACTIVITIES (Last 10)
═══════════════════════════════════════════════════════════════════

${activities.length === 0 ? 'No activities recorded' : activities.map((activity, index) => {
        const { formatDate } = require('../utils/formatDate');
        const date = formatDate(activity.createdAt, true);
        return `${index + 1}. [${date}] ${activity.description}`
      }).join('\n')}

═══════════════════════════════════════════════════════════════════
ACTIVITY BREAKDOWN
═══════════════════════════════════════════════════════════════════

${(() => {
        const createFarms = activities.filter(a => a.activityType === 'CREATE_FARM').length
        const createCrops = activities.filter(a => a.activityType === 'CREATE_CROP').length
        const createIrrigation = activities.filter(a => a.activityType === 'CREATE_IRRIGATION').length
        const updates = activities.filter(a => a.activityType.includes('UPDATE')).length
        const deletes = activities.filter(a => a.activityType.includes('DELETE')).length
        
        return `Farm Created:            ${createFarms}
Crops Added:             ${createCrops}
Irrigations Scheduled:   ${createIrrigation}
Updates Made:            ${updates}
Deletions:               ${deletes}`
      })()}

═══════════════════════════════════════════════════════════════════
RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════

${(() => {
        const recommendations = []
        if (stats.totalFarms === 0) recommendations.push('• Create your first farm to get started')
        if (stats.totalCrops === 0) recommendations.push('• Add crops to your farms for better tracking')
        if (stats.totalIrrigations === 0) recommendations.push('• Schedule irrigation for optimal crop health')
        if (stats.activeAlerts > 3) recommendations.push('• Monitor upcoming irrigations closely')
        if (recommendations.length === 0) recommendations.push('• Your farm management is on track!')
        
        return recommendations.join('\n')
      })()}

═══════════════════════════════════════════════════════════════════

Report generated by FarmEazy System
For more details, visit: https://farm-eazy.com

═══════════════════════════════════════════════════════════════════
`.trim()

      // Create and download file
      const element = document.createElement('a')
      const file = new Blob([reportContent], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `FarmEazy_Report_${new Date().getTime()}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      setError('Failed to generate report')
      console.error(err)
    } finally {
      setGeneratingReport(false)
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const getRelativeTime = (createdAt) => {
    if (!createdAt) return 'just now'
    
    const date = new Date(createdAt)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  /**
   * Get activity type color for visual distinction
   */
  const getActivityColor = (activityType) => {
    const colorMap = {
      'CREATE_FARM': 'bg-green-600',
      'CREATE_CROP': 'bg-blue-600',
      'CREATE_IRRIGATION': 'bg-cyan-600',
      'UPDATE_FARM': 'bg-green-500',
      'UPDATE_CROP': 'bg-blue-500',
      'UPDATE_IRRIGATION': 'bg-cyan-500',
      'DELETE_FARM': 'bg-red-600',
      'DELETE_CROP': 'bg-red-500',
      'DELETE_IRRIGATION': 'bg-red-400',
    }
    return colorMap[activityType] || 'bg-gray-600'
  }

  /**
   * Fetch dashboard statistics and activities
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsResponse, activitiesResponse, productsResponse] = await Promise.all([
          apiClient.get('/irrigation/stats'),
          apiClient.get('/activities/recent'),
          apiClient.get('/products/my-products/count')
        ])
        
        setStats({
          totalFarms: statsResponse.data.totalFarms || 0,
          totalCrops: statsResponse.data.totalCrops || 0,
          totalIrrigations: statsResponse.data.totalIrrigations || 0,
          activeAlerts: statsResponse.data.upcomingIrrigations || 0,
          totalProducts: productsResponse.data.count || 0,
        })
        setActivities(activitiesResponse.data || [])
        setError('')
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && stats.activeAlerts > 0) {
      new Notification('FarmEazy Alert', {
        body: `You have ${stats.activeAlerts} active irrigation alerts.`
      });
    }
  }, [stats.activeAlerts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'f') {
        document.querySelector('input[aria-label="Search farms or crops"]')?.focus();
      }
      if (e.ctrlKey && e.key === 'n') {
        document.querySelector('button[aria-label="Open chat support"]')?.click();
      }
      if (e.ctrlKey && e.key === 'q') {
        window.scrollTo({ top: document.querySelector('h2').offsetTop, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 px-2 sm:px-6 py-4 max-w-lg mx-auto">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mt-6 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-2 sm:px-6 py-4 max-w-lg mx-auto" role="main" aria-label="Dashboard main content">
      {showTour && (
        <OnboardingTour onFinish={handleTourFinish} />
      )}
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800" tabIndex={0} aria-label="Dashboard heading">{t('Dashboard')}</h1>
        <p className="text-gray-600 mt-1" tabIndex={0} aria-label="Dashboard welcome message">
          {getGreeting()}, {userName}! {window.history.state && window.history.state.usr && window.history.state.usr.welcome
            ? t('Welcome')
            : t('Welcome')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Farms */}
        <div className="card hover:shadow-lg transition-shadow" aria-label="Total Farms statistic">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium" aria-label="Total Farms label">{t('Total Farms')}</p>
              <p className="text-3xl font-bold text-green-600 mt-2" aria-label={`Total Farms value: ${stats.totalFarms}`}>{stats.totalFarms}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl" aria-label="Farm icon" role="img">
              <span aria-label="Farm">🌾</span>
            </div>
          </div>
        </div>

        {/* Total Crops */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('Total Crops')}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalCrops}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              🌱
            </div>
          </div>
        </div>

        {/* Products Listed */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('Products Listed')}</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.productsListed}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
              💧
            </div>
          </div>
        </div>
        {/* Analytics Charts */}
        <Suspense fallback={<div className="text-center text-gray-500">Loading charts...</div>}>
          <DashboardCharts stats={stats} />
        </Suspense>
        {/* Active Alerts */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('Active Alerts')}</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activeAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-2" aria-label="Weather widget">
        <span className="text-2xl" aria-label="Weather icon">☀️</span>
        <div>
          <div className="text-blue-800 font-bold" aria-label="Weather label">Weather</div>
          <div className="text-blue-700" aria-label="Weather value">{weather.temp}°C, {weather.desc}</div>
        </div>
      </div>

      {/* Farm/Crop Search Bar */}
      <div className="mb-4" aria-label="Farm and crop search bar">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search farms or crops..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
          aria-label="Search farms or crops"
        />
      </div>

      {/* Quick Actions */}
      <div className="card" aria-label="Dashboard quick actions">
        <h2 className="text-xl font-bold text-gray-800 mb-4" aria-label="Quick actions heading">{t('Quick Actions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Quick actions grid">
          <Link
            to="/farms"
            className="btn-primary text-center block hover:bg-green-700"
          >
            {t('View Farms')}
          </Link>
          <Link
            to="/crops"
            className="btn-primary text-center block hover:bg-green-700"
          >
            {t('Manage Crops')}
          </Link>
          <Link
            to="/irrigation"
            className="btn-primary text-center block hover:bg-green-700"
          >
            {t('Schedule Irrigation')}
          </Link>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className={`px-6 py-3 rounded-lg font-semibold transition-all text-center ${
              generatingReport
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {generatingReport ? 'Generating...' : `📄 ${t('Generate Report')}`}
          </button>
        </div>
      </div>
      {/* Dashboard Tips */}
      <div className="card bg-blue-50 border border-blue-200 mt-4">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Dashboard Tips</h3>
        <ul className="list-disc pl-6 text-blue-700 space-y-1">
          <li>Use Quick Actions to access core features faster.</li>
          <li>Monitor Active Alerts for timely irrigation and crop care.</li>
          <li>Check Recent Activities for farm updates and history.</li>
          <li>Switch language for a personalized experience.</li>
          <li>Download your farm report for offline records.</li>
        </ul>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('Recent Activities')}</h2>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No activities yet. Start by creating a farm!</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 pb-3 border-b border-gray-200 last:border-b-0">
                <div className={`w-3 h-3 ${getActivityColor(activity.activityType)} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{activity.description}</p>
                  <p className="text-gray-500 text-sm">{getRelativeTime(activity.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3">{t('Getting Started')}</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start space-x-3">
            <span className="text-green-600 font-bold">1.</span>
            <span>{t('Create your first farm in the Farms section')}</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-green-600 font-bold">2.</span>
            <span>{t('Add crops to your farm to start tracking growth')}</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-green-600 font-bold">3.</span>
            <span>{t('Set up irrigation schedules based on weather and crop needs')}</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-green-600 font-bold">4.</span>
            <span>{t('Monitor your farms and receive alerts for important events')}</span>
          </li>
        </ul>
      </div>
      <ChatSupport />
    </div>
  );
}

export default Dashboard
