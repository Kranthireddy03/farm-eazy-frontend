import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Helper function to format seconds to MM:SS format
 * Example: 540 seconds -> "09:00", 65 seconds -> "01:05"
 */
const formatTimeDisplay = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * SESSION TIMEOUT HOOK
 * 
 * Total session: 5 minutes (300 seconds) with continuous countdown
 * Inactivity warning: 90 seconds of no activity
 * Auto-logout: 60 additional seconds after warning (150 seconds total inactivity)
 * Notification: Shows at 2 minutes (120 seconds) remaining
 * 
 * @returns {Object} { timeRemaining, showWarning, resetTimer, formatTimeDisplay }
 */
const useSessionTimeout = () => {
  const navigate = useNavigate()
  const TOTAL_SESSION_TIME = 900 // 15 minutes
  const INACTIVITY_WARNING_TIME = 180 // 3 minutes
  const INACTIVITY_LOGOUT_TIME = 120 // 2 minutes after warning
  const TWO_MINUTE_NOTIFICATION = 120 // 2 minutes remaining
  
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_SESSION_TIME)
  const [showWarning, setShowWarning] = useState(false)
  const [twoMinuteNotified, setTwoMinuteNotified] = useState(false)
  const sessionTimerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Start the main session timer that ticks down continuously
  const startSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }

    let remainingTime = TOTAL_SESSION_TIME
    setTimeRemaining(remainingTime)
    setShowWarning(false)
    setTwoMinuteNotified(false)
    lastActivityRef.current = Date.now()

    sessionTimerRef.current = setInterval(() => {
      remainingTime -= 1
      setTimeRemaining(remainingTime)

      // Calculate inactivity duration
      const timeSinceLastActivity = (Date.now() - lastActivityRef.current) / 1000
      
      // Show notification at 2 minutes remaining
      if (remainingTime === TWO_MINUTE_NOTIFICATION && !twoMinuteNotified) {
        setTwoMinuteNotified(true)
        // Dispatch custom event for notification
        window.dispatchEvent(new CustomEvent('session-time-warning', { 
          detail: { message: '⏰ 2 minutes remaining in your session!' } 
        }))
      }
      
      // Show warning when inactive for 90 seconds
      if (timeSinceLastActivity >= INACTIVITY_WARNING_TIME && !showWarning) {
        setShowWarning(true)
      }
      
      // Auto logout when inactive for 90 + 60 = 150 seconds
      if (timeSinceLastActivity >= INACTIVITY_WARNING_TIME + INACTIVITY_LOGOUT_TIME) {
        clearInterval(sessionTimerRef.current)
        localStorage.removeItem('farmEazy_token')
        localStorage.removeItem('farmEazy_email')
        localStorage.removeItem('farmEazy_userId')
        navigate('/login', { replace: true })
      }

      // Also logout if total session time expires
      if (remainingTime <= 0) {
        clearInterval(sessionTimerRef.current)
        localStorage.removeItem('farmEazy_token')
        localStorage.removeItem('farmEazy_email')
        localStorage.removeItem('farmEazy_userId')
        navigate('/login', { replace: true })
      }
    }, 1000)
  }, [navigate])

  // Reset timer on user activity
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)
    setTwoMinuteNotified(false)
    setTimeRemaining(TOTAL_SESSION_TIME)
  }, [])

  // Set up activity listeners
  useEffect(() => {
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      setShowWarning(false)
    }

    // Add event listeners
    activities.forEach((activity) => {
      document.addEventListener(activity, handleActivity)
    })

    // Start the session timer
    startSessionTimer()

    // Cleanup
    return () => {
      activities.forEach((activity) => {
        document.removeEventListener(activity, handleActivity)
      })
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [startSessionTimer])

  return {
    timeRemaining,
    showWarning,
    resetTimer,
    formatTimeDisplay,
  }
}

export default useSessionTimeout
