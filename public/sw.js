// public/sw.js
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Skill Equator';
  const options = {
    body: data.body || 'Aapko ek naya update mila hai.',
    icon: '/logo.png',
    badge: '/logo.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://skillequator.in/')
  );
});