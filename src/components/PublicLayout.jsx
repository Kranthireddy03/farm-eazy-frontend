import { Outlet } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from './DarkModeToggle'
import PublicHeader from './PublicHeader'
import PublicFooter from './PublicFooter'

function PublicLayout({ children }) {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 to-cyan-50'}`}>
      <PublicHeader />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <PublicFooter />
      <DarkModeToggle floating />
    </div>
  )
}

export default PublicLayout
