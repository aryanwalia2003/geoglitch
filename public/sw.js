// cache-first: hashed assets + data, network-first: pages
const C = "gg-v3";
const PRE = ["/", "/border", "/river", "/higher", "/hops", "/truesize", "/length", "/antipode", "/sun", "/duel", "/blitz", "/trio", "/board", "/data/stats.json", "/data/borders.json", "/data/rivers.json", "/data/world.json"];
const put = (req, res) => { const cp = res.clone(); caches.open(C).then((c) => c.put(req, cp)); return res; };

self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(PRE))); self.skipWaiting(); });
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => clients.claim())),
);
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const hit = u.pathname.startsWith("/_next/static") || u.pathname.startsWith("/data/");
  e.respondWith(
    hit
      ? caches.match(e.request).then((r) => r || fetch(e.request).then((res) => put(e.request, res)))
      : fetch(e.request).then((res) => put(e.request, res)).catch(() => caches.match(e.request)),
  );
});
