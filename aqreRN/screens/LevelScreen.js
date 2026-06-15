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
  const [selectedChapter, setSelectedChapter] = useState(1);
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

  const getRows = (puzzles) => {
    const rows = [];
    for (let i = 0; i < puzzles.length; i += LEVELS_PER_ROW) {
      rows.push(puzzles.slice(i, i + LEVELS_PER_ROW));
    }
    return rows;
  };

  const renderPuzzleRows = (puzzles) => {
    const rows = getRows(puzzles);
    let displayNumber = 1;
    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.row}>
        {row.map((puzzle) => {
          const cleared = clearedPuzzles.includes(puzzle.id);
          const currentNumber = displayNumber++;
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
                {currentNumber}
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
    ));
  };

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

      <View style={styles.chapterContainer}>
        <View style={styles.chapterTabs}>
          <TouchableOpacity
            style={[styles.chapterTab, selectedChapter === 1 && styles.chapterTabActive]}
            onPress={() => setSelectedChapter(1)}
            activeOpacity={0.85}
          >
            <View style={[styles.tabIndicator, selectedChapter === 1 && styles.tabIndicatorActive]} />
            <Text style={[styles.chapterTabText, selectedChapter === 1 && styles.chapterTabTextActive]}>
              Chapter 1
            </Text>
            {selectedChapter === 1 && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chapterTab, selectedChapter === 2 && styles.chapterTabActive]}
            onPress={() => setSelectedChapter(2)}
            activeOpacity={0.85}
          >
            <View style={[styles.tabIndicator, selectedChapter === 2 && styles.tabIndicatorActive]} />
            <Text style={[styles.chapterTabText, selectedChapter === 2 && styles.chapterTabTextActive]}>
              Chapter 2
            </Text>
            {selectedChapter === 2 && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>
        <View style={styles.tabDivider}>
          <View style={[styles.activeDivider, selectedChapter === 1 ? styles.activeDividerLeft : styles.activeDividerRight]} />
        </View>
      </View>

      {selectedChapter === 1 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tutorial - Difficulty 0 */}
          {PUZZLE_MAPS.some(p => p.difficulty === 0) && (
            <>
              <View style={styles.difficultyHeader}>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyBadgeText}>Tutorial</Text>
                </View>
                <View style={styles.difficultyLine} />
              </View>
              {renderPuzzleRows(PUZZLE_MAPS.filter(p => p.difficulty === 0))}
            </>
          )}
          
          {/* Easy - Difficulty 1 */}
          {PUZZLE_MAPS.some(p => p.difficulty === 1) && (
            <>
              <View style={styles.difficultyHeader}>
                <View style={[styles.difficultyBadge, styles.difficultyBadge1]}>
                  <Text style={styles.difficultyBadgeText}>Easy</Text>
                </View>
                <View style={styles.difficultyLine} />
              </View>
              {renderPuzzleRows(PUZZLE_MAPS.filter(p => p.difficulty === 1))}
            </>
          )}
          
          {/* Normal - Difficulty 2 */}
          {PUZZLE_MAPS.some(p => p.difficulty === 2) && (
            <>
              <View style={styles.difficultyHeader}>
                <View style={[styles.difficultyBadge, styles.difficultyBadge2]}>
                  <Text style={styles.difficultyBadgeText}>Normal</Text>
                </View>
                <View style={styles.difficultyLine} />
              </View>
              {renderPuzzleRows(PUZZLE_MAPS.filter(p => p.difficulty === 2))}
            </>
          )}
          
          {/* Hard - Difficulty 3 */}
          {PUZZLE_MAPS.some(p => p.difficulty === 3) && (
            <>
              <View style={styles.difficultyHeader}>
                <View style={[styles.difficultyBadge, styles.difficultyBadge3]}>
                  <Text style={styles.difficultyBadgeText}>Hard</Text>
                </View>
                <View style={styles.difficultyLine} />
              </View>
              {renderPuzzleRows(PUZZLE_MAPS.filter(p => p.difficulty === 3))}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.comingSoonContainer}>
          <Ionicons name="time-outline" size={64} color="#6b7c93" />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>Chapter 2 is under development</Text>
        </View>
      )}
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
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#8e9aaf',
  },
  difficultyBadge1: {
    backgroundColor: '#4ade80',
  },
  difficultyBadge2: {
    backgroundColor: '#fb923c',
  },
  difficultyBadge3: {
    backgroundColor: '#f87171',
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  difficultyLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginLeft: 12,
    borderRadius: 1,
  },
  chapterContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
  },
  chapterTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  chapterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  chapterTabActive: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: 'rgba(59, 91, 219, 0.25)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  tabIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(90, 108, 125, 0.4)',
  },
  tabIndicatorActive: {
    backgroundColor: '#3b5bdb',
  },
  chapterTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7c8d',
    letterSpacing: 0.3,
  },
  chapterTabTextActive: {
    color: '#2c3e50',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff9800',
    marginLeft: 2,
  },
  tabDivider: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 12,
    position: 'relative',
  },
  activeDivider: {
    position: 'absolute',
    top: 0,
    height: 3,
    width: '50%',
    borderRadius: 2,
    backgroundColor: '#3b5bdb',
  },
  activeDividerLeft: {
    left: 0,
  },
  activeDividerRight: {
    right: 0,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  comingSoonText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4a5a6b',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#7a8a9b',
    marginTop: 8,
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
