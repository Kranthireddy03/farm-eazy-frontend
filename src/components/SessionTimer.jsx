import { useState, useEffect } from 'react'

/**
 * SESSION TIMER COMPONENT
 * 
 * Displays countdown timer on all pages
 * Shows in top-right corner of the screen
 * Changes color based on remaining time:
 * - Green (normal): > 120 seconds
 * - Yellow (warning): 90-120 seconds
 * - Red (critical): < 90 seconds
 */
function SessionTimer({ timeRemaining, warningTime = 90 }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Determine color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining <= warningTime) {
      return 'bg-red-100 text-red-700 border-red-300' // Critical
    } else if (timeRemaining <= 120) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300' // Warning
    }
    return 'bg-green-100 text-green-700 border-green-300' // Normal
  }

  const getTimerBgColor = () => {
    if (timeRemaining <= warningTime) {
      return 'bg-red-500'
    } else if (timeRemaining <= 120) {
      return 'bg-yellow-500'
    }
    return 'bg-green-500'
  }

  // Format time display
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isExpanded ? (
        <div className={`border-2 rounded-lg p-4 shadow-lg ${getTimerColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">Session Timer</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-lg font-bold ml-4 hover:opacity-70"
            >
              ×
            </button>
          </div>
          <div className="text-center mb-2">
            <div className="text-3xl font-bold">{formattedTime}</div>
            <p className="text-xs opacity-75">Time remaining</p>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${getTimerBgColor()}`}
              style={{ width: `${(timeRemaining / 300) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs mt-2 opacity-75">
            {timeRemaining <= 90
              ? 'Warning: Your session is about to expire!'
              : 'Click anywhere to reset timer'}
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 ${getTimerColor()}`}
        >
          <div className="text-center">
            <div className="text-xs font-bold">{formattedTime}</div>
            <svg
              className="w-5 h-5 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </button>
      )}
    </div>
  )
}

export default SessionTimer
