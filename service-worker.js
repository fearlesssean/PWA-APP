// Service Worker for Shared Use Across Multiple Apps

const CACHE_VERSION = 'v2';
const GLOBAL_CACHE_NAME = `global-cache-${CACHE_VERSION}`;
const globalUrlsToCache = [
  //'/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  //'/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  '/PWA-APP/IndexedDBManager.js',
  '/PWA-APP/icons/icon-192x192.png',
  '/PWA-APP/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing global resources`);

  event.waitUntil(
    caches.open(GLOBAL_CACHE_NAME).then((cache) => {
      return cache.addAll(globalUrlsToCache).catch((error) => {
        console.error('[Service Worker] Failed to cache resources:', error);
        throw error;
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const { APP_NAME, APP_SCOPE, CACHE_NAME, urlsToCache } = resolveAppData(requestUrl);

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
          }).catch((error) => {
            console.error('[Service Worker] Failed to fetch global resource:', error);
            throw error;
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
