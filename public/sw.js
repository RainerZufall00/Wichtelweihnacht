// Service Worker: App-Shell offline, API immer frisch.
const VERSION = 'wichtel-v3';
const SHELL = [
  '/',
  '/shell/wichtel',
  '/shell/admin',
  '/static/css/style.css',
  '/static/js/common.js',
  '/static/js/art.js',
  '/static/js/wichtel.js',
  '/static/js/admin.js',
  '/static/js/landing.js',
  '/static/fonts/fredoka.woff2',
  '/static/fonts/mountains-of-christmas.woff2',
  '/static/img/icon.svg',
  '/static/img/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/manifest.webmanifest') return; // immer Netz

  if (e.request.mode === 'navigate') {
    const shell = url.pathname.startsWith('/w/') ? '/shell/wichtel' : url.pathname.startsWith('/admin/') ? '/shell/admin' : '/';
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(shell, copy)); }
          return res;
        })
        .catch(() => caches.match(shell))
    );
    return;
  }

  // Statisches: Cache zuerst, im Hintergrund auffrischen
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
