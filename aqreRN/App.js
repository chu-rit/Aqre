import { useState, useEffect } from 'react';
import { Text, Platform, View, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import StartScreen from './screens/StartScreen';
import LevelScreen from './screens/LevelScreen';
import GameScreen from './screens/GameScreen';
import OptionsScreen from './screens/OptionsScreen';
import { loadSoundSettings, initBGM, setBGMEnabled, refreshSilentMode } from './utils/sound';
import { showPuzzleSelectInterstitial } from './utils/ads';

export default function App() {
  const [screen, setScreen] = useState('start');
  const [prevScreen, setPrevScreen] = useState('level');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSoundSettings();
    setReady(true);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshSilentMode();
    });
    return () => sub.remove();
  }, []);

  const goOptions = (from) => { setPrevScreen(from); setScreen('options'); };
  const onChangeBgm = (enabled) => setBGMEnabled(enabled);

  const handleStart = async () => {
    await loadSoundSettings();
    await initBGM();
    setScreen('level');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'level':
        return (
          <LevelScreen
            onSelectPuzzle={(puzzle) => showPuzzleSelectInterstitial(() => {
              setSelectedPuzzle(puzzle);
              setScreen('game');
            })}
            onBack={() => setScreen('start')}
            onOptions={() => goOptions('level')}
          />
        );
      case 'game':
        return selectedPuzzle ? (
          <GameScreen
            puzzle={selectedPuzzle}
            onBack={() => setScreen('level')}
            onOptions={() => goOptions('game')}
          />
        ) : null;
      case 'options':
        return <OptionsScreen onClose={() => setScreen(prevScreen)} onChangeBgm={onChangeBgm} />;
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  return <SafeAreaProvider>{renderScreen()}</SafeAreaProvider>;
}
