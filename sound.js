// 블럭클릭 사운드 생성
const tapSound = new Audio('sound/tap.mp3');

// 클리어 사운드 생성
const clearSound = new Audio('sound/clear.mp3');

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

    // 전역에서 사용 가능하도록 노출
    window.playTapSound = playTapSound;
    window.playClearSound = playClearSound;

    // 페이지 로드 시 사운드 미리 로딩
    console.log('Sounds preloaded successfully.');
});
