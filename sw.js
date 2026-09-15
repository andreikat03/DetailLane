const CACHE = 'detaillane-v5-5-calendar-1';
const OWN_CACHE_PREFIXES = ['detaillane-', 'quickquote-'];
const ASSETS = ['./', './index.html', './manifest.webmanifest', './favicon.ico', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];

async function precacheFresh() {
  const cache = await caches.open(CACHE);
  await Promise.all(ASSETS.map(async asset => {
    try {
      const response = await fetch(asset, { cache: 'reload' });
      if (response && response.ok) await cache.put(asset, response.clone());
    } catch (_) {}
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(precacheFresh());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && OWN_CACHE_PREFIXES.some(prefix => k.startsWith(prefix))).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: 'no-store' });
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      return (await caches.match(event.request)) || (event.request.mode === 'navigate' ? await caches.match('./index.html') : undefined) || Response.error();
    }
  })());
});
