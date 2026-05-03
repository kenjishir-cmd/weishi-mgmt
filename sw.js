const CACHE_NAME = 'weishi-app-cache';

// 安裝時只存入基本框架
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// 核心：網路優先策略
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    // 1. 優先嘗試從網路抓取最新的 index.html (或其他檔案)
    fetch(e.request)
      .then(networkRes => {
        // 如果網路通暢，就把新版存進快取，並回傳新版
        if (networkRes && networkRes.status === 200) {
          const cacheCopy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, cacheCopy));
        }
        return networkRes;
      })
      .catch(() => {
        // 2. 如果沒網路（離線），則從快取抓取之前存好的內容
        return caches.match(e.request).then(cached => {
          // 如果連快取都沒有，最後手段才抓 index.html
          return cached || caches.match('./index.html');
        });
      })
  );
});
