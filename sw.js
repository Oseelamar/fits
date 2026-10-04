// Offline support: keep the app shell, images, Three.js and the font so it opens without a connection.
// Bump VERSION whenever index.html or assets change so installed copies pick up the update.
const VERSION = 'fits-v3';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './assets/globe.png', './assets/paris.png', './assets/tokyo.png', './assets/newyork.png',
  './assets/act-city.png', './assets/act-dinner.png', './assets/act-beach.png',
  './assets/act-hiking.png', './assets/act-business.png', './assets/act-gym.png',
  './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // the page itself: network first so edits show up, cache when offline
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // images, Three.js modules and fonts: cache first
  if (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net'){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque'){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
