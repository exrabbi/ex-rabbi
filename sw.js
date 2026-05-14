const CACHE = 'exglobal-v6';
const STATIC = [
  '/ex-rabbi/styles.css',
  '/ex-rabbi/script.js',
  '/ex-rabbi/translations.js',
  '/ex-rabbi/products.js',
  '/ex-rabbi/favicon.svg',
  '/ex-rabbi/logo.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(STATIC.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Network-first for HTML so updates are always served fresh
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for static assets (CSS/JS/images)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const c = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, c));
        return res;
      });
    })
  );
});
