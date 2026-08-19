import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from '../components/Toast';
import OptionsScreen from './OptionsScreen';
import TutorialScreen, { handleSkipTutorial } from '../components/TutorialScreen';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';
import { playTap, playClear, playVibrate, setSoundEnabled } from '../utils/sound';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import {
  createAddHintPoints,
  loadHintPoints as loadHintPointsFn,
  createUseHint,
  createApplyHintCell,
} from '../utils/hintManager';
import { registerRef } from '../utils/refRegistry';
import { scaleStyles, UI_SCALE } from '../utils/responsive';
import CardCell from '../components/CardCell';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DIFFICULTY_NAMES = ['Tutorial', 'Easy', 'Normal', 'Hard'];
const SERIES_NAMES = {
  0: 'Tutorial',
  1: 'Easy 1',
  2: 'Easy 2',
  3: 'Normal 1',
  4: 'Normal 2',
  5: 'Hard',
};

function getPuzzleTitle(puzzle) {
  const groupName = SERIES_NAMES[puzzle.series] ?? DIFFICULTY_NAMES[puzzle.difficulty] ?? `Lv${puzzle.difficulty}`;
  const sameSeries = PUZZLE_MAPS.filter(p => p.series === puzzle.series);
  const idx = sameSeries.indexOf(puzzle);
  const num = idx >= 0 ? idx + 1 : '?';
  return `${groupName} - ${num}`;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BOARD_PADDING = 16;
const BOARD_SIZE = Math.round(SCREEN_WIDTH * 0.9);
const isTablet = Platform.isPad || SCREEN_WIDTH > 600;
const LOCK_HOLD_DURATION = 1000;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function checkGameRules(board, puzzle, isEnglish) {
  const size = puzzle.size;
  const violationMessages = new Set();

  for (const area of puzzle.areas) {
    if (area.required === 'J') continue;
    const required = parseInt(area.required);
    const grayCount = area.cells.reduce((n, [r, c]) => n + (board[r][c] === 1 ? 1 : 0), 0);
    if (grayCount > required) {
      violationMessages.add(JSON.stringify({ type: 'area_overflow', message: isEnglish ? 'Area has too many gray cells.' : '영역의 회색 칸 수가 초과되었습니다.', cells: area.cells.filter(([r, c]) => board[r][c] === 1).map(([r, c]) => ({ row: r, col: c })) }));
      break;
    }
    if (grayCount < required) {
      violationMessages.add(JSON.stringify({ type: 'area_underflow', message: isEnglish ? 'Area has too few gray cells.' : '영역의 회색 칸 수가 부족합니다.', cells: area.cells.filter(([r, c]) => board[r][c] !== 1).map(([r, c]) => ({ row: r, col: c })) }));
      break;
    }
  }

  const dirs = [{ dx: 1, dy: 0, name: isEnglish ? 'Horizontal' : '가로', key: 'horizontal' }, { dx: 0, dy: 1, name: isEnglish ? 'Vertical' : '세로', key: 'vertical' }];
  for (const dir of dirs) {
    let found = false;
    for (let i = 0; i < size && !found; i++) {
      for (let j = 0; j <= size - 4 && !found; j++) {
        const seq = [];
        const cells = [];
        for (let k = 0; k < 4; k++) {
          const r = dir.dy === 1 ? j + k : i;
          const c = dir.dx === 1 ? j + k : i;
          seq.push(dir.dx === 1 ? board[i][j + k] : board[j + k][i]);
          cells.push({ row: r, col: c });
        }
        if (seq.every(v => v === 0) || seq.every(v => v === 1)) {
          violationMessages.add(JSON.stringify({ type: `${dir.key}_consecutive`, message: isEnglish ? `${dir.name} 4 consecutive cells violation` : `${dir.name} 방향 4칸 연속 색상 위반`, cells }));
          found = true;
        }
      }
    }
  }

  const grayCells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === 1) grayCells.push([r, c]);
  if (grayCells.length > 0) {
    const globalVisited = new Set();
    const groups = [];
    for (const [sr, sc] of grayCells) {
      const startKey = `${sr},${sc}`;
      if (globalVisited.has(startKey)) continue;
      const group = [];
      const stack = [[sr, sc]];
      while (stack.length) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;
        if (globalVisited.has(key)) continue;
        globalVisited.add(key);
        group.push([r, c]);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === 1 && !globalVisited.has(`${nr},${nc}`)) stack.push([nr, nc]);
        }
      }
      groups.push(group);
    }
    if (groups.length > 1) {
      groups.sort((a, b) => b.length - a.length);
      const disconnected = groups.slice(1).flat();
      violationMessages.add(JSON.stringify({ type: 'connectivity', message: isEnglish ? 'Gray cells are not connected.' : '회색 칸들이 서로 연결되어 있지 않습니다.', cells: disconnected.map(([r, c]) => ({ row: r, col: c })) }));
    }
  }

  return Array.from(violationMessages).map(m => JSON.parse(m));
}

const REFERENCE_BOARD_SIZE = 480;
const GAP = Math.round(14 * BOARD_SIZE / REFERENCE_BOARD_SIZE);
const AREA_GAP = Math.round(6 * BOARD_SIZE / REFERENCE_BOARD_SIZE);

function getViolationMeta(type, isEnglish) {
  if (type === 'area_overflow' || type === 'area_underflow') {
    return { title: isEnglish ? 'Area' : '영역 규칙', icon: 'apps', color: '#3b82c4', tint: '#e3eef8' };
  }
  if (type === 'horizontal_consecutive' || type === 'vertical_consecutive') {
    return { title: isEnglish ? 'No Four' : '4연속 규칙', icon: 'warning', color: '#e8a33d', tint: '#fbf1de' };
  }
  if (type === 'connectivity') {
    return { title: isEnglish ? 'Connectivity' : '연결 규칙', icon: 'git-network', color: '#9b59b6', tint: '#f0e6f6' };
  }
  return { title: isEnglish ? 'Rule' : '규칙 위반', icon: 'alert-circle', color: '#6b8e3d', tint: '#eef3e2' };
}

const BackButton = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill="#2c3e50"
    />
  </Svg>
);

const SettingsButton = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      fill="#2c3e50"
    />
  </Svg>
);

const ResetButton = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
      fill="#2c3e50"
    />
  </Svg>
);

export default function GameScreen({ puzzle, onBack, onChangeBgm, onResetData, isActive = true }) {
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState(() => puzzle.initialState.map(r => [...r]));
  const boardRef = useRef(board);
  const previousBoardRef = useRef(board);
  boardRef.current = board;
  const [moveCount, setMoveCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [clearTime, setClearTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [violations, setViolations] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const selectedRule = React.useMemo(() => {
    if (!selectedViolation) return null;
    if (['area_overflow', 'area_underflow'].includes(selectedViolation.type)) return 'area';
    if (['connectivity'].includes(selectedViolation.type)) return 'connect';
    if (['horizontal_consecutive', 'vertical_consecutive'].includes(selectedViolation.type)) return 'seq';
    return null;
  }, [selectedViolation]);
  const [clearVisible, setClearVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasCompletedTutorialsWithoutSkipping, setHasCompletedTutorialsWithoutSkipping] = useState(false);
  const [hintPoints, setHintPoints] = useState(0);
  const [hintMode, setHintMode] = useState(false);
  const [masterMode, setMasterMode] = useState(false);
  const masterHintModeRef = useRef(false);
  const [language] = useState(() => {
    const locales = Localization.getLocales();
    const locale = locales?.[0]?.languageCode || locales?.[0]?.languageTag || '';
    return String(locale).toLowerCase().startsWith('ko') ? 'ko' : 'en';
  });
  const isEnglish = language === 'en';

  const [dotResetKey, setDotResetKey] = useState(0);
  const [lockedCells, setLockedCells] = useState({});
  const [clearPending, setClearPending] = useState(false);
  const clearPendingRef = useRef(false);
  const [clearEffectVisible, setClearEffectVisible] = useState(false);
  const clearStartTimerRef = useRef(null);
  const clearWaveAnim = useRef(new Animated.Value(0)).current;
  const clearPopupAnim = useRef(new Animated.Value(0)).current;
  const optionsPopupAnim = useRef(new Animated.Value(0)).current;
  const clearTriggeredRef = useRef(false);
  const isInitialPuzzleRef = useRef(true);

  const closeOptions = useCallback(() => {
    Animated.spring(optionsPopupAnim, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start(() => setShowOptions(false));
  }, [optionsPopupAnim]);

  const handleResetData = useCallback(() => {
    setShowOptions(false);
    if (onResetData) onResetData();
    else if (onBack) onBack();
  }, [onResetData, onBack]);

  const tutorialSteps = getTutorialStepsByLevel(puzzle.id);
  const cellRefs = useRef(null);
  if (!cellRefs.current || cellRefs.current.length !== puzzle.size) {
    cellRefs.current = Array.from({ length: puzzle.size }, () =>
      Array.from({ length: puzzle.size }, () => React.createRef())
    );
  }

  const addHintPoints = useCallback(createAddHintPoints(setHintPoints), []);

  const getCellRect = useCallback((row, col) => {
    return new Promise((resolve, reject) => {
      const ref = cellRefs.current?.[row]?.[col];
      if (!ref?.current) { reject(new Error('ref not ready')); return; }
      if (Platform.OS === 'web') {
        try {
          const rect = ref.current.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            resolve({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
          } else {
            reject(new Error('getBoundingClientRect failed'));
          }
        } catch (e) {
          reject(e);
        }
        return;
      }
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        if (typeof pageX === 'number') resolve({ left: pageX, top: pageY, width, height });
        else reject(new Error('measure failed'));
      });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadTutorialCompletionState = async () => {
      const [completedJson, skippedJson] = await Promise.all([
        AsyncStorage.getItem('completedTutorials'),
        AsyncStorage.getItem('skippedTutorials'),
      ]);
      const completed = JSON.parse(completedJson || '{}');
      const skipped = JSON.parse(skippedJson || '{}');
      const requiredLevelKeys = ['level26000001', 'level26000002', 'level26000003', 'level26000004'];
      const isEligible = requiredLevelKeys.every(key => completed[key] && !skipped[key]);
      if (!cancelled) setHasCompletedTutorialsWithoutSkipping(isEligible);
    };
    loadTutorialCompletionState();
    return () => {
      cancelled = true;
    };
  }, [puzzle.id]);

  useEffect(() => {
    loadHintPointsFn(setHintPoints);
  }, []);

  const size = puzzle.size;
  const areaFilledCounts = React.useMemo(() => puzzle.areas.map(area => (
    area.cells.reduce((count, [row, col]) => count + (board[row][col] === 1 ? 1 : 0), 0)
  )), [board, puzzle.areas]);
  const areaMap = React.useMemo(() => {
    const m = Array.from({ length: size }, () => Array(size).fill(-1));
    puzzle.areas.forEach((area, idx) => area.cells.forEach(([r, c]) => { m[r][c] = idx; }));
    return m;
  }, [puzzle]);

  useEffect(() => {
    if (!isInitialPuzzleRef.current) {
      const initialBoard = puzzle.initialState.map(r => [...r]);
      previousBoardRef.current = initialBoard;
      boardRef.current = initialBoard;
      setBoard(initialBoard);
      setMoveCount(0);
      setClearTime(null);
      setViolations([]);
      setClearVisible(false);
      clearPopupAnim.stopAnimation();
      clearPopupAnim.setValue(0);
      setClearEffectVisible(false);
      clearPendingRef.current = false;
      setClearPending(false);
      clearTriggeredRef.current = false;
      clearWaveAnim.stopAnimation();
      clearWaveAnim.setValue(0);
      setHighlightedCells([]);
      setSelectedViolation(null);
      setLockedCells({});
      setShowTutorial(false);
      setHintMode(false);
    }
    isInitialPuzzleRef.current = false;
    const steps = getTutorialStepsByLevel(puzzle.id);
    const tutorialTimer = steps.length > 0
      ? setTimeout(() => setShowTutorial(true), 500)
      : null;
    return () => {
      if (tutorialTimer) clearTimeout(tutorialTimer);
      clearWaveAnim.stopAnimation();
    };
  }, [puzzle, clearWaveAnim, clearPopupAnim]);

  useEffect(() => {
    AsyncStorage.getItem('options').then(json => {
      if (json) {
        const options = JSON.parse(json);
        setMasterMode(!!options.masterMode);
      }
    });
  }, []);

  useEffect(() => {
    if (!board || board.length !== size) return;
    const msgs = checkGameRules(board, puzzle, isEnglish);
    setViolations(prev => JSON.stringify(prev) === JSON.stringify(msgs) ? prev : msgs);
    if (msgs.length > 0) {
      clearTriggeredRef.current = false;
      return;
    }

    if (!clearTriggeredRef.current) {
      clearTriggeredRef.current = true;
      setClearPending(true);
      clearStartTimerRef.current = setTimeout(() => {
        setClearEffectVisible(true);
        clearWaveAnim.setValue(0);
        const waveSteps = (size - 1) * 2 + 3;
        Animated.timing(clearWaveAnim, {
          toValue: waveSteps,
          duration: Math.max(2000, waveSteps * 240),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setClearEffectVisible(false);
            setClearVisible(true);
            playClear();
            clearPopupAnim.setValue(0);
            Animated.spring(clearPopupAnim, {
              toValue: 1,
              friction: 7,
              tension: 70,
              useNativeDriver: true,
            }).start();
          }
        });
      }, 300);
      if (!clearTime) setClearTime(Date.now());
      AsyncStorage.getItem('clearedPuzzles').then(json => {
        const arr = json ? JSON.parse(json) : [];
        if (!arr.includes(puzzle.id)) {
          AsyncStorage.setItem('clearedPuzzles', JSON.stringify([...arr, puzzle.id]));
        }
      });
    }
    return () => {
      if (clearStartTimerRef.current) {
        clearTimeout(clearStartTimerRef.current);
        clearStartTimerRef.current = null;
      }
    };
  }, [board, puzzle, isEnglish, clearWaveAnim, clearPopupAnim]);

  useEffect(() => {
    setSelectedViolation(prev => prev === null ? prev : null);
    setHighlightedCells(prev => prev.length === 0 ? prev : []);
  }, [board]);

  const tapFeedback = useCallback(() => {
    playTap();
    playVibrate();
  }, []);

  const toggleCell = useCallback((r, c) => {
    if (clearPendingRef.current || clearPending || clearEffectVisible || clearVisible) return;
    const currentBoard = boardRef.current;
    if (currentBoard[r][c] === 2) return;
    const nextBoard = currentBoard.map(row => [...row]);
    nextBoard[r][c] = nextBoard[r][c] === 0 ? 1 : 0;
    if (checkGameRules(nextBoard, puzzle, isEnglish).length === 0) {
      clearPendingRef.current = true;
      setClearPending(true);
    }
    previousBoardRef.current = currentBoard.map(row => [...row]);
    boardRef.current = nextBoard;
    setBoard(nextBoard);
    setMoveCount(n => n + 1);
  }, [clearEffectVisible, clearVisible, puzzle, isEnglish]);

  const toggleLock = useCallback((r, c) => {
    if (clearPendingRef.current || clearPending || clearEffectVisible || clearVisible) return;
    const key = `${r}-${c}`;
    setLockedCells(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  }, [clearEffectVisible, clearVisible]);

  const useHint = useCallback(
    () => {
      masterHintModeRef.current = false;
      createUseHint(hintPoints, addHintPoints, setHintMode)();
    },
    [hintPoints, addHintPoints]
  );

  const applyHintCell = useCallback(
    createApplyHintCell(
      puzzle.id,
      board,
      setBoard,
      setHintMode,
      setLockedCells,
      setMoveCount,
      addHintPoints,
      showTutorial,
      tutorialStep,
      masterHintModeRef,
    ),
    [board, puzzle.id, addHintPoints, showTutorial, tutorialStep, masterHintModeRef]
  );

  const reset = useCallback(() => {
    if (clearStartTimerRef.current) {
      clearTimeout(clearStartTimerRef.current);
      clearStartTimerRef.current = null;
    }
    const initialBoard = puzzle.initialState.map(r => [...r]);
    previousBoardRef.current = initialBoard;
    boardRef.current = initialBoard;
    setBoard(initialBoard);
    setMoveCount(0);
    setClearTime(null);
    setViolations([]);
    setClearVisible(false);
    clearPopupAnim.stopAnimation();
    clearPopupAnim.setValue(0);
    setClearEffectVisible(false);
    clearPendingRef.current = false;
    setClearPending(false);
    clearTriggeredRef.current = false;
    clearWaveAnim.stopAnimation();
    clearWaveAnim.setValue(0);
    setHighlightedCells([]);
    setSelectedViolation(null);
    setLockedCells({});
    setHintMode(false);
  }, [puzzle, clearWaveAnim, clearPopupAnim]);

  useEffect(() => {
    if (!isActive || clearTime) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [clearTime, startTime, isActive]);

  const elapsed = clearTime && startTime ? Math.floor((clearTime - startTime) / 1000) : elapsedSeconds;
  const formattedElapsed = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 0) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <BackButton />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{getPuzzleTitle(puzzle)}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={reset} testID="reset-level" ref={r => registerRef('reset-level', r)}>
              <ResetButton />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => {
              setShowOptions(true);
              optionsPopupAnim.setValue(0);
              Animated.spring(optionsPopupAnim, {
                toValue: 1,
                friction: 7,
                tension: 60,
                useNativeDriver: true,
              }).start();
            }}>
              <SettingsButton />
            </TouchableOpacity>
          </View>
        </View>
      <View style={styles.stopwatch}>
          <View style={styles.stopwatchIcon}>
            <Ionicons name="time-outline" size={20} color="#fff" />
          </View>
          <View style={styles.stopwatchCopy}>
            <Text style={styles.stopwatchLabel}>TIME</Text>
            <Text style={styles.stopwatchValue}>{formattedElapsed}</Text>
          </View>
          <TouchableOpacity
            style={[styles.hintButton, hintMode && styles.hintButtonActive]}
            onPress={showTutorial && puzzle.id === 26000005 && tutorialStep === 2 ? () => setHintMode(prev => !prev) : useHint}
            onLongPress={masterMode ? () => {
              masterHintModeRef.current = !hintMode;
              setHintMode(prev => !prev);
            } : undefined}
            delayLongPress={500}
            testID="hint"
            nativeID="hint-button"
            ref={r => registerRef('hint', r)}
            activeOpacity={0.7}
          >
            <Ionicons name={hintMode ? 'bulb' : 'bulb-outline'} size={15} color="#fff" />
            <Text style={styles.hintButtonText}>HINT: {hintPoints}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.boardWrapper, { width: BOARD_SIZE, height: BOARD_SIZE }]} testID="board" ref={r => registerRef('board', r)}>
          {(() => {
            const pad = Math.round(14 * BOARD_SIZE / REFERENCE_BOARD_SIZE);
            const cellSize = (BOARD_SIZE - pad * 2 - GAP * (size - 1)) / size;
            const LINE_OFFSET = GAP / 2;
            const xs = [];
            const ys = [];
            let cx = pad;
            let cy = pad;
            for (let c = 0; c < size; c++) { xs.push(cx); cx += cellSize + GAP; }
            for (let r = 0; r < size; r++) { ys.push(cy); cy += cellSize + GAP; }
            // Build SVG path for area boundaries - draw each area's outline edges
            const LINE_COLOR = '#acd4f5';
            const STROKE_W = Math.round(6 * BOARD_SIZE / REFERENCE_BOARD_SIZE);
            const round = v => Math.round(v * 10) / 10;
            const inArea = (r, c, a) => r >= 0 && r < size && c >= 0 && c < size && areaMap[r][c] === a;

            const areaIds = new Set();
            for (let r = 0; r < size; r++)
              for (let c = 0; c < size; c++)
                if (areaMap[r][c] !== -1) areaIds.add(areaMap[r][c]);

            const pathSegs = [];
            for (const areaId of areaIds) {
              // Top boundaries: merge consecutive cells in same row with top boundary
              for (let r = 0; r < size; r++) {
                let c = 0;
                while (c < size) {
                  if (areaMap[r][c] !== areaId || inArea(r - 1, c, areaId)) { c++; continue; }
                  const startC = c;
                  while (c < size && areaMap[r][c] === areaId && !inArea(r - 1, c, areaId)) c++;
                  const endC = c - 1;
                  pathSegs.push(`M${round(xs[startC] - LINE_OFFSET)} ${round(ys[r] - LINE_OFFSET)} L${round(xs[endC] + cellSize + LINE_OFFSET)} ${round(ys[r] - LINE_OFFSET)}`);
                }
              }
              // Bottom boundaries
              for (let r = 0; r < size; r++) {
                let c = 0;
                while (c < size) {
                  if (areaMap[r][c] !== areaId || inArea(r + 1, c, areaId)) { c++; continue; }
                  const startC = c;
                  while (c < size && areaMap[r][c] === areaId && !inArea(r + 1, c, areaId)) c++;
                  const endC = c - 1;
                  pathSegs.push(`M${round(xs[startC] - LINE_OFFSET)} ${round(ys[r] + cellSize + LINE_OFFSET)} L${round(xs[endC] + cellSize + LINE_OFFSET)} ${round(ys[r] + cellSize + LINE_OFFSET)}`);
                }
              }
              // Left boundaries: merge consecutive cells in same column with left boundary
              for (let c = 0; c < size; c++) {
                let r = 0;
                while (r < size) {
                  if (areaMap[r][c] !== areaId || inArea(r, c - 1, areaId)) { r++; continue; }
                  const startR = r;
                  while (r < size && areaMap[r][c] === areaId && !inArea(r, c - 1, areaId)) r++;
                  const endR = r - 1;
                  pathSegs.push(`M${round(xs[c] - LINE_OFFSET)} ${round(ys[startR] - LINE_OFFSET)} L${round(xs[c] - LINE_OFFSET)} ${round(ys[endR] + cellSize + LINE_OFFSET)}`);
                }
              }
              // Right boundaries
              for (let c = 0; c < size; c++) {
                let r = 0;
                while (r < size) {
                  if (areaMap[r][c] !== areaId || inArea(r, c + 1, areaId)) { r++; continue; }
                  const startR = r;
                  while (r < size && areaMap[r][c] === areaId && !inArea(r, c + 1, areaId)) r++;
                  const endR = r - 1;
                  pathSegs.push(`M${round(xs[c] + cellSize + LINE_OFFSET)} ${round(ys[startR] - LINE_OFFSET)} L${round(xs[c] + cellSize + LINE_OFFSET)} ${round(ys[endR] + cellSize + LINE_OFFSET)}`);
                }
              }
            }
            const areaPath = pathSegs.join(' ');
            const cellElements = [];
            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                const clearEffectIndex = r + c;
                cellElements.push(
                  <View
                    key={`cell-${puzzle.id}-${r}-${c}`}
                    style={[
                      { position: 'absolute', left: xs[c], top: ys[r], width: cellSize, height: cellSize },
                      clearEffectVisible && {
                        zIndex: 1000 - clearEffectIndex,
                        elevation: 1000 - clearEffectIndex,
                      },
                    ]}
                  >
                    <CardCell
                      rowIdx={r}
                      colIdx={c}
                      cell={board[r][c]}
                      previousCell={previousBoardRef.current[r][c]}
                      size={size}
                      cellSize={cellSize}
                      areaMap={areaMap}
                      areaFilledCount={areaMap[r][c] === -1 ? 0 : areaFilledCounts[areaMap[r][c]]}
                      isViolation={highlightedCells.some(v => v.row === r && v.col === c)}
                      onPress={hintMode ? applyHintCell : toggleCell}
                      onTapStart={hintMode ? undefined : tapFeedback}
                      onLongPress={hintMode ? undefined : toggleLock}
                      isLocked={!!lockedCells[`${r}-${c}`]}
                      clearPending={clearPending}
                      hintMode={hintMode}
                      puzzle={puzzle}
                      cellRef={cellRefs.current[r][c]}
                      dotResetKey={dotResetKey}
                      clearEffectVisible={clearEffectVisible}
                      clearEffectIndex={clearEffectIndex}
                      clearWaveAnim={clearWaveAnim}
                    />
                  </View>
                );
              }
            }
            return (
              <View style={{ position: 'relative', width: BOARD_SIZE, height: BOARD_SIZE, overflow: 'visible' }}>
                {cellElements}
                {areaPath ? (
                  <View pointerEvents="none" style={{ position: 'absolute', top: -STROKE_W, left: -STROKE_W, width: BOARD_SIZE + STROKE_W * 2, height: BOARD_SIZE + STROKE_W * 2, zIndex: 10, elevation: 10, overflow: 'visible' }}>
                    <Svg width={BOARD_SIZE + STROKE_W * 2} height={BOARD_SIZE + STROKE_W * 2} viewBox={`${-STROKE_W} ${-STROKE_W} ${BOARD_SIZE + STROKE_W * 2} ${BOARD_SIZE + STROKE_W * 2}`}>
                      <Path d={areaPath} stroke={LINE_COLOR} strokeWidth={STROKE_W} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                ) : null}
              </View>
            );
          })()}
        </View>

{(() => {
          const ALL_RULES = [
            { key: 'area',    title: isEnglish ? 'Area' : '영역', types: ['area_overflow', 'area_underflow'], icon: 'apps',        okColor: '#3b82c4' },
            { key: 'connect', title: isEnglish ? 'Connect' : '연결', types: ['connectivity'],                     icon: 'git-network', okColor: '#9b59b6' },
            { key: 'seq',     title: isEnglish ? 'No Four' : '4연속', types: ['horizontal_consecutive', 'vertical_consecutive'], icon: 'warning',   okColor: '#e8a33d' },
          ];
          return (
            <View style={styles.violationSection}>
              <View style={styles.violationSectionHeader}>
                <View style={styles.violationSectionBadge}>
                  <Text style={styles.violationSectionBadgeText}>Rule Check</Text>
                </View>
                <View style={styles.violationSectionLine} />
              </View>
              <View style={styles.violationBox}>
              {ALL_RULES.map(rule => {
                const matched = violations.filter(v => rule.types.includes(v.type));
                const isViolated = matched.length > 0;
                const selected = matched.some(v => selectedViolation?.type === v.type);
                return (
                  <TouchableOpacity
                    key={rule.key}
                    testID={`rule-card-${rule.key}`}
                    ref={r => registerRef(`rule-card-${rule.key}`, r)}
                    style={[
                      styles.violationCard,
                      isViolated ? styles.violationCardError : styles.violationCardSuccess,
                      selected && styles.violationCardSelected,
                    ]}
                    onPress={() => {
                      if (!isViolated) return;
                      const msg = matched[0];
                      const same = selectedViolation?.type === msg.type;
                      setSelectedViolation(same ? null : msg);
                      setHighlightedCells(same ? [] : msg.cells.map(c => ({ ...c, type: msg.type })));
                      if (!same) setDotResetKey(k => k + 1);
                    }}
                    activeOpacity={isViolated ? 0.7 : 1}
                  >
                    <Ionicons
                      name={isViolated ? rule.icon : 'checkmark-circle'}
                      size={isTablet ? 32 : 22}
                      color={isViolated ? '#ef4444' : '#10b981'}
                    />
                    <Text
                      style={[styles.violationCardText, isViolated && styles.violationCardTextError]}
                    >
                      {rule.title}{isEnglish ? ' Rule' : ' 규\u2060칙'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              </View>
            </View>
          );
        })()}

        {clearVisible && (
          <Animated.View
            style={[styles.overlay, {
              opacity: clearPopupAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            }]}
          >
            <Animated.View
              style={[styles.clearCard, {
                opacity: clearPopupAnim.interpolate({
                  inputRange: [0, 0.35, 1],
                  outputRange: [0, 0.9, 1],
                }),
                transform: [
                  {
                    translateY: clearPopupAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [32, 0],
                    }),
                  },
                  {
                    scale: clearPopupAnim.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0.82, 1.04, 1],
                    }),
                  },
                ],
              }]}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setClearVisible(false);
                  clearPendingRef.current = false;
                  setClearPending(false);
                }}
              >
                <Ionicons name="close" size={20} color="#8a96a3" />
              </TouchableOpacity>
              <View style={styles.clearIconWrap}>
                <Ionicons name="checkmark" size={36} color="#fff" />
              </View>
              <Text style={styles.clearEyebrow}>PUZZLE COMPLETE</Text>
              <Text style={styles.clearTitle}>COMPLETE!</Text>
              <View style={styles.clearStats}>
                <View style={styles.clearStatCard}>
                  <Ionicons name="hand-left-outline" size={18} color="#4a90d9" />
                  <Text style={styles.clearStatValue}>{moveCount}</Text>
                </View>
                <View style={styles.clearStatDivider} />
                <View style={styles.clearStatCard}>
                  <Ionicons name="time-outline" size={18} color="#4a90d9" />
                  <Text style={styles.clearStatValue}>{formattedElapsed}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.clearBtn} onPress={onBack} activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>LEVELS</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
        </View>
      </View>
      <Toast />
      {showTutorial && (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <TutorialScreen
            isVisible={showTutorial}
            onClose={async () => {
              const key = `completedTutorials`;
              const json = await AsyncStorage.getItem(key) || '{}';
              const completed = JSON.parse(json);
              completed[`level${puzzle.id}`] = true;
              await AsyncStorage.setItem(key, JSON.stringify(completed));
              setShowTutorial(false);
            }}
            onSkip={() => handleSkipTutorial(puzzle.id, () => setShowTutorial(false))}
            levelId={puzzle.id}
            steps={tutorialSteps}
            board={board}
            selectedRule={selectedRule}
            hasCompletedTutorialsWithoutSkipping={hasCompletedTutorialsWithoutSkipping}
            onGrantHintPoints={addHintPoints}
            onStepChange={setTutorialStep}
            hintMode={hintMode}
            getCellRect={getCellRect}
          />
        </View>
      )}
      {showOptions && (
        <Animated.View
          style={[styles.optionsOverlay, {
            opacity: optionsPopupAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }]}
          onStartShouldSetResponder={() => true}
          onResponderRelease={closeOptions}
        >
          <Animated.View
            style={[styles.optionsCardWrap, {
              transform: [
                {
                  translateY: optionsPopupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [32, 0],
                  }),
                },
                {
                  scale: optionsPopupAnim.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.82, 1.04, 1],
                  }),
                },
              ],
            }]}
            onStartShouldSetResponder={() => true}
          >
            <OptionsScreen
              embedded
              onClose={closeOptions}
              onChangeBgm={onChangeBgm}
              onResetData={handleResetData}
              renderToast={false}
            />
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create(scaleStyles({
  optionsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(27, 42, 58, 0.38)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, elevation: 2000, padding: 24,
  },
  optionsCardWrap: {
    width: '100%', maxWidth: 420, alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#dde4ed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  stopwatch: {
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#243b53',
    shadowColor: '#162b42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  stopwatchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82c4',
    marginRight: 10,
  },
  stopwatchCopy: {
    flex: 1,
  },
  stopwatchLabel: {
    color: '#a9c4de',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  stopwatchValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#3b82c4',
    borderWidth: 1,
    borderColor: '#6fb1e5',
    shadowColor: '#102b45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 100,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  hintButtonActive: {
    backgroundColor: '#e8a33d',
    borderColor: '#f5c26b',
  },
  hintButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  boardWrapper: {
    backgroundColor: '#1a1a2e',
    padding: 0,
    borderRadius: 16,
    overflow: 'visible',
    alignSelf: 'center',
    marginTop: 16,
  },
  violationSection: {
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#f0f4f8',
    borderRadius: 16,
    padding: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  violationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  violationSectionBadge: {
    backgroundColor: '#2c3e50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  violationSectionBadgeText: {
    color: '#fff',
    fontSize: isTablet ? 20 : 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  violationSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d0d8e4',
  },
  violationBox: {
    flexDirection: 'row',
    gap: isTablet ? 12 : 8,
  },
  violationCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 10 : 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: isTablet ? 16 : 10,
    paddingHorizontal: isTablet ? 16 : 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  violationCardSuccess: {
    backgroundColor: '#fff',
    borderColor: '#d1fae5',
  },
  violationCardError: {
    backgroundColor: '#fff0f0',
    borderColor: '#fca5a5',
  },
  violationCardSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#f5f9fd',
  },
  violationCardText: {
    fontSize: isTablet ? 22 : 13,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
    flexShrink: 1,
    wordBreak: 'keep-all',
  },
  violationCardTextError: {
    color: '#dc2626',
  },
  violationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  violationRowSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#f5f9fd',
  },
  violationRowSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  violationIcon: {
    width: isTablet ? 56 : 40, height: isTablet ? 56 : 40, borderRadius: isTablet ? 28 : 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  violationTextWrap: { flex: 1 },
  violationTitle: { color: '#2c3e50', fontWeight: '800', fontSize: isTablet ? 21 : 15, marginBottom: 2 },
  violationDesc: { color: '#8a96a3', fontSize: isTablet ? 18 : 13, fontWeight: '500' },

  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(27, 42, 58, 0.18)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
    padding: 24,
  },
  clearCard: {
    width: '100%', maxWidth: 360, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24,
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', position: 'relative',
    shadowColor: '#1b2a3a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f8fc',
  },
  clearIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#10b981',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  clearEyebrow: { color: '#10b981', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  clearTitle: { fontSize: 30, fontWeight: '800', color: '#2c3e50', marginBottom: 6 },
  clearSubtitle: { color: '#8a96a3', fontSize: 14, fontWeight: '600', marginBottom: 22 },
  clearStats: {
    width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,249,253,0.62)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(224,234,244,0.78)', paddingVertical: 14, marginBottom: 20,
  },
  clearStatCard: { flex: 1, alignItems: 'center', gap: 3 },
  clearStatDivider: { width: 1, height: 46, backgroundColor: '#d8e3ee' },
  clearStatLabel: { color: '#8a96a3', fontSize: 12, fontWeight: '700' },
  clearStatValue: { color: '#2c3e50', fontSize: 20, fontWeight: '800' },
  clearBtn: {
    width: '100%', backgroundColor: 'rgba(74,144,217,0.72)', borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#4a90d9', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.24, shadowRadius: 9, elevation: 4,
  },
  clearBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
}));
