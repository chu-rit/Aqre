// 블럭클릭 사운드 생성
const tapSound = new Audio('sound/tap.mp3');

// 클리어 사운드 생성
const clearSound = new Audio('sound/clear.mp3');

// BGM 관리를 위한 상수 및 변수
const BGM_STORAGE_KEY = 'aqre_bgm_allowed';
const BGM_VOLUME = 0.3;

// BGM 오디오 요소 생성
const bgmAudio = new Audio('sound/bgm.mp3');
bgmAudio.loop = true;
bgmAudio.volume = BGM_VOLUME;

// 게임 활성화 상태 추적 변수
let isGameActive = false;

// 볼륨 설정
tapSound.volume = 0.3;
tapSound.preload = 'auto';

clearSound.volume = 0.5;
clearSound.preload = 'auto';

document.addEventListener('DOMContentLoaded', async () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive'
    });

    // Warm-up AudioContext by playing a short silent buffer to reduce latency
    const warmUpSilentBuffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
    const warmUpSource = audioCtx.createBufferSource();
    warmUpSource.buffer = warmUpSilentBuffer;
    warmUpSource.connect(audioCtx.destination);
    warmUpSource.start(0);

    let tapBuffer, clearBuffer;

    // 오디오 파일을 미리 로드하고 디코딩
    const loadSound = async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return audioCtx.decodeAudioData(arrayBuffer);
    };

    tapBuffer = await loadSound('sound/tap.mp3');
    clearBuffer = await loadSound('sound/clear.mp3');

    // Add a flag to ensure AudioContext.resume() is called only once
    let audioCtxResumed = false;

    // 전역 변수: 현재 재생 중인 효과음 노드를 추적
    let currentTapSource = null;
    let currentClearSource = null;

    // 앱이 백그라운드에서 포그라운드로 돌아올 때 AudioContext 재개
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            // 다시 재개할 수 있도록 플래그 재설정
            audioCtxResumed = false;
        }
    });

    const playTapSound = () => {
        // 효과음이 꺼져있으면 재생하지 않음
        if (!isSoundEnabled) return;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
            audioCtxResumed = true;
        }
        // 이전 tap 효과음 중단
        if (currentTapSource) {
            currentTapSource.stop();
        }

        // 새로운 tap 효과음 생성 및 재생
        currentTapSource = audioCtx.createBufferSource();
        currentTapSource.buffer = tapBuffer;
        currentTapSource.connect(audioCtx.destination);
        currentTapSource.start(0);
    };

    const playClearSound = () => {
        // 효과음이 꺼져있으면 재생하지 않음
        if (!isSoundEnabled) return;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
            audioCtxResumed = true;
        }
        // 이전 clear 효과음 중단
        if (currentClearSource) {
            currentClearSource.stop();
        }

        // 새로운 clear 효과음 생성 및 재생
        currentClearSource = audioCtx.createBufferSource();
        currentClearSource.buffer = clearBuffer;
        currentClearSource.connect(audioCtx.destination);
        currentClearSource.start(0);
    };

    // BGM 재생 함수
    function playBGM() {
        // 게임이 활성화 상태가 아니면 재생하지 않음
        if (!isGameActive) return;

        // 이미 재생 중이면 무시
        if (!bgmAudio.paused) return;

        // AudioContext 재개
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // BGM 재생
        bgmAudio.play()
            .then(() => {
                console.log('BGM 재생 시작');
                // 최초 재생 시 로컬 스토리지에 저장
                localStorage.setItem(BGM_STORAGE_KEY, 'true');
            })
            .catch(error => {
                console.error('BGM 재생 실패:', error);
            });
    }

    // BGM 일시정지 함수
    function pauseBGM() {
        bgmAudio.pause();
    }

    // 게임 활성화 상태 설정 함수
    function setGameActive(active) {
        isGameActive = active;
        
        if (active) {
            // 게임 활성화 시 BGM 재생 시도
            if (localStorage.getItem(BGM_STORAGE_KEY) === 'true') {
                playBGM();
            }
        } else {
            // 게임 비활성화 시 BGM 일시정지
            pauseBGM();
        }
    }

    // 게임 시작 버튼에 이벤트 리스너 추가
    const gameStartButton = document.getElementById('startButton');
    if (gameStartButton) {
        gameStartButton.addEventListener('click', () => {
            // 게임 활성화
            setGameActive(true);
            playBGM();
        });
    }

    // 페이지 가시성 변경 시 게임 상태 관리
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // 페이지가 보일 때
            if (isGameActive) {
                playBGM();
            }
        } else {
            // 페이지가 숨겨질 때
            pauseBGM();
        }
    });

    // 이전에 BGM 재생이 허용되었다면 자동 재생 시도
    if (localStorage.getItem(BGM_STORAGE_KEY) === 'true') {
        function attemptBGMPlayback(retryDelay = 3000) {
            if (!isGameActive) return;

            bgmAudio.play()
                .then(() => {
                    console.log('BGM 자동 재생 성공');
                })
                .catch(error => {
                    console.log('BGM 자동 재생 실패:', error);

                    // 재시도 스케줄링 (성공할 때까지)
                    setTimeout(() => {
                        attemptBGMPlayback(Math.min(retryDelay * 1.5, 30000));
                    }, retryDelay);
                });
        }

        // 초기 재생 시도
        setTimeout(attemptBGMPlayback, 3000);
    }

    // 전역에서 사용 가능하도록 노출
    window.playTapSound = playTapSound;
    window.playClearSound = playClearSound;
    window.playBGM = playBGM;
    window.pauseBGM = pauseBGM;
    window.setGameActive = setGameActive;

    // 페이지 로드 시 사운드 미리 로딩
    console.log('Sounds preloaded successfully.');
});
