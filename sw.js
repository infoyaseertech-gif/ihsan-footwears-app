/* IHSAN Footwears — Service Worker v3 */
const CACHE = 'ihsan-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({type:'RELOAD'}))
      ))
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) {
    return e.respondWith(fetch(e.request));
  }
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .catch(() => caches.match('./index.html'))
      )
  );
});
