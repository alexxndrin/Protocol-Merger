const CACHE_NAME = 'kovcheg-v3'; // Обновили версию кэша
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
    '/media/switch.mp3',
    '/images/index1.jpg',
    '/images/index2.jpg',
    '/images/index3.jpg',
    '/images/index4.jpg',
    '/images/main.jpg',
    '/images/prolog.jpeg',
    '/images/smena1.jpg',
    '/images/smena2.jpg',
    '/images/smena3.jpg',
    '/images/smena4.jpg',
    '/images/smena5.jpg',
    '/images/smena6.jpg',
    '/images/sound.gif',
    '/fonts/a-citynovalt.woff2',
    '/fonts/casanova.woff2',
    '/fonts/dreamscar.woff2'
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
