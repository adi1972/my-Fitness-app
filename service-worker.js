// ── GymLog Service Worker v2 ──────────────────────────
const CACHE = 'gymlog-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './Photos/Background app.png',
  './Sounds/soundreality-civil-defense-siren-128262.mp3'
];

// Install: pre-cache all app assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local assets, network-first for Google APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for Google APIs (OAuth, Fit)
  if (url.hostname.includes('google') || url.hostname.includes('googleapis')) {
    return; // let browser handle it normally
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache valid GET responses
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
