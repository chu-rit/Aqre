import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { styles, boardStyles } from '../styles';


export default function GameScreen({
  selectedPuzzle,
  board,
  handleCellPress,
  violationMessages,
  clearPopupVisible,
  setScreen,

  moveCount,
  startTime,
  clearTime,
  setClearPopupVisible,
  setMoveCount,
  setStartTime,
  setClearTime,
  soundEnabled,
  setSoundEnabled,
  bgmEnabled,
  setBgmEnabled,
  vibrationEnabled,
  setVibrationEnabled,


}) {
  const resetGameState = () => {
    setBoard(selectedPuzzle.initialState.map(row => [...row]));
    setMoveCount(0);
    setStartTime(Date.now());
    setClearTime(null);
  };

  if (!selectedPuzzle || !selectedPuzzle.size || !selectedPuzzle.areas) {
    // 유효하지 않은 퍼즐일 경우 레벨 선택 화면으로 돌아감
    setScreen('level');
    return null;
  }

  const size = selectedPuzzle.size;
  const GAP = 1;
  const areaMap = Array.from({ length: size }, () => Array(size).fill(-1));
  selectedPuzzle.areas.forEach((area, areaIdx) => {
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
        <Text style={styles.levelTitle}>Level {selectedPuzzle.id}</Text>
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
                  {(() => {
                    const areaIdx = areaMap[rowIdx][colIdx];
                    if (areaIdx !== -1) {
                      const area = selectedPuzzle.areas[areaIdx];
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

      {false && (
        <OptionsScreen
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          bgmEnabled={bgmEnabled}
          setBgmEnabled={setBgmEnabled}
          vibrationEnabled={vibrationEnabled}
          setVibrationEnabled={setVibrationEnabled}
          onClose={() => setOptionVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}
