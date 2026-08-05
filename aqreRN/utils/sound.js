import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let getRingerMode = null;
let RINGER_MODE = null;

try {
  const ringerModule = require('react-native-ringer-mode');
  getRingerMode = ringerModule.getRingerMode;
  RINGER_MODE = ringerModule.RINGER_MODE;
} catch (e) {}

let bgmPlayer = null;
let soundEnabled = true;
let bgmEnabled = true;
let soundVolume = 1.0;
let bgmVolume = 0.5;
let tapSound = null;
let vibrationEnabled = true;

async function isSilentMode() {
  if (Platform.OS !== 'android' || !getRingerMode) return false;
  try {
    const mode = await getRingerMode();
    return mode === RINGER_MODE.silent || mode === RINGER_MODE.vibrate;
  } catch (e) {
    return false;
  }
}

export async function loadSoundSettings() {
  try {
    // Set audio mode for optimal performance
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const json = await AsyncStorage.getItem('options');
    if (json) {
      const p = JSON.parse(json);
      soundEnabled = p.soundEnabled !== false;
      bgmEnabled = p.bgmEnabled !== false;
      if (typeof p.soundVolume === 'number') soundVolume = p.soundVolume;
      if (typeof p.bgmVolume === 'number') bgmVolume = p.bgmVolume;
      vibrationEnabled = p.vibrationEnabled !== false;
    }
    // Preload tap sound
    if (!tapSound) {
      tapSound = await Audio.Sound.createAsync(
        require('../assets/tap.mp3'),
        { shouldPlay: false, volume: soundVolume }
      );
    } else {
      await tapSound.sound.setVolumeAsync(soundVolume);
    }
  } catch {}
}

export async function initBGM() {
  if (!bgmEnabled) return;
  if (await isSilentMode()) return;
  try {
    if (bgmPlayer) await bgmPlayer.unloadAsync();
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/bgm.mp3'),
      { shouldPlay: true, isLooping: true, volume: bgmVolume }
    );
    bgmPlayer = sound;
  } catch (e) {
    console.log('BGM init error:', e);
  }
}

export async function playTap() {
  if (!soundEnabled || !tapSound) return;
  if (await isSilentMode()) return;
  try {
    await tapSound.sound.replayAsync();
  } catch (e) {}
}

export async function setSoundVolume(volume) {
  soundVolume = volume;
  if (tapSound) {
    await tapSound.sound.setVolumeAsync(volume);
  }
}

export async function playClear() {
  if (!soundEnabled) return;
  if (await isSilentMode()) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/clear.mp3'),
      { shouldPlay: true, volume: soundVolume }
    );
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {}
}

export async function setBGMEnabled(enabled) {
  bgmEnabled = enabled;
  if (bgmPlayer) {
    if (enabled) await bgmPlayer.playAsync();
    else await bgmPlayer.pauseAsync();
  } else if (enabled) {
    await initBGM();
  }
}

export async function refreshSilentMode() {
  if (await isSilentMode()) {
    if (bgmPlayer) await bgmPlayer.pauseAsync();
  } else {
    if (bgmEnabled && !bgmPlayer) await initBGM();
    else if (bgmEnabled && bgmPlayer) await bgmPlayer.playAsync();
  }
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export function setVibrationEnabled(enabled) {
  vibrationEnabled = enabled;
}

export function playVibrate() {
  if (!vibrationEnabled) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
}

export async function setBGMVolume(volume) {
  bgmVolume = volume;
  if (bgmPlayer) {
    await bgmPlayer.setVolumeAsync(volume);
  }
}

export async function stopBGM() {
  if (bgmPlayer) {
    await bgmPlayer.stopAsync();
    await bgmPlayer.unloadAsync();
    bgmPlayer = null;
  }
}
