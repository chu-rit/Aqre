const APP_VERSION = '1.0.03'; // 앱 버전 명시
const CACHE_NAME = `aqre-game-v${APP_VERSION}`;

// 베이스 URL 설정
const BASE_URL = self.location.hostname === 'chu-rit.github.io' ? '/Aqre' : '';

const urlsToCache = [
    `${BASE_URL}/`,
    `${BASE_URL}/index.html`,
    `${BASE_URL}/script.js`,
    `${BASE_URL}/puzzles.js`,
    `${BASE_URL}/styles.css`,
    `${BASE_URL}/manifest.json`,
    `${BASE_URL}/icons/icon-192x192.png`,
    `${BASE_URL}/icons/icon-512x512.png`
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log(`Cache opened: ${CACHE_NAME}`);
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(err => {
                            console.error(`Failed to cache ${url}:`, err);
                        });
                    })
                );
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                }).filter(Boolean)
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 버전 정보 요청에 대한 메시지 핸들러
self.addEventListener('message', (event) => {
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION_INFO',
            version: APP_VERSION
        });
    }
});

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에 있으면 캐시된 응답 반환
                if (response) {
                    return response;
                }

                // 캐시에 없으면 네트워크 요청
                return fetch(event.request).then(response => {
                    // 유효한 응답이 아니면 그대로 반환
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 응답을 복제하여 캐시에 저장
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
