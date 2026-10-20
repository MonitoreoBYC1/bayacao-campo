/* Service worker — Bayacao Registro de Campo
   Estrategia cache-first. Cambiar CACHE al publicar una versión nueva. */
const CACHE = 'bayacao-v4'; // v1.1: ficha del árbol, límites de tamaño
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './xlsx.full.min.js',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: precargar todos los archivos de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activación: borrar cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Peticiones: primero caché; si no está, red (y se guarda); sin red, index.html para navegación
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req, { ignoreSearch: true })
        .then((r) => r || caches.match('./index.html'))
        .then((r) => r || fetch(req))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      });
    })
  );
});
