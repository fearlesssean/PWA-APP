// Service Worker for Shared Use Across Multiple Apps

// Base configuration
const CACHE_VERSION = 'v2';

// Global scope for dynamic mappings
const appCaches = new Map();

// Dynamically resolve cache data for apps
function resolveAppData(requestUrl) {
  const pathSegments = requestUrl.pathname.split('/').filter(Boolean);
  const APP_NAME = pathSegments[1] || 'default-app'; // Assume second segment is app name
  const APP_SCOPE = `/${APP_NAME}/`;
  const CACHE_NAME = `${APP_NAME}-cache-${CACHE_VERSION}`;
  const urlsToCache = [
    `${APP_SCOPE}index.html`,
    `${APP_SCOPE}manifest.json`,
    '/PWA-APP/icons/icon-192x192.png',
    '/PWA-APP/icons/icon-512x512.png',
  ];
  return { APP_NAME, APP_SCOPE, CACHE_NAME, urlsToCache };
}

// Add install event handler dynamically for each app
function registerInstallEvent({ CACHE_NAME, urlsToCache }) {
  self.addEventListener('install', (event) => {
    console.log(`[Service Worker] Install event for ${CACHE_NAME}`);
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log(`[Service Worker] Caching resources for ${CACHE_NAME}`);
        return cache.addAll(urlsToCache);
      })
    );
    self.skipWaiting();
  });
}

// Fetch event: Dynamically determine app-specific cache and scope
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const { APP_NAME, APP_SCOPE, CACHE_NAME, urlsToCache } = resolveAppData(requestUrl);

  // Register install event dynamically if not already done for this app
  if (!appCaches.has(APP_NAME)) {
    appCaches.set(APP_NAME, true);
    registerInstallEvent({ CACHE_NAME, urlsToCache });
  }

  // Only handle requests within the app's scope
  if (!requestUrl.pathname.startsWith(APP_SCOPE)) {
    console.log(`[Service Worker] Ignoring request outside ${APP_NAME} scope:`, requestUrl.pathname);
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
          if (!cacheName.endsWith(`-cache-${CACHE_VERSION}`)) {
            console.log(`[Service Worker] Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
