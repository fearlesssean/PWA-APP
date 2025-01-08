// Service Worker for Shared Use Across Multiple Apps

// Base configuration
const CACHE_VERSION = 'v2';

// Fetch event: Dynamically determine app-specific cache and scope
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Dynamically determine APP_NAME and APP_SCOPE from the request URL
  const pathSegments = requestUrl.pathname.split('/').filter(Boolean); // Remove empty segments
  const APP_NAME = pathSegments[1] || 'default-app'; // Assume the second segment is the app name
  const APP_SCOPE = `/${APP_NAME}/`;
  const CACHE_NAME = `${APP_NAME}-cache-${CACHE_VERSION}`;
  console.log(APP_NAME);

  const urlsToCache = [
    `${APP_SCOPE}index.html`,
    `${APP_SCOPE}manifest.json`,
    `icons/icon-192x192.png`,
    `icons/icon-512x512.png`,
  ];

  // Install event: Cache resources for the app
  self.addEventListener('install', (installEvent) => {
    console.log(`[Service Worker] ${APP_NAME}: Install`);
    installEvent.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log(`[Service Worker] ${APP_NAME}: Caching resources`);
        return cache.addAll(urlsToCache);
      })
    );
    self.skipWaiting();
  });

  // Only handle requests within the app's scope
  if (!requestUrl.pathname.startsWith(APP_SCOPE)) {
    console.log(`[Service Worker] ${APP_NAME}: Ignoring request outside app scope:`, requestUrl.pathname);
    return;
  }

  // Serve cached resources or fetch from network
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
          if (cacheName.endsWith(`-cache-${CACHE_VERSION}`)) {
            return null; // Keep caches for the current version
          }
          console.log(`[Service Worker] Deleting old cache:`, cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});
