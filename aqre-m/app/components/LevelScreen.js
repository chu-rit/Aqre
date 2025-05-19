import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUZZLE_MAPS } from '../../src/logic/puzzles';
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
        console.log('클리어한 레벨이 없어 튜토리얼 표시');
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
        console.log('화면 포커스 이벤트 발생');
        const cleared = await loadClearedPuzzles();
        console.log('클리어한 레벨:', cleared);
        if (cleared.length === 0) {
          console.log('클리어한 레벨이 없어 튜토리얼을 표시합니다.');
          setShowTutorial(true);
        } else {
          console.log('클리어한 레벨이 있어 튜토리얼을 표시하지 않습니다.');
          setShowTutorial(false);
        }
      };
      
      checkOnFocus();
    }, [])
  );
  
  console.log('showTutorial 상태:', showTutorial);
  
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.side} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.title}>레벨 선택</Text>
        </View>
        <TouchableOpacity 
          onPress={handleOptionsPress}
          style={styles.optionButton}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={28} color="#4c6ef5" />
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
          steps={[
            { text: '안녕하세요! AQRE 게임에 오신 것을 환영합니다!' },
            { text: '이 게임은 퍼즐을 풀면서 재미있게 즐길 수 있는 게임이에요.' },
            { text: '지금부터 게임 방법을 알려드릴게요!' }
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  clearedLevelButton: {
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.8)'
  },
  clearedCheckmark: {
    position: 'absolute',
    right: 5,
    bottom: 5
  }
});
