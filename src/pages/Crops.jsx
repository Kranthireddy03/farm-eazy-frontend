/**
 * Crops Page Component
 *
 * Features:
 * - List all crops across farms
 * - Add new crop
 * - Edit crop details
 * - Delete crop
 * - Card-based grid view (matching Farms style)
 */

import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

function Crops() {
  const { toast, showToast, closeToast } = useToast()
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCrop, setEditingCrop] = useState(null)
  const [farms, setFarms] = useState([])
  const [formData, setFormData] = useState({
    cropName: '',
    season: '',
    sowingDate: '',
    expectedHarvestDate: '',
    farmId: '',
    status: 'PLANTED',
  })

  useEffect(() => {
    fetchCrops()
    fetchFarms()
  }, [])

  const fetchCrops = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.GET_CROPS)
      setCrops(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load crops')
      console.error(err)
      showToast('Failed to load crops', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchFarms = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_FARMS)
      setFarms(response.data)
    } catch (err) {
      console.error('Failed to fetch farms:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddCrop = async (e) => {
    e.preventDefault()

    if (!formData.cropName || !formData.season || !formData.sowingDate || !formData.expectedHarvestDate || !formData.farmId) {
      setError('Please fill in all required fields')
      showToast('Please fill in all required fields', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post(API_ENDPOINTS.CREATE_CROP, {
        cropName: formData.cropName,
        season: formData.season,
        sowingDate: formData.sowingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        farmId: parseInt(formData.farmId),
        status: formData.status,
      })

      setFormData({ cropName: '', season: '', sowingDate: '', expectedHarvestDate: '', farmId: '', status: 'PLANTED' })
      setShowAddForm(false)
      setError('')
      showToast('Crop created successfully!', 'success')
      await fetchCrops()
    } catch (err) {
      setError(err.message || 'Failed to create crop')
      showToast(err.message || 'Failed to create crop', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) {
      return
    }

    try {
      await apiClient.delete(API_ENDPOINTS.DELETE_CROP(cropId))
      setError('')
      showToast('Crop deleted successfully!', 'success')
      await fetchCrops()
    } catch (err) {
      setError('Failed to delete crop')
      showToast('Failed to delete crop', 'error')
    }
  }

  const handleEditClick = (crop) => {
    setEditingCrop(crop)
    setFormData({
      cropName: crop.cropName,
      season: crop.season,
      sowingDate: crop.sowingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      farmId: crop.farmId,
      status: crop.status,
    })
    setShowAddForm(false)
  }

  const handleUpdateCrop = async (e) => {
    e.preventDefault()

    if (!formData.cropName || !formData.season || !formData.sowingDate || !formData.expectedHarvestDate || !formData.farmId) {
      setError('Please fill in all required fields')
      showToast('Please fill in all required fields', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_CROP(editingCrop.id), {
        cropName: formData.cropName,
        season: formData.season,
        sowingDate: formData.sowingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        farmId: parseInt(formData.farmId),
        status: formData.status,
      })

      setFormData({ cropName: '', season: '', sowingDate: '', expectedHarvestDate: '', farmId: '', status: 'PLANTED' })
      setEditingCrop(null)
      setError('')
      showToast('Crop updated successfully!', 'success')
      await fetchCrops()
    } catch (err) {
      setError(err.message || 'Failed to update crop')
      showToast(err.message || 'Failed to update crop', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCrop(null)
    setFormData({ cropName: '', season: '', sowingDate: '', expectedHarvestDate: '', farmId: '', status: 'PLANTED' })
  }

  const getFarmName = (farmId) => {
    const farm = farms.find(f => f.id === farmId)
    return farm ? farm.farmName : 'Unknown Farm'
  }

  const getStatusColor = (status) => {
    const colors = {
      PLANTED: 'bg-blue-100 text-blue-800',
      GROWING: 'bg-green-100 text-green-800',
      READY: 'bg-yellow-100 text-yellow-800',
      HARVESTED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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
          <p className="text-gray-600">Loading crops...</p>
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
            <h1 className="text-3xl font-bold text-gray-800">Crops</h1>
            <p className="text-gray-600 mt-1">Track all your crops and their status</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingCrop(null)
              setFormData({ cropName: '', season: '', sowingDate: '', expectedHarvestDate: '', farmId: '', status: 'PLANTED' })
            }}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : '+ Add Crop'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Crop Form */}
        {showAddForm && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Crop</h2>
            <form onSubmit={handleAddCrop} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Crop Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="cropName"
                    value={formData.cropName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Wheat"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Farm <span className="text-red-500">*</span></label>
                  <select
                    name="farmId"
                    value={formData.farmId}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">-- Select a farm --</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.farmName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Season <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="season"
                    value={formData.season}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Rabi"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="PLANTED">Planted</option>
                    <option value="GROWING">Growing</option>
                    <option value="READY">Ready</option>
                    <option value="HARVESTED">Harvested</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Sowing Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="sowingDate"
                    value={formData.sowingDate}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Expected Harvest Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleChange}
                    className="form-input"
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
                  'Create Crop'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Edit Crop Form */}
        {editingCrop && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Crop</h2>
            <form onSubmit={handleUpdateCrop} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Crop Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="cropName"
                    value={formData.cropName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Wheat"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Farm <span className="text-red-500">*</span></label>
                  <select
                    name="farmId"
                    value={formData.farmId}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">-- Select a farm --</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.farmName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Season <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="season"
                    value={formData.season}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Rabi"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="PLANTED">Planted</option>
                    <option value="GROWING">Growing</option>
                    <option value="READY">Ready</option>
                    <option value="HARVESTED">Harvested</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Sowing Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="sowingDate"
                    value={formData.sowingDate}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Expected Harvest Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleChange}
                    className="form-input"
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
                    'Update Crop'
                  )}
                </button>
                <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Crops Grid */}
        {crops.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No crops yet. Add your first crop!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
              <div key={crop.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{crop.cropName}</h3>
                    <p className="text-gray-600 text-sm">📍 {getFarmName(crop.farmId)}</p>
                  </div>
                  <span className="text-2xl">🌱</span>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">Season</p>
                    <p className="font-semibold text-gray-800">{crop.season}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(crop.status)}`}>
                      {crop.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">Sowing Date</p>
                    <p className="font-semibold text-gray-800">{new Date(crop.sowingDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">Expected Harvest</p>
                    <p className="font-semibold text-gray-800">{new Date(crop.expectedHarvestDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(crop)}
                    className="flex-1 btn-primary text-center text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCrop(crop.id)}
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

export default Crops
