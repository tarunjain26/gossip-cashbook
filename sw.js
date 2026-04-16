const CACHE = 'gossip-cashbook-v2';
const BASE = '/gossip-cashbook/';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([
        BASE,
        BASE + 'index.html',
        BASE + 'icon-192.png',
        BASE + 'icon-512.png'
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Firebase calls — always network, never cache
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis.com') ||
      e.request.method !== 'GET') {
    return;
  }

  // App shell — cache first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          caches.open(CACHE).then(cache => cache.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => caches.match(BASE + 'index.html'));
    })
  );
});