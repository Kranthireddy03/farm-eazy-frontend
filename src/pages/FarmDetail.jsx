/**
 * Farm Detail Page — AppPage + PageScaffold (Farms pattern)
 */

import { useParams, useNavigate, Link } from 'react-router-dom'
import { formatDate } from '../utils/formatDate'
import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { PageSkeleton } from '../components/ui/Skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button, buttonVariants } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ErrorState } from '../components/ui/error-state'
import { InfoPanel } from '../components/platform/InfoPanel'
import { SummaryPanel } from '../components/platform/SummaryPanel'
import { MapPin, Sprout, ArrowLeft, Leaf } from 'lucide-react'

const STATUS_STYLES = {
  PLANTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  GROWING: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  READY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARVESTED: 'bg-muted text-muted-foreground',
}

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
      const farmCrops = response.data.filter((crop) => crop.farmId === parseInt(farmId, 10))
      setCrops(farmCrops)
    } catch (err) {
      console.error('Failed to fetch crops:', err)
    }
  }

  if (loading) {
    return (
      <AppPage title="Farm details" description="Loading farm information…">
        <PageSkeleton rows={4} />
      </AppPage>
    )
  }

  if (!farm) {
    return (
      <AppPage title="Farm not found" description="This farm could not be loaded.">
        <ErrorState
          title="Farm not found"
          description="The farm you are looking for does not exist or was removed."
          onRetry={() => navigate('/farms')}
          showHome={false}
        />
      </AppPage>
    )
  }

  const areaHa = Number(farm.areaSize) || 0

  return (
    <AppPage
      title={farm.farmName}
      description={farm.location}
      actions={
        <Button variant="outline" onClick={() => navigate('/farms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to farms
        </Button>
      }
      meta={
        <>
          <Badge variant="outline">{areaHa.toFixed(1)} ha</Badge>
          <Badge variant="muted">{crops.length} crops</Badge>
        </>
      }
    >
      {error && (
        <InfoPanel variant="destructive" title="Could not refresh" description={error} className="mb-6" />
      )}

      <PageScaffold
        aside={
          <>
            <SummaryPanel title="Farm summary">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Area</dt>
                  <dd className="font-medium">{areaHa.toFixed(1)} ha</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Crops</dt>
                  <dd className="font-medium">{crops.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{formatDate(farm.createdAt)}</dd>
                </div>
              </dl>
            </SummaryPanel>
            <InfoPanel
              title="Quick links"
              description="Manage crops and irrigation for this parcel."
            >
              <div className="flex flex-wrap gap-2 mt-3">
                <Link to="/crops" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  Manage crops
                </Link>
                <Link to="/irrigation/schedules" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  Irrigation schedules
                </Link>
                <Link to="/service-requests" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  Service requests
                </Link>
              </div>
            </InfoPanel>
          </>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Farm details
            </CardTitle>
            <CardDescription>Registered parcel information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Farm name</p>
              <p className="text-lg font-semibold">{farm.farmName}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </p>
              <p className="text-lg font-semibold">{farm.location}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Area size</p>
              <p className="text-lg font-semibold">{areaHa.toFixed(1)} hectares</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Created on</p>
              <p className="text-lg font-semibold">{formatDate(farm.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Crops on this farm
              </CardTitle>
              <CardDescription>Active and harvested crops linked to this parcel</CardDescription>
            </div>
            <Button size="sm" onClick={() => navigate('/crops')}>Add crop</Button>
          </CardHeader>
          <CardContent>
            {crops.length === 0 ? (
              <div className="text-center py-8 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground mb-4">No crops on this farm yet.</p>
                <Link to="/crops" className={cn(buttonVariants())}>
                  Create your first crop
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crops.map((crop) => (
                  <div
                    key={crop.id}
                    className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{crop.cropName}</h3>
                        <p className="text-sm text-muted-foreground">Season: {crop.season}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                          STATUS_STYLES[crop.status] || STATUS_STYLES.HARVESTED
                        }`}
                      >
                        {crop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageScaffold>
    </AppPage>
  )
}

export default FarmDetail
