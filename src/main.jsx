/**
 * React Application Entry Point
 * 
 * Sets up:
 * - React Router for page navigation
 * - BrowserRouter for client-side routing
 * - Mounts the App component to the DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { LoaderProvider } from './context/LoaderContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LoaderProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LoaderProvider>
  </React.StrictMode>,
)
