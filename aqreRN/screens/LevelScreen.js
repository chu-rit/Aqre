import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import TutorialScreen, { handleSkipTutorial } from '../components/TutorialScreen';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';

const LEVELS_PER_ROW = 5;

export default function LevelScreen({ onSelectPuzzle, onBack, onOptions }) {
  const [clearedPuzzles, setClearedPuzzles] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const level0Steps = getTutorialStepsByLevel(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem('clearedPuzzles');
        if (data) setClearedPuzzles(JSON.parse(data));
        const completed = await AsyncStorage.getItem('completedTutorials');
        const parsed = completed ? JSON.parse(completed) : {};
        const cleared = data ? JSON.parse(data) : [];
        const alreadyPlayed = parsed['level0'] || cleared.length > 0;
        if (!alreadyPlayed && level0Steps.length > 0) {
          setShowTutorial(true);
        }
      } catch (e) {}
    };
    load();
  }, []);

  const rows = [];
  for (let i = 0; i < PUZZLE_MAPS.length; i += LEVELS_PER_ROW) {
    rows.push(PUZZLE_MAPS.slice(i, i + LEVELS_PER_ROW));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Level Select</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onOptions} activeOpacity={0.7}>
          <Ionicons name="options" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((puzzle) => {
              const cleared = clearedPuzzles.includes(puzzle.id);
              return (
                <TouchableOpacity
                  key={puzzle.id}
                  testID={`level-${puzzle.id}`}
                  style={[styles.levelButton, cleared && styles.clearedButton]}
                  onPress={async () => {
                    if (showTutorial) {
                      const json = await AsyncStorage.getItem('completedTutorials') || '{}';
                      const c = JSON.parse(json);
                      c['level0'] = true;
                      await AsyncStorage.setItem('completedTutorials', JSON.stringify(c));
                      setShowTutorial(false);
                    }
                    onSelectPuzzle(puzzle);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.levelText, cleared && styles.clearedText]}>
                    {puzzle.id}
                  </Text>
                  {cleared && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
      {showTutorial && (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <TutorialScreen
            isVisible={showTutorial}
            onClose={async () => {
              const json = await AsyncStorage.getItem('completedTutorials') || '{}';
              const completed = JSON.parse(json);
              completed['level0'] = true;
              await AsyncStorage.setItem('completedTutorials', JSON.stringify(completed));
              setShowTutorial(false);
            }}
            onSkip={() => handleSkipTutorial(0, () => setShowTutorial(false))}
            levelId={0}
            steps={level0Steps}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a4c8e0',
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  row: {
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
  clearedButton: {
    backgroundColor: '#d4eaff',
  },
  levelText: {
    fontSize: 20,
    color: '#3a3a3a',
    fontWeight: 'bold',
  },
  clearedText: {
    color: '#3b5bdb',
  },
  checkmark: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: '#ff9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 2 },
      android: { elevation: 3 },
    }),
  },
});
