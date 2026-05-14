const CACHE = 'exglobal-v11';
const STATIC = [
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

  // Always network-first for HTML, JS, CSS — guarantees fresh code
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/') ||
      url.pathname.endsWith('.js') || url.pathname.endsWith('.css') ||
      url.search.includes('v=')) {
    e.respondWith(
      fetch(e.request)
        .then(res => { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first only for images/fonts/icons
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
