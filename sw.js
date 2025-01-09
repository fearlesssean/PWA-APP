const CACHE_PREFIX = 'pwa-cache-';

self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/PWA-APP/manifest-list.json') // Fetch the list of app manifests
      .then((response) => response.json())
      .then(async (manifestUrls) => {
        for (const manifestUrl of manifestUrls) {
          const response = await fetch(manifestUrl);
          const manifest = await response.json();
          const cacheName = `${CACHE_PREFIX}${manifest.short_name}`;

          // Cache resources listed in the manifest
          const resources = [
            manifest.start_url,
            ...manifest.icons.map((icon) => icon.src),
          ];

          const cache = await caches.open(cacheName);
          await cache.addAll(resources);
        }
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.keys().then((cacheNames) => {
      const matchingCache = cacheNames.find((cacheName) => {
        return event.request.url.includes(cacheName.replace(CACHE_PREFIX, ''));
      });

      if (matchingCache) {
        return caches
          .open(matchingCache)
          .then((cache) => cache.match(event.request))
          .then((response) => {
            return (
              response ||
              fetch(event.request).then((networkResponse) => {
                // Cache dynamically fetched resources
                caches.open(matchingCache).then((cache) =>
                  cache.put(event.request, networkResponse.clone())
                );
                return networkResponse;
              })
            );
          });
      }

      // Fallback to normal fetch if no cache matches
      return fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    fetch('/PWA-APP/manifest-list.json') // Fetch updated list of manifests
      .then((response) => response.json())
      .then((manifestUrls) =>
        caches.keys().then((cacheNames) => {
          const validCacheNames = manifestUrls.map((url) =>
            `${CACHE_PREFIX}${url.split('/').slice(-2, -1)[0]}`
          );

          // Debugging logs
          console.log('Cache Names:', cacheNames);
          console.log('Manifest URLs:', manifestUrls);
          console.log('Valid Cache Names:', validCacheNames);

          return Promise.all(
            cacheNames.map((cacheName) => {
              if (!validCacheNames.includes(cacheName)) {
                console.log(`Deleting old cache: ${cacheName}`);
                return caches.delete(cacheName);
              }
            })
          );
        })
      )
  );
});
