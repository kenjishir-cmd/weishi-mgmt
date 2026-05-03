// ── 偉士大樓 萬用自動更新 Service Worker ──────────────────────
const CACHE_NAME = 'weishi-mgmt-universal-cache';

// 1. 安裝階段：不設定特定的版本清單，讓它在 Fetch 時動態捕捉
self.addEventListener('install', e => {
  self.skipWaiting(); 
});

// 2. 激活階段：清理不屬於目前 CACHE_NAME 的舊快取
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

// 3. 核心邏輯：Stale-While-Revalidate (先用快取秒開，同時背景抓新版)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // 建立一個網路請求，用來更新快取
      const networkFetch = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 斷網時的靜默錯誤處理
      });

      // 如果有快取就先給快取（秒開），沒有就等網路請求
      return cachedResponse || networkFetch;
    })
  );
});
