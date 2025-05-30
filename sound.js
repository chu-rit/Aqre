// 블럭클릭 사운드 생성
const tapSound = new Audio('sound/tap.mp3');

// 클리어 사운드 생성
const clearSound = new Audio('sound/clear.mp3');

// BGM 관리를 위한 상수 및 변수
const BGM_STORAGE_KEY = 'aqre_bgm_allowed';

// 효과음 설정
let isSoundEnabled = true;

// 배경음 설정
let isBgmEnabled = true;

// BGM 관련 변수
let bgmBuffer = null;
let bgmSource = null;
let bgmGainNode = null;
let bgmPlaying = false;

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
    
    // BGM 로드
    try {
        bgmBuffer = await loadSound('sound/bgm.mp3');
        console.log('BGM 로드 완료');
    } catch (error) {
        console.error('BGM 로드 실패:', error);
    }

    // BGM 게인 노드 생성 (볼륨 조절용)
    bgmGainNode = audioCtx.createGain();
    bgmGainNode.gain.value = 0.3; // 볼륨 설정 (0.3 = 30%)
    bgmGainNode.connect(audioCtx.destination);

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

    // 배경음 토글 이벤트 리스너
    const bgmToggle = document.getElementById('bgm-toggle');
    if (bgmToggle) { // Check if the element exists
        bgmToggle.addEventListener('change', function() {
            isBgmEnabled = this.checked;
            if (isBgmEnabled) {
                playBGM(); // Web Audio API로 BGM 재생
            } else {
                pauseBGM(); // Web Audio API로 BGM 정지
            }
            localStorage.setItem('bgmEnabled', isBgmEnabled);
        });
    }

    // 로컬 스토리지에서 배경음 설정 불러오기
    const savedBgmSetting = localStorage.getItem('bgmEnabled');
    if (savedBgmSetting !== null) {
        isBgmEnabled = savedBgmSetting === 'true';
        if (bgmToggle) {
            bgmToggle.checked = isBgmEnabled;
        }
    }

    // 효과음 토글 이벤트 리스너
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.addEventListener('change', function() {
        isSoundEnabled = this.checked;
        localStorage.setItem('soundEnabled', isSoundEnabled);
    });

    // 로컬 스토리지에서 효과음 설정 불러오기
    const savedSoundSetting = localStorage.getItem('soundEnabled');
    if (savedSoundSetting !== null) {
        isSoundEnabled = savedSoundSetting === 'true';
        soundToggle.checked = isSoundEnabled;
    }

    // BGM 재생 함수 (Web Audio API 사용)
    function playBGM() {
        // 게임이 활성화 상태가 아니면 재생하지 않음
        if (!isGameActive) return;

        // 이미 재생 중이면 무시
        if (bgmPlaying) return;

        // BGM 토글 상태 확인
        if (!isBgmEnabled || !bgmBuffer) return;
        
        // AudioContext 재개
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        try {
            // 이전 소스 정리
            if (bgmSource) {
                bgmSource.stop();
                bgmSource.disconnect();
            }
            
            // 새 소스 생성
            bgmSource = audioCtx.createBufferSource();
            bgmSource.buffer = bgmBuffer;
            bgmSource.loop = true;
            bgmSource.connect(bgmGainNode);
            
            // BGM 재생 시작
            bgmSource.start(0);
            bgmPlaying = true;
            
            // 소스 종료 시 처리
            bgmSource.onended = () => {
                if (bgmSource) {
                    bgmPlaying = false;
                }
            };
            
            console.log('BGM 재생 시작');
            localStorage.setItem(BGM_STORAGE_KEY, 'true');
        } catch (error) {
            console.error('BGM 재생 실패:', error);
        }
    }

    // BGM 일시정지 함수
    function pauseBGM() {
        if (bgmSource && bgmPlaying) {
            try {
                bgmSource.stop();
                bgmPlaying = false;
            } catch (error) {
                console.error('BGM 정지 실패:', error);
            }
        }
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

            playBGM();
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
    // console.log('Sounds preloaded successfully.');
});
