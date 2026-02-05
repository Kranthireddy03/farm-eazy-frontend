/**
 * Farm Detail Page
 * 
 * Features:
 * - Display farm information
 * - Show associated crops
 * - Edit farm details
 * - Go back to farms list
 */

import { useParams, useNavigate } from 'react-router-dom'
import { formatDate } from '../utils/formatDate';
import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

function FarmDetail() {
  const { farmId } = useParams()
  const navigate = useNavigate()
  const [farm, setFarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFarmDetail()
  }, [farmId])

  const fetchFarmDetail = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.GET_FARM_BY_ID(farmId))
      setFarm(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load farm details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Loading farm details...</p>
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 text-lg mb-4">Farm not found</p>
        <button
          onClick={() => navigate('/farms')}
          className="btn-primary"
        >
          Back to Farms
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate('/farms')}
          className="text-green-600 hover:text-green-700 font-semibold mb-4"
        >
          ← Back to Farms
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{farm.farmName}</h1>
        <p className="text-gray-600 mt-1">Location: {farm.location}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Farm Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 text-sm">Farm Name</p>
            <p className="text-lg font-semibold text-gray-800">{farm.farmName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Location</p>
            <p className="text-lg font-semibold text-gray-800">{farm.location}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Area Size</p>
            <p className="text-lg font-semibold text-gray-800">{farm.areaSize} hectares</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Created On</p>
            <p className="text-lg font-semibold text-gray-800">
              {formatDate(farm.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Associated Crops</h2>
        <p className="text-gray-600">No crops associated yet</p>
      </div>
    </div>
  )
}

export default FarmDetail
