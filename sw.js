// IHSAN App Service Worker - Always fetch fresh (real-time sync)
const CACHE = 'ihsan-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept Supabase - always live
  if (url.includes('supabase.co')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    // Try network first for freshest content
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() =>
      // Fallback to cache if offline
      caches.match(e.request)
    )
  );
});
