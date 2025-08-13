import React, { useState, useEffect } from 'react';
import { useAqreSound } from '../src/hooks/sound';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import OptionsScreen from './components/OptionsScreen';
import LevelScreen from './components/LevelScreen';
import GameScreen from './components/GameScreen';
import StartScreen from './components/StartScreen';

export default function Page() {
  
  const { bgmSound, tapSound, clearSound, bgmPlay, bgmReady } = useAqreSound();

  const [currentScreen, setCurrentScreen] = useState('start');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [clearedLevels, setClearedLevels] = useState(new Set());
  const [initialLoad, setInitialLoad] = useState(true);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [vibrationEnabled] = useState(true);

  const handleLevelSelect = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setCurrentScreen('game');
  };
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 클리어한 레벨 로드
        const savedLevels = await AsyncStorage.getItem('clearedLevels');
        if (savedLevels) {
          const parsedLevels = JSON.parse(savedLevels);
          setClearedLevels(new Set(parsedLevels));
        }
      } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
      } finally {
        setInitialLoad(false);
      }
    };
    
    loadInitialData();
  }, []);

  // 최초 로드 시 저장된 옵션에서 BGM 설정 불러오기
  useEffect(() => {
    (async () => {
      try {
        const options = await AsyncStorage.getItem('options');
        if (options) {
          const parsed = JSON.parse(options);
          if (typeof parsed.soundEnabled === 'boolean') {
            setSoundEnabled(parsed.soundEnabled);
          }
          if (typeof parsed.bgmEnabled === 'boolean') {
            setBgmEnabled(parsed.bgmEnabled);
          }
        }
      } catch (e) {
        // noop
      }
    })();
  }, []);

  // BGM 설정 변경 시 즉시 반영
  useEffect(() => {
    (async () => {
      if (!bgmReady || !bgmSound.current) return;
      try {
        if (bgmEnabled) {
          await bgmPlay();
        } else {
          await bgmSound.current.stopAsync();
        }
      } catch (e) {
        // noop
      }
    })();
  }, [bgmEnabled, bgmReady, bgmPlay]);

  if (initialLoad) {
    return null;
  }
  
  const handleNavigateToLevel = () => {
    setCurrentScreen('level');
  };

  // 현재 화면 렌더링
  let currentScreenComponent = null;
  
  switch (currentScreen) {
    case 'start':
      currentScreenComponent = (
        <StartScreen
          setCurrentScreen={handleNavigateToLevel}
          soundEnabled={soundEnabled}
          tapSound={tapSound}
        />
      );
      break;
      
    case 'level':
      currentScreenComponent = (
        <LevelScreen
          setCurrentScreen={setCurrentScreen}
          onSelectPuzzle={handleLevelSelect}
          soundEnabled={soundEnabled}
          tapSound={tapSound}
          bgmEnabled={bgmEnabled}
          bgmPlay={bgmPlay}
        />
      );
      break;
      
    case 'game':
      if (selectedPuzzle) {
        currentScreenComponent = (
          <GameScreen
            puzzle={selectedPuzzle}
            setCurrentScreen={setCurrentScreen}
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
            tapSound={tapSound}
            bgmSound={bgmSound}
            clearSound={clearSound}
            bgmPlay={bgmPlay}
          />
        );
      }
      break;
      
    case 'options':
      currentScreenComponent = (
        <OptionsScreen
          bgmEnabled={bgmEnabled}
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          onChangeBgmEnabled={(v) => setBgmEnabled(v)}
          onChangeSoundEnabled={(v) => setSoundEnabled(v)}
          onClose={() => setCurrentScreen('start')}
        />
      );
      break;
      
    default:
      currentScreenComponent = (
        <View style={styles.centered}>
          <Text>다른 화면은 아직 준비 중입니다.</Text>
        </View>
      );
  }

  return currentScreenComponent;
}