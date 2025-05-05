import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAqreSound } from '../src/hooks/sound';
import { Switch, View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { styles, boardStyles } from './styles';
import * as Haptics from 'expo-haptics';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import { TutorialScreen, tutorialOpen } from './tutorial';
import { checkGameRules } from '../src/logic/gameRules';
import OptionsScreen from './components/OptionsScreen';
import LevelScreen from './components/LevelScreen';
import GameScreen from './components/GameScreen';

export default function Page() {
  
  const { bgmSound, tapSound, clearSound, bgmPlay, bgmReady } = useAqreSound();


  const [screen, setScreen] = useState('start'); // 'start', 'level', 'game', 'option'
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialLevelId, setTutorialLevelId] = useState(null);

  const [soundEnabled] = useState(true);
  const [bgmEnabled] = useState(true);
  const [vibrationEnabled] = useState(true);

  const handleLevelSelect = (puzzle) => {
    const tutorialSteps = tutorialOpen(puzzle.id);
    if (tutorialSteps) {
      setTutorialLevelId(puzzle.id);
      setShowTutorial(true);
      return;
    }
    setSelectedPuzzle(puzzle);
    setScreen('game');
  };



  // BGM 관리
  useEffect(() => {
    if (bgmReady && bgmSound.current) {
      if (bgmEnabled) {
        bgmPlay();
      } else {
        bgmSound.current.stopAsync();
      }
    }
  }, [bgmEnabled, bgmReady, bgmPlay]);

  if (screen === 'level') {
    return (
      <LevelScreen
        setScreen={setScreen}
        onSelectPuzzle={handleLevelSelect}
        tapSound={tapSound}
        bgmPlay={bgmPlay}
      />
    );
  }

  if (screen === 'game' && selectedPuzzle) {
    return (
      <GameScreen
        puzzle={selectedPuzzle}
        setScreen={setScreen}
        soundEnabled={soundEnabled}
        vibrationEnabled={vibrationEnabled}
        tapSound={tapSound}
        bgmSound={bgmSound}
        clearSound={clearSound}
        bgmPlay={bgmPlay}
      />
    );
  }

  if (screen === 'options') {
    return (
      <OptionsScreen
        onClose={() => {
          setScreen('start');
        }}
      />
    );
  }

  if (screen === 'start') {
    return (
      <SafeAreaView style={styles.startScreen}>
        <View style={styles.innerContainer}>
          <Image
            source={require('../assets/image.png')}
            style={styles.mainImage}
          />
          <Image
            source={require('../assets/logo1.png')}
            style={styles.logo}
          />
          <Text style={styles.versionTag}>v1.0.14</Text>
          <View style={styles.startContainer}>
            <TouchableOpacity
              style={styles.gameButton}
              onPress={async () => {
                if (soundEnabled && tapSound.current) {
                  try { await tapSound.current.replayAsync(); } catch (e) {}
                }
                if (Platform.OS === 'web') {
                  if (bgmSound.current) {
                    if (bgmEnabled) {
                      try { await bgmSound.current.playAsync(); } catch (e) {}
                    } else {
                      try { await bgmSound.current.stopAsync(); } catch (e) {}
                    }
                  }
                }
                setScreen('level');
              }}
            >
              <Text style={styles.startText}>Touch to start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  
  if (showTutorial) {
    return (
      <TutorialScreen 
        levelId={tutorialLevelId}
        onClose={() => {
          setShowTutorial(false);
          setSelectedPuzzle(PUZZLE_MAPS[tutorialLevelId]);
          setScreen('game');
        }}
        onHighlight={(highlightCells) => {
          // 하이라이트 로직 구현
          const newBoard = board.map((row, rowIndex) => 
            row.map((cell, colIndex) => {
              // 하이라이트 대상 셀이면 2(하이라이트), 아니면 기존 상태 유지
              const isHighlighted = highlightCells.some(([r, c]) => 
                r === rowIndex && c === colIndex
              );
              return isHighlighted ? 2 : cell;
            })
          );
          setBoard(newBoard);
        }}
        onAllowedCells={(allowedCells) => {
          // 허용된 셀 로직 구현
          const newBoard = board.map((row, rowIndex) => 
            row.map((cell, colIndex) => {
              // 허용된 셀이면 3(비활성), 아니면 기존 상태 유지
              const isAllowed = allowedCells.some(([r, c]) => 
                r === rowIndex && c === colIndex
              );
              return isAllowed ? 3 : cell;
            })
          );
          setBoard(newBoard);
        }}
      />
    );
  }

  return (
    <View style={styles.centered}>
      <Text>다른 화면은 아직 준비 중입니다.</Text>
    </View>
  );
}