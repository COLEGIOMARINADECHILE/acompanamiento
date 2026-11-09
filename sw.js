// Service worker: la app abre rapido y sigue mostrando la interfaz sin conexion.
// Los datos (Apps Script) siempre se piden a la red; nunca se guardan aqui.
const CACHE = 'acomp-aula-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || /script\.google\.com|googleusercontent\.com\/macros/.test(url.hostname + url.pathname)) return;
  if (req.mode === 'navigate') {   // pagina: red primero, cache de respaldo
    e.respondWith(fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => caches.match(req).then((m) => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {   // recursos: cache y actualizacion en segundo plano
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});