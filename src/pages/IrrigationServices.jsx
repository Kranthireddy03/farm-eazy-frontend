import { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'

function IrrigationServices() {
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

  useEffect(() => {
    fetchFarms();
    fetchCrops();
    fetchListings();
    fetchBookings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await apiClient.get('/services/listings');
      setListings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/services/bookings');
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
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
    try {
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
    } catch (error) {
      console.error('Error posting listing:', error);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/services/bookings', bookingForm);
      setBookings((prev) => [response.data, ...prev]);
      setShowBookingForm(false);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Irrigation Services & Farm Helpers</h1>
          <p className="text-gray-600">
            Post equipment or workers and book services for irrigation and crop requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Post Listings */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Equipment / Workers</h2>
              <p className="text-sm text-gray-600 mb-4">Share tractors, JCBs, irrigation tools, or skilled workers with farmers nearby.</p>

              <button
                onClick={() => setShowPostForm((prev) => !prev)}
                className="w-full mb-4 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
              >
                {showPostForm ? 'Close Form' : 'Post a Listing'}
              </button>

              {showPostForm && (
                <form onSubmit={handlePostSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={postForm.type}
                      onChange={handlePostChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="TRACTOR">Tractor</option>
                      <option value="JCB">JCB</option>
                      <option value="MANUAL">Manual Workers</option>
                      <option value="IRRIGATION">Irrigation Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      name="location"
                      value={postForm.location}
                      onChange={handlePostChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="City / Village"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    value={postForm.title}
                    onChange={handlePostChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Eg: Mahindra Tractor 575 DI"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                    <input
                      name="rate"
                      value={postForm.rate}
                      onChange={handlePostChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Eg: ₹1200/hr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <select
                      name="availability"
                      value={postForm.availability}
                      onChange={handlePostChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option>Available</option>
                      <option>Limited</option>
                      <option>Booked</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      name="contactName"
                      value={postForm.contactName}
                      onChange={handlePostChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      name="contactPhone"
                      value={postForm.contactPhone}
                      onChange={handlePostChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="10-digit phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    name="contactEmail"
                    value={postForm.contactEmail}
                    onChange={handlePostChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="example@email.com"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Post Listing
                </button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Active Listings</h3>
              <div className="space-y-3">
                {listings.length === 0 && (
                  <div className="text-sm text-gray-500">No listings yet. Post the first one!</div>
                )}
                {listings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{listing.title || 'Untitled Listing'}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{listing.type}</span>
                    </div>
                    <p className="text-sm text-gray-600">📍 {listing.location || 'Location not specified'}</p>
                    <p className="text-sm text-orange-600 font-semibold">{listing.rate || 'Rate not set'}</p>
                    <p className="text-sm text-gray-700 mt-1">Contact: {listing.contactName || 'N/A'}</p>
                    {listing.contactPhone && <p className="text-sm text-gray-700">📞 {listing.contactPhone}</p>}
                    {listing.contactEmail && <p className="text-sm text-gray-700">✉️ {listing.contactEmail}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Book a Service</h2>
              <p className="text-sm text-gray-600 mb-4">Request equipment or workers for irrigation and crop requirements.</p>

              <button
                onClick={() => setShowBookingForm((prev) => !prev)}
                className="w-full mb-4 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
              >
                {showBookingForm ? 'Close Form' : 'Request a Booking'}
              </button>

              {showBookingForm && (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select
                      name="serviceType"
                      value={bookingForm.serviceType}
                      onChange={handleBookingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="TRACTOR">Tractor</option>
                      <option value="JCB">JCB</option>
                      <option value="MANUAL">Manual Workers</option>
                      <option value="IRRIGATION">Irrigation Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      name="location"
                      value={bookingForm.location}
                      onChange={handleBookingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Farm location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                    <select
                      name="farmId"
                      value={bookingForm.farmId}
                      onChange={handleBookingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                    <select
                      name="cropId"
                      value={bookingForm.cropId}
                      onChange={handleBookingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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

                {bookingForm.serviceType === 'MANUAL' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">People Count</label>
                      <input
                        type="number"
                        name="peopleCount"
                        min="1"
                        value={bookingForm.peopleCount}
                        onChange={handleBookingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                      <input
                        type="number"
                        name="hours"
                        min="1"
                        value={bookingForm.hours}
                        onChange={handleBookingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                      <input
                        type="number"
                        name="hours"
                        min="1"
                        value={bookingForm.hours}
                        onChange={handleBookingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">People Needed</label>
                      <input
                        type="number"
                        name="peopleCount"
                        min="1"
                        value={bookingForm.peopleCount}
                        onChange={handleBookingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Requirements</label>
                  <textarea
                    name="notes"
                    value={bookingForm.notes}
                    onChange={handleBookingChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                    placeholder="Describe irrigation or crop requirements"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Request Booking
                </button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Booking Requests</h3>
              <div className="space-y-3">
                {bookings.length === 0 && (
                  <div className="text-sm text-gray-500">No booking requests yet.</div>
                )}
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{booking.serviceType} Service</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Requested</span>
                    </div>
                    <p className="text-sm text-gray-600">📍 {booking.location || 'Location not specified'}</p>
                    <p className="text-sm text-gray-700">
                      Farm: {booking.farmId || 'N/A'} · Crop: {booking.cropId || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">Hours: {booking.hours} · People: {booking.peopleCount}</p>
                    {booking.notes && <p className="text-sm text-gray-600 mt-1">Notes: {booking.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">How it Works</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Post your equipment or worker details.</li>
                <li>2. Farmers book services based on crop or irrigation needs.</li>
                <li>3. Confirm availability and schedule the job.</li>
                <li>4. Track the booking and complete the task.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IrrigationServices
