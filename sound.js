// 블럭클릭 사운드 생성
const tapSounds = [
    new Audio('sound/tap.mp3'),
];

// 클리어 사운드 생성
const clearSounds = [
    new Audio('sound/clear.mp3'),
];

// 볼륨 설정
tapSounds.forEach(sound => {
    sound.volume = 0.3;
    sound.preload = 'auto';
});

clearSounds.forEach(sound => {
    sound.volume = 0.5;
    sound.preload = 'auto';
});


// 현재 사운드 인덱스 추적
let currentSoundIndex = 0;

// 현재 클리어 사운드 인덱스 추적
let currentClearSoundIndex = 0;

// 즉시 재생 함수
function playTapSound() {
    try {
        const sound = tapSounds[currentSoundIndex];
        sound.currentTime = 0; // 항상 처음부터 재생
        sound.play();

        // 다음 사운드로 인덱스 변경 (순환)
        currentSoundIndex = (currentSoundIndex + 1) % tapSounds.length;
    } catch (error) {
        console.warn('사운드 재생 실패:', error);
    }
}

// 클리어 사운드 재생 함수
function playClearSound() {
    try {
        const sound = clearSounds[currentClearSoundIndex];
        sound.currentTime = 0; // 항상 처음부터 재생
        sound.play();

        // 다음 사운드로 인덱스 변경 (순환)
        currentClearSoundIndex = (currentClearSoundIndex + 1) % clearSounds.length;
    } catch (error) {
        console.warn('클리어 사운드 재생 실패:', error);
    }
}

// 페이지 로드 시 사운드 미리 로딩
document.addEventListener('DOMContentLoaded', () => {
    // 첫 번째 사운드 미리 로딩
    tapSounds[0].load();
    clearSounds[0].load();
});
