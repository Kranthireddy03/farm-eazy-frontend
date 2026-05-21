import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

import PublicHeader from './PublicHeader'
import PublicFooter from './PublicFooter'
import { PageCanvas } from './ui/PremiumSurface'

function PublicLayout({ children }) {
  const location = useLocation()

  const getPublicVariant = (pathname) => {
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'theme-split'
    if (pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/r/')) return 'theme-minimal'
    if (pathname.startsWith('/blog')) return 'theme-immersive'
    if (pathname.startsWith('/about') || pathname.startsWith('/contact') || pathname.startsWith('/public-services')) return 'theme-floating'
    return 'theme-glass'
  }

  const publicVariant = getPublicVariant(location.pathname)

  return (
    <PageCanvas>
      <div className={`premium-shell layout-variant ${publicVariant} min-h-screen flex flex-col relative overflow-hidden`}>
        <div className="pointer-events-none absolute -top-24 left-8 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-16 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className={`glass-card variant-surface content-dense ${publicVariant} min-h-auto p-3 sm:p-4 md:p-5 lg:p-6 animate-[fadeIn_.45s_ease-out]`}>
            {children || <Outlet />}
          </div>
        </main>
        <PublicFooter />
        </div>
      </div>
    </PageCanvas>
  )
}

export default PublicLayout
