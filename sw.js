const CACHE = 'exglobal-v31';

self.addEventListener('install', e => {
  // Use dynamic scope so it works on both exglobal.online and exrabbi.github.io/ex-rabbi/
  const base = self.registration.scope;
  const CORE = [
    base,
    base + 'index.html',
    base + 'favicon.png',
    base + 'icon-192.png',
    base + 'icon-512.png',
  ];
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
  const base = self.registration.scope;

  // Navigation — requested পেজ সরাসরি serve করো
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const c = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, c));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match(base + 'index.html')))
    );
    return;
  }

  // JS / CSS — always network-first so updates reach the installed app instantly
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
