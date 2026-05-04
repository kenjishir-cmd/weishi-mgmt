// ── 偉士大樓 Service Worker ──────────────────────────
// 策略：Cache First + Stale-While-Revalidate
// 每次改版只需更新 CACHE_VERSION
const CACHE_VERSION = 'weishi-v4';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500&family=DM+Mono&display=swap'
];

// ── INSTALL：預快取核心資源 ───────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.allSettled(
        CACHE_URLS.map(url => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

// ── ACTIVATE：清除舊快取 ──────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH：Cache First，背景更新 ─────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // 有快取 → 立即回傳，同時背景偷偷更新
      if (cached) {
        fetch(e.request).then(res => {
          if (res && res.status === 200)
            caches.open(CACHE_VERSION).then(c => c.put(e.request, res));
        }).catch(() => {});
        return cached;
      }
      // 沒快取 → 嘗試網路，成功就存快取
      return fetch(e.request).then(res => {
        if (res && res.status === 200)
          caches.open(CACHE_VERSION).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
