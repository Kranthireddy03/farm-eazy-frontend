/**
 * Farms Page Component
 * 
 * Features:
 * - List all user's farms
 * - Add new farm
 * - Edit farm details
 * - Delete farm
 * - View farm details
 */

import { useState, useEffect, useMemo } from 'react'
import { useLoader } from '../context/LoaderContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import { sendNotification } from '../components/NotificationCenter'

function Farms() {
    const { isDark } = useTheme()
    // Import dashboard stats refresh
    const dashboardWindow = window;
    const refreshDashboardStats = () => {
      if (dashboardWindow.fetchStats) {
        dashboardWindow.fetchStats();
      }
    };
  const { toast, showToast, closeToast } = useToast();
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingFarm, setEditingFarm] = useState(null)
  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    areaSize: '',
  })
  const { show: showLoader, hide: hideLoader } = useLoader();

  const farmMetrics = useMemo(() => {
    const totalFarms = farms.length
    const totalArea = farms.reduce((sum, farm) => sum + (Number(farm.areaSize) || 0), 0)
    const averageArea = totalFarms > 0 ? totalArea / totalFarms : 0
    const largeFarms = farms.filter((farm) => (Number(farm.areaSize) || 0) >= 10).length

    return {
      totalFarms,
      totalArea,
      averageArea,
      largeFarms,
    }
  }, [farms])

  /**
   * Fetch farms on component mount
   */
  useEffect(() => {
    const fetchWithLoader = async () => {
      try {
        showLoader();
        await fetchFarms();
      } finally {
        hideLoader();
      }
    };
    fetchWithLoader();
    // eslint-disable-next-line
  }, [])

  /**
   * Fetch all farms
   */
  const fetchFarms = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.GET_FARMS)
      setFarms(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load farms')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle form input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * Handle farm creation
   */
  const handleAddFarm = async (e) => {
    e.preventDefault()

    if (!formData.farmName || !formData.location || !formData.areaSize) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post(API_ENDPOINTS.CREATE_FARM, {
        ...formData,
        areaSize: parseFloat(formData.areaSize),
      })

      setFormData({ farmName: '', location: '', areaSize: '' })
      setShowAddForm(false)
      setError('')
      showToast('Farm created successfully!', 'success');
      sendNotification(`Farm "${formData.farmName}" created!`, 'success', '🌾');
      await fetchFarms()
      refreshDashboardStats();
    } catch (err) {
      setError(err.message || 'Failed to create farm')
      showToast(err.message || 'Failed to create farm', 'error');
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Handle farm deletion
   */
  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm('Are you sure you want to delete this farm?')) {
      return
    }

    try {
      await apiClient.delete(API_ENDPOINTS.DELETE_FARM(farmId))
      setError('')
      showToast('Farm deleted successfully!', 'success');
      await fetchFarms()
      refreshDashboardStats();
    } catch (err) {
      setError('Failed to delete farm')
      showToast('Failed to delete farm', 'error');
    }
  }

  /**
   * Handle edit button click
   */
  const handleEditClick = (farm) => {
    setEditingFarm(farm)
    setFormData({
      farmName: farm.farmName,
      location: farm.location,
      areaSize: farm.areaSize.toString(),
    })
    setShowAddForm(false)
  }

  /**
   * Handle farm update
   */
  const handleUpdateFarm = async (e) => {
    e.preventDefault()

    if (!formData.farmName || !formData.location || !formData.areaSize) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_FARM(editingFarm.id), {
        ...formData,
        areaSize: parseFloat(formData.areaSize),
      })

      setFormData({ farmName: '', location: '', areaSize: '' })
      setEditingFarm(null)
      setError('')
      showToast('Farm updated successfully!', 'success');
      await fetchFarms()
      refreshDashboardStats();
    } catch (err) {
      setError(err.message || 'Failed to update farm')
      showToast(err.message || 'Failed to update farm', 'error');
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = () => {
    setEditingFarm(null)
    setFormData({ farmName: '', location: '', areaSize: '' })
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-slate-900' : ''}`}>
        <div className="text-center">
          <div className="spinner text-green-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Loading farms...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
      <div className={`space-y-8 min-h-screen -m-6 p-6 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <section className="page-hero interactive-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">Farm workspace</p>
            <h1 className={`mt-2 text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Farms</h1>
            <p className={`mt-2 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage your land parcels with a richer workflow, better visual hierarchy, and faster action access.</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingFarm(null)
              setFormData({ farmName: '', location: '', areaSize: '' })
            }}
            className="premium-button"
          >
            {showAddForm ? 'Close Form' : '+ Add Farm'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`glass-card interactive-card p-4 ${isDark ? 'border-slate-700' : 'border-emerald-100'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Farms</p>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{farmMetrics.totalFarms}</p>
        </div>
        <div className={`glass-card interactive-card p-4 ${isDark ? 'border-slate-700' : 'border-emerald-100'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Area</p>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{farmMetrics.totalArea.toFixed(1)} ha</p>
        </div>
        <div className={`glass-card interactive-card p-4 ${isDark ? 'border-slate-700' : 'border-emerald-100'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Average Size</p>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{farmMetrics.averageArea.toFixed(1)} ha</p>
        </div>
        <div className={`glass-card interactive-card p-4 ${isDark ? 'border-slate-700' : 'border-emerald-100'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Large Farms</p>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{farmMetrics.largeFarms}</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>10+ hectares</p>
        </div>
      </div>

      <div className={`glass-card interactive-card p-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Farm Operations Quick Actions</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Jump to high-frequency tasks for faster daily operations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/crops" className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Manage Crops</Link>
            <Link to="/irrigation" className={`px-3 py-2 rounded-lg border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Irrigation Planner</Link>
            <Link to="/service-requests" className={`px-3 py-2 rounded-lg border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Service Requests</Link>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`px-4 py-3 rounded-lg border ${isDark ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Add Farm Form */}
      {showAddForm && (
        <div className={`glass-card interactive-card rounded-3xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900/65' : 'border-slate-100 bg-white/90 shadow-lg'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Add New Farm</h2>
            <span className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-emerald-600/60 text-emerald-300 bg-emerald-900/20' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>Interactive Form</span>
          </div>
          <form onSubmit={handleAddFarm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Farm Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., North Field"
                  required
                />
              </div>
              <div>
                <label className="form-label">Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., District, State"
                  required
                />
              </div>
              <div>
                <label className="form-label">Area Size (hectares) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="areaSize"
                  value={formData.areaSize}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 5.5"
                  step="0.1"
                  required
                />
              </div>
            </div>
            <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-slate-700 bg-slate-800/80 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              Tip: Use specific names and location tags so your crops and irrigation schedules are easier to filter later.
            </div>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Farm'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Edit Farm Form */}
      {editingFarm && (
        <div className={`glass-card interactive-card rounded-3xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900/65' : 'border-slate-100 bg-white/90 shadow-lg'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Edit Farm</h2>
            <span className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-cyan-600/60 text-cyan-300 bg-cyan-900/20' : 'border-cyan-200 text-cyan-700 bg-cyan-50'}`}>Live Update</span>
          </div>
          <form onSubmit={handleUpdateFarm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Farm Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., North Field"
                  required
                />
              </div>
              <div>
                <label className="form-label">Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., District, State"
                  required
                />
              </div>
              <div>
                <label className="form-label">Area Size (hectares) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="areaSize"
                  value={formData.areaSize}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 5.5"
                  step="0.1"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Farm'
                )}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Farms List */}
      {farms.length === 0 ? (
        <div className={`glass-card interactive-card text-center py-12 rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-100 bg-white/90 shadow-lg'}`}>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No farms yet. Create your first farm to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div key={farm.id} className={`glass-card interactive-card rounded-2xl border p-5 hover:shadow-lg transition-shadow ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-100 bg-white/95 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{farm.farmName}</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{farm.location}</p>
                </div>
                <span className="text-2xl">🌾</span>
              </div>

              <div className={`space-y-2 mb-4 pb-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Area Size</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{farm.areaSize} hectares</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClick(farm)}
                  className="flex-1 btn-primary text-center text-sm"
                >
                  Edit
                </button>
                <Link
                  to={`/farms/${farm.id}`}
                  className="flex-1 btn-secondary text-center text-sm"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  )
}

export default Farms
