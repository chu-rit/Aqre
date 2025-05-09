import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform, SafeAreaView } from 'react-native';
import { styles, boardStyles } from '../styles';


export default function GameScreen({
  puzzle,
  setScreen,
  soundEnabled,
  vibrationEnabled,
  tapSound,
  bgmSound,
  clearSound,
  bgmPlay,
}) {
  // 게임 상태 useState로 관리
  const [board, setBoard] = React.useState(puzzle.initialState.map(row => [...row]));
  const [moveCount, setMoveCount] = React.useState(0);
  const [startTime, setStartTime] = React.useState(Date.now());
  const [clearTime, setClearTime] = React.useState(null);
  const [violationMessages, setViolationMessages] = React.useState([]);
  const [highlightedViolationCells, setHighlightedViolationCells] = React.useState([]);
  const [clearPopupVisible, setClearPopupVisible] = React.useState(false);

  // 셀 색상 토글 함수
  const toggleCellColor = (row, col) => {
      setBoard(prev => {
          if (prev[row][col] === 2) return prev;
          const newBoard = [...prev];
          newBoard[row] = [...newBoard[row]];
          newBoard[row][col] = newBoard[row][col] === 0 ? 1 : 0;
          return newBoard;
      });
  };

  // 게임 상태 초기화 함수
  const resetGameState = () => {
    setBoard(puzzle.initialState.map(row => [...row]));
    setMoveCount(0);
    setStartTime(Date.now());
    setClearTime(null);
    setViolationMessages([]);
    setClearPopupVisible(false);
  };

  // 퍼즐이 변경될 때마다 상태 초기화
  React.useEffect(() => {
    resetGameState();
    // eslint-disable-next-line
  }, [puzzle]);

  // 게임 판 검사 및 클리어 팝업
  React.useEffect(() => {
    if (
      puzzle &&
      Array.isArray(board) &&
      board.length === puzzle.size &&
      board.every(row => Array.isArray(row) && row.length === puzzle.size)
    ) {
      const checkGameRules = (board, puzzle) => {
        const violations = {
            areaOverflow: false,
            consecutiveColors: {
                horizontal: false,
                vertical: false
            },
            cellConnectivity: false
        };
        const violationMessages = new Set();

        // 1. 각 영역의 회색 칸 수 확인
        for (const area of puzzle.areas) {
            const grayCount = area.cells.reduce((count, [row, col]) => {
                return count + (board[row][col] === 1 ? 1 : 0);
            }, 0);

            // 'J'인 경우는 검사하지 않음
            if (area.required === 'J') continue;

            // 문자열로 된 숫자를 정수로 변환하여 비교
            const requiredCount = parseInt(area.required);
            if (grayCount > requiredCount) {
                violations.areaOverflow = true;
                const overflowCells = area.cells.filter(([row, col]) => board[row][col] === 1);
                violationMessages.add(JSON.stringify({
                    type: '영역 회색 칸 초과',
                    message: '영역의 회색 칸 수가 초과되었습니다.',
                    cells: overflowCells.map(([row, col]) => ({row, col}))
                }));
                break;
            }
            if (grayCount < requiredCount) {
                violations.areaOverflow = true;
                const underflowCells = area.cells.filter(([row, col]) => board[row][col] !== 1);
                violationMessages.add(JSON.stringify({
                    type: '영역 회색 칸 부족',
                    message: '영역의 회색 칸 수가 부족합니다.',
                    cells: underflowCells.map(([row, col]) => ({row, col}))
                }));
                break;
            }
        }

        // 2. 연속된 같은 색상 체크 (가로, 세로)
        const directions = [
            { dx: 1, dy: 0, name: '가로', key: 'horizontal' },  // 가로
            { dx: 0, dy: 1, name: '세로', key: 'vertical' }   // 세로
        ];

        for (const dir of directions) {
            for (let i = 0; i < puzzle.size; i++) {
                for (let j = 0; j <= puzzle.size - 4; j++) {
                    const sequence = [];
                    const violationCells = [];

                    for (let k = 0; k < 4; k++) {
                        const row = dir.dy === 1 ? j + k : i;
                        const col = dir.dx === 1 ? j + k : i;

                        const color = dir.dx === 1
                            ? board[i][j + k]
                            : board[j + k][i];
                        sequence.push(color);
                        violationCells.push({row, col});
                    }

                    // 4개 연속 같은 색상 체크 (흰색 또는 회색만)
                    if (sequence.every(color => color === 0) || sequence.every(color => color === 1)) {
                        violations.consecutiveColors[dir.key] = true;
                        violationMessages.add(JSON.stringify({
                            type: `${dir.name} 연속 색상 위반`,
                            message: `${dir.name} 방향 4칸 연속 색상 위반`,
                            cells: violationCells
                        }));
                        break;
                    }
                }

                // 이미 해당 방향의 위반을 찾았다면 더 이상 확인하지 않음
                if (violations.consecutiveColors[dir.key]) break;
            }
        }

        // 3. 회색 칸 연결성 확인
        const grayCells = [];
        for (let i = 0; i < puzzle.size; i++) {
            for (let j = 0; j < puzzle.size; j++) {
                if (board[i][j] === 1) {
                    grayCells.push([i, j]);
                }
            }
        }

        // 회색 칸이 없으면 통과
        if (grayCells.length > 0) {
            const visited = new Set();
            const dfs = (r, c) => {
                if (r < 0 || r >= puzzle.size || c < 0 || c >= puzzle.size || board[r][c] !== 1 || visited.has(`${r},${c}`)) return;
                visited.add(`${r},${c}`);
                dfs(r+1, c);
                dfs(r-1, c);
                dfs(r, c+1);
                dfs(r, c-1);
            };

            const [startR, startC] = grayCells[0];
            dfs(startR, startC);

            if (visited.size !== grayCells.length) {
                violations.cellConnectivity = true;
                
                // 연결되지 않은 회색 셀 찾기
                const unconnectedCells = grayCells.filter(([r, c]) => !visited.has(`${r},${c}`));
                
                violationMessages.add(JSON.stringify({
                    type: '회색 칸 연결성 위반',
                    message: '회색 칸들이 서로 연결되어 있지 않습니다.',
                    cells: unconnectedCells.map(([row, col]) => ({row, col}))
                }));
            }
        }

        return {
            violations,
            violationMessages: Array.from(violationMessages)
        };
    };

      const result = checkGameRules(board, puzzle);
      const parsedViolationMessages = result.violationMessages.map(msg => {
        try {
          return JSON.parse(msg);
        } catch {
          return { type: 'unknown', message: msg, cells: [] };
        }
      });
      setViolationMessages(parsedViolationMessages);
      if (parsedViolationMessages.length === 0) {
        setClearPopupVisible(true);
        if (!clearTime) setClearTime(Date.now());
      }
    }
  }, [board, puzzle]);

  if (!puzzle || !puzzle.size || !puzzle.areas) {
    // 유효하지 않은 퍼즐일 경우 레벨 선택 화면으로 돌아감
    setScreen('level');
    return null;
  }

  const size = puzzle.size;
  const GAP = 1;
  const areaMap = Array.from({ length: size }, () => Array(size).fill(-1));
  puzzle.areas.forEach((area, areaIdx) => {
    area.cells.forEach(([r, c]) => {
      areaMap[r][c] = areaIdx;
    });
  });

  return (
    <SafeAreaView style={styles.levelScreen}>
      <View style={styles.levelHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen('level')}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.levelTitle}>Level {puzzle.id}</Text>
        <TouchableOpacity style={styles.optionsButton} onPress={() => setScreen('options')}>
          <Text style={styles.optionsButtonText}>☰</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.gameInfoContainer} />
      <View
        style={[
          boardStyles.boardWrapper,
          {
            width: '90%',
            aspectRatio: 1,
            alignSelf: 'center',
            padding: 8,
            borderRadius: 12,
            overflow: 'hidden',
          },
        ]}
      >
        {board.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flexDirection: 'row',
              flex: 1,
            }}
          >
            {row.map((cell, colIdx) => {
              let borders = {
                borderTopColor: 'transparent', borderTopWidth: 5,
                borderBottomColor: 'transparent', borderBottomWidth: 5,
                borderLeftColor: 'transparent', borderLeftWidth: 5,
                borderRightColor: 'transparent', borderRightWidth: 5,
              };
              if (areaMap[rowIdx][colIdx] !== -1) {
                if (rowIdx === 0 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx - 1]?.[colIdx]) {
                  borders.borderTopColor = 'deepskyblue';
                }
                if (rowIdx === size - 1 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx + 1]?.[colIdx]) {
                  borders.borderBottomColor = 'deepskyblue';
                }
                if (colIdx === 0 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx][colIdx - 1]) {
                  borders.borderLeftColor = 'deepskyblue';
                }
                if (colIdx === size - 1 || areaMap[rowIdx][colIdx] !== areaMap[rowIdx][colIdx + 1]) {
                  borders.borderRightColor = 'deepskyblue';
                }
              }
              // 애니메이션 값 생성
              const violationAnimValue = useRef(new Animated.Value(0)).current;
              
              // 애니메이션 설정
              useEffect(() => {
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(violationAnimValue, {
                      toValue: 1,
                      duration: 1500,
                      useNativeDriver: false
                    }),
                    Animated.timing(violationAnimValue, {
                      toValue: 0,
                      duration: 1500,
                      useNativeDriver: false
                    })
                  ])
                ).start();
              }, []);

              const isViolationCell = highlightedViolationCells.some(cell => cell.row === rowIdx && cell.col === colIdx);
              
              // 애니메이션 값 생성
              const violationDotAnim = useRef(new Animated.Value(0)).current;
              
              // 애니메이션 설정
              useEffect(() => {
                const animationLoop = Animated.loop(
                  Animated.sequence([
                    Animated.timing(violationDotAnim, {
                      toValue: 1,
                      duration: 1500,
                      useNativeDriver: false
                    }),
                    Animated.timing(violationDotAnim, {
                      toValue: 0,
                      duration: 1500,
                      useNativeDriver: false
                    })
                  ])
                );
                animationLoop.start();
                return () => animationLoop.stop();
              }, [violationDotAnim]);

              const ViolationDot = () => {
                if (!isViolationCell) return null;

                const dotSize = violationDotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 15]
                });
                const dotOpacity = violationDotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 0]
                });

                return (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: [{ translateX: -5 }, { translateY: -5 }],
                      width: dotSize,
                      height: dotSize,
                      borderRadius: 5,
                      backgroundColor: 'rgba(46, 204, 113, 1)',
                      opacity: dotOpacity,
                      ...Platform.select({
                        ios: { shadowColor: 'rgba(46, 204, 113, 0.5)', shadowOpacity: 0.5, shadowRadius: 5 },
                        android: { elevation: 3 }
                      })
                    }}
                  />
                );
              };

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
              
              // 위반된 셀 하이라이트
              if (isViolationCell) {
                cellStyle.push({
                  position: 'relative',
                });
              }
              return (
                <TouchableOpacity
                  key={`cell-${rowIdx}-${colIdx}`}
                  style={cellStyle}
                  onPress={() => {
                    toggleCellColor(rowIdx, colIdx);
                    setMoveCount(cnt => cnt + 1);
                    if (soundEnabled && tapSound && tapSound.current) {
                      tapSound.current.replayAsync();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ViolationDot />
                  {/* 필요시 영역 힌트 표시 */}
                  {(() => {
                    const areaIdx = areaMap[rowIdx][colIdx];
                    if (areaIdx !== -1) {
                      const area = puzzle.areas[areaIdx];
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
            <TouchableOpacity 
              key={idx} 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 2,
                padding: 5,
                borderRadius: 8,
                backgroundColor: highlightedViolationCells.length > 0 && highlightedViolationCells.some(cell => cell.type === msg.type) ? '#ffeeee' : 'transparent'
              }}
              onPress={() => {
                console.log('Violation Message Clicked:', msg);
                console.log('Current Highlighted Cells:', highlightedViolationCells);
                
                // 이미 하이라이트된 위반 유형이면 하이라이트 해제, 아니면 해당 위반 유형의 셀 하이라이트
                setHighlightedViolationCells(prev => {
                  const isAlreadyHighlighted = prev.length > 0 && prev[0].type === msg.type;
                  console.log('Is Already Highlighted:', isAlreadyHighlighted);
                  
                  const newHighlightedCells = isAlreadyHighlighted 
                    ? [] 
                    : msg.cells.map(cell => ({...cell, type: msg.type}));
                  
                  console.log('New Highlighted Cells:', newHighlightedCells);
                  return newHighlightedCells;
                });
              }}
            >
              <Text style={{ fontSize: 19, marginRight: 6 }}>⚠️</Text>
              <Text style={{
                color: '#b00020',
                fontWeight: 'bold',
                fontSize: 16,
                textAlign: 'center',
                flexShrink: 1,
              }}>
                {msg.message}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#90caf9', // 하늘색 테두리
            shadowColor: '#1976d2',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.16,
            shadowRadius: 16,
            elevation: 8,
            minWidth: 250,
            position: 'relative',
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: 5,
              }}
              onPress={() => {
                setClearPopupVisible(false);
              }}
            >
              <Text style={{ fontSize: 20, color: '#999' }}>✕</Text>
            </TouchableOpacity>
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
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>리스트로</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
