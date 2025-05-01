import React, { useState, useEffect, useRef } from 'react';
import { useAqreSound } from '../src/hooks/sound';
import { Switch, StyleSheet, View, Text, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import { TutorialScreen, tutorialOpen } from './tutorial';
import { checkGameRules } from '../src/logic/gameRules';

// Aqre React Native 메인 페이지
export default function Page() {
  // ===== 사운드 및 옵션 =====
  const { bgmSound, tapSound, clearSound, bgmPlay, bgmReady } = useAqreSound();
  const [optionVisible, setOptionVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // 옵션 상태 로드 및 저장 함수
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  const saveOption = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`${key} 저장 중 오류:`, error);
    }
  };

  const loadOptions = async () => {
    try {
      const savedSoundEnabled = await AsyncStorage.getItem('soundEnabled');
      const savedBgmEnabled = await AsyncStorage.getItem('bgmEnabled');
      const savedVibrationEnabled = await AsyncStorage.getItem('vibrationEnabled');

      if (savedSoundEnabled !== null) setSoundEnabled(JSON.parse(savedSoundEnabled));
      if (savedBgmEnabled !== null) setBgmEnabled(JSON.parse(savedBgmEnabled));
      if (savedVibrationEnabled !== null) setVibrationEnabled(JSON.parse(savedVibrationEnabled));
    } catch (error) {
      console.error('옵션 로드 중 오류:', error);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  // ===== 게임 진행 상태 =====
  const [moveCount, setMoveCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [clearTime, setClearTime] = useState(null);

  // ===== 화면 전환 및 퍼즐 상태 =====
  const [screen, setScreen] = useState('start'); // 'start', 'level', 'game', 'option'
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [board, setBoard] = useState([]);
  const [violations, setViolations] = useState([]);
  const [violationMessages, setViolationMessages] = useState([]);
  const [clearPopupVisible, setClearPopupVisible] = useState(false);

  // ===== 튜토리얼 및 레벨 선택 함수 =====
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialLevelId, setTutorialLevelId] = useState(null);

  const handleLevelSelect = (puzzle) => {
    // 튜토리얼 자동 트리거
    const tutorialSteps = tutorialOpen(puzzle.id);
    if (tutorialSteps) {
      setTutorialLevelId(puzzle.id);
      setShowTutorial(true);
      return;
    }

    // 퍼즐 선택 기본 로직
    setSelectedPuzzle(puzzle);
    setScreen('game');
  };

  // ===== 퍼즐이 바뀔 때 보드 초기화 =====
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

  // ===== 게임 규칙 검사 =====
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
      }
    } else {
      setViolations([]);
      setViolationMessages([]);
    }
  }, [board, screen, selectedPuzzle]);

  // ===== 퍼즐이 바뀔 때 팝업 닫기 =====
  useEffect(() => {
    setClearPopupVisible(false);
  }, [selectedPuzzle]);

  // ===== 배경음 토글 =====
  useEffect(() => {
    if (bgmReady && bgmSound.current) {
      try {
        if (bgmEnabled) {
          bgmPlay(); // 항상 재생 시도
        } else {
          // 무조건 정지, 상태와 무관하게
          bgmSound.current.stopAsync();
        }
      } catch (error) {
        console.error('배경음 토글 중 오류:', error);
      }
    }
  }, [bgmEnabled, bgmReady, bgmPlay]);

  // 퍼즐이 바뀔 때마다 보드 초기화
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

  // 게임 규칙 검사 (board와 selectedPuzzle 모두 정상적으로 준비된 경우에만)
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

      // 룰체크 결과가 위반 없을 때만 팝업
      if (result.violationMessages.length === 0) {
        setClearPopupVisible(true);
        if (!clearTime) setClearTime(Date.now());
      }
      // 팝업이 떠 있으면 자동으로 닫지 않음
    } else {
      setViolations([]);
      setViolationMessages([]);
      // setClearPopupVisible(false); // 자동 닫힘 제거
    }
  }, [board, screen, selectedPuzzle]);

  // 퍼즐이 바뀔 때만 팝업을 닫음
  useEffect(() => {
    setClearPopupVisible(false);
  }, [selectedPuzzle]);

  // 배경음 토글 시 즉시 반영
  useEffect(() => {
    if (bgmReady && bgmSound.current) {
      if (bgmEnabled) {
        // 모바일: 안전하게 재생
        if (Platform.OS !== 'web') {
          bgmPlay();
        }
      } else {
        try { bgmSound.current.stopAsync(); } catch (e) {}
      }
    }
  }, [bgmEnabled, bgmReady]);


  // 레벨 선택 화면(levelScreen)
  if (screen === 'level') {
    // 레벨을 5개씩 묶어서 행(row)로 만듦
    const levelsPerRow = 5;
    const rows = [];
    for (let i = 0; i < PUZZLE_MAPS.length; i += levelsPerRow) {
      rows.push(PUZZLE_MAPS.slice(i, i + levelsPerRow));
    }

    return (
      <SafeAreaView style={styles.levelScreen}>
        <View style={styles.levelHeader}>
          <TouchableOpacity style={styles.backButton} onPress={async () => {
            if (tapSound.current) {
              try { 
                if (soundEnabled) {
                  await tapSound.current.replayAsync(); 
                }
                if (vibrationEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              } catch (e) {}
            }
            if (bgmEnabled && Platform.OS === 'web') {
              bgmPlay();
            }
            setScreen('start');
          }}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.levelTitle}>Level Select</Text>
          <TouchableOpacity style={styles.optionsButton} onPress={() => setOptionVisible(true)}>
            <Text style={styles.optionsButtonText}>☰</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.levelContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.levelGrid}>
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.levelRow}>
                {row.map((puzzle) => (
                  <TouchableOpacity
                    key={puzzle.id}
                    style={styles.levelButton}
                    onPress={() => {
                      if (bgmEnabled && Platform.OS === 'web') {
                        bgmPlay();
                      }
                      handleLevelSelect(puzzle);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.levelButtonText}>{puzzle.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          <Text style={styles.levelContinued}>To Be Continued...</Text>
        </ScrollView>
      {/* 옵션 팝업 */}
      {optionVisible && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.28)',
          zIndex: 200,
        }}>
          {/* 반투명 배경 위에 옵션 전체 화면 */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#a4c8e0',
          }} />
          {/* 옵션 헤더 */}
          <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', flexDirection: 'row', alignItems: 'center', height: 60, paddingHorizontal: 8 }}>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
              onPress={async () => {
                if (soundEnabled && tapSound.current) {
                  try { await tapSound.current.replayAsync(); } catch (e) {}
                }
                setOptionVisible(false);
              }}
            >
              <Text style={{ fontSize: 28, color: '#1976d2', fontWeight: 'bold' }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginLeft: 12 }}>옵션</Text>
          </View>
          <View style={{ width: '85%', maxWidth: 340, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 18, padding: 24, marginTop: 74, alignSelf: 'center', borderWidth: 2, borderColor: '#90caf9', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 14, elevation: 7 }}>
            {/* 클리어 데이터 버튼 */}
            <TouchableOpacity
              style={{ width: '100%', height: 44, borderRadius: 12, backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9', marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                setMoveCount(0); setStartTime(Date.now()); setClearTime(null); setBoard(selectedPuzzle ? selectedPuzzle.initialState.map(row => [...row]) : []); setViolations([]); setViolationMessages([]); setClearPopupVisible(false);
              }}
            >
              <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16 }}>클리어 데이터 지우기</Text>
            </TouchableOpacity>
            {/* 효과음 토글 */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>효과음</Text>
              <Switch
                value={soundEnabled}
                onValueChange={(newValue) => {
                   setSoundEnabled(newValue);
                   saveOption('soundEnabled', newValue);
                 }}
                trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                thumbColor={soundEnabled ? '#90caf9' : '#eee'}
              />
            </View>
            {/* 배경음 토글 */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>배경음</Text>
              <Switch
                value={bgmEnabled}
                onValueChange={(newValue) => {
                   setBgmEnabled(newValue);
                   saveOption('bgmEnabled', newValue);
                 }}
                trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                thumbColor={bgmEnabled ? '#90caf9' : '#eee'}
              />
            </View>
            {/* 진동 토글 */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>진동</Text>
              <Switch
                value={vibrationEnabled}
                onValueChange={(newValue) => {
                   setVibrationEnabled(newValue);
                   saveOption('vibrationEnabled', newValue);
                 }}
                trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                thumbColor={vibrationEnabled ? '#90caf9' : '#eee'}
              />
            </View>
          </View>
        </View>
      )}
      </SafeAreaView>
    );
  }

  // 게임 화면(보드 렌더링 포함)
  if (
    screen === 'game' &&
    selectedPuzzle &&
    Array.isArray(selectedPuzzle.areas) &&
    typeof selectedPuzzle.size === 'number' &&
    selectedPuzzle.size > 0 &&
    Array.isArray(board) &&
    board.length === selectedPuzzle.size
  ) {
    const size = selectedPuzzle.size;
    const GAP = 1;

    // 1. areaMap 생성 (각 셀의 영역ID)
    const areaMap = Array.from({ length: size }, () => Array(size).fill(-1));
    selectedPuzzle.areas.forEach((area, areaIdx) => {
      area.cells.forEach(([r, c]) => {
        areaMap[r][c] = areaIdx;
      });
    });



    const handleCellPress = (rowIdx, colIdx) => {
      setBoard(prev =>
        prev.map((row, r) =>
          row.map((cell, c) =>
            r === rowIdx && c === colIdx ? (cell === 0 ? 1 : cell === 1 ? 0 : 2) : cell
          )
        )
      );
      setMoveCount(cnt => cnt + 1);
      // 셀 클릭 시 tap 사운드
      if (soundEnabled && tapSound.current) {
        tapSound.current.replayAsync();
      }
    };

    return (
      <SafeAreaView style={styles.levelScreen}>
        <View style={styles.levelHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (soundEnabled && tapSound.current) {
              tapSound.current.replayAsync();
            }
            setScreen('level');
          }}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.levelTitle}>Level {selectedPuzzle.id}</Text>
          <TouchableOpacity style={styles.optionsButton} onPress={() => setOptionVisible(true)}>
            <Text style={styles.optionsButtonText}>☰</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gameInfoContainer} />
        {/* 게임보드 */}
        <View
          style={[
            boardStyles.boardWrapper,
            {
              width: '90%', // 반응형, 원하는 비율로 조정 가능
              aspectRatio: 1, // 정사각형
              alignSelf: 'center',
              padding: 8, // 안쪽 여백
              borderRadius: 12,
              overflow: 'hidden',
            },
          ]}
        >
          {/* 셀 렌더링 (기존과 동일) */}
          {board.map((row, rowIdx) => (
            <View
              key={rowIdx}
              style={{
                flexDirection: 'row',
                flex: 1,
              }}
            >
              {row.map((cell, colIdx) => {
                // 기본 border: 검정색, 영역선만 파란색
                let borders = {
                  borderTopColor: 'transparent', borderTopWidth: 5,
                  borderBottomColor: 'transparent', borderBottomWidth: 5,
                  borderLeftColor: 'transparent', borderLeftWidth: 5,
                  borderRightColor: 'transparent', borderRightWidth: 5,
                };
                if (areaMap[rowIdx][colIdx] !== -1) {
                  // 상
                  if (rowIdx === 0 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx - 1]?.[colIdx]) {
                    borders.borderTopColor = 'deepskyblue';
                  }
                  // 하
                  if (rowIdx === size - 1 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx + 1]?.[colIdx]) {
                    borders.borderBottomColor = 'deepskyblue';
                  }
                  // 좌
                  if (colIdx === 0 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx][colIdx - 1]) {
                    borders.borderLeftColor = 'deepskyblue';
                  }
                  // 우
                  if (colIdx === size - 1 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx][colIdx + 1]) {
                    borders.borderRightColor = 'deepskyblue';
                  }
                }
                let cellStyle = [
                  boardStyles.cellBase,
                  {
                    flex: 1,
                    aspectRatio: 1,
                    marginRight: colIdx === size - 1 ? 0 : GAP,
                    marginBottom: rowIdx === size - 1 ? 0 : GAP,
                    borderRadius: 2,
                    ...borders,
                  },
                ];
                if (cell === 0) cellStyle.push(boardStyles.cellWhite);
                else if (cell === 1) cellStyle.push(boardStyles.cellGray);
                else if (cell === 2) cellStyle.push(boardStyles.cellInactive);
                return (
                  <TouchableOpacity
                    key={colIdx}
                    style={cellStyle}
                    activeOpacity={0.8}
                    onPress={() => handleCellPress(rowIdx, colIdx)}
                  >
                    {/* 영역별 힌트(숫자) 표시: 각 영역의 첫 셀에만 */}
                    {(() => {
                      const areaIdx = areaMap[rowIdx][colIdx];
                      if (areaIdx !== -1) {
                        const area = selectedPuzzle.areas[areaIdx];
                        // 이 셀이 해당 영역의 첫 셀(왼쪽 위)이고 required가 'J'가 아닐 때만
                        if (area.cells[0][0] === rowIdx && area.cells[0][1] === colIdx && area.required !== 'J') {
                          return (
                            <Text style={{
                              position: 'absolute',
                              left: 2,
                              top: 2,
                              color: '#333',
                              fontWeight: 'bold',
                              fontSize: 21,
                              backgroundColor: 'transparent',
                              zIndex: 10,
                            }}>
                              {area.required}
                            </Text>
                          );
                        }
                      }
                      return null;
                    })()}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        {/* violationMessages를 게임보드 하단에만 표시 */}
        {violationMessages.length > 0 && (
          <View style={{
            marginTop: 16,
            marginBottom: 4,
            backgroundColor: '#ffeaea',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            shadowColor: '#e00',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 4,
            alignSelf: 'center',
            width: '95%',
            borderWidth: 1.5,
            borderColor: '#ffb3b3',
          }}>
            {violationMessages.map((msg, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 19, marginRight: 6 }}>⚠️</Text>
                <Text style={{
                  color: '#b00020',
                  fontWeight: 'bold',
                  fontSize: 16,
                  textAlign: 'center',
                  flexShrink: 1,
                }}>
                  {msg}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 클리어 팝업 */}
        {clearPopupVisible && (
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}>
            <View style={{
              backgroundColor: '#e3f2fd', // 연한 하늘색
              borderRadius: 22,
              paddingVertical: 40,
              paddingHorizontal: 34,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#90caf9', // 하늘색 테두리
              shadowColor: '#1976d2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.16,
              shadowRadius: 16,
              elevation: 8,
              minWidth: 250,
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2a7', marginBottom: 18, textShadowColor: '#eee', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                클리어!
              </Text>
              <Text style={{ color: '#2a7', fontWeight: 'bold', fontSize: 17, marginTop: 10 }}>
                조작 횟수: {moveCount}회
              </Text>
              <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 17, marginTop: 4 }}>
                걸린 시간: {clearTime && startTime ? Math.floor((clearTime-startTime)/1000) : 0}초
              </Text>
              <TouchableOpacity
                  style={{
                    marginTop: 16,
                    backgroundColor: '#1976d2', // 진한 하늘색
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 44,
                    shadowColor: '#1976d2',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                    elevation: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setClearPopupVisible(false);
                    setScreen('level');
                    setMoveCount(0);
                    setStartTime(null);
                    setClearTime(null);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>리스트로</Text>
                </TouchableOpacity>
            </View>
          </View>
        )}

      {/* 옵션 팝업 */}
      {optionVisible && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.28)',
          zIndex: 200,
        }}>
          {/* 반투명 배경 위에 옵션 전체 화면 */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#a4c8e0',
          }} />
          {/* 옵션 헤더 */}
          <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', flexDirection: 'row', alignItems: 'center', height: 60, paddingHorizontal: 8 }}>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
              onPress={async () => {
                if (soundEnabled && tapSound.current) {
                  try { await tapSound.current.replayAsync(); } catch (e) {}
                }
                setOptionVisible(false);
              }}
            >
              <Text style={{ fontSize: 28, color: '#1976d2', fontWeight: 'bold' }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginLeft: 12 }}>옵션</Text>
          </View>
          <View style={{ width: '85%', maxWidth: 340, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 18, padding: 24, marginTop: 74, alignSelf: 'center', borderWidth: 2, borderColor: '#90caf9', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 14, elevation: 7 }}>
            {/* 클리어 데이터 버튼 */}
            <TouchableOpacity
              style={{ width: '100%', height: 44, borderRadius: 12, backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9', marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                setMoveCount(0); setStartTime(Date.now()); setClearTime(null); setBoard(selectedPuzzle ? selectedPuzzle.initialState.map(row => [...row]) : []); setViolations([]); setViolationMessages([]); setClearPopupVisible(false);
              }}
            >
              <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16 }}>클리어 데이터 지우기</Text>
            </TouchableOpacity>
            {/* 효과음 토글 */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>효과음</Text>
              <Switch
                value={soundEnabled}
                onValueChange={(newValue) => {
                   setSoundEnabled(newValue);
                   saveOption('soundEnabled', newValue);
                 }}
                trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                thumbColor={soundEnabled ? '#90caf9' : '#eee'}
              />
            </View>
            {/* 배경음 토글 */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>배경음</Text>
              <Switch
                value={bgmEnabled}
                onValueChange={(newValue) => {
                   setBgmEnabled(newValue);
                   saveOption('bgmEnabled', newValue);
                 }}
                trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                thumbColor={bgmEnabled ? '#90caf9' : '#eee'}
              />
            </View>
            {/* 진동 토글 */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>진동</Text>
              <Switch
                value={vibrationEnabled}
                onValueChange={(newValue) => {
                   setVibrationEnabled(newValue);
                   saveOption('vibrationEnabled', newValue);
                 }}
                trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                thumbColor={vibrationEnabled ? '#90caf9' : '#eee'}
              />
            </View>
          </View>
        </View>
      )}
      </SafeAreaView>
    );
  }

  // 첫 화면(startScreen)
  if (screen === 'start') {
    return (
      <SafeAreaView style={styles.startScreen}>
        <View style={styles.innerContainer}>
        <Image
          source={require('../assets/image.png')} // 실제 경로/파일명에 맞게 수정 필요
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
              // 버튼 클릭 시 tap 사운드
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
        {/* 옵션 팝업 */}
        {optionVisible && (
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.28)',
            zIndex: 200,
          }}>
            {/* 반투명 배경 위에 옵션 전체 화면 */}
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#a4c8e0',
            }} />
            {/* 옵션 헤더 */}
            <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', flexDirection: 'row', alignItems: 'center', height: 60, paddingHorizontal: 8 }}>
              <TouchableOpacity
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
                onPress={async () => {
                if (soundEnabled && tapSound.current) {
                  try { await tapSound.current.replayAsync(); } catch (e) {}
                }
                setOptionVisible(false);
              }}
              >
                <Text style={{ fontSize: 28, color: '#1976d2', fontWeight: 'bold' }}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginLeft: 12 }}>옵션</Text>
            </View>
            <View style={{ width: '85%', maxWidth: 340, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 18, padding: 24, marginTop: 74, alignSelf: 'center', borderWidth: 2, borderColor: '#90caf9', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 14, elevation: 7 }}>
              {/* 클리어 데이터 버튼 */}
              <TouchableOpacity
                style={{ width: '100%', height: 44, borderRadius: 12, backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9', marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}
                onPress={async () => {
                  if (soundEnabled && tapSound.current) {
                    try { await tapSound.current.replayAsync(); } catch (e) {}
                  }
                  setMoveCount(0); setStartTime(Date.now()); setClearTime(null); setBoard(selectedPuzzle ? selectedPuzzle.initialState.map(row => [...row]) : []); setViolations([]); setViolationMessages([]); setClearPopupVisible(false);
                }}
              >
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16 }}>클리어 데이터 지우기</Text>
              </TouchableOpacity>
              {/* 효과음 토글 */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>효과음</Text>
                <Switch
                  value={soundEnabled}
                  onValueChange={(value) => {
                    setSoundEnabled(value);
                    saveOption('soundEnabled', value);
                  }}
                  trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                  thumbColor={soundEnabled ? '#90caf9' : '#eee'}
                />
              </View>
              {/* 배경음 토글 */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>배경음</Text>
                <Switch
                  value={bgmEnabled}
                  onValueChange={(value) => {
                    setBgmEnabled(value);
                    saveOption('bgmEnabled', value);
                  }}
                  trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                  thumbColor={bgmEnabled ? '#90caf9' : '#eee'}
                />
              </View>
              {/* 진동 토글 */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold' }}>진동</Text>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={(value) => {
                    setVibrationEnabled(value);
                    saveOption('vibrationEnabled', value);
                  }}
                  trackColor={{ false: '#b0bec5', true: '#1976d2' }}
                  thumbColor={vibrationEnabled ? '#90caf9' : '#eee'}
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // (추후: 레벨 선택, 게임 화면 등 추가)
  return (
    <View style={styles.centered}>
      <Text>다른 화면은 아직 준비 중입니다.</Text>
    </View>
  );

  // 튜토리얼 추가
  {showTutorial && (
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
  )}
}

// 게임보드 스타일(웹 디자인 최대 반영)
const boardStyles = StyleSheet.create({
  boardWrapper: { 
    backgroundColor: '#2a2a2a',
    padding: 4,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 18,
  },
  boardRow: {
    flexDirection: 'row',
  },
  cellBase: {
    margin: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellWhite: {
    backgroundColor: '#fff', // 원본게임 기본(흰색)
  },
  cellBlack: {
    backgroundColor: '#222', // 원본게임 검정(혹은 '#222' 또는 '#111')
  },
  cellGray: {
    backgroundColor: '#999', // type2 (밝은 회색)
  },
  cellInactive: {
    backgroundColor: 'steelblue', // type3 (비활성)
  },
  // 추후 영역 경계 스타일 예시
  cellBoundary: {
    borderWidth: 3,
    borderColor: 'deepskyblue',
  },
  cellText: {
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontSize: 18,
  },
});

const styles = StyleSheet.create({
  levelScreen: {
    flex: 1,
    backgroundColor: '#a4c8e0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  gameInfoContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  gameInfoText: {
    fontSize: 16,
    color: '#444',
    marginVertical: 2,
    fontWeight: '500',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 26,
    color: '#333',
    fontWeight: 'bold',
  },
  levelTitle: {
    fontSize: 22,
    color: '#222',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  optionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButtonText: {
    fontSize: 26,
    color: '#333',
    fontWeight: 'bold',
  },
  levelContainer: {
    paddingHorizontal: 10,
    paddingBottom: 32,
    alignItems: 'center',
  },
  levelGrid: {
    width: '100%',
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  levelButton: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 2,
  },
  levelButtonText: {
    fontSize: 20,
    color: '#3a3a3a',
    fontWeight: 'bold',
  },
  levelContinued: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    fontWeight: '600',
  },
  startScreen: {
    flex: 1,
    backgroundColor: '#a4c8e0', // 웹과 동일하게
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mainImage: {
    width: 320,
    height: 320,
    // marginTop: 36,
    // marginBottom: 24,
    resizeMode: 'cover',
  },
  logo: {
    width: 220,
    height: 90,
    marginBottom: 36,
    resizeMode: 'contain',
  },
  versionTag: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  startContainer: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  startText: {
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    paddingVertical: 6,
  },
  gameButton: {
    width: '80%',
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});