// ============================================================
//  GymLog service worker — offline app shell
// ============================================================
const VERSION = "gymlog-v1.3.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./css/styles.css",
  "./assets/fonts/anton.woff2",
  "./assets/fonts/hanken-latin.woff2",
  "./assets/fonts/hanken-latin-ext.woff2",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./js/app.js",
  "./js/store.js",
  "./js/state.js",
  "./js/sync.js",
  "./js/coach.js",
  "./js/utils.js",
  "./js/components/icons.js",
  "./js/components/muscleMap.js",
  "./js/components/charts.js",
  "./js/components/restTimer.js",
  "./js/components/sheet.js",
  "./js/components/picker.js",
  "./js/views/today.js",
  "./js/views/log.js",
  "./js/views/library.js",
  "./js/views/body.js",
  "./js/views/progress.js",
  "./js/views/settings.js",
  "./data/exercises.js",
  "./data/muscles.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin

  // App-shell fallback for navigations
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Cache-first for everything else, with background refresh
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
