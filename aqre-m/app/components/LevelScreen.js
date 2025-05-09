import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { styles } from '../styles';


import AsyncStorage from '@react-native-async-storage/async-storage';

import { PUZZLE_MAPS } from '../../src/logic/puzzles';

export default function LevelScreen({ soundEnabled, tapSound, vibrationEnabled, bgmEnabled, bgmPlay, setScreen, onSelectPuzzle }) {
  const [clearedPuzzles, setClearedPuzzles] = React.useState([]);

  // 클리어된 퍼즐 저장
  const saveClearedPuzzles = async (puzzles) => {
    try {
      await AsyncStorage.setItem('clearedPuzzles', JSON.stringify(puzzles));
    } catch (e) {}
  };

  // 클리어된 퍼즐 불러오기
  const loadClearedPuzzles = async () => {
    try {
      const puzzlesJson = await AsyncStorage.getItem('clearedPuzzles');
      if (puzzlesJson) {
        const parsedPuzzles = JSON.parse(puzzlesJson);
        setClearedPuzzles(parsedPuzzles);
        console.log('[LevelScreen] clearedPuzzles:', parsedPuzzles);
      } else {
        setClearedPuzzles([]);
        console.log('[LevelScreen] clearedPuzzles: [] (스토리지 없음)');
      }
    } catch (e) {
      setClearedPuzzles([]);
      console.log('[LevelScreen] clearedPuzzles: [] (에러)', e);
    }
  };

  React.useEffect(() => {
    loadClearedPuzzles();
  }, []);

  // 레벨 목록 rows 생성
  const levelsPerRow = 5;
  const rows = [];
  for (let i = 0; i < PUZZLE_MAPS.length; i += levelsPerRow) {
    rows.push(PUZZLE_MAPS.slice(i, i + levelsPerRow));
  }

  return (
    <SafeAreaView style={styles.levelScreen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.side} onPress={async () => {
          if (tapSound.current) {
            try {
              if (soundEnabled) {
                await tapSound.current.replayAsync();
              }
              if (vibrationEnabled && Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } catch (e) {}
          }
          if (bgmEnabled && Platform.OS === 'web') {
            bgmPlay();
          }
          setScreen('start');
        }}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.title}>Level Select</Text>
        </View>
        <TouchableOpacity style={styles.side} onPress={() => setScreen('options')}>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.levelContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.levelGrid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.levelRow}>
              {row.map((puzzle) => (
                <TouchableOpacity
                  key={puzzle.id}
                  style={[
                    styles.levelButton,
                    clearedPuzzles.includes(puzzle.id) && { 
                      borderWidth: 3,
                      borderColor: 'rgba(76, 175, 80, 0.8)'
                    }
                  ]}
                  onPress={() => {
                    if (bgmEnabled && Platform.OS === 'web') {
                      bgmPlay();
                    }
                    onSelectPuzzle(puzzle);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <Text style={styles.levelButtonText}>{puzzle.id}</Text>
                    {clearedPuzzles.includes(puzzle.id) && (
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{
                          color: 'rgba(0, 200, 0, 0.5)',
                          fontSize: 24,
                          fontWeight: 'bold'
                        }}>✓</Text>
                      </View>
                    )}
                  </View>
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
