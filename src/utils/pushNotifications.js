// src/utils/pushNotifications.js
// Utility for registering and sending push notifications

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/serviceWorker.js');
      return reg;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }
}

export async function subscribeUserToPush(registration) {
  if (!('PushManager' in window)) return null;
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('<YOUR_PUBLIC_VAPID_KEY>')
    });
    return sub;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function showLocalNotification(title, body, swReg) {
  if (swReg && swReg.showNotification) {
    swReg.showNotification(title, { body });
  } else if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
