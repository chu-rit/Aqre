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
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [tutorialSkipped, setTutorialSkipped] = useState(false);

  const [soundEnabled] = useState(true);
  const [bgmEnabled] = useState(true);
  const [vibrationEnabled] = useState(true);

  const handleLevelSelect = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setCurrentScreen('game');
  };
  
  // 튜토리얼 완료 처리
  const handleTutorialComplete = useCallback(() => {
    setTutorialCompleted(true);
    setShowTutorial(false);
    AsyncStorage.setItem('tutorialCompleted', 'true');
  }, []);
  
  // 튜토리얼 스킵 처리
  const handleTutorialSkip = useCallback(() => {
    setTutorialSkipped(true);
    setShowTutorial(false);
    AsyncStorage.setItem('tutorialSkipped', 'true');
  }, []);
  
  // 튜토리얼 상태 확인
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const [completed, skipped] = await Promise.all([
          AsyncStorage.getItem('tutorialCompleted'),
          AsyncStorage.getItem('tutorialSkipped')
        ]);
        
        if (completed !== 'true' && skipped !== 'true') {
          setShowTutorial(true);
        } else {
          setTutorialCompleted(completed === 'true');
          setTutorialSkipped(skipped === 'true');
        }
      } catch (error) {
        console.error('튜토리얼 상태 확인 실패:', error);
      }
    };
    
    checkTutorialStatus();
  }, []);

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

  // 튜토리얼 스텝 정의
  const tutorialSteps = {
    levelSelect: [
      {
        text: '안녕하세요! Aqre 퍼즐 게임에 오신 것을 환영합니다!\n\n이 게임은 블록을 채워서 퍼즐을 해결하는 게임이에요.\n\n시작해볼까요?',
        showNextButton: true,
        position: { bottom: 20, left: 20, right: 20 },
      },
      {
        text: '레벨을 선택해서 게임을 시작할 수 있어요.\n\n초보자라면 1번 레벨부터 차근차근 도전해보세요!',
        showNextButton: true,
        position: { bottom: 20, left: 20, right: 20 },
        highlight: {
          selectors: ['data-testid=level-1'],
          style: { width: 60, height: 60, borderRadius: 8 }
        }
      },
      {
        text: '게임 방법이 궁금하시다면?\n\n오른쪽 상단의 도움말 버튼을 누르면 자세한 게임 방법을 확인할 수 있어요!',
        showNextButton: true,
        position: { top: 20, right: 20, width: 300 },
        highlight: {
          selectors: ['data-testid=help-button'],
          style: { width: 40, height: 40, borderRadius: 20 }
        }
      }
    ]
  };

  return (
    <TutorialScreen
      isVisible={showTutorial}
      onClose={handleTutorialComplete}
      onSkip={handleTutorialSkip}
      levelId="levelSelect"
      steps={tutorialSteps}
    >
      <View style={{ flex: 1 }}>
        {currentScreenComponent}
      </View>
    </TutorialScreen>
  );
}