/**
 * Irrigation Schedules Page Component
 * 
 * Features:
 * - List all irrigation schedules
 * - Create new irrigation schedule
 * - Edit existing schedules
 * - Delete schedules
 * - View schedule details
 */

import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

function IrrigationSchedules() {
    // Import dashboard stats refresh
    const dashboardWindow = window;
    const refreshDashboardStats = () => {
      if (dashboardWindow.fetchStats) {
        dashboardWindow.fetchStats();
      }
    };
  const [schedules, setSchedules] = useState([])
  const [crops, setCrops] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    cropId: '',
    farmId: '',
    irrigationDate: '',
    startTime: '06:00',
    duration: '',
    waterAmount: '',
    notes: '',
  })

  useEffect(() => {
    fetchSchedules()
    fetchCrops()
    fetchFarms()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.GET_IRRIGATION_SCHEDULES)
      setSchedules(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load irrigation schedules')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCrops = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_CROPS)
      setCrops(response.data)
    } catch (err) {
      console.error('Failed to fetch crops:', err)
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

  const handleAddSchedule = async (e) => {
    e.preventDefault()

    if (!formData.cropId || !formData.farmId || !formData.irrigationDate || !formData.startTime || !formData.duration || !formData.waterAmount) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post(API_ENDPOINTS.CREATE_IRRIGATION, {
        cropId: parseInt(formData.cropId),
        farmId: parseInt(formData.farmId),
        irrigationDate: formData.irrigationDate,
        startTime: formData.startTime,
        duration: parseInt(formData.duration),
        waterAmount: parseFloat(formData.waterAmount),
        notes: formData.notes,
      })

      setFormData({
        cropId: '',
        farmId: '',
        irrigationDate: '',
        startTime: '06:00',
        duration: '',
        waterAmount: '',
        notes: '',
      })
      setShowAddForm(false)
      setError('')
      await fetchSchedules()
      refreshDashboardStats();
    } catch (err) {
      setError(err.message || 'Failed to create schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return
    }

    try {
      await apiClient.delete(API_ENDPOINTS.DELETE_IRRIGATION(scheduleId))
      setError('')
      await fetchSchedules()
      refreshDashboardStats();
    } catch (err) {
      setError('Failed to delete schedule')
    }
  }

  const handleEditClick = (schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      cropId: schedule.cropId || '',
      farmId: schedule.farmId || '',
      irrigationDate: schedule.scheduleDate || schedule.irrigationDate || '',
      startTime: schedule.startTime || '06:00',
      duration: schedule.duration || '',
      waterAmount: schedule.waterAmount || '',
      notes: schedule.notes || '',
    })
    setShowAddForm(false)
  }

  const handleUpdateSchedule = async (e) => {
    e.preventDefault()

    if (!formData.cropId || !formData.farmId || !formData.irrigationDate || !formData.startTime || !formData.duration || !formData.waterAmount) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_IRRIGATION(editingSchedule.id), {
        cropId: parseInt(formData.cropId),
        farmId: parseInt(formData.farmId),
        irrigationDate: formData.irrigationDate,
        startTime: formData.startTime,
        duration: parseInt(formData.duration),
        waterAmount: parseFloat(formData.waterAmount),
        notes: formData.notes,
      })

      setFormData({
        cropId: '',
        farmId: '',
        irrigationDate: '',
        startTime: '06:00',
        duration: '',
        waterAmount: '',
        notes: '',
      })
      setEditingSchedule(null)
      setError('')
      await fetchSchedules()
      refreshDashboardStats();
    } catch (err) {
      setError(err.message || 'Failed to update schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingSchedule(null)
    setFormData({
      cropId: '',
      farmId: '',
      irrigationDate: '',
      startTime: '06:00',
      duration: '',
      waterAmount: '',
      notes: '',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Loading schedules...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 -m-6 p-6">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-5xl">💧</span>
              <div>
                <h1 className="text-3xl font-bold">Irrigation Schedules</h1>
                <p className="text-blue-100 mt-1">Plan and track irrigation for your crops</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm)
                setEditingSchedule(null)
                setFormData({
                  cropId: '',
                  farmId: '',
                  irrigationDate: '',
                  startTime: '06:00',
                  duration: '',
                  waterAmount: '',
                  notes: '',
                })
              }}
              className="bg-slate-800 text-cyan-400 px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors shadow-md border border-slate-600"
            >
              {showAddForm ? 'Cancel' : '+ New Schedule'}
            </button>
          </div>
        </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Create New Schedule</h2>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Select Farm <span className="text-red-500">*</span></label>
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
                <label className="form-label">Select Crop <span className="text-red-500">*</span></label>
                <select
                  name="cropId"
                  value={formData.cropId}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">-- Select a crop --</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.cropName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Irrigation Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="irrigationDate"
                  value={formData.irrigationDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Start Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Duration (minutes) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="60"
                  required
                />
              </div>
              <div>
                <label className="form-label">Water Amount (liters) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="waterAmount"
                  value={formData.waterAmount}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="10000"
                  step="0.1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                placeholder="Add any notes for this schedule"
                rows="3"
              ></textarea>
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
                'Create Schedule'
              )}
            </button>
          </form>
        </div>
      )}

      {editingSchedule && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Edit Irrigation Schedule</h2>
          <form onSubmit={handleUpdateSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Select Farm <span className="text-red-500">*</span></label>
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
                <label className="form-label">Select Crop <span className="text-red-500">*</span></label>
                <select
                  name="cropId"
                  value={formData.cropId}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">-- Select a crop --</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.cropName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Irrigation Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="irrigationDate"
                  value={formData.irrigationDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Start Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Duration (minutes) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="60"
                  required
                />
              </div>
              <div>
                <label className="form-label">Water Amount (liters) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="waterAmount"
                  value={formData.waterAmount}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="10000"
                  step="0.1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                placeholder="Add any notes for this schedule"
                rows="3"
              ></textarea>
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
                  'Update Schedule'
                )}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg text-center py-12">
          <span className="text-5xl mb-4 block">🌱</span>
          <p className="text-slate-400 text-lg">No schedules yet. Create your first irrigation schedule!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Irrigation Schedule</h3>
                    <p className="text-blue-100 text-sm">ID: {schedule.id}</p>
                  </div>
                  <span className="text-2xl">💧</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">📅</span>
                  <div>
                    <p className="text-slate-500 text-xs">Date</p>
                    <p className="font-semibold text-white">
                      {new Date(schedule.scheduleDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">⏱️</span>
                  <div>
                    <p className="text-slate-500 text-xs">Duration</p>
                    <p className="font-semibold text-white">{schedule.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">💦</span>
                  <div>
                    <p className="text-slate-500 text-xs">Water Amount</p>
                    <p className="font-semibold text-white">{schedule.waterAmount} liters</p>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex space-x-2">
                <button
                  onClick={() => handleEditClick(schedule)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg font-medium hover:bg-red-900/50 hover:text-red-400 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default IrrigationSchedules
