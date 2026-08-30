import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import UnifiedHeader from './shell/UnifiedHeader'
import PublicFooter from './PublicFooter'
import { PageCanvas } from './ui/PremiumSurface'

function PublicLayout({ children }) {
  const location = useLocation()

  const scrollToTopPage = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    })
  }

  useEffect(() => {
    scrollToTopPage()
  }, [location.pathname])

  const getPublicVariant = (pathname) => {
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'theme-split'
    if (pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/r/')) return 'theme-minimal'
    if (pathname.startsWith('/blog')) return 'theme-immersive'
    if (pathname.startsWith('/about') || pathname.startsWith('/contact') || pathname.startsWith('/public-services')) return 'theme-floating'
    return 'theme-glass'
  }

  const publicVariant = getPublicVariant(location.pathname)

  return (
    <PageCanvas className="bg-background">
      <div className={`layout-variant ${publicVariant} min-h-screen flex flex-col`}>
        <UnifiedHeader />
        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className={`content-dense ${publicVariant} min-h-full animate-[fadeIn_.45s_ease-out]`}>
            {children || <Outlet />}
          </div>
        </main>
        <PublicFooter />
      </div>
    </PageCanvas>
  )
}

export default PublicLayout
