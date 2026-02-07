import { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

function IrrigationServices() {
  const { toast, showToast, closeToast } = useToast()
  const [activeTab, setActiveTab] = useState('listings') // 'listings' or 'bookings'

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
  const [showPostForm, setShowPostForm] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [editingListing, setEditingListing] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFarms();
    fetchCrops();
    fetchListings();
    fetchBookings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/services/listings');
      setListings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setLoading(false)
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
      const response = await apiClient.post('/services/bookings', bookingForm);
      setBookings((prev) => [response.data, ...prev]);
      setShowBookingForm(false);
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
    } catch (error) {
      console.error('Error deleting listing:', error)
      const errorMsg = error.response?.data?.message || 'Failed to delete listing'
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

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Irrigation Services</h1>
            <p className="text-gray-600 mt-1">Equipment & workers marketplace for your farm needs</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'listings'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Service Listings
          </button>
          <button
            onClick={() => listings.length > 0 && setActiveTab('bookings')}
            disabled={listings.length === 0}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'bookings'
                ? 'text-green-600 border-b-2 border-green-600'
                : listings.length === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title={listings.length === 0 ? 'No service listings available yet' : ''}
          >
            My Booking Requests {listings.length === 0 && '🔒'}
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
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-2xl border border-purple-200 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white bg-opacity-20 rounded-lg p-3">
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
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Service Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">⚙️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">✏️</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Be specific about model/capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Pricing Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      Location & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">🗺️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">₹</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Enter amount per hour</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span>
                      Contact Information
                      <span className="text-xs font-normal text-gray-500 ml-2">(Optional - uses profile info if blank)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">👤</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">📱</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">✉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
                        <span className="text-gray-400">📅</span>
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
                      className="px-8 py-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Pro Tip</p>
                        <p className="text-sm text-blue-800 mt-1">
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
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-2xl border-2 border-blue-400 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white bg-opacity-20 rounded-lg p-3">
                        <span className="text-3xl">✏️</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Edit Service Listing</h2>
                        <p className="text-blue-100 text-sm">Update your service information</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-white hover:text-blue-100 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
                      title="Cancel editing"
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleUpdateListing} className="p-8 space-y-6">
                  {/* Service Type Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Service Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">⚙️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">✏️</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Be specific about model/capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Pricing Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      Location & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">🗺️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">₹</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Enter amount per hour</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span>
                      Contact Information
                      <span className="text-xs font-normal text-gray-500 ml-2">(Optional)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">👤</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">📱</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <span className="text-gray-400">✉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
                        <span className="text-gray-400">📅</span>
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
                      className="px-8 py-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-900">Important Note</p>
                        <p className="text-sm text-yellow-800 mt-1">
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
                <p className="text-gray-600 text-lg font-semibold">No service listings yet</p>
                <p className="text-gray-500 text-sm mt-2">Post the first service to enable booking requests!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{listing.title || 'Untitled Listing'}</h3>
                        <p className="text-gray-600 text-sm">📍 {listing.location || 'Location not specified'}</p>
                      </div>
                      <span className="text-2xl">{getServiceIcon(listing.type)}</span>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Type</p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{listing.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Rate</p>
                        <p className="text-sm text-orange-600 font-semibold">{listing.rate || 'Rate not set'}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          listing.availability === 'Available' ? 'bg-green-100 text-green-700' :
                          listing.availability === 'Limited' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{listing.availability}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {listing.contactName && (
                        <p className="text-sm text-gray-700">👤 {listing.contactName}</p>
                      )}
                      {listing.contactPhone && (
                        <p className="text-sm text-gray-700">📞 {listing.contactPhone}</p>
                      )}
                      {listing.contactEmail && (
                        <p className="text-sm text-gray-700">✉️ {listing.contactEmail}</p>
                      )}
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
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
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Request a Service</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
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
                      placeholder="Describe irrigation or crop requirements"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Request Booking'}
                  </button>
                </form>
              </div>
            )}

            {/* Booking Requests Grid */}
            {bookings.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 text-lg">No booking requests yet. Create your first request!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{booking.serviceType} Service</h3>
                        <p className="text-gray-600 text-sm">📍 {booking.location || 'Location not specified'}</p>
                      </div>
                      <span className="text-2xl">{getServiceIcon(booking.serviceType)}</span>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Farm ID</p>
                        <p className="text-sm font-semibold text-gray-800">{booking.farmId || 'N/A'}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Crop ID</p>
                        <p className="text-sm font-semibold text-gray-800">{booking.cropId || 'N/A'}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Hours</p>
                        <p className="text-sm font-semibold text-gray-800">{booking.hours}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">People</p>
                        <p className="text-sm font-semibold text-gray-800">{booking.peopleCount}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Notes:</p>
                        <p className="text-sm text-gray-700">{booking.notes}</p>
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
