// ── 偉士大樓 Service Worker v4 ─────────────────────────
// ⚠️ 每次更新 index.html，請同時把下面數字加一（v4 → v5 → v6…）
const CACHE_VERSION = 'weishi-v4';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500&family=DM+Mono&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return Promise.allSettled(
        CACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn('Cache add failed:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_VERSION).then(c => c.put(e.request, networkRes.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_VERSION).then(c => c.put(e.request, networkRes.clone()));
          }
          return networkRes;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
