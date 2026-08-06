import { useState, useEffect, useRef } from 'react';
import { Text, Platform, View, ActivityIndicator, AppState, Animated, Dimensions, Easing } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import StartScreen from './screens/StartScreen';
import LevelScreen from './screens/LevelScreen';
import GameScreen from './screens/GameScreen';
import { loadSoundSettings, initBGM, setBGMEnabled, refreshSilentMode } from './utils/sound';
import { showPuzzleSelectInterstitial } from './utils/ads';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function App() {
  const [screen, setScreen] = useState('start');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [ready, setReady] = useState(false);
  const screenSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSoundSettings();
    setReady(true);
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

  const openGame = (puzzle) => {
    screenSlideAnim.setValue(0);
    setSelectedPuzzle(puzzle);
    setScreen('game');
    requestAnimationFrame(() => {
      Animated.timing(screenSlideAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeGame = () => {
    Animated.timing(screenSlideAnim, {
      toValue: 0,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setSelectedPuzzle(null);
        setScreen('level');
      }
    });
  };

  const renderLevelGameFlow = () => {
    const translateX = screenSlideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -SCREEN_WIDTH],
    });

    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View
          style={{
            flex: 1,
            width: SCREEN_WIDTH * 2,
            flexDirection: 'row',
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <LevelScreen
              onSelectPuzzle={(puzzle) => showPuzzleSelectInterstitial(() => openGame(puzzle))}
              onBack={() => setScreen('start')}
              onChangeBgm={onChangeBgm}
            />
          </View>
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            {selectedPuzzle ? (
              <GameScreen
                puzzle={selectedPuzzle}
                onBack={closeGame}
                onChangeBgm={onChangeBgm}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderScreen = () => {
    switch (screen) {
      case 'level':
      case 'game':
        return renderLevelGameFlow();
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  return <SafeAreaProvider>{renderScreen()}</SafeAreaProvider>;
}
