// src/services/pushService.js
// Naya file — existing code ko touch nahi karta

const BACKEND = 'https://skillsaathi-backend.onrender.com';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  try {
    // 1. Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push not supported in this browser');
      return null;
    }

    // 2. Request notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // 3. Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 4. Fetch VAPID public key from backend
    const keyRes = await fetch(`${BACKEND}/api/v1/notifications/push/public-key`);
    if (!keyRes.ok) throw new Error(`Public key fetch failed: ${keyRes.status}`);
    const keyData = await keyRes.json();
    const vapidPublicKey = keyData.data.publicKey;

    // 5. Check existing subscription or subscribe
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // 6. Save subscription to backend
    const token = localStorage.getItem('ss_access_token');
    if (!token) {
      console.warn('No auth token — user not logged in');
      return subscription;
    }

    const payload = subscription.toJSON();
    const saveRes = await fetch(`${BACKEND}/api/v1/notifications/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: payload.endpoint,
        p256dhKey: payload.keys.p256dh,
        authKey: payload.keys.auth,
      }),
    });

    if (!saveRes.ok) {
      throw new Error(`Save failed: ${saveRes.status}`);
    }

    console.log('✅ Push subscription active');
    return subscription;
  } catch (err) {
    console.error('❌ Push subscription failed:', err);
    return null;
  }
}
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
    }
  } catch (err) {
    console.error('❌ Unsubscribe failed:', err);
  }
}