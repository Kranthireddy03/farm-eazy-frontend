import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSession } from '../../context/SessionContext'
import { useLocationContext } from '../../context/LocationContext'
import PageLoader from '../shell/PageLoader'
import { Button } from '../ui/button'

const LOCATION_DEFER_PATHS = [
  '/complete-google-profile',
  '/service-unavailable',
  '/coverage',
  '/active-locations',
  '/locations',
]

/**
 * Blocks protected UI until session bootstrap completes and the user has a validated,
 * active service location. Prevents dashboard components from mounting or calling APIs
 * in the background until location access is verified.
 */
export default function SessionBootstrapGate({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    isBootstrapping,
    bootstrapError,
    bootstrapSession,
    profile,
  } = useSession()
  const { isSessionVerified, isServiceable, isSelectorOpen, wizardDetail } = useLocationContext()

  const deferLocationRequirement = LOCATION_DEFER_PATHS.includes(location.pathname)

  if (authLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return children
  }

  if (isBootstrapping) {
    return <PageLoader />
  }

  if (bootstrapError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4">
        <p className="text-lg font-semibold">We couldn&apos;t load your session</p>
        <p className="text-sm text-muted-foreground max-w-md">{bootstrapError}</p>
        <Button type="button" onClick={() => bootstrapSession()}>
          Retry
        </Button>
      </div>
    )
  }

  const profileReady = Boolean(profile)
  const isBlockingWizardOpen = isSelectorOpen && (
    wizardDetail?.reason === 'SESSION_START' ||
    wizardDetail?.reason === 'POST_LOGIN' ||
    wizardDetail?.reason === 'LOCATION_REQUIRED' ||
    wizardDetail?.blocking === true
  )

  const isLocationValidated = isSessionVerified && isServiceable && !isBlockingWizardOpen
  const isReadyToRender = deferLocationRequirement || (profileReady && isLocationValidated)

  if (!isReadyToRender) {
    // Completely hide dashboard and suppress background API queries until location is chosen & verified
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Verifying service zone access…</p>
        </div>
      </div>
    )
  }

  return children
}
