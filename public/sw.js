/* Cache public pocket-guide assets only. Nonce HTML, RSC, health and map tiles stay network-only. */
if (typeof importScripts === "function") importScripts("/pwa-release.js");
const CACHE = "citylit-field-guide-" + (self.CITYLIT_PWA_RELEASE || "v5");
const CORE = [
  "/offline.html",
  "/offline.js",
  "/offline.css",
  "/manifest.webmanifest",
  "/data/places.json",
  "/data/cities.json",
  "/app-icon.svg",
  "/brand/khwezi-offline.svg",
  "/brand/apple-touch-icon.png",
  "/brand/app-icon-192.png",
  "/brand/app-icon-512.png",
  "/brand/app-icon-maskable.png",
];
const isPhoto = (path) => /^\/images\/[a-f0-9]{12}\.jpg$/.test(path);
const refreshCore = (cache) =>
  cache.addAll(
    CORE.map(
      (path) =>
        new Request(new URL(path, self.location.origin), { cache: "reload", redirect: "error" }),
    ),
  );
self.addEventListener("install", (event) => {
  // First installs activate normally. Updates wait for an explicit user action.
  event.waitUntil(caches.open(CACHE).then(refreshCore));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const current = await caches.open(CACHE);
      const previous = (await caches.keys()).filter(
        (key) => key.startsWith("citylit-field-guide-") && key !== CACHE,
      );
      for (const key of previous) {
        const old = await caches.open(key);
        let copied = true;
        for (const request of await old.keys()) {
          const url = new URL(request.url);
          if (url.origin !== self.location.origin || !url.pathname.startsWith("/images/")) continue;
          try {
            const photo = await old.match(request);
            if (photo && !(await current.match(request))) await current.put(request, photo);
          } catch {
            copied = false;
          }
        }
        // Keep old photos as a fallback if storage cannot fit the migration.
        if (copied) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
async function cachedPublic(request, allowOlderPhotos = false) {
  const current = await caches.open(CACHE);
  return (
    (await current.match(request)) || (allowOlderPhotos ? await caches.match(request) : undefined)
  );
}
async function offlineNavigation(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.status < 500) return response; // Preserve real 404s and auth responses.
  } catch {
    /* A slow or absent connection should still launch the guide. */
  } finally {
    clearTimeout(timeout);
  }
  return (
    (await cachedPublic("/offline.html")) ||
    new Response("Connect once to download your Citylit pocket guide.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(offlineNavigation(event.request));
    return;
  }
  if (!url.search && (CORE.includes(url.pathname) || isPhoto(url.pathname))) {
    event.respondWith(
      fetch(event.request).catch(
        async () =>
          (await cachedPublic(event.request, isPhoto(url.pathname))) ||
          new Response("Not downloaded", { status: 503 }),
      ),
    );
  }
});
async function guideStatus(cache) {
  const photos = new Set();
  for (const key of (await caches.keys()).filter((key) => key.startsWith("citylit-field-guide-"))) {
    for (const request of await (await caches.open(key)).keys()) {
      const url = new URL(request.url);
      if (url.origin === self.location.origin && !url.search && isPhoto(url.pathname))
        photos.add(url.pathname);
    }
  }
  return {
    textSaved: !!(await cache.match("/data/places.json")),
    photoCount: photos.size,
  };
}
self.addEventListener("message", (event) => {
  if (event.origin !== self.location.origin) return;
  const type = event.data?.type;
  if (type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (!["SAVE_GUIDE", "GUIDE_STATUS", "CLEAR_PHOTOS"].includes(type)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      let ok = true;
      try {
        if (type === "SAVE_GUIDE") {
          await refreshCore(cache);
          const places = await (await cache.match("/data/places.json")).json();
          const ids = Array.isArray(event.data.ids)
            ? [...new Set(event.data.ids.filter((id) => typeof id === "string"))].slice(0, 30)
            : [];
          const photos = [
            ...new Set(
              places
                .filter((p) => ids.includes(p.id))
                .flatMap((p) =>
                  Array.isArray(p.images) ? p.images.slice(0, 1).map((i) => i.src) : [],
                ),
            ),
          ];
          for (const photo of photos) {
            if (!isPhoto(photo)) {
              ok = false;
              continue;
            }
            try {
              await cache.add(
                new Request(new URL(photo, self.location.origin), { redirect: "error" }),
              );
            } catch {
              ok = false;
            }
          }
        }
        if (type === "CLEAR_PHOTOS") {
          // Include quota-retained older caches; preserve guide text and local saves.
          for (const key of (await caches.keys()).filter((key) =>
            key.startsWith("citylit-field-guide-"),
          )) {
            const stored = await caches.open(key);
            for (const request of await stored.keys())
              if (new URL(request.url).pathname.startsWith("/images/"))
                await stored.delete(request);
          }
        }
      } catch {
        ok = false;
      }
      event.ports?.[0]?.postMessage({ ok, ...(await guideStatus(cache)) });
    })(),
  );
});
