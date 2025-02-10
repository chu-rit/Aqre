const APP_VERSION = '1.0.01'; // 앱 버전 명시
const CACHE_NAME = `aqre-game-v${APP_VERSION}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/styles.css',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
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

// 업데이트 알림 및 처리
self.addEventListener('message', (event) => {
    if (event.data === 'CHECK_VERSION') {
        // 클라이언트에 현재 앱 버전 전송
        event.ports[0].postMessage({
            version: APP_VERSION,
            type: 'VERSION_INFO'
        });
    }
});
