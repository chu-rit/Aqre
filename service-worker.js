const APP_VERSION = '1.0.02'; // 앱 버전 명시
const CACHE_NAME = `aqre-game-v${APP_VERSION}`;
const urlsToCache = [
    '/Aqre/',
    '/Aqre/index.html',
    '/Aqre/script.js',
    '/Aqre/puzzles.js',
    '/Aqre/styles.css',
    '/Aqre/manifest.json',
    '/Aqre/icons/icon-192x192.png',
    '/Aqre/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap',
    'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
    'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log(`Cache opened: ${CACHE_NAME}`);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // 새로운 서비스 워커 즉시 활성화
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 현재 버전과 다른 캐시 삭제
                    if (cacheName !== CACHE_NAME) {
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                }).filter(Boolean) // null 값 제거
            );
        }).then(() => {
            // 모든 열린 페이지의 서비스 워커 즉시 제어
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 캐시 응답 반환
                if (response) {
                    return response;
                }

                // 네트워크 요청
                return fetch(event.request).then((response) => {
                    // 유효한 응답만 캐시
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 응답 복제 후 캐시
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// 버전 정보 요청에 대한 메시지 핸들러 추가
self.addEventListener('message', (event) => {
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION_INFO',
            version: APP_VERSION
        });
    }
});
