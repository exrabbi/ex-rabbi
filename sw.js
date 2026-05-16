const CACHE = 'exglobal-v23';
const CORE = [
  '/ex-rabbi/',
  '/ex-rabbi/index.html',
  '/ex-rabbi/favicon.png',
  '/ex-rabbi/icon-192.png',
  '/ex-rabbi/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(CORE.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Navigation requests (opening the app) — always go to index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch('/ex-rabbi/index.html')
        .then(res => {
          const c = res.clone();
          caches.open(CACHE).then(cache => cache.put('/ex-rabbi/', c));
          return res;
        })
        .catch(() => caches.match('/ex-rabbi/index.html').then(r => r || caches.match('/ex-rabbi/')))
    );
    return;
  }

  // JS / CSS — always network-first so updates reach the installed app
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.search.includes('v=')
  ) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const c = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, c));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Images / fonts — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const c = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, c));
        return res;
      }).catch(() => cached);
    })
  );
});
