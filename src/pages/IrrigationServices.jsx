import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import { useTheme } from '../context/ThemeContext'
import { useLocationContext } from '../context/LocationContext'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { KpiSection } from '../components/app/KpiSection'
import { KpiCard } from '../components/ui/kpi-card'
import { IrrigationPageAside } from '../components/irrigation/IrrigationPageAside'
import { FeChip } from '../components/platform/FeOpsPrimitives'
import { cn } from '../lib/utils'

const SERVICE_TABS = [
  { value: 'listings', label: 'My listings' },
  { value: 'browse', label: 'Browse & book' },
  { value: 'bookings', label: 'My bookings' },
  { value: 'provider-requests', label: 'Provider queue' },
]

function IrrigationServices() {
  const { isDark } = useTheme()
  const { selectedLocation } = useLocationContext()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('listings') // 'listings', 'browse', 'bookings', or 'provider-requests'

  const [postForm, setPostForm] = useState({
    type: 'TRACTOR',
    title: '',
    location: '',
    serviceableLocations: '',
    serviceRadiusKm: 20,
    rate: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    availability: 'Available',
    attachmentUrls: ''
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
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [eligibilityLoading, setEligibilityLoading] = useState(true)
  const [listingEligibility, setListingEligibility] = useState(null)

  useEffect(() => {
    const loadInitialData = async () => {
      const eligibility = await fetchListingEligibility()
      fetchFarms()
      fetchCrops()
      fetchBookings()
      fetchAllListings()

      if (eligibility?.eligible) {
        fetchListings()
        fetchProviderRequests()
      } else {
        setListings([])
        setProviderRequests([])
        setMyListingIds(new Set())
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const onLocationChanged = () => {
      fetchAllListings()
      fetchListings()
    }
    window.addEventListener('farmeazy:location-changed', onLocationChanged)
    window.addEventListener('storage', onLocationChanged)
    return () => {
      window.removeEventListener('farmeazy:location-changed', onLocationChanged)
      window.removeEventListener('storage', onLocationChanged)
    }
  }, [])

  const fetchListingEligibility = async () => {
    try {
      setEligibilityLoading(true)
      const response = await apiClient.get('/vendors/listing-eligibility?listingType=SERVICE', {
        validateStatus: (status) => status < 500,
      })
      const eligibility = response?.data || null
      setListingEligibility(eligibility)
      return eligibility
    } catch (error) {
      console.error('Error fetching listing eligibility:', error)
      const fallbackEligibility = {
        eligible: false,
        verificationInProgress: false,
        verificationMessage: 'Unable to validate vendor verification right now. Please complete or retry verification.',
        verificationRedirectPath: '/vendor-verification'
      }
      setListingEligibility(fallbackEligibility)
      return fallbackEligibility
    } finally {
      setEligibilityLoading(false)
    }
  }

  const handleOpenPostService = () => {
    if (!listingEligibility?.eligible) {
      showToast(listingEligibility?.verificationMessage || 'Complete vendor verification first.', 'warning')
      navigate(listingEligibility?.verificationRedirectPath || '/vendor-dashboard')
      return
    }
    setShowPostForm(!showPostForm)
  }

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/services/listings/my');
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
      const response = await apiClient.get('/services/nearby');
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

  const handleAttachmentFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachmentFiles(files.slice(0, 8))
  }

  const uploadAttachmentFilesIfAny = async () => {
    if (!attachmentFiles.length) {
      return []
    }

    const formData = new FormData()
    attachmentFiles.forEach((file) => formData.append('files', file))

    setUploadingAttachments(true)
    try {
      const uploadResponse = await apiClient.post('/services/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return Array.isArray(uploadResponse?.data?.urls) ? uploadResponse.data.urls : []
    } finally {
      setUploadingAttachments(false)
    }
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

    const confirmation = window.confirm(
      `Confirm service listing details:\n\nService: ${postForm.title}\nPrimary Location: ${postForm.location}\nServiceable Locations: ${postForm.serviceableLocations || postForm.location}\nRate: INR ${postForm.rate}/hour\n\nProceed to publish?`
    );
    if (!confirmation) {
      return;
    }

    try {
      const eligibilityResponse = await apiClient.get('/vendors/listing-eligibility?listingType=SERVICE', {
        validateStatus: (status) => status < 500,
      })
      const eligibility = eligibilityResponse?.data || {}
      if (!eligibility.eligible) {
        const firstReason = Array.isArray(eligibility.missingRequirements) && eligibility.missingRequirements.length
          ? eligibility.missingRequirements[0]
          : 'Listing eligibility requirements are not complete.'
        showToast(firstReason, 'warning')
        navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard')
        return
      }
    } catch (eligibilityError) {
      showToast('Unable to validate listing eligibility right now. Please try again.', 'error')
      return
    }

    try {
      setLoading(true)
      const uploadedAttachmentUrls = await uploadAttachmentFilesIfAny()
      // Send all fields to backend
      const serviceData = {
        serviceName: postForm.title,
        description: `${postForm.type} service available in ${postForm.location}. Serviceable: ${postForm.serviceableLocations || postForm.location}. Contact: ${postForm.contactName || 'N/A'}, Phone: ${postForm.contactPhone || 'N/A'}. Status: ${postForm.availability}`,
        price: parseFloat(postForm.rate),
        type: postForm.type,
        location: postForm.location,
        latitude: selectedLocation?.latitude ?? null,
        longitude: selectedLocation?.longitude ?? null,
        serviceRadiusKm: Number(postForm.serviceRadiusKm) || 20,
        availability: postForm.availability || 'Available',
        contactName: postForm.contactName,
        contactPhone: postForm.contactPhone,
        contactEmail: postForm.contactEmail,
        attachmentUrls: uploadedAttachmentUrls
      };
      const response = await apiClient.post('/services/listings', serviceData);
      setListings((prev) => [response.data, ...prev]);
      setPostForm({
        type: 'TRACTOR',
        title: '',
        location: '',
        serviceableLocations: '',
        serviceRadiusKm: 20,
        rate: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        availability: 'Available',
        attachmentUrls: ''
      });
      setAttachmentFiles([])
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
      serviceableLocations: listing.serviceableLocations || '',
      serviceRadiusKm: listing.serviceRadiusKm || 20,
      rate: listing.rate?.toString() || listing.price?.toString() || '',
      contactName: listing.contactName || '',
      contactPhone: listing.contactPhone || '',
      contactEmail: listing.contactEmail || '',
      availability: listing.availability || 'Available',
      attachmentUrls: Array.isArray(listing.attachmentUrls) ? listing.attachmentUrls.join('\n') : ''
    })
    setShowPostForm(false)
  }

  const handleCancelEdit = () => {
    setEditingListing(null)
    setPostForm({
      type: 'TRACTOR',
      title: '',
      location: '',
      serviceableLocations: '',
      serviceRadiusKm: 20,
      rate: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      availability: 'Available',
      attachmentUrls: ''
    })
    setAttachmentFiles([])
  }

  const handleUpdateListing = async (e) => {
    e.preventDefault()
    if (!postForm.title || !postForm.location || !postForm.rate) {
      showToast('Please fill all required fields', 'warning')
      return
    }
    try {
      setLoading(true)
      const uploadedAttachmentUrls = await uploadAttachmentFilesIfAny()
      const serviceData = {
        serviceName: postForm.title,
        description: `${postForm.type} service available in ${postForm.location}. Serviceable: ${postForm.serviceableLocations || postForm.location}. Contact: ${postForm.contactName || 'N/A'}, Phone: ${postForm.contactPhone || 'N/A'}. Status: ${postForm.availability}`,
        price: parseFloat(postForm.rate),
        type: postForm.type,
        location: postForm.location,
        latitude: selectedLocation?.latitude ?? editingListing?.latitude ?? null,
        longitude: selectedLocation?.longitude ?? editingListing?.longitude ?? null,
        serviceRadiusKm: Number(postForm.serviceRadiusKm) || editingListing?.serviceRadiusKm || 20,
        availability: postForm.availability || 'Available',
        contactName: postForm.contactName,
        contactPhone: postForm.contactPhone,
        contactEmail: postForm.contactEmail,
        attachmentUrls: uploadedAttachmentUrls.length
          ? uploadedAttachmentUrls
          : (Array.isArray(editingListing?.attachmentUrls) ? editingListing.attachmentUrls : [])
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
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getServiceAttachments = (listing) => {
    if (!listing || !Array.isArray(listing.attachmentUrls)) {
      return [];
    }
    return listing.attachmentUrls.filter((url) => typeof url === 'string' && url.trim());
  }

  const isVideoAttachment = (url) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url || '');

  const getVideoType = (url) => {
    if (/\.webm(\?.*)?$/i.test(url || '')) return 'video/webm'
    if (/\.ogg(\?.*)?$/i.test(url || '')) return 'video/ogg'
    if (/\.mov(\?.*)?$/i.test(url || '')) return 'video/quicktime'
    if (/\.m4v(\?.*)?$/i.test(url || '')) return 'video/x-m4v'
    return 'video/mp4'
  }

  const renderAttachmentShowcase = (listing) => {
    const attachments = getServiceAttachments(listing);
    if (!attachments.length) return null;

    return (
      <div className={`mt-3 rounded-xl p-3 border ${isDark ? 'bg-card/50 border-border' : 'bg-muted/30 border-border'}`}>
        <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Service Attachments</p>
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {attachments.map((url, index) => (
            <div key={`${url}-${index}`} className="snap-start flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-border dark:border-border bg-black">
              {isVideoAttachment(url) ? (
                <video className="w-full h-full object-cover" controls preload="metadata" playsInline>
                  <source src={url} type={getVideoType(url)} />
                </video>
              ) : (
                <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
      <AppPage
        title="Irrigation services"
        description="Post services, accept requests, and book farm operations."
      >
      <PageScaffold
        aside={
          <IrrigationPageAside
            summary={[
              { label: 'My listings', value: String(listings.length) },
              { label: 'Open bookings', value: String(bookings.filter((b) => b.status === 'PENDING').length) },
              { label: 'Browse catalog', value: String(allListings.length) },
            ]}
          />
        }
      >
      <div className="space-y-8">
        <KpiSection>
          <KpiCard title="My listings" value={listings.length} hint="Your service posts" />
          <KpiCard title="Browse pool" value={allListings.length} hint="Available nearby" />
          <KpiCard title="My bookings" value={bookings.length} hint="Requests you sent" />
          <KpiCard title="Provider queue" value={providerRequests.length} hint="Incoming requests" />
        </KpiSection>

        <div className="ops-panel flex flex-wrap gap-2 border p-2">
          {SERVICE_TABS.map((tab) => (
            <FeChip
              key={tab.value}
              active={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="px-4 py-2"
            >
              {tab.label}
            </FeChip>
          ))}
        </div>

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <>
            {!eligibilityLoading && !listingEligibility?.eligible && (
              <div className={`rounded-2xl border p-6 mb-4 ${isDark ? 'bg-muted border-border text-muted-foreground' : 'bg-background border-border text-foreground'}`}>
                <h2 className="text-xl font-bold">Vendor verification required</h2>
                <p className="mt-2 text-sm">
                  {listingEligibility?.verificationMessage || 'Complete vendor verification first to access paid service listing tools.'}
                </p>
                {listingEligibility?.verificationInProgress && (
                  <p className={`mt-2 text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    Verification is in progress. After successful verification, vendor dashboard and paid listings will unlock.
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => navigate('/vendor-dashboard')}
                    className="btn-primary"
                  >
                    Open Vendor Dashboard
                  </button>
                  <button
                    onClick={fetchListingEligibility}
                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/10"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}

            {/* Add Listing Button */}
            <div className="flex justify-end">
              <button
                onClick={handleOpenPostService}
                disabled={eligibilityLoading || !listingEligibility?.eligible}
                className="btn-primary"
              >
                {showPostForm ? 'Cancel' : '+ Post Service'}
              </button>
            </div>

            {/* Post Service Form */}
            {showPostForm && (
              <div className={`rounded-xl shadow-2xl overflow-hidden border ${isDark ? 'bg-gradient-to-br from-card to-background border-border' : 'bg-background border-border'}`}>
                {/* Form Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
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
                  <div className={`rounded-xl p-6 border ${isDark ? 'bg-muted border-border' : 'bg-muted/50 border-border'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      <span className="text-2xl">📋</span>
                      Service Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">⚙️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">✏️</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Be specific about model/capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Pricing Section */}
                  <div className="bg-muted rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      Location & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">🗺️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Serviceable Locations
                        </label>
                        <div className="relative">
                          <input
                            name="serviceableLocations"
                            value={postForm.serviceableLocations}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="e.g., Guntur, Vijayawada, Tenali"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">🧭</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tell users where this service can be delivered.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">₹</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Enter amount per hour</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Service Radius (KM)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {[5, 10, 20, 50].map((radius) => (
                            <button
                              key={radius}
                              type="button"
                              onClick={() => setPostForm((prev) => ({ ...prev, serviceRadiusKm: radius }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${Number(postForm.serviceRadiusKm || 20) === radius
                                ? 'bg-primary text-white border-primary'
                                : 'bg-muted text-muted-foreground border-border hover:border-primary'}`}
                            >
                              {radius} km
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            name="serviceRadiusKm"
                            type="number"
                            min="1"
                            max="500"
                            value={postForm.serviceRadiusKm}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="20"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">📡</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Nearby users inside this radius can discover your service.</p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-6 border ${isDark ? 'bg-muted border-border' : 'bg-muted/50 border-border'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      <span className="text-2xl">🖼️</span>
                      Optional Showcase Attachments
                    </h3>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
                      multiple
                      onChange={handleAttachmentFilesChange}
                      className="form-input"
                    />
                    <p className={`text-xs mt-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      Select up to 8 files (images/videos). Files upload automatically on save.
                    </p>
                    {attachmentFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachmentFiles.map((file, index) => (
                          <span
                            key={`${file.name}-${index}`}
                            className={`text-xs px-2 py-1 rounded-full border ${isDark ? 'bg-muted border-border text-muted-foreground' : 'bg-background border-border text-foreground'}`}
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact Information Section */}
                  <div className={`rounded-xl p-6 border ${isDark ? 'bg-muted border-border' : 'bg-muted/50 border-border'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      <span className="text-2xl">📞</span>
                      Contact Information
                      <span className={`text-xs font-normal ml-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>(Optional - uses profile info if blank)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">👤</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">📱</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
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
                            <span className="text-muted-foreground">✉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="bg-muted rounded-xl p-6 border border-border">
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
                        <span className="text-muted-foreground">📅</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading || uploadingAttachments}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {loading || uploadingAttachments ? (
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
                      className={`px-8 py-4 border-2 font-semibold rounded-xl transition-all duration-300 ${isDark ? 'border-border hover:border-border text-muted-foreground hover:bg-muted' : 'border-border hover:border-border text-muted-foreground hover:bg-muted'}`}
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
              <div className={`rounded-xl shadow-2xl border-2 border-primary/40 overflow-hidden ${isDark ? 'bg-gradient-to-br from-card to-background' : 'bg-background'}`}>
                {/* Form Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <span className="text-3xl">✏️</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Edit Service Listing</h2>
                        <p className="text-blue-100 text-sm">Update your service information</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-white hover:text-blue-100 transition-colors p-2 hover:bg-muted/50 rounded-lg"
                      title="Cancel editing"
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleUpdateListing} className="p-8 space-y-6">
                  {/* Service Type Section */}
                  <div className={`rounded-xl p-6 border ${isDark ? 'bg-muted border-border' : 'bg-muted/50 border-border'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      <span className="text-2xl">📋</span>
                      Service Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Service Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="type"
                            value={postForm.type}
                            onChange={handlePostChange}
                            className="form-input pl-10 appearance-none cursor-pointer hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            required
                          >
                            <option value="TRACTOR">🚜 Tractor</option>
                            <option value="JCB">🏗️ JCB / Excavator</option>
                            <option value="MANUAL">👷 Manual Workers</option>
                            <option value="IRRIGATION">💧 Irrigation Equipment</option>
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">⚙️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Service Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="title"
                            value={postForm.title}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="e.g., Mahindra Tractor 575 DI"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">✏️</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Be specific about model/capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Pricing Section */}
                  <div className="bg-muted rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      Location & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Service Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="location"
                            value={postForm.location}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="City / Village / District"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">🗺️</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Serviceable Locations
                        </label>
                        <div className="relative">
                          <input
                            name="serviceableLocations"
                            value={postForm.serviceableLocations}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="e.g., Guntur, Vijayawada, Tenali"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">🧭</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Hourly Rate <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="rate"
                            type="number"
                            value={postForm.rate}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="1200"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">₹</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Enter amount per hour</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Service Radius (KM)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {[5, 10, 20, 50].map((radius) => (
                            <button
                              key={radius}
                              type="button"
                              onClick={() => setPostForm((prev) => ({ ...prev, serviceRadiusKm: radius }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${Number(postForm.serviceRadiusKm || 20) === radius
                                ? 'bg-primary text-white border-primary'
                                : 'bg-muted text-muted-foreground border-border hover:border-primary'}`}
                            >
                              {radius} km
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            name="serviceRadiusKm"
                            type="number"
                            min="1"
                            max="500"
                            value={postForm.serviceRadiusKm}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="20"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">📡</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Nearby users inside this radius can discover your service.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">🖼️</span>
                      Optional Showcase Attachments
                    </h3>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
                      multiple
                      onChange={handleAttachmentFilesChange}
                      className="form-input"
                    />
                    <p className="text-xs mt-2 text-muted-foreground">
                      Select up to 8 files (images/videos). Files upload automatically on save.
                    </p>
                    {attachmentFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachmentFiles.map((file, index) => (
                          <span
                            key={`${file.name}-${index}`}
                            className="text-xs px-2 py-1 rounded-full border bg-muted border-border text-muted-foreground"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-muted rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span>
                      Contact Information
                      <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Contact Name
                        </label>
                        <div className="relative">
                          <input
                            name="contactName"
                            value={postForm.contactName}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Your name"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">👤</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            name="contactPhone"
                            value={postForm.contactPhone}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="10-digit mobile"
                            maxLength="10"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">📱</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            name="contactEmail"
                            type="email"
                            value={postForm.contactEmail}
                            onChange={handlePostChange}
                            className="form-input pl-10 hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="your@email.com"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-muted-foreground">✉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="bg-muted rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">⏰</span>
                      Availability Status
                    </h3>
                    <div className="relative">
                      <select
                        name="availability"
                        value={postForm.availability}
                        onChange={handlePostChange}
                        className="form-input pl-10 appearance-none cursor-pointer hover:border-primary/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        <option value="Available">✅ Available Now</option>
                        <option value="Limited">⚠️ Limited Availability</option>
                        <option value="Booked">⛔ Fully Booked</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <span className="text-muted-foreground">📅</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading || uploadingAttachments}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {loading || uploadingAttachments ? (
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
                      className={`px-8 py-4 border-2 font-semibold rounded-xl transition-all duration-300 ${isDark ? 'border-border hover:border-border text-muted-foreground hover:bg-muted' : 'border-border hover:border-border text-muted-foreground hover:bg-muted'}`}
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
              <div className={`rounded-xl shadow-lg p-6 text-center py-12 border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
                <div className="text-6xl mb-4">🔧</div>
                <p className={`text-lg font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>No service listings yet</p>
                <p className={`text-sm mt-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Post the first service to enable booking requests!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{listing.title || listing.serviceName || 'Untitled Listing'}</h3>
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>📍 {listing.location || 'Location not specified'}</p>
                      </div>
                      <span className="text-2xl">{getServiceIcon(listing.type)}</span>
                    </div>

                    <div className={`space-y-2 mb-4 pb-4 border-b ${isDark ? 'border-border' : 'border-border'}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Type</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>{listing.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Rate</p>
                        <p className="text-sm text-orange-500 font-semibold">{listing.rate || listing.price || 'Rate not set'}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Status</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          listing.availability === 'Available' ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') :
                          listing.availability === 'Limited' ? (isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700') :
                          (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>{listing.availability}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {listing.contactName && (
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>👤 {listing.contactName}</p>
                      )}
                      {listing.contactPhone && (
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>📞 {listing.contactPhone}</p>
                      )}
                      {listing.contactEmail && (
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>✉️ {listing.contactEmail}</p>
                      )}
                    </div>

                    {renderAttachmentShowcase(listing)}

                    {/* Edit and Delete Buttons */}
                    <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-border' : 'border-border'}`}>
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
            {/* Browse Services Grid - Filters out user's own services */}
            {allListings.filter(listing => !myListingIds.has(listing.id)).length === 0 ? (
              <div className={`rounded-xl shadow-lg p-6 text-center py-12 border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
                <div className="text-6xl mb-4">🔍</div>
                <p className={`text-lg font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>No services available yet</p>
                <p className={`text-sm mt-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Check back later for available services!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.filter(listing => !myListingIds.has(listing.id)).map((listing) => (
                  <div key={listing.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{listing.serviceName || listing.title || 'Untitled Service'}</h3>
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>📍 {listing.location || 'Location not specified'}</p>
                      </div>
                      <span className="text-3xl">{getServiceIcon(listing.type)}</span>
                    </div>

                    <div className={`space-y-2 mb-4 pb-4 border-b ${isDark ? 'border-border' : 'border-border'}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Type</p>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>{listing.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Hourly Rate</p>
                        <p className="text-lg text-green-500 font-bold">₹{listing.price || listing.rate || 'N/A'}/hr</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Availability</p>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          listing.availability === 'Available' ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') :
                          listing.availability === 'Limited' ? (isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700') :
                          (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>{listing.availability}</span>
                      </div>
                    </div>

                    {listing.description && (
                      <div className="mb-4">
                        <p className={`text-xs mb-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Description:</p>
                        <p className={`text-sm line-clamp-3 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{listing.description}</p>
                      </div>
                    )}

                    {renderAttachmentShowcase(listing)}

                    <div className="space-y-1 mb-4">
                      {listing.contactName && (
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>👤 {listing.contactName}</p>
                      )}
                      {listing.contactPhone && (
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>📞 {listing.contactPhone}</p>
                      )}
                      {listing.contactEmail && (
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>✉️ {listing.contactEmail}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleBookService(listing)}
                      disabled={listing.availability === 'Booked' || myListingIds.has(listing.id)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        listing.availability === 'Booked' || myListingIds.has(listing.id)
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
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
              <div className={`rounded-xl shadow-2xl border-2 border-primary overflow-hidden ${isDark ? 'bg-gradient-to-br from-card to-background' : 'bg-background'}`}>
                {/* Form Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">📝</span>
                    Request a Service
                  </h2>
                  {selectedService && (
                    <div className="mt-2 bg-muted/50 rounded-lg p-3 text-white">
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
                      className={`px-8 py-3 border-2 font-semibold rounded-lg transition-all duration-300 ${isDark ? 'border-border hover:border-border text-muted-foreground hover:bg-muted' : 'border-border hover:border-border text-muted-foreground hover:bg-muted'}`}
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
              <div className={`rounded-xl shadow-lg p-6 text-center py-12 border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
                <div className="text-6xl mb-4">📋</div>
                <p className={`text-lg font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>No booking requests yet</p>
                <p className={`text-sm mt-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Browse available services and make your first booking!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{booking.serviceType} Service</h3>
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>📍 {booking.location || 'Location not specified'}</p>
                        {booking.providerName && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Provider: {booking.providerName}</p>
                        )}
                      </div>
                      <span className="text-2xl">{getServiceIcon(booking.serviceType)}</span>
                    </div>

                    <div className="mb-3">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className={`space-y-2 mb-4 pb-4 border-b ${isDark ? 'border-border' : 'border-border'}`}>
                      {booking.farmName && (
                        <div className="flex justify-between items-center">
                          <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Farm</p>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>{booking.farmName}</p>
                        </div>
                      )}
                      {booking.cropName && (
                        <div className="flex justify-between items-center">
                          <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Crop</p>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>{booking.cropName}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Hours</p>
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>{booking.hours}hrs</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">People</p>
                        <p className="text-sm font-semibold text-white">{booking.peopleCount}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Notes:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{booking.notes}</p>
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
                <p className="text-muted-foreground text-lg font-semibold">No booking requests yet</p>
                <p className="text-muted-foreground text-sm mt-2">When customers book your services, they will appear here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providerRequests.map((request) => (
                  <div key={request.id} className="card hover:shadow-lg transition-shadow border-2 border-blue-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{request.serviceType} Service Request</h3>
                        <p className="text-muted-foreground text-sm">📍 {request.location || 'Location not specified'}</p>
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

                    <div className="space-y-2 mb-4 pb-4 border-b border-border">
                      {request.farmName && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">Farm</p>
                          <p className="text-sm font-semibold text-white">{request.farmName}</p>
                        </div>
                      )}
                      {request.cropName && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">Crop</p>
                          <p className="text-sm font-semibold text-white">{request.cropName}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Hours Requested</p>
                        <p className="text-sm font-semibold text-white">{request.hours}hrs</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">People Count</p>
                        <p className="text-sm font-semibold text-white">{request.peopleCount}</p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Customer Notes:</p>
                        <p className="text-sm text-muted-foreground bg-blue-900/30 p-3 rounded border border-blue-700">{request.notes}</p>
                      </div>
                    )}

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
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
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground font-semibold">
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
      </PageScaffold>
    </AppPage>
  )
}

export default IrrigationServices
