const CACHE = 'exglobal-v3';
const ASSETS = [
  '/ex-rabbi/',
  '/ex-rabbi/index.html',
  '/ex-rabbi/styles.css',
  '/ex-rabbi/script.js',
  '/ex-rabbi/translations.js',
  '/ex-rabbi/products.js',
  '/ex-rabbi/manifest.json',
  '/ex-rabbi/favicon.svg',
  '/ex-rabbi/logo.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/ex-rabbi/')))
  );
});
