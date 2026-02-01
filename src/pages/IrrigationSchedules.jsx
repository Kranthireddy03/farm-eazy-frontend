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
  const [schedules, setSchedules] = useState([])
  const [crops, setCrops] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
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
    } catch (err) {
      setError('Failed to delete schedule')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Loading schedules...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Irrigation Schedules</h1>
          <p className="text-gray-600 mt-1">Plan and track irrigation for your crops</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ New Schedule'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Schedule</h2>
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

      {schedules.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">No schedules yet. Create your first irrigation schedule!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Irrigation Schedule</h3>
                  <p className="text-gray-600 text-sm">ID: {schedule.id}</p>
                </div>
                <span className="text-2xl">💧</span>
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-gray-600 text-sm">Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(schedule.scheduleDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Duration</p>
                  <p className="font-semibold text-gray-800">{schedule.duration} minutes</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Water Amount</p>
                  <p className="font-semibold text-gray-800">{schedule.waterAmount} liters</p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteSchedule(schedule.id)}
                className="btn-secondary w-full text-sm"
              >
                Delete Schedule
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default IrrigationSchedules
