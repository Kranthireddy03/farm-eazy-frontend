import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function PublicFooter() {
  const { isDark } = useTheme()

  return (
    <footer className={`${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-emerald-100 text-slate-700'} border-t mt-auto`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>FarmEazy</p>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              A modern platform for farming operations, support workflows, and informed decision-making.
            </p>
          </div>

          <div>
            <p className={`font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Public Pages</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/about" className="hover:underline">About</Link>
              <Link to="/public-services" className="hover:underline">Platform Overview</Link>
              <Link to="/blog" className="hover:underline">Blog</Link>
              <Link to="/faq" className="hover:underline">FAQ</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>

          <div>
            <p className={`font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Legal</p>
            <div className="flex flex-col gap-1 text-sm">
              <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="hover:underline">Terms</Link>
              <Link to="/refund-policy" className="hover:underline">Refund Policy</Link>
              <Link to="/shipping-policy" className="hover:underline">Shipping Policy</Link>
              <Link to="/marketplace-disclosure" className="hover:underline">Marketplace Disclosure</Link>
            </div>
          </div>
        </div>

        <div className={`mt-6 pt-4 border-t text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${isDark ? 'border-slate-800 text-slate-500' : 'border-emerald-100 text-slate-500'}`}>
          <p>Contact: support@farm-eazy.com</p>
          <p>© {new Date().getFullYear()} FarmEazy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
