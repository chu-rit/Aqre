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

  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [bgmEnabled, setBgmEnabledState] = useState(true);
  const [vibrationEnabled, setVibrationEnabledState] = useState(true);

  // 옵션 저장
  const saveOptions = async (options) => {
    try {
      await AsyncStorage.setItem('options', JSON.stringify(options));
    } catch (e) {}
  };

  // 옵션 불러오기
  const loadOptions = async () => {
    try {
      const options = await AsyncStorage.getItem('options');
      if (options) {
        const parsed = JSON.parse(options);
        setSoundEnabledState(parsed.soundEnabled ?? true);
        setBgmEnabledState(parsed.bgmEnabled ?? true);
        setVibrationEnabledState(parsed.vibrationEnabled ?? true);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadOptions();
    loadClearedPuzzles();
  }, []);

  // 옵션 setter 래핑
  const setSoundEnabled = (val) => {
    setSoundEnabledState(val);
    saveOptions({ soundEnabled: val, bgmEnabled, vibrationEnabled });
  };
  const setBgmEnabled = (val) => {
    setBgmEnabledState(val);
    saveOptions({ soundEnabled, bgmEnabled: val, vibrationEnabled });
  };
  const setVibrationEnabled = (val) => {
    setVibrationEnabledState(val);
    saveOptions({ soundEnabled, bgmEnabled, vibrationEnabled: val });
  };

  const [moveCount, setMoveCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [clearTime, setClearTime] = useState(null);

  
  const [screen, setScreen] = useState('start'); // 'start', 'level', 'game', 'option'
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [board, setBoard] = useState([]);
  const [violations, setViolations] = useState([]);
  const [violationMessages, setViolationMessages] = useState([]);
  const [clearPopupVisible, setClearPopupVisible] = useState(false);
  const [clearedPuzzles, setClearedPuzzles] = useState([]);

  // 클리어된 퍼즐 저장
  const saveClearedPuzzles = async (puzzles) => {
    try {
      await AsyncStorage.setItem('clearedPuzzles', JSON.stringify(puzzles));
    } catch (e) {
      console.error('Failed to save cleared puzzles', e);
    }
  };

  // 클리어된 퍼즐 불러오기
  const loadClearedPuzzles = async () => {
    try {
      const puzzlesJson = await AsyncStorage.getItem('clearedPuzzles');
      if (puzzlesJson) {
        const parsedPuzzles = JSON.parse(puzzlesJson);
        setClearedPuzzles(parsedPuzzles);
      }
    } catch (e) {
      console.error('Failed to load cleared puzzles', e);
    }
  };

  
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialLevelId, setTutorialLevelId] = useState(null);


  const handleLevelSelect = (puzzle) => {
    
    const tutorialSteps = tutorialOpen(puzzle.id);
    if (tutorialSteps) {
      setTutorialLevelId(puzzle.id);
      setShowTutorial(true);
      return;
    }

    // 게임 상태 초기화
    setBoard(puzzle.initialState.map(row => [...row]));
    setViolations([]);
    setViolationMessages([]);
    setClearPopupVisible(false);
    setMoveCount(0);
    setStartTime(Date.now());
    setClearTime(null);
    
    setSelectedPuzzle(puzzle);
    setScreen('game');
  };

  
  useEffect(() => {
    if (!selectedPuzzle) return;
    setBoard(selectedPuzzle.initialState.map(row => [...row]));
    setViolations([]);
    setViolationMessages([]);
    setClearPopupVisible(false);
    setMoveCount(0);
    setStartTime(Date.now());
    setClearTime(null);
  }, [selectedPuzzle]);

  
  useEffect(() => {
    if (
      screen === 'game' &&
      selectedPuzzle &&
      Array.isArray(board) &&
      board.length === selectedPuzzle.size &&
      board.every(row => Array.isArray(row) && row.length === selectedPuzzle.size)
    ) {
      const result = checkGameRules(board, selectedPuzzle);
      setViolations(result.violations);
      setViolationMessages(result.violationMessages);
      if (result.violationMessages.length === 0) {
        setClearPopupVisible(true);
        if (!clearTime) setClearTime(Date.now());
        if (!clearedPuzzles.includes(selectedPuzzle.id)) {
          const updatedClearedPuzzles = [...clearedPuzzles, selectedPuzzle.id];
          setClearedPuzzles(updatedClearedPuzzles);
          saveClearedPuzzles(updatedClearedPuzzles);
        }
      }
    } else {
      setViolations([]);
      setViolationMessages([]);
    }
  }, [board, screen, selectedPuzzle, clearedPuzzles]);

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
    const levelsPerRow = 5;
    const rows = [];
    for (let i = 0; i < PUZZLE_MAPS.length; i += levelsPerRow) {
      rows.push(PUZZLE_MAPS.slice(i, i + levelsPerRow));
    }

    return (
      <LevelScreen
        rows={rows}
        soundEnabled={soundEnabled}
        tapSound={tapSound}
        vibrationEnabled={vibrationEnabled}
        bgmEnabled={bgmEnabled}
        bgmPlay={bgmPlay}
        setScreen={setScreen}

        handleLevelSelect={handleLevelSelect}
        setSoundEnabled={setSoundEnabled}
        setBgmEnabled={setBgmEnabled}
        setVibrationEnabled={setVibrationEnabled}
        clearedPuzzles={clearedPuzzles}
      />
    );
  }

  if (screen === 'game' && selectedPuzzle) {
    return (
      <GameScreen
        selectedPuzzle={selectedPuzzle}
        board={board}
        handleCellPress={(rowIdx, colIdx) => {
          setBoard(prev =>
            prev.map((row, r) =>
              row.map((cell, c) =>
                r === rowIdx && c === colIdx ? (cell === 0 ? 1 : cell === 1 ? 0 : 2) : cell
              )
            )
          );
          setMoveCount(cnt => cnt + 1);
          if (soundEnabled && tapSound.current) {
            tapSound.current.replayAsync();
          }
        }}
        violationMessages={violationMessages}
        clearPopupVisible={clearPopupVisible}
        setScreen={setScreen}

        moveCount={moveCount}
        startTime={startTime}
        clearTime={clearTime}
        setClearPopupVisible={setClearPopupVisible}
        setMoveCount={setMoveCount}
        setStartTime={setStartTime}
        setClearTime={setClearTime}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        bgmEnabled={bgmEnabled}
        setBgmEnabled={setBgmEnabled}
        vibrationEnabled={vibrationEnabled}
        setVibrationEnabled={setVibrationEnabled}
        clearedPuzzles={clearedPuzzles}

      />
    );
  }

  if (screen === 'options') {
    return (
      <OptionsScreen
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        bgmEnabled={bgmEnabled}
        setBgmEnabled={setBgmEnabled}
        vibrationEnabled={vibrationEnabled}
        setVibrationEnabled={setVibrationEnabled}
        clearedPuzzles={clearedPuzzles}
        setClearedPuzzles={setClearedPuzzles}
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