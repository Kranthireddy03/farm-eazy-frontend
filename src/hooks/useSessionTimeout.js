import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Helper function to format seconds to MM:SS format.
 */
const formatTimeDisplay = (seconds) => {
  const s = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(s / 60)
  const secs = s % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const LAST_ACTIVITY_KEY = 'farmEazy_lastActivity'

/**
 * TRUE INACTIVITY SESSION TIMEOUT
 *
 * The timeout is measured from the LAST meaningful user activity, NOT from login.
 * An actively-using user is never logged out. Activity is DOM-only (mouse/keyboard/
 * scroll/touch/click); the chat presence heartbeat and other background network
 * activity do NOT reset this timer.
 *
 *  15 minutes (900s) of continuous inactivity -> warning
 *  30 minutes (1800s) of continuous inactivity -> logout
 *
 * @returns {Object} { timeRemaining, showWarning, resetTimer, formatTimeDisplay }
 */
const useSessionTimeout = () => {
  const navigate = useNavigate()
  const WARNING_AFTER = 900    // 15 minutes of inactivity -> warning
  const LOGOUT_AFTER = 1800    // 30 minutes of inactivity -> logout
  const TWO_MINUTE_NOTIFICATION = 120 // 2 minutes remaining to logout

  const [timeRemaining, setTimeRemaining] = useState(LOGOUT_AFTER)
  const [showWarning, setShowWarning] = useState(false)
  const [twoMinuteNotified, setTwoMinuteNotified] = useState(false)
  const sessionTimerRef = useRef(null)
  const lastActivityRef = useRef(readLastActivity())

  function readLastActivity() {
    try {
      const v = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10)
      return v > 0 ? v : Date.now()
    } catch (_e) {
      return Date.now()
    }
  }

  const markActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    try { localStorage.setItem(LAST_ACTIVITY_KEY, now.toString()) } catch (_e) {}
    setShowWarning(false)
    setTwoMinuteNotified(false)
  }, [])

  // Reset the inactivity deadline (Continue Session button).
  const resetTimer = useCallback(() => {
    markActivity()
    setTimeRemaining(LOGOUT_AFTER)
  }, [markActivity])

  // Start the inactivity check ticking once per second.
  const startTimer = useCallback(() => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)

    lastActivityRef.current = readLastActivity()
    setTimeRemaining(LOGOUT_AFTER)
    setShowWarning(false)
    setTwoMinuteNotified(false)

    sessionTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = (Date.now() - lastActivityRef.current) / 1000
      const remaining = LOGOUT_AFTER - timeSinceLastActivity
      setTimeRemaining(remaining)

      if (remaining <= TWO_MINUTE_NOTIFICATION && !twoMinuteNotified) {
        setTwoMinuteNotified(true)
        window.dispatchEvent(new CustomEvent('session-time-warning', {
          detail: { message: '⏰ 2 minutes remaining before inactivity logout!' },
        }))
      }

      if (timeSinceLastActivity >= WARNING_AFTER && !showWarning) {
        setShowWarning(true)
      }

      if (timeSinceLastActivity >= LOGOUT_AFTER) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
        localStorage.removeItem('farmEazy_token')
        localStorage.removeItem('farmEazy_email')
        localStorage.removeItem('farmEazy_userId')
        navigate('/login', { replace: true })
      }
    }, 1000)
  }, [navigate, showWarning, twoMinuteNotified])

  // Set up DOM activity listeners (meaningful user interaction only).
  useEffect(() => {
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      try { localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString()) } catch (_e) {}
      setShowWarning(false)
      setTwoMinuteNotified(false)
    }

    activities.forEach((activity) => document.addEventListener(activity, handleActivity, { passive: true }))

    startTimer()

    return () => {
      activities.forEach((activity) => document.removeEventListener(activity, handleActivity))
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }
  }, [startTimer])

  return {
    timeRemaining,
    showWarning,
    resetTimer,
    formatTimeDisplay,
  }
}

export default useSessionTimeout
