/**
 * Farm Detail Page
 * 
 * Features:
 * - Display farm information
 * - Show associated crops
 * - Edit farm details
 * - Go back to farms list
 */

import { useParams, useNavigate, Link } from 'react-router-dom'
import { formatDate } from '../utils/formatDate';
import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

function FarmDetail() {
  const { farmId } = useParams()
  const navigate = useNavigate()
  const [farm, setFarm] = useState(null)
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFarmDetail()
    fetchCrops()
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

  const fetchCrops = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_CROPS)
      const farmCrops = response.data.filter(crop => crop.farmId === parseInt(farmId))
      setCrops(farmCrops)
    } catch (err) {
      console.error('Failed to fetch crops:', err)
    }
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm details...</p>
        </div>
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <span className="text-6xl mb-4 block">🌾</span>
          <h2 className="text-2xl font-bold text-white mb-2">Farm Not Found</h2>
          <p className="text-slate-400 mb-6">The farm you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/farms')}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
          >
            ← Back to Farms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/farms')}
            className="flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Farms
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Farm Header Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-8 text-white mb-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-6xl mb-4 block">🌾</span>
              <h1 className="text-3xl font-bold mb-2">{farm.farmName}</h1>
              <p className="text-green-100 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {farm.location}
              </p>
            </div>
            <Link
              to="/farms"
              className="px-4 py-2 bg-slate-700/50 rounded-lg text-white hover:bg-slate-600/50 transition-all"
            >
              Edit Farm
            </Link>
          </div>
        </div>

        {/* Farm Details Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>📋</span> Farm Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Farm Name</p>
              <p className="text-lg font-semibold text-white">{farm.farmName}</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Location</p>
              <p className="text-lg font-semibold text-white">{farm.location}</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Area Size</p>
              <p className="text-lg font-semibold text-white">{farm.areaSize} hectares</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Created On</p>
              <p className="text-lg font-semibold text-white">
                {formatDate(farm.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Associated Crops Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🌱</span> Associated Crops
            </h2>
            <Link
              to="/crops"
              className="px-4 py-2 bg-green-900/40 text-green-400 rounded-lg font-medium hover:bg-green-900/60 transition-colors"
            >
              + Add Crop
            </Link>
          </div>
          
          {crops.length === 0 ? (
            <div className="text-center py-8 bg-slate-700 rounded-lg">
              <span className="text-4xl mb-3 block">🌱</span>
              <p className="text-slate-400 mb-4">No crops planted in this farm yet</p>
              <Link
                to="/crops"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Plant Your First Crop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crops.map((crop) => (
                <div key={crop.id} className="border border-slate-600 rounded-lg p-4 bg-slate-700 hover:bg-slate-600 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{crop.cropName}</h3>
                      <p className="text-sm text-slate-400">Season: {crop.season}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(crop.status)}`}>
                      {crop.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FarmDetail
