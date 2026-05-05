const CACHE_VERSION = 'weishi-v5';

const CACHE_URLS = [
  '/weishi-mgmt/',
  '/weishi-mgmt/index.html',
  '/weishi-mgmt/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(CACHE_URLS)
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).catch(() =>
        caches.match('/weishi-mgmt/index.html')
      );
    })
  );
});
