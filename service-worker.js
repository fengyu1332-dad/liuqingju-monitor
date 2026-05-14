const CACHE_NAME = 'liuqingju-v2';
const STATIC_CACHE = 'liuqingju-static-v2';
const DYNAMIC_CACHE = 'liuqingju-dynamic-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/modal-style.css',
    '/css/notification-style.css',
    '/js/auth.js',
    '/js/security-utils.js',
    '/js/auth-modal.js',
    '/js/user-menu.js',
    '/js/main.js',
    '/js/toast-component.js',
    '/manifest.json'
];

const CDN_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

const MAX_DYNAMIC_ITEMS = 50;

self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.addAll(CDN_ASSETS);
            })
        ]).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => {
                        return cacheName.startsWith('liuqingju-') && 
                               cacheName !== STATIC_CACHE && 
                               cacheName !== DYNAMIC_CACHE;
                    })
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (url.origin === location.origin) {
        if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('/', '')))) {
            event.respondWith(cacheFirst(request, STATIC_CACHE));
            return;
        }
    }

    if (CDN_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
        return;
    }

    if (url.origin === location.origin) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }

    event.respondWith(
        fetch(request).catch(() => {
            return caches.match(request);
        })
    );
});

async function cacheFirst(request, cacheName) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Fetch failed, returning offline page');
        return caches.match('/index.html');
    }
}

async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            
            const existingKeys = await cache.keys();
            if (existingKeys.length >= MAX_DYNAMIC_ITEMS) {
                await cache.delete(existingKeys[0]);
            }
            
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
    }
}

self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
