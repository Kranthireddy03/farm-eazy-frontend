import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useCoin } from '../context/CoinContext';
import apiClient from '../services/apiClient';
import Toast from '../components/Toast';

/**
 * Enhanced Dashboard with Analytics & Activity Feed
 * 
 * Features:
 * - Product count, farm count, crop count displays
 * - User activity log with scrollable feed
 * - Activity filtering and search
 * - Statistics and insights
 * - Quick actions
 */

function DashboardEnhanced() {
  const navigate = useNavigate()
  const { toast, showToast, closeToast } = useToast()
  const { coins } = useCoin()

  // Service filter/sort states
  const [serviceFilter, setServiceFilter] = useState('')
  const [serviceSort, setServiceSort] = useState('name')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const [stats, setStats] = useState({
    totalFarms: 0,
    totalCrops: 0,
    totalIrrigations: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalServices: 0,
    activeAlerts: 0
  })
  
  const [activities, setActivities] = useState([])
  const [filteredActivities, setFilteredActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedActivityType, setSelectedActivityType] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceListings, setServiceListings] = useState([])

  const activityTypes = [
    { value: 'ALL', label: 'All Activities', icon: '📝' },
    { value: 'REGISTERED', label: 'Account', icon: '✍️' },
    { value: 'ORDER_PLACED', label: 'Orders', icon: '📦' },
    { value: 'ADDED_PRODUCT', label: 'Products', icon: '➕' },
    { value: 'FARM_ADDED', label: 'Farms', icon: '🌾' },
    { value: 'CROP_ADDED', label: 'Crops', icon: '🌱' },
    { value: 'COINS_EARNED', label: 'Coins', icon: '🪙' }
  ]

  // Fetch dashboard statistics
  useEffect(() => {
    fetchStats()
  }, [])

  // Filter activities when type or search changes
  useEffect(() => {
    filterActivities()
  }, [activities, selectedActivityType, searchTerm])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch all stats in parallel
      const [farmsRes, cropsRes, irrigationRes, productsRes, servicesRes, ordersRes] =
        await Promise.allSettled([
          apiClient.get('/farms'),
          apiClient.get('/crops'),
          apiClient.get('/irrigation'),
          apiClient.get('/products'),
          apiClient.get('/services/listings'),
          apiClient.get('/orders').catch(() => ({ data: { totalOrders: 0 } }))
        ]);

      const activitiesRes = await apiClient.get('/activities');
      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);

      const newStats = { ...stats }

      // Process results
      if (farmsRes.status === 'fulfilled') {
        newStats.totalFarms = Array.isArray(farmsRes.value.data) ? farmsRes.value.data.length : 0
      }
      if (cropsRes.status === 'fulfilled') {
        newStats.totalCrops = Array.isArray(cropsRes.value.data) ? cropsRes.value.data.length : 0
      }
      if (irrigationRes.status === 'fulfilled') {
        newStats.totalIrrigations = Array.isArray(irrigationRes.value.data) ? irrigationRes.value.data.length : 0
      }
      if (productsRes.status === 'fulfilled') {
        newStats.totalProducts = Array.isArray(productsRes.value.data) ? productsRes.value.data.length : 0
      }
      if (servicesRes.status === 'fulfilled') {
        const servicesData = servicesRes.value.data
        // Get user info from localStorage (assumes user object with id or email)
        let user = null;
        try {
          user = JSON.parse(localStorage.getItem('user'));
        } catch {}
        // Handle paginated response (Spring Boot Page object)
        let allServices = [];
        if (servicesData.content && Array.isArray(servicesData.content)) {
          allServices = servicesData.content;
        } else if (Array.isArray(servicesData)) {
          allServices = servicesData;
        }
        // Filter by user if possible
        let filtered = allServices;
        if (user && user.id) {
          filtered = allServices.filter(s => s.userId === user.id);
        }
        setServiceListings(filtered);
        newStats.totalServices = filtered.length;
        if (!allServices.length) {
          setServiceListings([]);
          newStats.totalServices = 0;
        }
      }
      if (ordersRes.status === 'fulfilled') {
        newStats.totalOrders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data.length : 0
      }

      setStats(newStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      showToast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Service management functions
  const editService = (id) => {
    navigate(`/services/edit/${id}`);
  };

  const deleteService = async (id) => {
    try {
      await apiClient.delete(`/services/${id}`);
      setServiceListings(prev => prev.filter(s => s.id !== id));
      showToast('Service deleted successfully', 'success');
      setDeleteConfirmId(null);
    } catch (error) {
      showToast('Failed to delete service', 'error');
      setDeleteConfirmId(null);
    }
  };

  const filterActivities = () => {
    let filtered = activities

    // Filter by type
    if (selectedActivityType !== 'ALL') {
      filtered = filtered.filter(activity => 
        activity.activityType === selectedActivityType
      )
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredActivities(filtered)
  }

  const getActivityIcon = (activityType) => {
    const iconMap = {
      'REGISTERED': '✍️',
      'LOGGED_IN': '🔓',
      'LOGGED_OUT': '🔒',
      'ADDED_PRODUCT': '➕',
      'REMOVED_PRODUCT': '➖',
      'UPDATED_PRODUCT': '✏️',
      'ADDED_TO_CART': '🛒',
      'REMOVED_FROM_CART': '🗑️',
      'ORDER_PLACED': '📦',
      'ORDER_PAID': '💳',
      'ORDER_SHIPPED': '🚚',
      'ORDER_DELIVERED': '✅',
      'ORDER_CANCELLED': '❌',
      'COINS_EARNED': '🪙',
      'COINS_USED': '💰',
      'PASSWORD_CHANGED': '🔐',
      'PROFILE_UPDATED': '👤',
      'FARM_ADDED': '🌾',
      'FARM_UPDATED': '🔄',
      'FARM_DELETED': '❌',
      'CROP_ADDED': '🌱',
      'CROP_UPDATED': '🔄',
      'CROP_DELETED': '❌',
      'IRRIGATION_ADDED': '💧',
      'IRRIGATION_UPDATED': '🔄',
      'IRRIGATION_DELETED': '❌',
      'PAYMENT_FAILED': '⚠️'
    }
    return iconMap[activityType] || '📝'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back! 👋</h1>
          <p className="text-slate-400">Here's your farming dashboard overview</p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Farms Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Farms</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalFarms}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.totalFarms === 0 ? '✚ Add your first farm' : '📊 Manage farms'}
                </p>
              </div>
              <div className="text-5xl">🌾</div>
            </div>
            <Link 
              to="/farms"
              className="mt-4 inline-block px-4 py-2 bg-green-900/50 text-green-400 rounded-lg text-sm font-semibold hover:bg-green-900/70 transition"
            >
              View Farms →
            </Link>
          </div>

          {/* Crops Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Growing Crops</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalCrops}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.totalCrops === 0 ? '✚ Plant your first crop' : '🌱 Monitor growth'}
                </p>
              </div>
              <div className="text-5xl">🌱</div>
            </div>
            <Link 
              to="/crops"
              className="mt-4 inline-block px-4 py-2 bg-blue-900/50 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-900/70 transition"
            >
              View Crops →
            </Link>
          </div>

          {/* Products Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Listed Products</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalProducts}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.totalProducts === 0 ? '✚ Sell products' : '🛍️ Manage sales'}
                </p>
              </div>
              <div className="text-5xl">📦</div>
            </div>
            <Link 
              to="/selling"
              className="mt-4 inline-block px-4 py-2 bg-orange-900/50 text-orange-400 rounded-lg text-sm font-semibold hover:bg-orange-900/70 transition"
            >
              Manage →
            </Link>
          </div>

          {/* Orders Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Orders Placed</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalOrders}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.totalOrders === 0 ? '✚ Start shopping' : '🛒 View orders'}
                </p>
              </div>
              <div className="text-5xl">🛒</div>
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="mt-4 inline-block px-4 py-2 bg-purple-900/50 text-purple-400 rounded-lg text-sm font-semibold hover:bg-purple-900/70 transition"
            >
              Go to Cart →
            </button>
          </div>
        </div>

        {/* Coins, Irrigation & Services Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Coins Card */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Available Coins</p>
                <p className="text-4xl font-bold mt-2">{coins?.totalCoins || 0} 🪙</p>
                <p className="text-yellow-100 text-xs mt-2">≈ ₹{coins?.totalCoins || 0} in value</p>
              </div>
              <div className="text-6xl opacity-50">💰</div>
            </div>
          </div>

          {/* Irrigation Card */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Irrigation Schedules</p>
                <p className="text-4xl font-bold mt-2">{stats.totalIrrigations}</p>
                <p className="text-blue-100 text-xs mt-2">
                  {stats.totalIrrigations === 0 ? '✚ Create schedule' : '💧 Active schedules'}
                </p>
              </div>
              <div className="text-6xl opacity-50">💧</div>
            </div>
          </div>

          {/* Services Card */}
          <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Service Listings</p>
                <p className="text-4xl font-bold mt-2">{stats.totalServices}</p>
                <p className="text-indigo-100 text-xs mt-2">
                  {stats.totalServices === 0 ? '✚ List services' : '🔧 Active services'}
                </p>
              </div>
              <div className="text-6xl opacity-50">🚜</div>
            </div>
            <Link
              to="/irrigation-services"
              className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition"
            >
              View Services →
            </Link>
          </div>
        </div>

        {/* Service Listings Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">🚜</span> My Service Listings
          </h2>
          {/* Filter and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              placeholder="Filter by name or description..."
              className="px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={serviceSort}
              onChange={e => setServiceSort(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          {/* Filtered and Sorted Listings */}
          {serviceListings.length === 0 ? (
            <p className="text-slate-500">No service listings yet.</p>
          ) : (
            <ul>
              {serviceListings
                .filter(service =>
                  (!serviceFilter ||
                    (service.name && service.name.toLowerCase().includes(serviceFilter.toLowerCase())) ||
                    (service.description && service.description.toLowerCase().includes(serviceFilter.toLowerCase()))
                  )
                )
                .sort((a, b) => {
                  if (serviceSort === 'name') {
                    return (a.name || '').localeCompare(b.name || '');
                  } else if (serviceSort === 'price') {
                    return (a.price || 0) - (b.price || 0);
                  } else if (serviceSort === 'status') {
                    return (a.status || '').localeCompare(b.status || '');
                  }
                  return 0;
                })
                .map(service => (
                  <li key={service.id} className="flex items-center justify-between border-b border-slate-700 py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">🔧</span>
                      <div>
                        <div className="font-semibold text-white">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-slate-400 mt-1">{service.description}</div>
                        )}
                        {service.price && (
                          <div className="text-sm text-green-400 mt-1">₹{service.price}</div>
                        )}
                        {service.status && (
                          <div className="text-xs text-indigo-400 mt-1">Status: {service.status}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                        onClick={() => editService(service.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={() => setDeleteConfirmId(service.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}

          {/* Delete Confirmation Dialog */}
          {deleteConfirmId && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-black bg-opacity-50 absolute inset-0"></div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 relative z-10 w-96">
                <h3 className="text-lg font-bold text-white mb-4">Confirm Delete</h3>
                <p className="text-slate-300 mb-6">Are you sure you want to delete this service?</p>
                <div className="flex justify-end gap-3">
                  <button
                    className="bg-slate-600 text-slate-200 px-4 py-2 rounded hover:bg-slate-500 transition"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition"
                    onClick={() => deleteService(deleteConfirmId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">📊 Your Activity Feed</h2>
            <p className="text-indigo-100 text-sm mt-1">Track all your actions and interactions</p>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Activity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Activity Type</label>
                <select
                  value={selectedActivityType}
                  onChange={(e) => setSelectedActivityType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Search Activities</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search description..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="px-4 py-2 bg-indigo-900/50 text-indigo-300 rounded-lg font-semibold">
                  {filteredActivities.length} result{filteredActivities.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-slate-400 text-lg">📭 No activities found</p>
                <p className="text-slate-500 text-sm mt-2">Your activities will appear here</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-slate-700/50 transition">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0 pt-1">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{activity.description}</p>
                      {activity.details && (
                        <p className="text-xs text-slate-400 mt-1">{activity.details}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">{activity.timeAgo}</p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                        {activity.activityType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Activity Stats */}
          {activities.length > 0 && (
            <div className="px-6 py-4 bg-slate-700/50 border-t border-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {activities.filter(a => a.activityType.includes('FARM')).length}
                  </p>
                  <p className="text-xs text-slate-400">Farm Actions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {activities.filter(a => a.activityType.includes('CROP')).length}
                  </p>
                  <p className="text-xs text-slate-400">Crop Actions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {activities.filter(a => a.activityType.includes('ORDER')).length}
                  </p>
                  <p className="text-xs text-slate-400">Order Actions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {activities.filter(a => a.activityType.includes('COIN')).length}
                  </p>
                  <p className="text-xs text-slate-400">Coin Actions</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/farms')}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-4 hover:shadow-lg hover:bg-slate-700 transition text-left border-l-4 border-l-green-500"
          >
            <p className="text-2xl">🌾</p>
            <p className="font-semibold text-white mt-2">Add Farm</p>
            <p className="text-sm text-slate-400">Create a new farm</p>
          </button>
          
          <button
            onClick={() => navigate('/crops')}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-4 hover:shadow-lg hover:bg-slate-700 transition text-left border-l-4 border-l-blue-500"
          >
            <p className="text-2xl">🌱</p>
            <p className="font-semibold text-white mt-2">Plant Crop</p>
            <p className="text-sm text-slate-400">Add new crop</p>
          </button>

          <button
            onClick={() => navigate('/buying')}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-4 hover:shadow-lg hover:bg-slate-700 transition text-left border-l-4 border-l-orange-500"
          >
            <p className="text-2xl">🛒</p>
            <p className="font-semibold text-white mt-2">Shop</p>
            <p className="text-sm text-slate-400">Browse marketplace</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardEnhanced
