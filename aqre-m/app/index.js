import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAqreSound } from '../src/hooks/sound';
import { View, Text, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import * as Haptics from 'expo-haptics';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import TutorialScreen from './tutorial';
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

  const [soundEnabled] = useState(true);
  const [bgmEnabled] = useState(true);
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
          // 디버깅 시에만 사용
          // console.log('로드된 클리어 레벨:', parsedLevels);
        }
      } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
      } finally {
        setInitialLoad(false);
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (bgmReady && bgmSound.current) {
      if (bgmEnabled) {
        bgmPlay();
      } else {
        bgmSound.current.stopAsync();
      }
    }
  }, [bgmEnabled, bgmReady, bgmPlay]);

  if (initialLoad) {
    return null;
  }
  
  // 레벨 선택 화면으로 이동할 때 튜토리얼 표시
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
          tapSound={tapSound}
        />
      );
      break;
      
    case 'level':
      currentScreenComponent = (
        <LevelScreen
          setCurrentScreen={setCurrentScreen}
          onSelectPuzzle={handleLevelSelect}
          tapSound={tapSound}
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

  return (
    <View style={{ flex: 1 }}>
      {currentScreenComponent}
    </View>
  );
}