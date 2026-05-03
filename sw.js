// ── 偉士大樓 Service Worker v1.6.0 ───────────────────────
// 採用 Network First 策略：優先抓取網路新版，斷網時才用快取。

const CACHE_NAME = 'weishi-mgmt-v1.6.0';

// 需要快取的靜態資源
const PRE_CACHE_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500&family=DM+Mono&display=swap'
];

// 1. 安裝：存入基本資源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE_RESOURCES))
  );
  self.skipWaiting(); // 強制跳過等待，立刻更新
});

// 2. 激活：清除舊版的快取垃圾
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] 刪除舊快取:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // 立刻接管頁面
});

// 3. 抓取：網路優先 (Network First)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(networkRes => {
        // 如果網路通暢，更新快取並回傳
        if (networkRes && networkRes.status === 200) {
          const cacheCopy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, cacheCopy));
        }
        return networkRes;
      })
      .catch(() => {
        // 如果網路斷線，嘗試從快取拿資料
        return caches.match(e.request).then(cached => {
          // 如果快取有就給快取，都沒有就給首頁
          return cached || caches.match('./index.html');
        });
      })
  );
});
