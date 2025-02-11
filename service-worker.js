const APP_VERSION = '1.0.05'; // 앱 버전 명시
const CACHE_NAME = `aqre-game-v${APP_VERSION}`;

// 개발 환경 확인
const isDevelopment = 
    location.hostname === 'localhost' || 
    location.hostname === '127.0.0.1' || 
    location.hostname === '';

// 캐싱할 파일 목록
const CORE_ASSETS = [
    './',
    './index.html',
    './script.js',
    './puzzles.js',
    './styles.css',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('Service Worker installing');
    
    // 개발 환경에서는 캐싱 최소화
    if (!isDevelopment) {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(CORE_ASSETS);
            })
        );
    }
    
    // 대기 상태 건너뛰기
    self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // 모든 클라이언트 제어
    self.clients.claim();
});

// 가져오기 이벤트
self.addEventListener('fetch', (event) => {
    // 개발 환경에서는 네트워크 우선
    if (isDevelopment) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then((response) => {
            // 캐시에 있으면 캐시 응답 반환
            if (response) {
                return response;
            }
            
            // 캐시에 없으면 네트워크에서 가져오기
            return fetch(event.request).then((fetchResponse) => {
                // 유효한 응답만 캐시
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    return fetchResponse;
                }
                
                // 응답 복제 후 캐시에 저장
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return fetchResponse;
            });
        })
    );
});

// 버전 정보 요청 처리
self.addEventListener('message', (event) => {
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION_INFO',
            version: APP_VERSION
        });
    }
});
