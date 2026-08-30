import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSession } from '../../context/SessionContext'
import PageLoader from '../shell/PageLoader'
import { Button } from '../ui/button'

const LOCATION_DEFER_PATHS = ['/complete-google-profile']

/**
 * Blocks protected UI until session bootstrap (GET /users/me) completes
 * and the backend reports an effective location when required.
 */
export default function SessionBootstrapGate({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    isBootstrapping,
    isSessionReady,
    bootstrapError,
    bootstrapSession,
    profile,
  } = useSession()

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
  const locationReady = deferLocationRequirement ? true : isSessionReady

  if (!profileReady || !locationReady) {
    return <PageLoader message="Choose your location to continue" />
  }

  return children
}
