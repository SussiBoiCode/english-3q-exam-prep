// Offline cache. Bump VERSION whenever any file changes so phones pick up the new copy.
const VERSION = 'v1';
const CACHE = 'eng3q-' + VERSION;
const FILES = [
  './', 'index.html', 'fonts.css', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/BricolageGrotesque-normal-9955101c.woff2',
  'fonts/IBMPlexMono-normal-b3398d77.woff2',
  'fonts/NotoSansKR-normal-095f493b.woff2',
  'fonts/SourceSerif4-italic-785649c0.woff2',
  'fonts/SourceSerif4-normal-c66b77b7.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache first (works with no signal at all); refresh the cached copy in the background when online.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const fresh = fetch(e.request)
    .then(r => r.ok ? caches.open(CACHE).then(c => c.put(e.request, r.clone())).then(() => r) : r)
    .catch(() => null);
  e.waitUntil(fresh);
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    return (await fresh) || (e.request.mode === 'navigate' ? c.match('index.html') : Response.error());
  }));
});
