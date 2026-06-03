const CACHE = 'exglobal-v33';

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
      .then(() => {
        // Tell all open tabs to reload so they get the fresh SW immediately
        self.clients.matchAll({ type: 'window', includeUncontrolled: false })
          .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })));
      })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const base = self.registration.scope;

  // Navigation — admin.html সরাসরি serve করো, SW bypass
  if (e.request.mode === 'navigate') {
    const reqUrl = new URL(e.request.url);
    if (reqUrl.pathname.includes('admin')) {
      e.respondWith(fetch(e.request)); // direct fetch, no redirect
      return;
    }
    e.respondWith(
      fetch(base + 'index.html')
        .then(res => {
          const c = res.clone();
          caches.open(CACHE).then(cache => cache.put(base + 'index.html', c));
          return res;
        })
        .catch(() => caches.match(base + 'index.html').then(r => r || caches.match(base)))
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
