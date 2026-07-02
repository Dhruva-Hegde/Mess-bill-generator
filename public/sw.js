const CACHE_NAME = 'malnad-mane-v12';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Malnad.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
  'https://cdn-icons-png.flaticon.com/512/2652/2652218.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - Network-First for HTML/Navigations, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For index.html or root page: Network-First to ensure we always get updates when online
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore network errors for background fetch
        });

      return cachedResponse || fetchPromise;
    })
  );
});
