import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StartScreen from './screens/StartScreen';
import TransitionHost from './components/TransitionHost';
import { loadSoundSettings, initBGM, setBGMEnabled, refreshSilentMode } from './utils/sound';

export default function App() {
  const [screen, setScreen] = useState('start');

  useEffect(() => {
    loadSoundSettings();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshSilentMode();
    });
    return () => sub.remove();
  }, []);

  const onChangeBgm = (enabled) => setBGMEnabled(enabled);

  const handleStart = async () => {
    await loadSoundSettings();
    await initBGM();
    setScreen('level');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {screen === 'level' ? (
          <TransitionHost
            onBackToStart={() => setScreen('start')}
            onChangeBgm={onChangeBgm}
          />
        ) : (
          <StartScreen onStart={handleStart} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
