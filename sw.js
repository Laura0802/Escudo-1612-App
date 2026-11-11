/* Service worker de Escudo 1612.
   Guarda la app en caché para que se abra sin conexión y para que el
   navegador la ofrezca como aplicación instalable.

   IMPORTANTE: al publicar una versión nueva de la app, cambia el número
   de VERSION. Si no, los visitantes seguirán viendo la versión guardada. */

const VERSION = 'v1';
const CACHE = 'escudo1612-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Solo lo propio: la API de Base44 y Google Analytics van por red.
  if (url.origin !== self.location.origin) return;

  // Navegación: red primero, y si falla, la app guardada.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || caches.match(new URL('index.html', self.registration.scope).href))
        )
    );
    return;
  }

  // Resto de recursos propios: caché primero.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).catch(() => hit))
  );
});
