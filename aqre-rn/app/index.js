import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';

import { PUZZLE_MAPS } from '../src/logic/puzzles';

export default function Page() {
  const [screen, setScreen] = useState('start'); // 'start', 'level', 'game', 'option'
  const [selectedPuzzle, setSelectedPuzzle] = useState(null); // 현재 선택된 퍼즐
  const [gameBoard, setGameBoard] = useState(null); // 현재 게임 보드 상태

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
          <TouchableOpacity style={styles.backButton} onPress={() => setScreen('start')}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.levelTitle}>Level Select</Text>
          <TouchableOpacity style={styles.optionsButton} onPress={() => {}}>
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
                      setSelectedPuzzle(puzzle);
                      setGameBoard(puzzle.initialState.map(row => [...row])); // 딥카피
                      setScreen('game');
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
      </SafeAreaView>
    );
  }

  // 게임 화면(gameScreen)
  if (screen === 'game' && selectedPuzzle && gameBoard) {
    const size = selectedPuzzle.size;
    // 화면 가로폭 기준 셀 크기 동적 계산
    const { width } = Dimensions.get('window');
    const BOARD_MARGIN = 24;
    const BOARD_MAX = width * 0.96;
    const cellSize = Math.floor((BOARD_MAX - BOARD_MARGIN * 2) / size);
    // 영역별 색상 팔레트(최대 16영역, 반복 사용)
    const areaColors = [
      '#e1eaff', '#ffe6e1', '#e1ffe6', '#fffbe1', '#f3e1ff', '#e1f9ff', '#ffe1f3', '#e9ffe1',
      '#f5e1ff', '#e1fff5', '#fff0e1', '#e1eaff', '#ffe1e1', '#e1ffe1', '#e1e1ff', '#fffde1'
    ];
    // 셀별 area 인덱스 맵 만들기
    const areaMap = Array.from({length: size}, () => Array(size).fill(-1));
    selectedPuzzle.areas.forEach((area, idx) => {
      area.cells.forEach(([r, c]) => {
        areaMap[r][c] = idx;
      });
    });
    return (
      <SafeAreaView style={styles.levelScreen}>
        <View style={styles.levelHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setScreen('level')}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.levelTitle}>Level {selectedPuzzle.id}</Text>
          <View style={{width: 44}} />
        </View>
        <View style={[styles.gameBoardContainer, { width: cellSize * size + 4, height: cellSize * size + 4 }]}> 
          {gameBoard.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gameBoardRow}>
              {row.map((cell, colIdx) => {
                const isFixed = selectedPuzzle.initialState[rowIdx][colIdx] === 2;
                const areaIdx = areaMap[rowIdx][colIdx];
                // Aqre 오리지널 스타일: 영역 경계에만 굵은 검정, 내부는 얇은 연한 라인
                const borderStyles = {};
                const dirs = [
                  { key: 'Top', dr: -1, dc: 0, style: 'borderTopWidth', color: 'borderTopColor' },
                  { key: 'Bottom', dr: 1, dc: 0, style: 'borderBottomWidth', color: 'borderBottomColor' },
                  { key: 'Left', dr: 0, dc: -1, style: 'borderLeftWidth', color: 'borderLeftColor' },
                  { key: 'Right', dr: 0, dc: 1, style: 'borderRightWidth', color: 'borderRightColor' },
                ];
                dirs.forEach(({ dr, dc, style, color }) => {
                  const nr = rowIdx + dr, nc = colIdx + dc;
                  if (nr < 0 || nr >= size || nc < 0 || nc >= size || areaMap[nr][nc] !== areaIdx) {
                    borderStyles[style] = 4.5; // 영역 경계선
                    borderStyles[color] = '#222';
                  } else {
                    borderStyles[style] = 0.5; // 내부선
                    borderStyles[color] = '#bbb';
                  }
                });
                borderStyles.backgroundColor = '#fff';
                borderStyles.borderRadius = 0;
                const areaStyle = borderStyles;
                if (isFixed) {
                  return (
                    <View key={colIdx} style={[
                      styles.gameCell,
                      { width: cellSize, height: cellSize },
                      areaStyle, // borderWidth, borderColor만 동적으로 오버라이드
                      styles.fixedCell
                    ]} />
                  );
                } else {
                  return (
                    <TouchableOpacity
                      key={colIdx}
                      style={[
                        styles.gameCell,
                        { width: cellSize, height: cellSize },
                        areaStyle, // borderWidth, borderColor만 동적으로 오버라이드
                        cell === 1 && styles.grayCell
                      ]}
                      onPress={() => {
                        setGameBoard(prev => {
                          // 고정 셀은 절대 토글 불가 (혹시라도 방어)
                          if (selectedPuzzle.initialState[rowIdx][colIdx] === 2) return prev;
                          const copy = prev.map(r => [...r]);
                          copy[rowIdx][colIdx] = copy[rowIdx][colIdx] === 1 ? 0 : 1;
                          return copy;
                        });
                      }}
                      activeOpacity={0.7}
                    />
                  );
                }
              })}
            </View>
          ))}
        </View>
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
          <TouchableOpacity style={styles.gameButton} onPress={() => setScreen('level')}>
            <Text style={styles.startText}>Touch to start</Text>
          </TouchableOpacity>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  // (추후: 레벨 선택, 게임 화면 등 추가)
  return (
    <View style={styles.centered}>
      <Text>다른 화면은 아직 준비 중입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  levelScreen: {
    flex: 1,
    backgroundColor: '#a4c8e0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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