/**
 * Farms Page Component
 * 
 * Features:
 * - List all user's farms
 * - Add new farm
 * - Edit farm details
 * - Delete farm
 * - View farm details
 */

import { useState, useEffect, useMemo } from 'react'
import { useLoader } from '../context/LoaderContext'
import { useLocationContext } from '../context/LocationContext'
import { useToast } from '../hooks/useToast';
import AppPage from '../components/layout/AppPage';
import LocationPicker from '../components/LocationPicker'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import { sendNotification } from '../components/NotificationCenter'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { FormField } from '../components/ui/form-field'
import { DataTable } from '../components/ui/data-table'
import { EmptyState } from '../components/ui/empty-state'
import { ErrorState } from '../components/ui/error-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { Sprout, MapPin, Plus } from 'lucide-react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

function Farms() {
    // Import dashboard stats refresh
    const dashboardWindow = window;
    const refreshDashboardStats = () => {
      if (dashboardWindow.fetchStats) {
        dashboardWindow.fetchStats();
      }
    };
  const { showToast } = useToast();
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingFarm, setEditingFarm] = useState(null)
  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    areaSize: '',
    latitude: null,
    longitude: null,
  })
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const { selectedLocation } = useLocationContext()
  const [farmSearch, setFarmSearch] = useState('')
  const debouncedFarmSearch = useDebouncedValue(farmSearch)

  const { show: showLoader, hide: hideLoader } = useLoader();

  const filteredFarms = useMemo(() => {
    if (!debouncedFarmSearch.trim()) return farms
    const q = debouncedFarmSearch.toLowerCase()
    return farms.filter(
      (f) =>
        (f.farmName && f.farmName.toLowerCase().includes(q)) ||
        (f.location && f.location.toLowerCase().includes(q)),
    )
  }, [farms, debouncedFarmSearch])

  const farmColumns = useMemo(
    () => [
      {
        accessorKey: 'farmName',
        header: 'Farm name',
        cell: ({ row }) => <span className="font-medium">{row.original.farmName}</span>,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <span className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {row.original.location}
          </span>
        ),
      },
      {
        accessorKey: 'areaSize',
        header: 'Area (ha)',
        cell: ({ row }) => Number(row.original.areaSize).toFixed(1),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEditClick(row.original)}>Edit</Button>
            <Link
              to={`/farms/${row.original.id}`}
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
            >
              View
            </Link>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteFarm(row.original.id)}>Delete</Button>
          </div>
        ),
      },
    ],
    [],
  )

  const farmMetrics = useMemo(() => {
    const totalFarms = farms.length
    const totalArea = farms.reduce((sum, farm) => sum + (Number(farm.areaSize) || 0), 0)
    const averageArea = totalFarms > 0 ? totalArea / totalFarms : 0
    const largeFarms = farms.filter((farm) => (Number(farm.areaSize) || 0) >= 10).length

    return {
      totalFarms,
      totalArea,
      averageArea,
      largeFarms,
    }
  }, [farms])

  /**
   * Fetch farms on component mount
   */
  useEffect(() => {
    const fetchWithLoader = async () => {
      try {
        showLoader();
        await fetchFarms();
      } finally {
        hideLoader();
      }
    };
    fetchWithLoader();
    // eslint-disable-next-line
  }, [])

  /**
   * Fetch all farms
   */
  const fetchFarms = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.GET_FARMS)
      setFarms(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load farms')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle form input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * Handle farm creation
   */
  const handleAddFarm = async (e) => {
    e.preventDefault()

    if (!formData.farmName || !formData.location || !formData.areaSize) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post(API_ENDPOINTS.CREATE_FARM, {
        ...formData,
        areaSize: parseFloat(formData.areaSize),
        latitude: formData.latitude,
        longitude: formData.longitude,
      })

      setFormData({ farmName: '', location: '', areaSize: '', latitude: null, longitude: null })
      setShowAddForm(false)
      setShowLocationPicker(false)
      setError('')
      showToast('Farm created successfully!', 'success');
      sendNotification(`Farm "${formData.farmName}" created!`, 'success', '🌾');
      await fetchFarms()
      refreshDashboardStats();
    } catch (err) {
      setError(err.message || 'Failed to create farm')
      showToast(err.message || 'Failed to create farm', 'error');
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Handle farm deletion
   */
  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm('Are you sure you want to delete this farm?')) {
      return
    }

    try {
      await apiClient.delete(API_ENDPOINTS.DELETE_FARM(farmId))
      setError('')
      showToast('Farm deleted successfully!', 'success');
      await fetchFarms()
      refreshDashboardStats();
    } catch (err) {
      setError('Failed to delete farm')
      showToast('Failed to delete farm', 'error');
    }
  }

  /**
   * Handle edit button click
   */
  const handleEditClick = (farm) => {
    setEditingFarm(farm)
    setFormData({
      farmName: farm.farmName,
      location: farm.location,
      areaSize: farm.areaSize.toString(),
      latitude: farm.latitude ?? null,
      longitude: farm.longitude ?? null,
    })
    setShowAddForm(false)
  }

  /**
   * Handle farm update
   */
  const handleUpdateFarm = async (e) => {
    e.preventDefault()

    if (!formData.farmName || !formData.location || !formData.areaSize) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_FARM(editingFarm.id), {
        ...formData,
        areaSize: parseFloat(formData.areaSize),
        latitude: formData.latitude,
        longitude: formData.longitude,
      })

      setFormData({ farmName: '', location: '', areaSize: '', latitude: null, longitude: null })
      setEditingFarm(null)
      setShowLocationPicker(false)
      setError('')
      showToast('Farm updated successfully!', 'success');
      await fetchFarms()
      refreshDashboardStats();
    } catch (err) {
      setError(err.message || 'Failed to update farm')
      showToast(err.message || 'Failed to update farm', 'error');
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = () => {
    setEditingFarm(null)
    setFormData({ farmName: '', location: '', areaSize: '', latitude: null, longitude: null })
    setShowLocationPicker(false)
  }

  const useCurrentAppLocation = () => {
    if (!selectedLocation) {
      showToast('Select a global location first from the location bar.', 'warning')
      return
    }

    const latitude = selectedLocation.latitude ?? null
    const longitude = selectedLocation.longitude ?? null
    const label = selectedLocation.label
      || selectedLocation.address?.addressLine1
      || (latitude != null && longitude != null ? `Lat ${Number(latitude).toFixed(5)}, Lon ${Number(longitude).toFixed(5)}` : '')

    setFormData((prev) => ({
      ...prev,
      location: label || prev.location,
      latitude,
      longitude,
    }))
    showToast('Farm location set from current active location.', 'success')
  }

  if (loading) {
    return (
      <AppPage title="Farms" description="Manage farm locations and land parcels.">
        <PageSkeleton variant="table" />
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Farms"
      description="Register land parcels, track area, and connect crops and irrigation to each location."
      actions={
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingFarm(null)
            setFormData({ farmName: '', location: '', areaSize: '', latitude: null, longitude: null })
            setShowLocationPicker(false)
          }}
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Close form' : 'Add farm'}
        </Button>
      }
    >
      <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total farms" value={farmMetrics.totalFarms} hint="Registered parcels" icon={Sprout} />
        <KpiCard title="Total area" value={`${farmMetrics.totalArea.toFixed(1)} ha`} hint="Combined hectares" icon={MapPin} />
        <KpiCard title="Average size" value={`${farmMetrics.averageArea.toFixed(1)} ha`} hint="Per farm" icon={Sprout} />
        <KpiCard title="Large farms" value={farmMetrics.largeFarms} hint="10+ hectares" icon={Sprout} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>High-frequency farm operations.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/crops" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Manage crops</Link>
          <Link to="/irrigation" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Irrigation</Link>
          <Link to="/service-requests" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Service requests</Link>
        </CardContent>
      </Card>

      {error && (
        <ErrorState title="Could not load farms" description={error} onRetry={fetchFarms} showHome={false} />
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add new farm</CardTitle>
            <CardDescription>Register a parcel with name, location, and area.</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleAddFarm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Farm name" id="farmName" required>
                <Input id="farmName" name="farmName" value={formData.farmName} onChange={handleChange} placeholder="North field" required />
              </FormField>
              <FormField label="Location" id="location" required>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="District, state" required />
              </FormField>
              <FormField label="Area (hectares)" id="areaSize" required hint="Decimal values supported">
                <Input id="areaSize" type="number" name="areaSize" value={formData.areaSize} onChange={handleChange} step="0.1" required />
              </FormField>
            </div>
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={useCurrentAppLocation}>Use current location</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLocationPicker((prev) => !prev)}>
                  {showLocationPicker ? 'Hide map' : 'Map picker'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates: {formData.latitude != null ? Number(formData.latitude).toFixed(5) : '—'}, {formData.longitude != null ? Number(formData.longitude).toFixed(5) : '—'}
              </p>
            </div>
            {showLocationPicker && (
              <LocationPicker
                onLocationSelect={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                onAddressSubmit={(addr) => setFormData((prev) => ({
                  ...prev,
                  location: addr.addressLine1 || addr.city || prev.location,
                  latitude: addr.latitude,
                  longitude: addr.longitude,
                }))}
                initialAddress={null}
              />
            )}
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create farm'}</Button>
          </form>
          </CardContent>
        </Card>
      )}

      {editingFarm && (
        <Card>
          <CardHeader>
            <CardTitle>Edit farm</CardTitle>
            <CardDescription>Update parcel details for {editingFarm.farmName}.</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleUpdateFarm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Farm name" id="edit-farmName" required>
                <Input id="edit-farmName" name="farmName" value={formData.farmName} onChange={handleChange} required />
              </FormField>
              <FormField label="Location" id="edit-location" required>
                <Input id="edit-location" name="location" value={formData.location} onChange={handleChange} required />
              </FormField>
              <FormField label="Area (hectares)" id="edit-areaSize" required>
                <Input id="edit-areaSize" type="number" name="areaSize" value={formData.areaSize} onChange={handleChange} step="0.1" required />
              </FormField>
            </div>
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={useCurrentAppLocation}>Use current location</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLocationPicker((prev) => !prev)}>
                  {showLocationPicker ? 'Hide map' : 'Map picker'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates: {formData.latitude != null ? Number(formData.latitude).toFixed(5) : '—'}, {formData.longitude != null ? Number(formData.longitude).toFixed(5) : '—'}
              </p>
            </div>
            {showLocationPicker && (
              <LocationPicker
                onLocationSelect={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                onAddressSubmit={(addr) => setFormData((prev) => ({
                  ...prev,
                  location: addr.addressLine1 || addr.city || prev.location,
                  latitude: addr.latitude,
                  longitude: addr.longitude,
                }))}
                initialAddress={null}
              />
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? 'Updating…' : 'Update farm'}</Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={farmColumns}
        data={filteredFarms}
        searchPlaceholder="Search farms…"
        globalFilter={farmSearch}
        onGlobalFilterChange={setFarmSearch}
        emptyTitle="No farms yet"
        emptyDescription="Create your first farm to start tracking crops and irrigation."
        emptyAction={<Button size="sm" onClick={() => setShowAddForm(true)}>Add farm</Button>}
        mobileCardRender={(farm) => (
          <Card key={farm.id}>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-medium">{farm.farmName}</p>
                <p className="text-sm text-muted-foreground">{farm.location}</p>
              </div>
              <p className="text-sm">{farm.areaSize} ha</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditClick(farm)}>Edit</Button>
                <Link to={`/farms/${farm.id}`} className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-accent">View</Link>
              </div>
            </CardContent>
          </Card>
        )}
      />
      </div>
    </AppPage>
  )
}

export default Farms
