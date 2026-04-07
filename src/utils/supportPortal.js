export const getSupportPortalBaseUrl = () => {
  const configuredBase = import.meta.env.VITE_SUPPORT_DASHBOARD_URL || import.meta.env.VITE_SUPPORT_BASE_URL
  if (configuredBase && configuredBase.trim()) return configuredBase
  
  if (typeof window !== 'undefined' && window.location?.origin) {
    const { protocol, hostname, port, origin } = window.location
    
    // Map domain to support portal
    if (hostname.includes('farm-eazy.com') || hostname === 'localhost') {
      // For farm-eazy.com and localhost, use support.farm-eazy.com
      if (hostname === 'localhost' && port === '3000') {
        // Local development: support runs on 5173
        return `${protocol}//${hostname}:5173`
      }
      // Production/UAT: use support.farm-eazy.com
      return `${protocol}//support.farm-eazy.com`
    }

    // Hosted frontend/backend (Render/Vercel/etc): default to support portal deployment
    return 'https://admin-support-portal.vercel.app'
  }
  return 'https://admin-support-portal.vercel.app'
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
