import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

let bgmPlayer = null;
let soundEnabled = true;
let bgmEnabled = true;
let soundVolume = 1.0;
let bgmVolume = 0.5;

export async function loadSoundSettings() {
  try {
    const json = await AsyncStorage.getItem('options');
    if (json) {
      const p = JSON.parse(json);
      soundEnabled = p.soundEnabled !== false;
      bgmEnabled = p.bgmEnabled !== false;
      if (typeof p.soundVolume === 'number') soundVolume = p.soundVolume;
      if (typeof p.bgmVolume === 'number') bgmVolume = p.bgmVolume;
    }
  } catch {}
}

export async function initBGM() {
  if (!bgmEnabled) return;
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
  if (!soundEnabled) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/tap.mp3'),
      { shouldPlay: true, volume: soundVolume }
    );
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {}
}

export async function playClear() {
  if (!soundEnabled) return;
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

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export async function setBGMVolume(volume) {
  bgmVolume = volume;
  if (bgmPlayer) {
    await bgmPlayer.setVolumeAsync(volume);
  }
}

export function setSoundVolume(volume) {
  soundVolume = volume;
}

export async function stopBGM() {
  if (bgmPlayer) {
    await bgmPlayer.stopAsync();
    await bgmPlayer.unloadAsync();
    bgmPlayer = null;
  }
}
