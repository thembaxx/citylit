/* Public field-guide text and explicitly requested photos only; no third-party maps. */
const CACHE = 'citylit-field-guide-v4';
const CORE = ['/offline.html', '/data/places.json', '/data/cities.json', '/app-icon.svg', '/brand/khwezi-offline.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const current = await caches.open(CACHE);
    const previous = (await caches.keys()).filter(key => key.startsWith('citylit-field-guide-') && key !== CACHE);
    // A new identity must not discard a traveller's already-downloaded venue photos.
    for (const key of previous) {
      const old = await caches.open(key);
      for (const request of await old.keys()) {
        const url = new URL(request.url);
        if (url.origin !== self.location.origin || !url.pathname.startsWith('/images/')) continue;
        const photo = await old.match(request);
        if (photo && !(await current.match(request))) await current.put(request, photo);
      }
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (url.pathname === '/offline.html' || url.pathname === '/app-icon.svg' || ['/data/', '/images/', '/brand/'].some(prefix => url.pathname.startsWith(prefix)))
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'SAVE_GUIDE') return;
  event.waitUntil((async () => {
    let ok = true;
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(CORE);
      const places = await (await cache.match('/data/places.json')).json();
      const ids = Array.isArray(event.data.ids) ? event.data.ids.filter(id => typeof id === 'string').slice(0, 30) : [];
      const photos = [...new Set(places.filter(p => ids.includes(p.id)).flatMap(p => p.images.slice(0, 1).map(i => i.src)))];
      for (const photo of photos) {
        if (!photo.startsWith('/images/')) continue;
        try { await cache.add(photo); } catch { ok = false; }
      }
    } catch { ok = false; }
    const textSaved = !!(await cache.match('/data/places.json'));
    event.ports[0]?.postMessage({ ok, textSaved });
  })());
});
