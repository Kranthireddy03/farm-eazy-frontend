import { useState, useEffect } from 'react'

/**
 * INACTIVITY WARNING COMPONENT
 * 
 * Displays warning modal when user is inactive for 90 seconds
 * Shows countdown timer with auto-logout message
 * User can click "Stay Online" to reset the timer
 */
function InactivityWarning({ showWarning, timeRemaining, onStayOnline }) {
  const [displayTime, setDisplayTime] = useState(timeRemaining)

  useEffect(() => {
    setDisplayTime(timeRemaining)
  }, [timeRemaining])

  if (!showWarning) {
    return null
  }

  // Format time for display
  const minutes = Math.floor(displayTime / 60)
  const seconds = displayTime % 60
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-8 max-w-md mx-4 border-4 border-red-600 animate-pulse">
        <div className="flex justify-center mb-6">
          <div className="bg-red-900/50 rounded-full p-6">
            <svg
              className="w-12 h-12 text-red-500 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 4v2M9 3h6m0 0a9 9 0 019 9v6a9 9 0 01-9 9H9a9 9 0 01-9-9v-6a9 9 0 019-9z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-red-500 mb-3">
          ⚠️ Session Expiring Soon
        </h2>

        <p className="text-center text-slate-200 mb-6 text-lg font-semibold">
          You have been inactive. Your session will expire in:
        </p>

        <div className="bg-red-900/40 border-4 border-red-600 rounded-lg p-8 mb-8 text-center">
          <div className="text-6xl font-bold text-red-500 font-mono">{formattedTime}</div>
          <p className="text-red-400 text-sm mt-2 font-semibold">minutes remaining</p>
        </div>

        <p className="text-center text-slate-400 mb-8">
          Click "Stay Online" to continue your session, or you will be logged out automatically.
        </p>

        <button
          onClick={onStayOnline}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-lg transform hover:scale-105 active:scale-95"
        >
          ✓ Stay Online
        </button>

        <p className="text-center text-slate-500 text-xs mt-6">
          Warning appears after 90 seconds of inactivity.
        </p>
      </div>
    </div>
  )
}

export default InactivityWarning
