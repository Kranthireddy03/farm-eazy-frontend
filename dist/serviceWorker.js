// FarmEazy PWA Service Worker with Push Notifications

const CACHE_NAME = 'farm-eazy-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(urlsToCache);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip API calls for caching
  const apiPattern = /\/api\//;
  if (apiPattern.test(event.request.url)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// ==========================================
// PUSH NOTIFICATION HANDLING
// ==========================================

// Handle incoming push notifications
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received:', event);
  
  let data = {
    title: 'FarmEazy Notification',
    body: 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'farmeazy-notification',
    data: { url: '/' }
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.notificationId || data.tag,
        data: {
          url: payload.actionUrl || payload.url || '/',
          notificationId: payload.notificationId
        },
        actions: payload.actions || [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: payload.priority === 'HIGH' || payload.priority === 'URGENT',
        vibrate: [100, 50, 100]
      };
    } catch (e) {
      console.error('[ServiceWorker] Error parsing push data:', e);
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      actions: data.actions,
      requireInteraction: data.requireInteraction,
      vibrate: data.vibrate
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close (for tracking)
self.addEventListener('notificationclose', event => {
  console.log('[ServiceWorker] Notification closed:', event.notification.tag);
});

// Handle push subscription change (e.g., browser refreshes subscription)
self.addEventListener('pushsubscriptionchange', event => {
  console.log('[ServiceWorker] Push subscription changed');
  
  event.waitUntil(
    // Re-subscribe with the same options
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(newSubscription => {
        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + self.authToken // Note: this won't work directly
          },
          body: JSON.stringify(newSubscription.toJSON())
        });
      })
  );
});
