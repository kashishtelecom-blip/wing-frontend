// ==========================================
// 1. CACHING (PWA) - Your existing code
// ==========================================
const CACHE_NAME = 'wing-v1';
const PRECACHE_URLS = [
  '/',
  '/explore',
  '/trending',
  '/manifest.webmanifest',
  '/wing-logo-v2.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Don't cache API calls or non-GET requests
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});

// ==========================================
// 2. PUSH NOTIFICATIONS - The NEW code
// ==========================================
self.addEventListener('push', function (event) {
  if (event.data) {
    let data = { title: 'Wing', body: 'You have a new notification.', url: '/' };
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }

    const options = {
      body: data.body,
      icon: '/wing-logo-v2.png',
      badge: '/wing-logo-v2.png',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});