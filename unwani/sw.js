const CACHE = "unwani-v016";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./app-standalone.js",
  "./unwani-engine.js",
  "./styles.css",
  "./manifest.json",
  "./icon.svg",
  "./audit.html",
  "./core.html",
  "./ops.html",
  "./legal.html"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => undefined);
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
