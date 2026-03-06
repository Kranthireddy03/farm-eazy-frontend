/**
 * React Application Entry Point
 * 
 * Sets up:
 * - React Router for page navigation
 * - BrowserRouter for client-side routing
 * - Console filter to reduce third-party noise
 * - Mounts the App component to the DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initConsoleFilter } from './utils/consoleFilter'

// Initialize console filter (hides third-party noise, preserves FarmEazy logs)
// To disable: comment out this line and refresh
initConsoleFilter()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
