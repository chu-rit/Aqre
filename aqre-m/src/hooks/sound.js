import { useRef, useEffect, useState } from 'react';
import { Audio } from 'expo-av';

// Aqre 사운드 관리 커스텀 훅
export function useAqreSound() {
  const [bgmReady, setBgmReady] = useState(false);
  const bgmSound = useRef(null);
  const tapSound = useRef(null);
  const clearSound = useRef(null);

  // 사운드 로딩 및 해제
  useEffect(() => {
    setBgmReady(false);
    async function setupSounds() {
      // Tap
      if (tapSound.current) {
        await tapSound.current.unloadAsync();
        tapSound.current = null;
      }
      // Clear
      if (clearSound.current) {
        await clearSound.current.unloadAsync();
        clearSound.current = null;
      }
      // BGM
      if (bgmSound.current) {
        await bgmSound.current.unloadAsync();
        bgmSound.current = null;
      }
      // Load tap
      const tap = await Audio.Sound.createAsync(require('../../assets/tap.mp3'));
      tapSound.current = tap.sound;
      // Load clear
      const clear = await Audio.Sound.createAsync(require('../../assets/clear.mp3'));
      clearSound.current = clear.sound;
      // Load BGM
      const bgm = await Audio.Sound.createAsync(
        require('../../assets/bgm.mp3'),
        { isLooping: true, volume: 0.6 }
      );
      bgmSound.current = bgm.sound;
      setBgmReady(true);
    }
    setupSounds();
    return () => {
      if (tapSound.current) {
        tapSound.current.unloadAsync();
        tapSound.current = null;
      }
      if (clearSound.current) {
        clearSound.current.unloadAsync();
        clearSound.current = null;
      }
      if (bgmSound.current) {
        bgmSound.current.unloadAsync();
        bgmSound.current = null;
      }
    };
  }, []);

  // 안전하게 배경음 재생 (stop 후 play 시 위치 리셋)
  const bgmPlay = async () => {
  try {
    if (bgmSound.current) {
      const status = await bgmSound.current.getStatusAsync();
      if (!status.isPlaying) {
        await bgmSound.current.playAsync();
      }
    } else {
      const bgm = await Audio.Sound.createAsync(
        require('../../assets/bgm.mp3'),
        { isLooping: true, volume: 0.6 }
      );
      bgmSound.current = bgm.sound;
      await bgmSound.current.playAsync();
    }
  } catch (e) {}
};

  return {
    bgmSound,
    tapSound,
    clearSound,
    bgmPlay,
    bgmReady,
  };
}
