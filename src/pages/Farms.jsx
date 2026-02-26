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

import { useState, useEffect } from 'react'
import { useLoader } from '../context/LoaderContext'
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

function Farms() {
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="spinner text-green-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <p className="text-gray-600">Loading farms...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
      <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Farms</h1>
          <p className="text-gray-600 mt-1">Manage all your farms in one place</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingFarm(null)
            setFormData({ farmName: '', location: '', areaSize: '' })
          }}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Farm'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Farm Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Farm</h2>
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
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Farm</h2>
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
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">No farms yet. Create your first farm to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div key={farm.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{farm.farmName}</h3>
                  <p className="text-gray-600 text-sm">{farm.location}</p>
                </div>
                <span className="text-2xl">🌾</span>
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-gray-600 text-sm">Area Size</p>
                  <p className="font-semibold text-gray-800">{farm.areaSize} hectares</p>
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
