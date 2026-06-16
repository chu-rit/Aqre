import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import TutorialScreen, { handleSkipTutorial } from '../components/TutorialScreen';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';

const LEVELS_PER_ROW = 5;

function CollapsibleSection({ label, badgeStyle, children, collapsed, onToggle }) {
  const animHeight = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const measuredHeight = useRef(0);
  const [ready, setReady] = useState(false);
  const collapsedRef = useRef(collapsed);

  useEffect(() => {
    if (!ready) return;
    Animated.timing(animHeight, {
      toValue: collapsed ? 0 : 1,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [collapsed, ready]);

  const heightStyle = ready
    ? { height: animHeight.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight.current] }) }
    : (collapsedRef.current ? { height: 0 } : {});

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.sectionBadge, badgeStyle]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <Text style={styles.sectionBadgeText} numberOfLines={1}>{label}</Text>
        <Ionicons
          name={collapsed ? 'chevron-forward' : 'chevron-down'}
          size={12}
          color="rgba(255,255,255,0.85)"
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>
      <Animated.View style={[styles.sectionCardWrapper, heightStyle]}>
        <View
          style={styles.sectionCard}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && measuredHeight.current === 0) {
              measuredHeight.current = h;
              animHeight.setValue(collapsedRef.current ? 0 : 1);
              setReady(true);
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

export default function LevelScreen({ onSelectPuzzle, onBack, onOptions }) {
  const [clearedPuzzles, setClearedPuzzles] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [loaded, setLoaded] = useState(false);

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const level0Steps = getTutorialStepsByLevel(0);
  const overlayAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem('clearedPuzzles');
        if (data) setClearedPuzzles(JSON.parse(data));
        const cleared = data ? JSON.parse(data) : [];
        const alreadyPlayed = cleared.length > 0;
        if (!alreadyPlayed && level0Steps.length > 0) {
          setShowTutorial(true);
        }
        const sectionMap = { TUTORIAL: 0, EASY: 1, NORMAL: 2 };
        const updates = {};
        for (const [label, diff] of Object.entries(sectionMap)) {
          const puzzles = PUZZLE_MAPS.filter(p => p.chapter === 1 && p.difficulty === diff);
          if (puzzles.length > 0 && puzzles.every(p => cleared.includes(p.id))) {
            updates[label] = true;
          }
        }
        setCollapsedSections(prev => ({ ...prev, ...updates }));
      } catch (e) {}
      setLoaded(true);
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
    let idx = 0;
    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.row}>
        {row.map((puzzle) => {
          const cleared = clearedPuzzles.includes(puzzle.id);
          const currentNumber = idx + 1;
          idx++;
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
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const renderSection = (label, badgeStyle, puzzles, sectionLocked = false, unlockHint = null) => {
    const collapsed = collapsedSections[label] ?? false;
    return (
      <CollapsibleSection
        key={label}
        label={label}
        badgeStyle={badgeStyle}
        collapsed={collapsed}
        onToggle={() => toggleSection(label)}
      >
        {sectionLocked ? (
          <View style={[styles.lockedSection, !unlockHint && styles.lockedSectionCompact]}>
            <Ionicons name="lock-closed" size={36} color="#9aa5b0" />
            {unlockHint && <Text style={styles.unlockHint}>{unlockHint}</Text>}
          </View>
        ) : (
          renderPuzzleRows(puzzles)
        )}
      </CollapsibleSection>
    );
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
          {loaded && (() => {
            const d0 = PUZZLE_MAPS.filter(p => p.chapter === 1 && p.difficulty === 0);
            const d1 = PUZZLE_MAPS.filter(p => p.chapter === 1 && p.difficulty === 1);
            const d2 = PUZZLE_MAPS.filter(p => p.chapter === 1 && p.difficulty === 2);
            const d3 = PUZZLE_MAPS.filter(p => p.chapter === 1 && p.difficulty === 3);
            const easyLocked = !d0.every(p => clearedPuzzles.includes(p.id));
            const normalLocked = easyLocked || !d1.every(p => clearedPuzzles.includes(p.id));
            const hardLocked = normalLocked || !d2.every(p => clearedPuzzles.includes(p.id));
            return (
              <>
                {d0.length > 0 && renderSection('TUTORIAL', styles.badgeTutorial, d0)}
                {d1.length > 0 && renderSection('EASY', styles.badgeEasy, d1, easyLocked, easyLocked ? '튜토리얼을 완료하면 잠금 해제됩니다.' : null)}
                {d2.length > 0 && renderSection('NORMAL', styles.badgeNormal, d2, normalLocked, normalLocked && !easyLocked ? 'EASY 퍼즐을 10개 이상 클리어하면 잠금 해제됩니다.' : null)}
                {d3.length > 0 && renderSection('HARD', styles.badgeHard, d3, true, hardLocked && !normalLocked ? 'NORMAL 퍼즐을 10개 이상 클리어하면 잠금 해제됩니다.' : null)}
              </>
            );
          })()}
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
            onSkip={() => setShowTutorial(false)}
            levelId={0}
            steps={level0Steps}
          />
        </View>
      )}
      <Animated.View
        pointerEvents="none"
        style={[styles.fadeOverlay, { opacity: overlayAnim }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dde4ed',
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2c3e50',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: -1,
    marginLeft: 12,
    zIndex: 1,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  badgeTutorial: { backgroundColor: '#8e9aaf' },
  badgeEasy:    { backgroundColor: '#5ba4cf' },
  badgeNormal:  { backgroundColor: '#e8914a' },
  badgeHard:    { backgroundColor: '#4a6fa5' },
  sectionCardWrapper: {
    overflow: 'hidden',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
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
    backgroundColor: 'rgba(255,255,255,0.35)',
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
  activeDividerLeft: { left: 0 },
  activeDividerRight: { right: 0 },
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
    marginBottom: 10,
  },
  levelButton: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#c8d8e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  clearedButton: {
    backgroundColor: '#90b4d0',
  },
  lockedButton: {
    backgroundColor: '#b0bcc8',
  },
  lockedSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  lockedSectionCompact: {
    paddingVertical: 10,
  },
  unlockHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#9aa5b0',
    fontWeight: '500',
  },
  levelText: {
    fontSize: 22,
    color: '#1a3a5a',
    fontWeight: '700',
  },
  clearedText: {
    color: '#3a5a7a',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4a90d9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
      android: { elevation: 3 },
    }),
  },
});
