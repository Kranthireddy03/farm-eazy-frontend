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
      const response = await apiClient.post('/services/listings', postForm);
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
      showToast('Failed to create listing', 'error');
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
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'bookings'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Booking Requests
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
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Post Equipment / Workers</h2>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Type <span className="text-red-500">*</span></label>
                      <select
                        name="type"
                        value={postForm.type}
                        onChange={handlePostChange}
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
                      <label className="form-label">Title <span className="text-red-500">*</span></label>
                      <input
                        name="title"
                        value={postForm.title}
                        onChange={handlePostChange}
                        className="form-input"
                        placeholder="e.g., Mahindra Tractor 575 DI"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Location <span className="text-red-500">*</span></label>
                      <input
                        name="location"
                        value={postForm.location}
                        onChange={handlePostChange}
                        className="form-input"
                        placeholder="City / Village"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Rate <span className="text-red-500">*</span></label>
                      <input
                        name="rate"
                        value={postForm.rate}
                        onChange={handlePostChange}
                        className="form-input"
                        placeholder="e.g., ₹1200/hr"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Contact Name</label>
                      <input
                        name="contactName"
                        value={postForm.contactName}
                        onChange={handlePostChange}
                        className="form-input"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="form-label">Contact Phone</label>
                      <input
                        name="contactPhone"
                        value={postForm.contactPhone}
                        onChange={handlePostChange}
                        className="form-input"
                        placeholder="10-digit phone"
                      />
                    </div>
                    <div>
                      <label className="form-label">Contact Email</label>
                      <input
                        name="contactEmail"
                        value={postForm.contactEmail}
                        onChange={handlePostChange}
                        className="form-input"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Availability</label>
                    <select
                      name="availability"
                      value={postForm.availability}
                      onChange={handlePostChange}
                      className="form-input"
                    >
                      <option>Available</option>
                      <option>Limited</option>
                      <option>Booked</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Post Listing'}
                  </button>
                </form>
              </div>
            )}

            {/* Services Listings Grid */}
            {listings.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 text-lg">No service listings yet. Post the first one!</p>
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
