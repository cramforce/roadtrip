importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0-beta.0/workbox-sw.js');

// Uncomment for debugging
// workbox.core.setLogLevel(workbox.core.LOG_LEVELS.debug);

workbox.routing.registerRoute(
  /^https:\/\/((\w+)\.googleapis\.com|www\.googletagmanager\.com|code\.getmdl\.io)\/.+$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-cache',
    plugins: [
      // Allow opaque responses
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200] // YOLO
      }),
    ],
  })
);

workbox.routing.registerRoute(
  // Cache immutable files forever
  /^https:\/\/roadtrip-api\./,
  // Use the cache if it's available
  workbox.strategies.cacheFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Cache for a maximum of 30 days
        maxAgeSeconds: 30 * 24 * 60 * 60,
      })
    ],
  })
);

workbox.routing.registerRoute(
  // Cache immutable files forever
  /^https:\/\/[^.]+\.wikipedia\.org\//,
  // Use the cache if it's available
  workbox.strategies.cacheFirst({
    cacheName: 'wiki-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Cache for a maximum of 2 days
        maxAgeSeconds: 2 * 24 * 60 * 60,
      })
    ],
  })
);

workbox.routing.registerRoute(
  // Prefer the network but if it doesn't respond within 1 seconds,
  // fallback to a doc if we have a cached version that is max
  // 10 days old.
  // Basically that means that the schedule should load offline for the
  // duration of the conference
  /(\/|\.html|\.js|\.css)$/,
  // Use the network unless things are slow
  workbox.strategies.networkFirst({
    cacheName: 'doc-cache',
    networkTimeoutSeconds: 1,
    plugins: [
      new workbox.expiration.Plugin({
        // Cache for a maximum of 10 days
        maxAgeSeconds: 10 * 24 * 60 * 60,
      })
    ],
  })
);
