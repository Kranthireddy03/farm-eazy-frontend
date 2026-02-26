/**
 * Email Error Page Component
 * 
 * Professional error page displayed when email delivery fails.
 * Provides clear messaging and action options for users.
 * 
 * Features:
 * - Clear error messaging
 * - Professional design
 * - Action buttons for retry or alternative contact
 * - Responsive layout
 */

import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function EmailError() {
  const location = useLocation()
  const navigate = useNavigate()
  const [errorDetails, setErrorDetails] = useState({
    title: 'Email Delivery Failed',
    message: 'We were unable to send the email. Please try again later.',
    errorCode: null,
    email: null,
    returnPath: '/login'
  })

  useEffect(() => {
    // Parse error details from location state
    if (location.state) {
      setErrorDetails(prev => ({
        ...prev,
        title: location.state.title || prev.title,
        message: location.state.message || prev.message,
        errorCode: location.state.errorCode || null,
        email: location.state.email || null,
        returnPath: location.state.returnPath || '/login'
      }))
    }
  }, [location.state])

  const handleTryAgain = () => {
    // Navigate back to the previous page to try again
    if (location.state?.returnPath) {
      navigate(location.state.returnPath)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Error Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {errorDetails.title}
            </h1>
            <p className="text-white/90 text-sm">
              We encountered an issue sending your email
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Error Message Box */}
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-5 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg 
                    className="w-6 h-6 text-red-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-300 font-semibold mb-1">
                    What happened?
                  </h3>
                  <p className="text-red-400 text-sm leading-relaxed">
                    {errorDetails.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Info (if available) */}
            {errorDetails.email && (
              <div className="bg-slate-700 border border-slate-600 rounded-xl p-4 mb-6">
                <p className="text-slate-400 text-sm">
                  <span className="font-medium">Recipient:</span>{' '}
                  <span className="text-white">{errorDetails.email}</span>
                </p>
              </div>
            )}

            {/* Suggestions */}
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-3">What you can do:</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2 text-sm text-slate-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Wait a few minutes and try again</span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-slate-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Check that your email address is correct</span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-slate-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Contact our support team if the issue persists</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleTryAgain}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-500/40"
              >
                Try Again
              </button>
              
              <Link
                to="/login"
                className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Back to Login
              </Link>
            </div>

            {/* Support Link */}
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <p className="text-slate-400 text-sm">
                Need help?{' '}
                <Link 
                  to="/support" 
                  className="text-green-400 hover:text-green-300 font-semibold"
                >
                  Contact Support
                </Link>
              </p>
            </div>

            {/* Error Code (for debugging) */}
            {errorDetails.errorCode && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  Error Code: {errorDetails.errorCode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 FarmEazy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailError
