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

    const playTapSound = () => {
        if (audioCtx.state === 'suspended' && !audioCtxResumed) {
            audioCtx.resume();
            audioCtxResumed = true;
        }
        // 이전 tap 효과음 중단
        if (currentTapSource) {
            try {
                currentTapSource.stop();
            } catch (e) {
                console.warn('Tap sound stop failed:', e);
            }
            currentTapSource = null;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = tapBuffer;
        source.connect(audioCtx.destination);
        source.start(0); // 즉시 재생
        currentTapSource = source;
    };

    const playClearSound = () => {
        if (audioCtx.state === 'suspended' && !audioCtxResumed) {
            audioCtx.resume();
            audioCtxResumed = true;
        }
        // 이전 clear 효과음 중단
        if (currentClearSource) {
            try {
                currentClearSource.stop();
            } catch (e) {
                console.warn('Clear sound stop failed:', e);
            }
            currentClearSource = null;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = clearBuffer;
        source.connect(audioCtx.destination);
        source.start(0); // 즉시 재생
        currentClearSource = source;
    };

    // 전역에서 사용 가능하도록 노출
    window.playTapSound = playTapSound;
    window.playClearSound = playClearSound;

    // 페이지 로드 시 사운드 미리 로딩
    console.log('Sounds preloaded successfully.');
});
