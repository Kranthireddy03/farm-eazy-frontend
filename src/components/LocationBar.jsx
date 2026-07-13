import { useLocationContext } from '../context/LocationContext'
import { useTheme } from '../context/ThemeContext'

export default function LocationBar() {
  const { selectedLocationLabel, hasSelectedLocation, openSelector } = useLocationContext()
  const { isDark } = useTheme()

  return (
    <div className={`sticky top-[68px] z-40 border-b backdrop-blur ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
      <div className="container-main py-2.5">
        <button
          type="button"
          onClick={openSelector}
          className={`w-full rounded-xl border px-4 py-2 text-left transition ${isDark ? 'border-slate-600 bg-slate-800/70 hover:border-emerald-400 text-slate-100' : 'border-slate-200 bg-white hover:border-emerald-500 text-slate-900'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Delivering To</p>
              <p className="mt-1 truncate text-sm font-semibold">
                {hasSelectedLocation ? selectedLocationLabel : 'Select your delivery location'}
              </p>
            </div>
            <span className={`text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Change
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
