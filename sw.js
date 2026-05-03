// ── 偉士大樓 萬用自動更新 Service Worker ──────────────────────
// 此版本一旦設定完成，除非要更改快取策略，否則不需再改動。

const CACHE_NAME = 'weishi-mgmt-universal-v1';

// 1. 安裝階段：立刻接管
self.addEventListener('install', e => {
  self.skipWaiting();
});

// 2. 激活階段：清理不屬於目前 CACHE_NAME 的舊快取垃圾
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
      // 發起網路請求以獲取最新版本
      const networkFetch = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          // 將抓到的最新版存入快取，蓋掉舊的
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 斷網時靜默處理，不報錯
      });

      // 如果手機裡有快取就給快取（秒開），沒有就等網路抓回來
      return cachedResponse || networkFetch;
    })
  );
});
