// Service Worker: App-Shell offline, API immer frisch.
// Liegt unter /w/ (öffentlich), steuert per Service-Worker-Allowed aber die ganze Seite.
const VERSION = 'wichtel-v5';
// Nur Dateien unter /w/ vorab laden: alles andere liegt hinter dem Pangolin-Login
const SHELL = [
  '/w/shell',
  '/w/static/css/style.css',
  '/w/static/js/common.js',
  '/w/static/js/art.js',
  '/w/static/js/wichtel.js',
  '/w/static/fonts/fredoka.woff2',
  '/w/static/fonts/mountains-of-christmas.woff2',
  '/w/static/img/icon.svg',
  '/w/static/img/icon-192.png',
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
  const p = url.pathname;
  if (p.startsWith('/api/') || p.startsWith('/w/api/') || p === '/w/manifest.webmanifest') return; // immer Netz

  if (e.request.mode === 'navigate') {
    const shell = p.startsWith('/w/') ? '/w/shell' : p.startsWith('/admin/') ? '/__admin-shell' : '/__landing-shell';
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
