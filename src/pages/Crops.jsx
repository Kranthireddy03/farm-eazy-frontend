/**
 * Crops Page — enterprise list + forms (Farms pattern)
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { InfoPanel } from '../components/platform/InfoPanel'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { FormField } from '../components/ui/form-field'
import { DataTable } from '../components/ui/data-table'
import { ErrorState } from '../components/ui/error-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/badge'
import { Sprout, Leaf, Calendar, Plus } from 'lucide-react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const STATUS_STYLES = {
  PLANTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  GROWING: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  READY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARVESTED: 'bg-muted text-muted-foreground',
}

const EMPTY_FORM = {
  cropName: '',
  season: '',
  sowingDate: '',
  expectedHarvestDate: '',
  farmId: '',
  status: 'PLANTED',
}

function Crops() {
  const { showToast } = useToast()
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCrop, setEditingCrop] = useState(null)
  const [farms, setFarms] = useState([])
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [cropSearch, setCropSearch] = useState('')
  const debouncedCropSearch = useDebouncedValue(cropSearch)

  useEffect(() => {
    fetchCrops()
    fetchFarms()
  }, [])

  const fetchCrops = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.GET_CROPS)
      setCrops(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load crops')
      console.error(err)
      showToast('Failed to load crops', 'error')
    } finally {
      setLoading(false)
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

  const getFarmName = useCallback(
    (farmId) => {
      const farm = farms.find((f) => f.id === farmId)
      return farm ? farm.farmName : 'Unknown farm'
    },
    [farms],
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddCrop = async (e) => {
    e.preventDefault()
    if (!formData.cropName || !formData.season || !formData.sowingDate || !formData.expectedHarvestDate || !formData.farmId) {
      setError('Please fill in all required fields')
      showToast('Please fill in all required fields', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post(API_ENDPOINTS.CREATE_CROP, {
        cropName: formData.cropName,
        season: formData.season,
        sowingDate: formData.sowingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        farmId: parseInt(formData.farmId, 10),
        status: formData.status,
      })
      setFormData(EMPTY_FORM)
      setShowAddForm(false)
      setError('')
      showToast('Crop created successfully!', 'success')
      await fetchCrops()
    } catch (err) {
      setError(err.message || 'Failed to create crop')
      showToast(err.message || 'Failed to create crop', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return
    try {
      await apiClient.delete(API_ENDPOINTS.DELETE_CROP(cropId))
      setError('')
      showToast('Crop deleted successfully!', 'success')
      await fetchCrops()
    } catch (err) {
      setError('Failed to delete crop')
      showToast('Failed to delete crop', 'error')
    }
  }

  const handleEditClick = (crop) => {
    setEditingCrop(crop)
    setFormData({
      cropName: crop.cropName,
      season: crop.season,
      sowingDate: crop.sowingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      farmId: crop.farmId,
      status: crop.status,
    })
    setShowAddForm(false)
  }

  const handleUpdateCrop = async (e) => {
    e.preventDefault()
    if (!formData.cropName || !formData.season || !formData.sowingDate || !formData.expectedHarvestDate || !formData.farmId) {
      setError('Please fill in all required fields')
      showToast('Please fill in all required fields', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_CROP(editingCrop.id), {
        cropName: formData.cropName,
        season: formData.season,
        sowingDate: formData.sowingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        farmId: parseInt(formData.farmId, 10),
        status: formData.status,
      })
      setFormData(EMPTY_FORM)
      setEditingCrop(null)
      setError('')
      showToast('Crop updated successfully!', 'success')
      await fetchCrops()
    } catch (err) {
      setError(err.message || 'Failed to update crop')
      showToast(err.message || 'Failed to update crop', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCrop(null)
    setFormData(EMPTY_FORM)
  }

  const filteredCrops = useMemo(() => {
    if (!debouncedCropSearch.trim()) return crops
    const q = debouncedCropSearch.toLowerCase()
    return crops.filter(
      (c) =>
        (c.cropName && c.cropName.toLowerCase().includes(q)) ||
        (c.season && c.season.toLowerCase().includes(q)) ||
        getFarmName(c.farmId).toLowerCase().includes(q),
    )
  }, [crops, debouncedCropSearch, getFarmName])

  const cropMetrics = useMemo(() => {
    const total = crops.length
    const planted = crops.filter((c) => c.status === 'PLANTED').length
    const growing = crops.filter((c) => c.status === 'GROWING').length
    const ready = crops.filter((c) => c.status === 'READY').length
    return { total, planted, growing, ready }
  }, [crops])

  const cropColumns = useMemo(
    () => [
      {
        accessorKey: 'cropName',
        header: 'Crop',
        cell: ({ row }) => <span className="font-medium">{row.original.cropName}</span>,
      },
      {
        id: 'farm',
        header: 'Farm',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{getFarmName(row.original.farmId)}</span>
        ),
      },
      {
        accessorKey: 'season',
        header: 'Season',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge className={STATUS_STYLES[row.original.status] || STATUS_STYLES.HARVESTED}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'sowingDate',
        header: 'Sowing',
        cell: ({ row }) => new Date(row.original.sowingDate).toLocaleDateString(),
      },
      {
        accessorKey: 'expectedHarvestDate',
        header: 'Harvest',
        cell: ({ row }) => new Date(row.original.expectedHarvestDate).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEditClick(row.original)}>Edit</Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteCrop(row.original.id)}>Delete</Button>
          </div>
        ),
      },
    ],
    [getFarmName],
  )

  const cropFormFields = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Crop name" id="cropName" required>
        <Input id="cropName" name="cropName" value={formData.cropName} onChange={handleChange} placeholder="Wheat" required />
      </FormField>
      <FormField label="Farm" id="farmId" required>
        <select id="farmId" name="farmId" value={formData.farmId} onChange={handleChange} className={selectClass} required>
          <option value="">Select a farm</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>{farm.farmName}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Season" id="season" required>
        <Input id="season" name="season" value={formData.season} onChange={handleChange} placeholder="Rabi" required />
      </FormField>
      <FormField label="Status" id="status">
        <select id="status" name="status" value={formData.status} onChange={handleChange} className={selectClass}>
          <option value="PLANTED">Planted</option>
          <option value="GROWING">Growing</option>
          <option value="READY">Ready</option>
          <option value="HARVESTED">Harvested</option>
        </select>
      </FormField>
      <FormField label="Sowing date" id="sowingDate" required>
        <Input id="sowingDate" type="date" name="sowingDate" value={formData.sowingDate} onChange={handleChange} required />
      </FormField>
      <FormField label="Expected harvest" id="expectedHarvestDate" required>
        <Input id="expectedHarvestDate" type="date" name="expectedHarvestDate" value={formData.expectedHarvestDate} onChange={handleChange} required />
      </FormField>
    </div>
  )

  if (loading) {
    return (
      <AppPage title="Crops" description="Track planting, growth, and harvest across your farms.">
        <PageSkeleton variant="table" />
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Crops"
      description="Track planting, growth, and harvest across your farms."
      actions={
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingCrop(null)
            setFormData(EMPTY_FORM)
          }}
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Close form' : 'Add crop'}
        </Button>
      }
    >
      <PageScaffold
        aside={
          <InfoPanel title="Crop operations" description="Link crops to farms and irrigation schedules.">
            <div className="flex flex-wrap gap-2 mt-3">
              <Link to="/farms" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Manage farms</Link>
              <Link to="/irrigation" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Irrigation</Link>
              <Link to="/dashboard" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Dashboard</Link>
            </div>
          </InfoPanel>
        }
      >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Total crops" value={cropMetrics.total} hint="Across all farms" icon={Sprout} />
          <KpiCard title="Planted" value={cropMetrics.planted} hint="Recently sown" icon={Leaf} />
          <KpiCard title="Growing" value={cropMetrics.growing} hint="In progress" icon={Leaf} />
          <KpiCard title="Ready" value={cropMetrics.ready} hint="Near harvest" icon={Calendar} />
      </div>

        {error && (
          <ErrorState title="Something went wrong" description={error} onRetry={fetchCrops} showHome={false} />
        )}

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add new crop</CardTitle>
              <CardDescription>Capture farm, season, and harvest targets.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCrop} className="space-y-4">
                {cropFormFields}
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create crop'}</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {editingCrop && (
          <Card>
            <CardHeader>
              <CardTitle>Edit crop</CardTitle>
              <CardDescription>Update timeline for {editingCrop.cropName}.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCrop} className="space-y-4">
                {cropFormFields}
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>{submitting ? 'Updating…' : 'Update crop'}</Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <DataTable
          columns={cropColumns}
          data={filteredCrops}
          searchPlaceholder="Search crops…"
          globalFilter={cropSearch}
          onGlobalFilterChange={setCropSearch}
          emptyTitle="No crops yet"
          emptyDescription="Add your first crop to track seasons and harvest windows."
          emptyAction={<Button size="sm" onClick={() => setShowAddForm(true)}>Add crop</Button>}
          mobileCardRender={(crop) => (
            <Card key={crop.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{crop.cropName}</p>
                    <p className="text-sm text-muted-foreground">{getFarmName(crop.farmId)}</p>
                  </div>
                  <Badge className={STATUS_STYLES[crop.status] || STATUS_STYLES.HARVESTED}>{crop.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{crop.season} · Harvest {new Date(crop.expectedHarvestDate).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditClick(crop)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteCrop(crop.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          )}
        />
      </PageScaffold>
    </AppPage>
  )
}

export default Crops
