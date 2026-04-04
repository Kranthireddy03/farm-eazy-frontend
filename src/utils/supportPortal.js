export const getSupportPortalBaseUrl = () => {
  const configuredBase = import.meta.env.VITE_SUPPORT_DASHBOARD_URL
  if (configuredBase) return configuredBase
  if (typeof window !== 'undefined' && window.location?.origin) {
    const { protocol, hostname, port, origin } = window.location
    // Main user app is running on 3000; support portal should open on 5173.
    if (port === '3000') return `${protocol}//${hostname}:5173`
    return origin
  }
  return 'http://localhost:5173'
}

const normalizePortalPath = (path) => {
  if (!path) return '/user/dashboard'
  return path.startsWith('/') ? path : `/${path}`
}

export const buildSupportPortalUrl = ({
  portalPath = '/user/dashboard',
  mode = 'user',
  redirect,
  theme,
} = {}) => {
  const safeMode = mode === 'admin' ? 'admin' : 'user'
  const base = getSupportPortalBaseUrl().replace(/\/$/, '')
  const path = normalizePortalPath(portalPath)
  const targetRedirect = normalizePortalPath(redirect || portalPath)
  const preferredTheme = theme || localStorage.getItem('farmEazy_theme') || 'dark'

  return `${base}${path}?handoff=1&mode=${encodeURIComponent(safeMode)}&redirect=${encodeURIComponent(targetRedirect)}&theme=${encodeURIComponent(preferredTheme)}`
}

export const prepareSupportPortalHandoff = ({
  mode = 'user',
  token,
  email,
  redirect = '/user/dashboard',
  theme,
} = {}) => {
  const authToken = token || localStorage.getItem('farmEazy_token')
  if (!authToken) return false

  const authEmail = email || localStorage.getItem('farmEazy_email') || ''
  const preferredTheme = theme || localStorage.getItem('farmEazy_theme') || 'dark'
  const payload = {
    __farmEazySupportHandoff: true,
    accessToken: authToken,
    email: authEmail,
    mode: mode === 'admin' ? 'admin' : 'user',
    redirect: normalizePortalPath(redirect),
    theme: preferredTheme,
    ts: Date.now(),
  }

  try {
    window.name = JSON.stringify(payload)
    return true
  } catch (_err) {
    return false
  }
}
