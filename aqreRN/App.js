import { useState, useEffect } from 'react';
import { Text, Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import StartScreen from './screens/StartScreen';
import LevelScreen from './screens/LevelScreen';
import GameScreen from './screens/GameScreen';
import OptionsScreen from './screens/OptionsScreen';
import { loadSoundSettings, initBGM, setBGMEnabled } from './utils/sound';
import { initializeAds, showTestInterstitialAd } from './utils/ads';

const FONT_NAME = 'NotoSansKR';

export default function App() {
  const [screen, setScreen] = useState('start');
  const [prevScreen, setPrevScreen] = useState('level');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [fontsLoaded] = Font.useFonts({
    [FONT_NAME]: require('./assets/fonts/NotoSansKR.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded && Platform.OS === 'android') {
      if (Text.defaultProps == null) Text.defaultProps = {};
      Text.defaultProps.style = { fontFamily: FONT_NAME };
    }
  }, [fontsLoaded]);

  useEffect(() => {
    loadSoundSettings();
    initializeAds();
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
            onSelectPuzzle={(puzzle) => showTestInterstitialAd(() => {
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4c6ef5" />
      </View>
    );
  }

  return <SafeAreaProvider>{renderScreen()}</SafeAreaProvider>;
}
