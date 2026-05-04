// ── 偉士大樓 萬用自動更新 Service Worker v2.0.2 ──────────────────
// 優化點：確保安裝時預抓 index.html，解決初次離線可能打不開的問題。

const CACHE_NAME = 'weishi-mgmt-v2.0.2';
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. 安裝階段：立刻接管，並預抓核心檔案
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// 2. 激活階段：清理舊快取垃圾
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 核心邏輯：Stale-While-Revalidate (快取秒開 + 背景靜默更新)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // 排除外站請求（如天氣 API 不快取，確保溫度是活的）
  if (!e.request.url.includes(self.location.origin) && !e.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      const networkFetch = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 斷網時不報錯
      });

      // 有快取給快取，沒快取等網路
      return cachedResponse || networkFetch;
    })
  );
});
