/* IHSAN Business App — Service Worker (pass-through, no caching of app shell) */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // Always fetch fresh from network — never serve stale cached app
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
