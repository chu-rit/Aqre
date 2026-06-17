import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { showToast } from '../components/Toast';
import TutorialScreen, { handleSkipTutorial } from '../components/TutorialScreen';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';
import { playTap, playClear, setSoundEnabled } from '../utils/sound';
import { PUZZLE_MAPS } from '../src/logic/puzzles';

const DIFFICULTY_NAMES = ['Tutorial', 'Easy', 'Normal', 'Hard'];

function getPuzzleTitle(puzzle) {
  const groupName = DIFFICULTY_NAMES[puzzle.difficulty] ?? `Lv${puzzle.difficulty}`;
  const sameDiff = PUZZLE_MAPS.filter(p => p.difficulty === puzzle.difficulty);
  const idx = sameDiff.findIndex(p => p.id === puzzle.id);
  const num = idx >= 0 ? idx + 1 : '?';
  return `${groupName} ${num}`;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 480);

function checkGameRules(board, puzzle) {
  const size = puzzle.size;
  const violationMessages = new Set();

  for (const area of puzzle.areas) {
    if (area.required === 'J') continue;
    const required = parseInt(area.required);
    const grayCount = area.cells.reduce((n, [r, c]) => n + (board[r][c] === 1 ? 1 : 0), 0);
    if (grayCount > required) {
      violationMessages.add(JSON.stringify({ type: '영역 회색 칸 초과', message: '영역의 회색 칸 수가 초과되었습니다.', cells: area.cells.filter(([r, c]) => board[r][c] === 1).map(([r, c]) => ({ row: r, col: c })) }));
      break;
    }
    if (grayCount < required) {
      violationMessages.add(JSON.stringify({ type: '영역 회색 칸 부족', message: '영역의 회색 칸 수가 부족합니다.', cells: area.cells.filter(([r, c]) => board[r][c] !== 1).map(([r, c]) => ({ row: r, col: c })) }));
      break;
    }
  }

  const dirs = [{ dx: 1, dy: 0, name: '가로', key: 'horizontal' }, { dx: 0, dy: 1, name: '세로', key: 'vertical' }];
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
          violationMessages.add(JSON.stringify({ type: `${dir.name} 연속 색상 위반`, message: `${dir.name} 방향 4칸 연속 색상 위반`, cells }));
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
      violationMessages.add(JSON.stringify({ type: '회색 칸 연결성 위반', message: '회색 칸들이 서로 연결되어 있지 않습니다.', cells: disconnected.map(([r, c]) => ({ row: r, col: c })) }));
    }
  }

  return Array.from(violationMessages).map(m => JSON.parse(m));
}

const GAP = 1;

function getViolationMeta(type) {
  if (type === '영역 회색 칸 초과' || type === '영역 회색 칸 부족') {
    return { title: '영역 규칙', icon: 'apps', color: '#3b82c4', tint: '#e3eef8' };
  }
  if (type === '가로 연속 색상 위반' || type === '세로 연속 색상 위반') {
    return { title: '4연속 규칙', icon: 'warning', color: '#e8a33d', tint: '#fbf1de' };
  }
  if (type === '회색 칸 연결성 위반') {
    return { title: '연결 규칙', icon: 'git-network', color: '#9b59b6', tint: '#f0e6f6' };
  }
  return { title: '규칙 위반', icon: 'alert-circle', color: '#6b8e3d', tint: '#eef3e2' };
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

const BoardCell = React.memo(function BoardCell({ rowIdx, colIdx, cell, size, areaMap, isViolation, onPress, puzzle, cellRef, dotResetKey }) {
  const dotAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);
  useEffect(() => {
    dotAnim.stopAnimation();
    dotAnim.setValue(0);
    if (loopRef.current) { loopRef.current.stop(); loopRef.current = null; }
    if (!isViolation) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
      Animated.timing(dotAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
    ]));
    loopRef.current = loop;
    loop.start();
    return () => { loop.stop(); dotAnim.stopAnimation(); loopRef.current = null; };
  }, [isViolation, dotResetKey]);

  const areaIdx = areaMap[rowIdx][colIdx];
  const borders = { borderTopColor: 'transparent', borderTopWidth: 4, borderBottomColor: 'transparent', borderBottomWidth: 4, borderLeftColor: 'transparent', borderLeftWidth: 4, borderRightColor: 'transparent', borderRightWidth: 4 };
  if (areaIdx !== -1) {
    if (rowIdx === 0 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx - 1]?.[colIdx]) borders.borderTopColor = '#acd4f5';
    if (rowIdx === size - 1 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx + 1]?.[colIdx]) borders.borderBottomColor = '#acd4f5';
    if (colIdx === 0 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx][colIdx - 1]) borders.borderLeftColor = '#acd4f5';
    if (colIdx === size - 1 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx][colIdx + 1]) borders.borderRightColor = '#acd4f5';
  }

  const bgColor = cell === 0 ? '#fff' : cell === 1 ? '#8a8a8a' : '#3a6b9c';
  const dotSize = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 14] });
  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  const showLabel = (() => {
    if (areaIdx === -1) return false;
    const area = puzzle.areas[areaIdx];
    if (area.required === 'J') return false;
    return area.cells[0][0] === rowIdx && area.cells[0][1] === colIdx;
  })();

  return (
    <TouchableOpacity
      ref={cellRef}
      style={[{
        flex: 1, aspectRatio: 1,
        marginRight: colIdx === size - 1 ? 0 : GAP,
        marginBottom: rowIdx === size - 1 ? 0 : GAP,
        borderRadius: 0,
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
        ...borders,
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isViolation && (
        <Animated.View style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: [
            { translateX: dotSize.interpolate({ inputRange: [8, 14], outputRange: [-4, -7] }) },
            { translateY: dotSize.interpolate({ inputRange: [8, 14], outputRange: [-4, -7] }) },
          ],
          width: dotSize, height: dotSize, borderRadius: 7,
          backgroundColor: 'rgba(46,204,113,1)', opacity: dotOpacity,
        }} />
      )}
      {showLabel && (
        <View
          testID={`area-${rowIdx}-${colIdx}`}
          style={{ position: 'absolute', left: 2, top: 2, zIndex: 10 }}
        >
          <Text style={{
            color: '#1e3a5f',
            fontWeight: 'bold',
            fontSize: 21,
            textShadowColor: '#fff',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 3,
          }}>
            {puzzle.areas[areaIdx]?.required}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function GameScreen({ puzzle, onBack, onOptions }) {
  const [board, setBoard] = useState(() => puzzle.initialState.map(r => [...r]));
  const [moveCount, setMoveCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [clearTime, setClearTime] = useState(null);
  const [violations, setViolations] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [clearVisible, setClearVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [dotResetKey, setDotResetKey] = useState(0);

  const tutorialSteps = getTutorialStepsByLevel(puzzle.id);
  const cellRefs = useRef(null);
  if (!cellRefs.current || cellRefs.current.length !== puzzle.size) {
    cellRefs.current = Array.from({ length: puzzle.size }, () =>
      Array.from({ length: puzzle.size }, () => React.createRef())
    );
  }

  const getCellRect = useCallback((row, col) => {
    return new Promise((resolve, reject) => {
      const ref = cellRefs.current?.[row]?.[col];
      if (!ref?.current) { reject(new Error('ref not ready')); return; }
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        if (typeof pageX === 'number') resolve({ left: pageX, top: pageY, width, height });
        else reject(new Error('measure failed'));
      });
    });
  }, []);

  useEffect(() => {
    if (tutorialSteps.length > 0) setShowTutorial(true);
  }, [puzzle.id]);

  const size = puzzle.size;
  const areaMap = React.useMemo(() => {
    const m = Array.from({ length: size }, () => Array(size).fill(-1));
    puzzle.areas.forEach((area, idx) => area.cells.forEach(([r, c]) => { m[r][c] = idx; }));
    return m;
  }, [puzzle]);

  useEffect(() => {
    setBoard(puzzle.initialState.map(r => [...r]));
    setMoveCount(0);
    setClearTime(null);
    setViolations([]);
    setClearVisible(false);
    setHighlightedCells([]);
    setSelectedViolation(null);
    const steps = getTutorialStepsByLevel(puzzle.id);
    if (steps.length > 0) setShowTutorial(true);
  }, [puzzle]);

  useEffect(() => {
    if (!board || board.length !== size) return;
    const msgs = checkGameRules(board, puzzle);
    setViolations(msgs);
    if (msgs.length === 0) {
      if (!clearVisible) playClear();
      setClearVisible(true);
      if (!clearTime) setClearTime(Date.now());
      AsyncStorage.getItem('clearedPuzzles').then(json => {
        const arr = json ? JSON.parse(json) : [];
        if (!arr.includes(puzzle.id)) {
          AsyncStorage.setItem('clearedPuzzles', JSON.stringify([...arr, puzzle.id]));
        }
      });
    }
  }, [board, puzzle]);

  useEffect(() => {
    setSelectedViolation(null);
    setHighlightedCells([]);
  }, [board]);

  const toggleCell = useCallback((r, c) => {
    playTap();
    setBoard(prev => {
      if (prev[r][c] === 2) return prev;
      const next = prev.map(row => [...row]);
      next[r][c] = next[r][c] === 0 ? 1 : 0;
      return next;
    });
    setMoveCount(n => n + 1);
  }, []);

  const reset = useCallback(() => {
    setBoard(puzzle.initialState.map(r => [...r]));
    setMoveCount(0);
    setClearTime(null);
    setViolations([]);
    setClearVisible(false);
    setHighlightedCells([]);
    setSelectedViolation(null);
  }, [puzzle]);

  const elapsed = clearTime && startTime ? Math.floor((clearTime - startTime) / 1000) : 0;

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <BackButton />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{getPuzzleTitle(puzzle)}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={reset} testID="reset-level">
              <ResetButton />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={onOptions}>
              <SettingsButton />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.boardWrapper}>
          {board.map((row, rIdx) => (
            <View key={rIdx} style={{ flexDirection: 'row', flex: 1, minHeight: 0 }}>
              {row.map((cell, cIdx) => (
                <BoardCell
                  key={`${rIdx}-${cIdx}`}
                  rowIdx={rIdx}
                  colIdx={cIdx}
                  cell={cell}
                  size={size}
                  areaMap={areaMap}
                  isViolation={highlightedCells.some(v => v.row === rIdx && v.col === cIdx)}
                  onPress={() => toggleCell(rIdx, cIdx)}
                  puzzle={puzzle}
                  cellRef={cellRefs.current[rIdx][cIdx]}
                  dotResetKey={dotResetKey}
                />
              ))}
            </View>
          ))}
        </View>

        {violations.length > 0 && (
          <View style={styles.violationBox}>
            {violations.map((msg, idx) => {
              const meta = getViolationMeta(msg.type);
              const selected = selectedViolation?.type === msg.type;
              return (
                <TouchableOpacity
                  key={idx}
                  testID={`violation-item-${idx}`}
                  style={[styles.violationRow, selected && styles.violationRowSelected]}
                  onPress={() => {
                    const same = selectedViolation?.type === msg.type;
                    setSelectedViolation(same ? null : msg);
                    setHighlightedCells(same ? [] : msg.cells.map(c => ({ ...c, type: msg.type })));
                    if (!same) setDotResetKey(k => k + 1);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.violationIcon, { backgroundColor: meta.tint }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <View style={styles.violationTextWrap}>
                    <Text style={styles.violationTitle}>{meta.title}</Text>
                    <Text style={styles.violationDesc}>{msg.message}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {clearVisible && (
          <View style={styles.overlay}>
            <View style={styles.clearCard}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setClearVisible(false)}>
                <Text style={{ fontSize: 20, color: '#999' }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.clearTitle}>클리어!</Text>
              <Text style={styles.clearStat}>조작 횟수: {moveCount}회</Text>
              <Text style={styles.clearStat}>걸린 시간: {elapsed}초</Text>
              <TouchableOpacity style={styles.clearBtn} onPress={onBack}>
                <Text style={styles.clearBtnText}>리스트로</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
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
            getCellRect={getCellRect}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  boardWrapper: {
    backgroundColor: '#2c3e50',
    padding: 6,
    borderRadius: 16,
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    alignSelf: 'center',
    marginTop: 16,
  },
  violationBox: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
  violationIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  violationTextWrap: { flex: 1 },
  violationTitle: { color: '#2c3e50', fontWeight: '800', fontSize: 15, marginBottom: 2 },
  violationDesc: { color: '#8a96a3', fontSize: 13, fontWeight: '500' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  clearCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    alignItems: 'center', borderWidth: 2, borderColor: '#90caf9',
    minWidth: 250, position: 'relative',
    shadowColor: '#1976d2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 8,
  },
  closeBtn: { position: 'absolute', top: 10, right: 10, padding: 5 },
  clearTitle: { fontSize: 28, fontWeight: 'bold', color: '#2a7', marginBottom: 16 },
  clearStat: { color: '#1976d2', fontWeight: 'bold', fontSize: 17, marginTop: 4 },
  clearBtn: {
    marginTop: 20, backgroundColor: '#1976d2', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 44,
  },
  clearBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
});
