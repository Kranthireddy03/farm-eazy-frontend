// src/utils/pushNotifications.js
// Utility for registering and sending push notifications

import apiClient from '../services/apiClient';

// VAPID public key - will be fetched from backend
let vapidPublicKey = null;

/**
 * Register the service worker for push notifications
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/serviceWorker.js');
      console.log('[PushNotifications] Service Worker registered:', reg.scope);
      return reg;
    } catch (err) {
      console.error('[PushNotifications] Service Worker registration failed:', err);
      return null;
    }
  }
  console.warn('[PushNotifications] Service Worker not supported');
  return null;
}

/**
 * Fetch VAPID public key from backend
 */
export async function getVapidPublicKey() {
  if (vapidPublicKey) {
    return vapidPublicKey;
  }
  
  try {
    const response = await apiClient.get('/push/vapid-key');
    vapidPublicKey = response.data.publicKey;
    console.log('[PushNotifications] VAPID key fetched from backend');
    return vapidPublicKey;
  } catch (err) {
    console.error('[PushNotifications] Failed to fetch VAPID key:', err);
    return null;
  }
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushSupported() {
  return 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Check current push permission status
 */
export function getPushPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  const permission = await Notification.requestPermission();
  console.log('[PushNotifications] Permission result:', permission);
  return permission;
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeUserToPush(registration) {
  if (!('PushManager' in window)) {
    console.warn('[PushNotifications] PushManager not supported');
    return null;
  }
  
  try {
    // Get VAPID key from backend
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.error('[PushNotifications] No VAPID key available');
      return null;
    }
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    console.log('[PushNotifications] Push subscription created:', subscription.endpoint.slice(-20));
    
    // Send subscription to backend
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (err) {
    console.error('[PushNotifications] Push subscription failed:', err);
    return null;
  }
}

/**
 * Send push subscription to backend server
 */
async function sendSubscriptionToServer(subscription) {
  try {
    const subscriptionData = subscription.toJSON();
    await apiClient.post('/push/subscribe', {
      endpoint: subscriptionData.endpoint,
      keys: {
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth
      },
      userAgent: navigator.userAgent
    });
    console.log('[PushNotifications] Subscription sent to server');
    return true;
  } catch (err) {
    console.error('[PushNotifications] Failed to send subscription to server:', err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // Notify backend
      await apiClient.post('/push/unsubscribe', {
        endpoint: subscription.endpoint
      });
      
      // Unsubscribe locally
      await subscription.unsubscribe();
      console.log('[PushNotifications] Unsubscribed successfully');
      return true;
    }
    return false;
  } catch (err) {
    console.error('[PushNotifications] Failed to unsubscribe:', err);
    return false;
  }
}

/**
 * Check if user is currently subscribed to push
 */
export async function isSubscribed(registration) {
  if (!registration) return false;
  
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (err) {
    console.error('[PushNotifications] Error checking subscription:', err);
    return false;
  }
}

/**
 * Full setup: register service worker, request permission, subscribe
 */
export async function setupPushNotifications() {
  // Check support
  if (!isPushSupported()) {
    console.warn('[PushNotifications] Push notifications not supported');
    return { success: false, reason: 'unsupported' };
  }
  
  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return { success: false, reason: 'sw-failed' };
  }
  
  // Wait for service worker to be ready
  await navigator.serviceWorker.ready;
  
  // Check/request permission
  let permission = getPushPermission();
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }
  
  if (permission !== 'granted') {
    console.warn('[PushNotifications] Permission not granted:', permission);
    return { success: false, reason: 'permission-denied', permission };
  }
  
  // Subscribe to push
  const subscription = await subscribeUserToPush(registration);
  if (!subscription) {
    return { success: false, reason: 'subscription-failed' };
  }
  
  return { 
    success: true, 
    registration, 
    subscription 
  };
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

/**
 * Show a local notification (for testing)
 */
export function showLocalNotification(title, body, swReg) {
  if (swReg && swReg.showNotification) {
    swReg.showNotification(title, { 
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      tag: 'test-notification'
    });
  } else if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

