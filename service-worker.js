// Service Worker for Shared Use Across Multiple Apps

// Base configuration
const CACHE_VERSION = 'v2';
const GLOBAL_CACHE_NAME = `global-cache-${CACHE_VERSION}`;
const globalUrlsToCache = [
  '/PWA-APP/IndexedDBManager.js',
  '/PWA-APP/icons/icon-192x192.png',
  '/PWA-APP/icons/icon-512x512.png',
];

// Global cache installation
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing global resources`);
  event.waitUntil(
    caches.open(GLOBAL_CACHE_NAME).then((cache) => {
      return cache.addAll(globalUrlsToCache);
    })
  );
  self.skipWaiting();
});

// Dynamically resolve app-specific cache data
function resolveAppData(requestUrl) {
  const pathSegments = requestUrl.pathname.split('/').filter(Boolean);
  const APP_NAME = pathSegments[1] || 'default-app'; // Assume second segment is app name
  const APP_SCOPE = `/PWA-APP/${APP_NAME}/`;  // Adjust scope to match subfolder structure
  const CACHE_NAME = `${APP_NAME}-cache-${CACHE_VERSION}`;
  const urlsToCache = [
    `${APP_SCOPE}index.html`,
    `${APP_SCOPE}manifest.json`,
    `${APP_SCOPE}styles.css`,
    `${APP_SCOPE}app.js`,
  ];
  return { APP_NAME, APP_SCOPE, CACHE_NAME, urlsToCache };
}

// Fetch event
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const { APP_NAME, APP_SCOPE, CACHE_NAME, urlsToCache } = resolveAppData(requestUrl);

  // Cache global resources
  if (globalUrlsToCache.includes(requestUrl.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((response) => {
            const responseToCache = response.clone();
            caches.open(GLOBAL_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
        );
      })
    );
    return;
  }

  // Ignore requests outside app scope
  if (!requestUrl.pathname.startsWith(APP_SCOPE)) {
    console.log(`[Service Worker] Ignoring request outside ${APP_NAME} scope:`, requestUrl.pathname);
    return;
  }

  // Serve app-specific resources
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(`[Service Worker] ${APP_NAME}: Serving from cache:`, requestUrl.pathname);
        return cachedResponse;
      }

      console.log(`[Service Worker] ${APP_NAME}: Fetching from network:`, requestUrl.pathname);
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response; // Return uncacheable response directly
          }

          // Cache the response for future requests
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error(`[Service Worker] ${APP_NAME}: Fetch failed:`, error);
          throw error;
        });
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Cleaning up old caches`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.endsWith(`-cache-${CACHE_VERSION}`) && cacheName !== GLOBAL_CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
