// Service Worker — precaches app shell and assets for offline use
const CACHE_VERSION = 'v1::pixel-quiz';
const CACHE_ASSETS = [
  '/',
  'index.html',
  'script.js',
  'styles.css',
  'quizData1.json',
  'quizData2.json',
  'quizData3.json',
  'quizData4.json',
  'quizData5.json',
  'quizData6.json',
  'favicon.ico',
  'favicon-96x96.png',
  'favicon.svg',
  'apple-touch-icon.png',
  'web-app-manifest-192x192.png',
  'web-app-manifest-512x512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Simple cache-first strategy for requests
self.addEventListener('fetch', event => {
  const request = event.request;

  // Always try navigation requests (HTML) network-first, fallback to cache
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request).then(response => {
        // Update the cache with the latest index.html
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put('index.html', copy));
        return response;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // For other requests, use cache-first then network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(networkResponse => {
        // Put a copy in cache for future requests (optional for third-party requests)
        if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return networkResponse;
      }).catch(() => {
        // If image requested and not available, return a transparent fallback or appropriate response
        if (request.destination === 'image') {
          return new Response('', { status: 404, statusText: 'Image not in cache' });
        }
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
