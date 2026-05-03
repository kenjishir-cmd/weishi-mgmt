// ── 偉士大樓 Service Worker v4 ─────────────────────────
// ⚠️ 每次更新 index.html，請同時把下面數字加一（v4 → v5 → v6…）
// 這樣舊 PWA App 才會自動抓到新版本並重新載入
const CACHE_VERSION = 'weishi-v4';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500&family=DM+Mono&display=swap'
];

// ── INSTALL：建立新快取 ────────────────────────────────
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
  // 安裝完立刻跳過等待，不需要等舊 SW 關閉
  self.skipWaiting();
});

// ── ACTIVATE：刪除所有舊版快取 ────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => {
          console.log('[SW] 刪除舊快取:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim()) // 立刻接管所有分頁
  );
});

// ── FETCH：Cache First，背景更新快取 ──────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // 有快取先回傳，同時背景更新
        fetch(e.request).then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_VERSION).then(c =>
              c.put(e.request, networkRes.clone())
            );
          }
        }).catch(() => {});
        return cached;
      }
      // 無快取：從網路取得後存入快取
      return fetch(e.request)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});

// ── MESSAGE：接收主頁面的強制更新指令 ────────────────
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
