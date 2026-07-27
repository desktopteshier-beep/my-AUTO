// Minimal service worker: exists so the console is installable as a PWA.
// This dashboard is authenticated and per-admin, so pages and API responses
// are never cached here — only the static icon assets are, to avoid ever
// serving stale or cross-session data offline.
const CACHE = 'console-static-v1'
const STATIC_ASSETS = ['/system-icon.svg', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (!STATIC_ASSETS.includes(url.pathname)) return
  event.respondWith(caches.match(request).then(cached => cached || fetch(request)))
})
