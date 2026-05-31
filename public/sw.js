const CACHE_NAME = 'kovcheg-v2'; // Обновили версию кэша
const urls = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/shift1.html',
    '/manifest.webmanifest',
    '/css/dashboard.css',
    '/css/main.css',
    '/css/shift1.css',
    '/js/app.js',
    '/js/dashboard.js',
    '/js/shift1.js',
    '/images/character.jpg',
    '/images/oracul.png',
    '/images/icon.svg',
    '/media/background.mp3',
    '/media/background2.mp3',
    '/media/switch.mp3'
];

self.addEventListener('install', e => {
    self.skipWaiting(); // Форсируем обновление Service Worker
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Кэширование файлов оболочки');
            return cache.addAll(urls);
        })
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
});

self.addEventListener('fetch', e => {
    // Игнорируем POST-запросы (логирование на сервер не кэшируется)
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            return cachedResponse || fetch(e.request).catch(() => {
                console.log('[SW] Режим оффлайн: запрос не выполнен', e.request.url);
            });
        })
    );
});
