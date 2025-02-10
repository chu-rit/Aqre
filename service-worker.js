const APP_VERSION = '1.0.04'; // 앱 버전 명시
const CACHE_NAME = `aqre-game-v${APP_VERSION}`;

// GitHub Pages 기반 URL
const BASE_URL = self.location.hostname === 'chu-rit.github.io' ? '/Aqre' : 
                self.location.hostname === '127.0.0.1' ? '' : '';

// 캐시할 리소스 목록 정의
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
                        return cache.add(new Request(url, {cache: 'no-cache'}))
                            .catch(err => {
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
    // 상대 경로로 요청 URL 변환
    const url = new URL(event.request.url);
    const isLocalResource = url.origin === location.origin;

    if (!isLocalResource) {
        return; // 외부 리소스는 기본 동작 사용
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // 캐시에서 찾음
                }

                // 캐시에 없으면 네트워크에서 가져오기
                return fetch(event.request.clone())
                    .then(response => {
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
            .catch(() => {
                // 오프라인이고 캐시에도 없는 경우
                return caches.match(`${BASE_URL}/index.html`);
            })
    );
});
