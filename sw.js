const CACHE = 'alumil-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/register.html',
  '/manifest.json',
  '/logo.PNG',
  '/css/style.css'
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip non-GET and external API calls (always need network)
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('yahoo.com')) return;
  if (e.request.url.includes('googleapis.com')) return;
  if (e.request.url.includes('geojs.io') || e.request.url.includes('ipapi.co')) return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a copy of successful responses
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
