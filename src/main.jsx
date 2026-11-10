/**
 * React Application Entry Point
 * 
 * Sets up:
 * - React Router for page navigation
 * - BrowserRouter for client-side routing
 * - Console filter to reduce third-party noise
 * - Stale chunk reload recovery (vite:preloadError)
 * - Service worker lifecycle management (safe registration in prod, unregister in dev)
 * - Mounts the App component to the DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import App from './App'
import './index.css'
import { initConsoleFilter } from './utils/consoleFilter'

// Initialize console filter (hides third-party noise, preserves FarmEazy logs)
initConsoleFilter()

// Recover smoothly if a new production deployment changed chunk hashes
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[FarmEazy] New version deployed or chunk failed to load. Refreshing page...');
  const reloadKey = 'farmeazy_last_chunk_reload';
  const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
  const now = Date.now();
  if (now - lastReload > 8000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

// Service Worker Registration in Production / Unregistration in Dev
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then((registration) => {
          console.log('[FarmEazy] ServiceWorker active with scope:', registration.scope);
          // Check for worker updates
          registration.update();
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[FarmEazy] ServiceWorker registration failed:', error);
        });
    });
  } else {
    // Unregister any active service workers in development mode to prevent stale cache conflicts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
        console.log('[FarmEazy] Unregistered dev service worker:', reg.scope);
      }
    });
  }
}

const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim()

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  RECAPTCHA_SITE_KEY ? (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      {app}
    </GoogleReCaptchaProvider>
  ) : app
)
