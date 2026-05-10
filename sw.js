const CACHE_NAME = "weather-histogram-v6";
const ASSETS = ["./", "index.html", "manifest.json"];

// Recursos que deben ser cacheados agresivamente (Cache-First)
const STATIC_ASSETS = /\.(js|css|png|jpg|jpeg|svg|woff2)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        for (const asset of ASSETS) {
          try {
            await cache.add(asset);
          } catch (e) {
            console.warn("[SW] Failed to cache asset:", asset, e);
          }
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a las APIs externas
  if (
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("openstreetmap.org")
  ) {
    return; // Dejar que el navegador lo maneje sin Service Worker
  }

  // Solo manejar peticiones GET y esquemas http/https
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              event.request.url.startsWith("http")
            ) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Estrategia para assets estáticos: Cache-First con actualización en background
        if (STATIC_ASSETS.test(url.pathname)) {
          return cachedResponse || fetchPromise;
        }

        // Estrategia Stale-While-Revalidate para el resto
        return cachedResponse || fetchPromise;
      });
    }),
  );
});
