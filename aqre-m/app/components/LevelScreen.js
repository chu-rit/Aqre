import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUZZLE_MAPS } from '../../src/logic/puzzles';
import { tutorialSteps } from '../../src/logic/tutorialSteps';
import TutorialScreen from '../tutorial';
import { styles } from '../styles';

export default function LevelScreen({ soundEnabled, tapSound, vibrationEnabled, bgmEnabled, bgmPlay, setCurrentScreen, onSelectPuzzle }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [clearedPuzzles, setClearedPuzzles] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // 클리어한 퍼즐 로드
  const loadClearedPuzzles = async () => {
    try {
      const clearedPuzzlesData = await AsyncStorage.getItem('clearedPuzzles');
      if (clearedPuzzlesData) {
        setClearedPuzzles(JSON.parse(clearedPuzzlesData));
      }
      return clearedPuzzlesData ? JSON.parse(clearedPuzzlesData) : [];
    } catch (error) {
      console.error('클리어한 퍼즐 로드 실패:', error);
      return [];
    }
  };

  useEffect(() => {
    const checkTutorial = async () => {
      const cleared = await loadClearedPuzzles();
      
      // 클리어한 레벨이 없으면 항상 튜토리얼 표시
      if (cleared.length === 0) {
        // 클리어한 레벨이 없어 튜토리얼 표시
        setShowTutorial(true);
      } else {
        setShowTutorial(false);
      }
      
      setInitialLoad(false);
    };
    
    checkTutorial();
  }, []);
  
  // 화면에 포커스가 올 때마다 체크
  useFocusEffect(
    useCallback(() => {
      const checkOnFocus = async () => {
        const cleared = await loadClearedPuzzles();
        if (cleared.length === 0) {
          setShowTutorial(true);
        } else {
          setShowTutorial(false);
        }
      };
      
      checkOnFocus();
    }, [])
  );
  
  // showTutorial 상태는 디버깅 시에만 필요하면 주석 처리
  // console.log('showTutorial 상태:', showTutorial);
  
  // 튜토리얼 완료 처리
  const handleTutorialComplete = async () => {
    await AsyncStorage.setItem('tutorialCompleted', 'true');
    setShowTutorial(false);
  };
  
  // 튜토리얼 스킵 처리
  const handleSkipTutorial = async () => {
    await AsyncStorage.setItem('tutorialSkipped', 'true');
    setShowTutorial(false);
  };

  // 레벨 선택 처리
  const handleLevelSelect = async (puzzle) => {
    if (bgmEnabled && Platform.OS === 'web') {
      bgmPlay();
    }
    onSelectPuzzle(puzzle);
  };

  // 뒤로 가기 처리
  const handleBack = async () => {
    if (tapSound?.current) {
      try {
        if (soundEnabled) {
          await tapSound.current.replayAsync();
        }
        if (vibrationEnabled && Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        console.error('사운드 재생 오류:', e);
      }
    }
    
    if (bgmEnabled && Platform.OS === 'web') {
      bgmPlay();
    }
    setCurrentScreen('start');
  };

  // 옵션 버튼 처리
  const handleOptionsPress = async () => {
    if (tapSound?.current) {
      try {
        if (soundEnabled) {
          await tapSound.current.replayAsync();
        }
        if (vibrationEnabled && Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        console.error('사운드 재생 오류:', e);
      }
    }
    
    setCurrentScreen('options');
  };

  if (initialLoad) {
    return null; // 초기 로딩 중에는 아무것도 표시하지 않음
  }

  // 레벨 목록 rows 생성
  const levelsPerRow = 5;
  const rows = [];
  for (let i = 0; i < PUZZLE_MAPS.length; i += levelsPerRow) {
    rows.push(PUZZLE_MAPS.slice(i, i + levelsPerRow));
  }

  return (
    <SafeAreaView style={styles.levelScreen}>
      <View style={localStyles.header}>
        <TouchableOpacity style={localStyles.side} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={localStyles.center}>
          <Text style={localStyles.title}>Level Select</Text>
        </View>
        <TouchableOpacity 
          onPress={handleOptionsPress}
          style={localStyles.optionButton}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.levelContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.levelRow}>
            {row.map((puzzle) => (
              <TouchableOpacity
                key={puzzle.id}
                style={[
                  styles.levelButton,
                  clearedPuzzles.includes(puzzle.id) && styles.clearedLevelButton
                ]}
                onPress={() => handleLevelSelect(puzzle)}
                activeOpacity={0.7}
                testID={`level-${puzzle.id}`}
              >
                <Text style={styles.levelButtonText}>{puzzle.id}</Text>
                {clearedPuzzles.includes(puzzle.id) && (
                  <View style={styles.clearedCheckmark}>
                    <Ionicons name="checkmark" size={24} color="rgba(0, 200, 0, 0.8)" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* 튜토리얼 화면 */}
      {showTutorial && (
        <TutorialScreen
          isVisible={showTutorial}
          onClose={handleTutorialComplete}
          onSkip={handleSkipTutorial}
          levelId="level0"
          steps={tutorialSteps}
        />
      )}
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  side: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  optionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearedLevelButton: {
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.8)'
  },
  clearedCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
});
