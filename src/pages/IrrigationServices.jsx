import { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

function IrrigationServices() {
  const { toast, showToast, closeToast } = useToast()
  const [activeTab, setActiveTab] = useState('listings') // 'listings', 'browse', 'bookings', or 'provider-requests'

  const [postForm, setPostForm] = useState({
    type: 'TRACTOR',
    title: '',
    location: '',
    rate: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    availability: 'Available'
  })

  const [bookingForm, setBookingForm] = useState({
    serviceType: 'TRACTOR',
    farmId: '',
    cropId: '',
    location: '',
    peopleCount: 1,
    hours: 2,
    notes: ''
  })

  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [loadingFarms, setLoadingFarms] = useState(true)
  const [loadingCrops, setLoadingCrops] = useState(true)

  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [allListings, setAllListings] = useState([]) // All available services to browse
  const [providerRequests, setProviderRequests] = useState([]) // Incoming booking requests for user's services
  const [myListingIds, setMyListingIds] = useState(new Set()) // IDs of user's own service listings
  const [showPostForm, setShowPostForm] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedService, setSelectedService] = useState(null) // Service being booked
  const [editingListing, setEditingListing] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFarms();
    fetchCrops();
    fetchListings();
    fetchBookings();
    fetchAllListings();
    fetchProviderRequests();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/services/listings/my');
      console.log('[DEBUG] /services/listings/my response:', response.data);
      const userListings = Array.isArray(response.data.content) ? response.data.content : Array.isArray(response.data) ? response.data : [];
      setListings(userListings);
      setMyListingIds(new Set(userListings.map(listing => listing.id)));
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
      setMyListingIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/services/bookings/my-bookings');
      setBookings(Array.isArray(response.data.content) ? response.data.content : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false)
    }
  };

  const fetchAllListings = async () => {
    try {
      const response = await apiClient.get('/services/listings');
      setAllListings(Array.isArray(response.data.content) ? response.data.content : Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching all listings:', error);
      setAllListings([]);
    }
  };

  const fetchProviderRequests = async () => {
    try {
      const response = await apiClient.get('/services/bookings/my-listings');
      setProviderRequests(Array.isArray(response.data.content) ? response.data.content : []);
    } catch (error) {
      console.error('Error fetching provider requests:', error);
      setProviderRequests([]);
    }
  };

  useEffect(() => {
    if (!bookingForm.farmId) return
    const availableCrops = crops.filter(
      (crop) => String(crop.farmId) === String(bookingForm.farmId)
    )
    if (availableCrops.length > 0) {
      setBookingForm((prev) => ({ ...prev, cropId: String(availableCrops[0].id) }))
    } else {
      setBookingForm((prev) => ({ ...prev, cropId: '' }))
    }
  }, [bookingForm.farmId, crops])

  const fetchFarms = async () => {
    try {
      setLoadingFarms(true)
      const response = await apiClient.get('/farms')
      const farmList = Array.isArray(response.data) ? response.data : []
      setFarms(farmList)
      if (farmList.length > 0) {
        setBookingForm((prev) => ({ ...prev, farmId: String(farmList[0].id) }))
      }
    } catch (error) {
      console.error('Error fetching farms:', error)
      setFarms([])
    } finally {
      setLoadingFarms(false)
    }
  }

  const fetchCrops = async () => {
    try {
      setLoadingCrops(true)
      const response = await apiClient.get('/crops')
      const cropList = Array.isArray(response.data) ? response.data : []
      setCrops(cropList)
      if (cropList.length > 0) {
        setBookingForm((prev) => ({ ...prev, cropId: String(cropList[0].id) }))
      }
    } catch (error) {
      console.error('Error fetching crops:', error)
      setCrops([])
    } finally {
      setLoadingCrops(false)
    }
  }

  const handlePostChange = (e) => {
    const { name, value } = e.target
    setPostForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBookingChange = (e) => {
    const { name, value } = e.target
    setBookingForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.location || !postForm.rate) {
      showToast('Please fill all required fields', 'warning')
      return
    }
    try {
      setLoading(true)
      // Send all fields to backend
      const serviceData = {
        serviceName: postForm.title,
        description: `${postForm.type} service available in ${postForm.location}. Contact: ${postForm.contactName || 'N/A'}, Phone: ${postForm.contactPhone || 'N/A'}. Status: ${postForm.availability}`,
        price: parseFloat(postForm.rate),
        type: postForm.type,
        location: postForm.location,
        availability: postForm.availability || 'Available',
        contactName: postForm.contactName,
        contactPhone: postForm.contactPhone,
        contactEmail: postForm.contactEmail
      };
      const response = await apiClient.post('/services/listings', serviceData);
      setListings((prev) => [response.data, ...prev]);
      setPostForm({
        type: 'TRACTOR',
        title: '',
        location: '',
        rate: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        availability: 'Available'
      });
      setShowPostForm(false);
      showToast('Service listing created successfully!', 'success');
      fetchListings();
    } catch (error) {
      console.error('Error posting listing:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create listing';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false)
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.farmId || !bookingForm.location) {
      showToast('Please fill all required fields', 'warning')
      return
    }
    try {
      setLoading(true)
      const bookingData = {
        ...bookingForm,
        serviceListingId: selectedService?.id || null
      };
      const response = await apiClient.post('/services/bookings', bookingData);
      setBookings((prev) => [response.data, ...prev]);
      setShowBookingForm(false);
      setSelectedService(null);
      showToast('Booking request submitted successfully!', 'success');
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      showToast('Failed to create booking', 'error');
    } finally {
      setLoading(false)
    }
  };

  const handleEditClick = (listing) => {
    setEditingListing(listing)
    setPostForm({
      type: listing.type || 'TRACTOR',
      title: listing.title || listing.serviceName || '',
      location: listing.location || '',
      rate: listing.rate?.toString() || listing.price?.toString() || '',
      contactName: listing.contactName || '',
      contactPhone: listing.contactPhone || '',
      contactEmail: listing.contactEmail || '',
      availability: listing.availability || 'Available'
    })
    setShowPostForm(false)
  }

  const handleCancelEdit = () => {
    setEditingListing(null)
    setPostForm({
      type: 'TRACTOR',
      title: '',
      location: '',
      rate: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      availability: 'Available'
    })
  }

  const handleUpdateListing = async (e) => {
    e.preventDefault()
    if (!postForm.title || !postForm.location || !postForm.rate) {
      showToast('Please fill all required fields', 'warning')
      return
    }
    try {
      setLoading(true)
      const serviceData = {
        serviceName: postForm.title,
        description: `${postForm.type} service available in ${postForm.location}. Contact: ${postForm.contactName || 'N/A'}, Phone: ${postForm.contactPhone || 'N/A'}. Status: ${postForm.availability}`,
        price: parseFloat(postForm.rate),
        type: postForm.type,
        location: postForm.location,
        availability: postForm.availability || 'Available',
        contactName: postForm.contactName,
        contactPhone: postForm.contactPhone,
        contactEmail: postForm.contactEmail
      }
      await apiClient.put(`/services/listings/${editingListing.id}`, serviceData)
      showToast('Service listing updated successfully!', 'success')
      setEditingListing(null)
      handleCancelEdit()
      fetchListings()
    } catch (error) {
      console.error('Error updating listing:', error)
      const errorMsg = error.response?.data?.message || 'Failed to update listing'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this service listing?')) {
      return
    }
    try {
      setLoading(true)
      await apiClient.delete(`/services/listings/${listingId}`)
      setListings((prev) => prev.filter((l) => l.id !== listingId))
      showToast('Service listing deleted successfully!', 'success')
      fetchAllListings() // Refresh browse listings too
    } catch (error) {
      console.error('Error deleting listing:', error)
      const errorMsg = error.response?.data?.message || 'Failed to delete listing'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBookService = (service) => {
    setSelectedService(service)
    setShowBookingForm(true)
    setActiveTab('bookings')
  }

  const handleApproveBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to approve this booking request?')) {
      return
    }
    try {
      setLoading(true)
      await apiClient.put(`/services/bookings/${bookingId}/approve`)
      showToast('Booking request approved successfully!', 'success')
      fetchProviderRequests()
    } catch (error) {
      console.error('Error approving booking:', error)
      const errorMsg = error.response?.data?.message || 'Failed to approve booking'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeclineBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to decline this booking request?')) {
      return
    }
    try {
      setLoading(true)
      await apiClient.put(`/services/bookings/${bookingId}/decline`)
      showToast('Booking request declined.', 'info')
      fetchProviderRequests()
    } catch (error) {
      console.error('Error declining booking:', error)
      const errorMsg = error.response?.data?.message || 'Failed to decline booking'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getServiceIcon = (type) => {
    switch(type) {
      case 'TRACTOR': return '🚜'
      case 'JCB': return '🏗️'
      case 'MANUAL': return '👷'
      case 'IRRIGATION': return '💧'
      default: return '🔧'
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-600'
      case 'APPROVED':
        return 'bg-green-900/50 text-green-400 border-green-600'
      case 'DECLINED':
        return 'bg-red-900/50 text-red-400 border-red-600'
      case 'COMPLETED':
        return 'bg-blue-900/50 text-blue-400 border-blue-600'
      case 'CANCELLED':
        return 'bg-slate-700 text-slate-400 border-slate-600'
      default:
        return 'bg-slate-700 text-slate-400 border-slate-600'
    }
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
            <h1 className="text-3xl font-bold text-white">Irrigation Services</h1>
            <p className="text-slate-400 mt-1">Equipment & workers marketplace for your farm needs</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'listings'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Service Listings
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'browse'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Browse & Book Services
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Booking Requests
          </button>
          <button
            onClick={() => setActiveTab('provider-requests')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'provider-requests'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Provider Requests
          </button>
        </div>

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <>
            {/* Add Listing Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                className="btn-primary"
              >
                {showPostForm ? 'Cancel' : '+ Post Service'}
              </button>
            </div>

            {/* Post Service Form */}
            {showPostForm && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <span className="text-3xl">🚜</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">List Your Service</h2>
                        <p className="text-purple-100 text-sm">Share equipment or offer skilled labor</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handlePostSubmit} className="p-8 space-y-6">
                  {/* Service Type Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Service Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Service Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="type"
                            value={postForm.type}
                            onChange={handlePostChange}
                            className="form-input pl-10 appearance-none cursor-pointer hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            required
                          >
                            <option value="TRACTOR">🚜 Tractor</option>
                            <option value="JCB">🏗️ JCB / Excavator</option>
                            <option value="MANUAL">👷 Manual Workers</option>
                            <option value="IRRIGATION">💧 Irrigation Equipment</option>
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">⚙️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Service Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="title"
                            value={postForm.title}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="e.g., Mahindra Tractor 575 DI"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">✏️</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Be specific about model/capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Pricing Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      Location & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Service Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="location"
                            value={postForm.location}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="City / Village / District"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">🗺️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Hourly Rate <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="rate"
                            type="number"
                            value={postForm.rate}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="1200"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">₹</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Enter amount per hour</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span>
                      Contact Information
                      <span className="text-xs font-normal text-slate-400 ml-2">(Optional - uses profile info if blank)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Contact Name
                        </label>
                        <div className="relative">
                          <input
                            name="contactName"
                            value={postForm.contactName}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="Your name"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">👤</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            name="contactPhone"
                            value={postForm.contactPhone}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="10-digit mobile"
                            maxLength="10"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">📱</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            name="contactEmail"
                            type="email"
                            value={postForm.contactEmail}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="your@email.com"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">✉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">⏰</span>
                      Availability Status
                    </h3>
                    <div className="relative">
                      <select
                        name="availability"
                        value={postForm.availability}
                        onChange={handlePostChange}
                        className="form-input pl-10 appearance-none cursor-pointer hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      >
                        <option value="Available">✅ Available Now</option>
                        <option value="Limited">⚠️ Limited Availability</option>
                        <option value="Booked">⛔ Fully Booked</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <span className="text-slate-400">📅</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Creating Listing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>🚀</span>
                          Post Service Listing
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPostForm(false)}
                      className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-slate-300 font-semibold rounded-xl transition-all duration-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-300">Pro Tip</p>
                        <p className="text-sm text-blue-200 mt-1">
                          Include clear details about your equipment condition, availability hours, and any special requirements to get more booking requests!
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Service Form */}
            {editingListing && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border-2 border-blue-400 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <span className="text-3xl">✏️</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Edit Service Listing</h2>
                        <p className="text-blue-100 text-sm">Update your service information</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-white hover:text-blue-100 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                      title="Cancel editing"
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleUpdateListing} className="p-8 space-y-6">
                  {/* Service Type Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Service Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Service Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="type"
                            value={postForm.type}
                            onChange={handlePostChange}
                            className="form-input pl-10 appearance-none cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            required
                          >
                            <option value="TRACTOR">🚜 Tractor</option>
                            <option value="JCB">🏗️ JCB / Excavator</option>
                            <option value="MANUAL">👷 Manual Workers</option>
                            <option value="IRRIGATION">💧 Irrigation Equipment</option>
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">⚙️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Service Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="title"
                            value={postForm.title}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="e.g., Mahindra Tractor 575 DI"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">✏️</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Be specific about model/capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Pricing Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      Location & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Service Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="location"
                            value={postForm.location}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="City / Village / District"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">🗺️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Hourly Rate <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="rate"
                            type="number"
                            value={postForm.rate}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="1200"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">₹</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Enter amount per hour</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span>
                      Contact Information
                      <span className="text-xs font-normal text-slate-400 ml-2">(Optional)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Contact Name
                        </label>
                        <div className="relative">
                          <input
                            name="contactName"
                            value={postForm.contactName}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Your name"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">👤</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            name="contactPhone"
                            value={postForm.contactPhone}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="10-digit mobile"
                            maxLength="10"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">📱</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            name="contactEmail"
                            type="email"
                            value={postForm.contactEmail}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="your@email.com"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400">✉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="bg-slate-700 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">⏰</span>
                      Availability Status
                    </h3>
                    <div className="relative">
                      <select
                        name="availability"
                        value={postForm.availability}
                        onChange={handlePostChange}
                        className="form-input pl-10 appearance-none cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        <option value="Available">✅ Available Now</option>
                        <option value="Limited">⚠️ Limited Availability</option>
                        <option value="Booked">⛔ Fully Booked</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <span className="text-slate-400">📅</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Updating Listing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>💾</span>
                          Save Changes
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-slate-300 font-semibold rounded-xl transition-all duration-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-300">Important Note</p>
                        <p className="text-sm text-yellow-200 mt-1">
                          Changes will be visible immediately. Make sure all information is accurate before saving.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Services Listings Grid */}
            {listings.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <p className="text-slate-300 text-lg font-semibold">No service listings yet</p>
                <p className="text-slate-400 text-sm mt-2">Post the first service to enable booking requests!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{listing.title || listing.serviceName || 'Untitled Listing'}</h3>
                        <p className="text-slate-400 text-sm">📍 {listing.location || 'Location not specified'}</p>
                      </div>
                      <span className="text-2xl">{getServiceIcon(listing.type)}</span>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Type</p>
                        <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full font-semibold">{listing.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Rate</p>
                        <p className="text-sm text-orange-400 font-semibold">{listing.rate || listing.price || 'Rate not set'}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Status</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          listing.availability === 'Available' ? 'bg-green-900/50 text-green-400' :
                          listing.availability === 'Limited' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>{listing.availability}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {listing.contactName && (
                        <p className="text-sm text-slate-300">👤 {listing.contactName}</p>
                      )}
                      {listing.contactPhone && (
                        <p className="text-sm text-slate-300">📞 {listing.contactPhone}</p>
                      )}
                      {listing.contactEmail && (
                        <p className="text-sm text-slate-300">✉️ {listing.contactEmail}</p>
                      )}
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                      <button
                        onClick={() => handleEditClick(listing)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* BROWSE & BOOK SERVICES TAB */}
        {activeTab === 'browse' && (
          <>
            {/* Browse Services Grid */}
            {allListings.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-slate-300 text-lg font-semibold">No services available yet</p>
                <p className="text-slate-400 text-sm mt-2">Check back later for available services!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.map((listing) => (
                  <div key={listing.id} className="card hover:shadow-lg transition-shadow border-2 border-slate-600">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{listing.serviceName || listing.title || 'Untitled Service'}</h3>
                        <p className="text-slate-400 text-sm">📍 {listing.location || 'Location not specified'}</p>
                      </div>
                      <span className="text-3xl">{getServiceIcon(listing.type)}</span>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Type</p>
                        <span className="text-xs bg-green-900/50 text-green-400 px-3 py-1 rounded-full font-semibold">{listing.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Hourly Rate</p>
                        <p className="text-lg text-green-400 font-bold">₹{listing.price || listing.rate || 'N/A'}/hr</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Availability</p>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          listing.availability === 'Available' ? 'bg-green-900/50 text-green-400' :
                          listing.availability === 'Limited' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>{listing.availability}</span>
                      </div>
                    </div>

                    {listing.description && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-1">Description:</p>
                        <p className="text-sm text-slate-300 line-clamp-3">{listing.description}</p>
                      </div>
                    )}

                    <div className="space-y-1 mb-4">
                      {listing.contactName && (
                        <p className="text-sm text-slate-300">👤 {listing.contactName}</p>
                      )}
                      {listing.contactPhone && (
                        <p className="text-sm text-slate-300">📞 {listing.contactPhone}</p>
                      )}
                      {listing.contactEmail && (
                        <p className="text-sm text-slate-300">✉️ {listing.contactEmail}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleBookService(listing)}
                      disabled={listing.availability === 'Booked' || myListingIds.has(listing.id)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        listing.availability === 'Booked' || myListingIds.has(listing.id)
                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transform hover:scale-105 active:scale-95'
                      }`}
                    >
                      {listing.availability === 'Booked' ? '⛔ Fully Booked' :
                       myListingIds.has(listing.id) ? '🔒 Your Own Service' :
                       '📝 Book This Service'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <>
            {/* Add Booking Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="btn-primary"
              >
                {showBookingForm ? 'Cancel' : '+ Request Service'}
              </button>
            </div>

            {/* Booking Form */}
            {showBookingForm && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border-2 border-green-500 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">📝</span>
                    Request a Service
                  </h2>
                  {selectedService && (
                    <div className="mt-2 bg-slate-700/50 rounded-lg p-3 text-white">
                      <p className="text-sm font-semibold">Booking: {selectedService.serviceName || selectedService.title}</p>
                      <p className="text-xs">Rate: ₹{selectedService.price || selectedService.rate}/hr • {selectedService.type}</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleBookingSubmit} className="p-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Service Type <span className="text-red-500">*</span></label>
                      <select
                        name="serviceType"
                        value={bookingForm.serviceType}
                        onChange={handleBookingChange}
                        className="form-input"
                        required
                      >
                        <option value="TRACTOR">Tractor</option>
                        <option value="JCB">JCB</option>
                        <option value="MANUAL">Manual Workers</option>
                        <option value="IRRIGATION">Irrigation Tools</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Location <span className="text-red-500">*</span></label>
                      <input
                        name="location"
                        value={bookingForm.location}
                        onChange={handleBookingChange}
                        className="form-input"
                        placeholder="Farm location"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Farm <span className="text-red-500">*</span></label>
                      <select
                        name="farmId"
                        value={bookingForm.farmId}
                        onChange={handleBookingChange}
                        className="form-input"
                        required
                      >
                        {loadingFarms && <option>Loading farms...</option>}
                        {!loadingFarms && farms.length === 0 && <option>No farms found</option>}
                        {!loadingFarms && farms.map((farm) => (
                          <option key={farm.id} value={farm.id}>
                            {farm.farmName || farm.name || `Farm #${farm.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Crop</label>
                      <select
                        name="cropId"
                        value={bookingForm.cropId}
                        onChange={handleBookingChange}
                        className="form-input"
                      >
                        {loadingCrops && <option>Loading crops...</option>}
                        {!loadingCrops && crops.length === 0 && <option>No crops found</option>}
                        {!loadingCrops && crops.length > 0 && (
                          crops.filter(
                            (crop) => String(crop.farmId) === String(bookingForm.farmId)
                          ).length === 0
                        ) && <option>No crops for selected farm</option>}
                        {!loadingCrops && crops.filter(
                          (crop) => String(crop.farmId) === String(bookingForm.farmId)
                        ).map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.cropName || crop.name || `Crop #${crop.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Hours Required <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="hours"
                        min="1"
                        value={bookingForm.hours}
                        onChange={handleBookingChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">People / Workers Count <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="peopleCount"
                        min="1"
                        value={bookingForm.peopleCount}
                        onChange={handleBookingChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Notes / Requirements</label>
                    <textarea
                      name="notes"
                      value={bookingForm.notes}
                      onChange={handleBookingChange}
                      className="form-input"
                      rows="3"
                      placeholder="Describe your requirements for this service"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>🚀</span>
                          Request Booking
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false)
                        setSelectedService(null)
                      }}
                      className="px-8 py-3 border-2 border-slate-600 hover:border-slate-500 text-slate-300 font-semibold rounded-lg transition-all duration-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>

                  {selectedService && (
                    <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="text-sm font-semibold text-blue-300">Booking Information</p>
                          <p className="text-sm text-blue-200 mt-1">
                            This request will be sent to the service provider. You'll be notified once they respond to your request.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Booking Requests Grid */}
            {bookings.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-slate-300 text-lg font-semibold">No booking requests yet</p>
                <p className="text-slate-400 text-sm mt-2">Browse available services and make your first booking!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{booking.serviceType} Service</h3>
                        <p className="text-slate-400 text-sm">📍 {booking.location || 'Location not specified'}</p>
                        {booking.providerName && (
                          <p className="text-slate-400 text-xs mt-1">Provider: {booking.providerName}</p>
                        )}
                      </div>
                      <span className="text-2xl">{getServiceIcon(booking.serviceType)}</span>
                    </div>

                    <div className="mb-3">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                      {booking.farmName && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-400">Farm</p>
                          <p className="text-sm font-semibold text-white">{booking.farmName}</p>
                        </div>
                      )}
                      {booking.cropName && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-400">Crop</p>
                          <p className="text-sm font-semibold text-white">{booking.cropName}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Hours</p>
                        <p className="text-sm font-semibold text-white">{booking.hours}hrs</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">People</p>
                        <p className="text-sm font-semibold text-white">{booking.peopleCount}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Notes:</p>
                        <p className="text-sm text-slate-300 bg-slate-700 p-2 rounded">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PROVIDER REQUESTS TAB */}
        {activeTab === 'provider-requests' && (
          <>
            {/* Provider Requests Grid */}
            {providerRequests.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">📬</div>
                <p className="text-slate-300 text-lg font-semibold">No booking requests yet</p>
                <p className="text-slate-400 text-sm mt-2">When customers book your services, they will appear here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providerRequests.map((request) => (
                  <div key={request.id} className="card hover:shadow-lg transition-shadow border-2 border-blue-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{request.serviceType} Service Request</h3>
                        <p className="text-slate-400 text-sm">📍 {request.location || 'Location not specified'}</p>
                        {request.customerName && (
                          <p className="text-blue-400 text-sm font-semibold mt-1">Customer: {request.customerName}</p>
                        )}
                      </div>
                      <span className="text-3xl">{getServiceIcon(request.serviceType)}</span>
                    </div>

                    <div className="mb-3">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                      {request.farmName && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-400">Farm</p>
                          <p className="text-sm font-semibold text-white">{request.farmName}</p>
                        </div>
                      )}
                      {request.cropName && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-400">Crop</p>
                          <p className="text-sm font-semibold text-white">{request.cropName}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">Hours Requested</p>
                        <p className="text-sm font-semibold text-white">{request.hours}hrs</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-400">People Count</p>
                        <p className="text-sm font-semibold text-white">{request.peopleCount}</p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-1">Customer Notes:</p>
                        <p className="text-sm text-slate-300 bg-blue-900/30 p-3 rounded border border-blue-700">{request.notes}</p>
                      </div>
                    )}

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                        <button
                          onClick={() => handleApproveBooking(request.id)}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleDeclineBooking(request.id)}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          ❌ Decline
                        </button>
                      </div>
                    )}

                    {request.status !== 'PENDING' && (
                      <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                        <p className="text-sm text-slate-400 font-semibold">
                          {request.status === 'APPROVED' && '✅ You approved this request'}
                          {request.status === 'DECLINED' && '❌ You declined this request'}
                          {request.status === 'COMPLETED' && '✓ Request completed'}
                          {request.status === 'CANCELLED' && '⊘ Request cancelled'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default IrrigationServices
