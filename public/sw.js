// CaliberShelf — minimal service worker
// Satisfies PWA installability criteria without offline caching.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Do NOT call event.respondWith(): re-issuing the request via
// fetch(event.request) drops POST bodies on WebKit/iOS, which broke every
// mutation (e.g. Add Watch) in the installed PWA while GET-only browsing kept
// working. An empty fetch listener still satisfies PWA installability heuristics
// but lets the browser handle the network natively, so request bodies survive.
self.addEventListener("fetch", () => {});
