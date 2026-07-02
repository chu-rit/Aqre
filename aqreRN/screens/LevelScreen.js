import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUZZLE_MAPS } from '../src/logic/puzzles';
import TutorialScreen, { handleSkipTutorial } from '../components/TutorialScreen';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';
import { playTap } from '../utils/sound';
import { Image } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const LEVELS_PER_ROW = 5;
const PAGE_PADDING = 16 * 2;       // page horizontal padding
const CARD_PADDING = 16 * 2;       // card horizontal padding
const BTN_MARGIN = 5 * 2;
const LEVEL_BTN_SIZE = Math.min(64, Math.floor((SCREEN_WIDTH - PAGE_PADDING - CARD_PADDING - BTN_MARGIN * LEVELS_PER_ROW) / LEVELS_PER_ROW));

const SERIES_INFO = [
  { series: 0, label: 'TUTORIAL',  color: '#8e9aaf', icon: 'school-outline' },
  { series: 1, label: 'EASY',      color: '#5ba4cf', icon: 'sunny-outline' },
  { series: 2, label: 'NORMAL 1',  color: '#e8914a', icon: 'flame-outline' },
  { series: 3, label: 'NORMAL 2',  color: '#e8914a', icon: 'flame-outline' },
  { series: 4, label: 'HARD',      color: '#4a6fa5', icon: 'skull-outline' },
];

export default function LevelScreen({ onSelectPuzzle, onBack, onOptions }) {
  const [clearedPuzzles, setClearedPuzzles] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const flatListRef = useRef(null);
  const level0Steps = getTutorialStepsByLevel(0);
  const overlayAnim = useRef(new Animated.Value(1)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;

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
      } catch (e) {}
      setLoaded(true);
    };
    load();
  }, []);

  const getGroupData = useCallback(() => {
    if (selectedChapter !== 1) return [];
    const chapterPuzzles = PUZZLE_MAPS.filter(p => p.chapter === 1);
    const d0 = chapterPuzzles.filter(p => p.difficulty === 0);
    const d1 = chapterPuzzles.filter(p => p.difficulty === 1);
    const d2 = chapterPuzzles.filter(p => p.difficulty === 2);
    const d3 = chapterPuzzles.filter(p => p.difficulty === 3);
    const easyLocked = d0.length > 0 && !d0.every(p => clearedPuzzles.includes(p.id));
    const clearedEasy = d1.filter(p => clearedPuzzles.includes(p.id)).length;
    const clearedNormal = d2.filter(p => clearedPuzzles.includes(p.id)).length;
    const normalLocked = easyLocked || clearedEasy < 10;
    const clearedNormal1 = chapterPuzzles.filter(p => p.series === 2 && clearedPuzzles.includes(p.id)).length;
    const normal2Locked = normalLocked || clearedNormal1 < 5;
    const hardLocked = normalLocked || clearedNormal < 10;

    const lockMap = {
      0: false,
      1: easyLocked,
      2: normalLocked,
      3: normal2Locked,
      4: hardLocked,
    };
    const unlockHints = {
      1: '튜토리얼을 완료하면 잠금 해제됩니다.',
      2: 'EASY 퍼즐을 10개 이상 클리어하면 잠금 해제됩니다.',
      3: 'NORMAL 1 퍼즐을 5개 이상 클리어하면 잠금 해제됩니다.',
      4: 'NORMAL 퍼즐을 10개 이상 클리어하면 잠금 해제됩니다.',
    };

    const seriesNumbers = [...new Set(chapterPuzzles.map(p => p.series))].sort((a, b) => a - b);

    const allGroups = seriesNumbers.map(s => {
      const info = SERIES_INFO.find(si => si.series === s) || { label: `SERIES ${s}`, color: '#888', icon: 'puzzle' };
      const puzzles = chapterPuzzles.filter(p => p.series === s);
      const locked = lockMap[s] || false;
      const unlockHint = locked ? (unlockHints[s] || null) : null;
      return {
        key: `series_${s}`,
        label: info.label,
        color: info.color,
        icon: info.icon,
        series: s,
        diff: puzzles[0]?.difficulty ?? 0,
        puzzles,
        locked,
        unlockHint,
      };
    });

    const firstLockedIndex = allGroups.findIndex(g => g.locked);
    if (firstLockedIndex === -1) return allGroups;
    return allGroups.slice(0, firstLockedIndex + 1);
  }, [selectedChapter, clearedPuzzles]);

  const groupData = loaded ? getGroupData() : [];

  const handlePageChange = useCallback((index) => {
    if (index < 0 || index >= groupData.length) return;
    setCurrentPage(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, [groupData.length]);

  const onScroll = useCallback((e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    if (index !== currentPage && index >= 0 && index < groupData.length) {
      setCurrentPage(index);
    }
  }, [currentPage, groupData.length]);

  const getRows = (puzzles) => {
    const rows = [];
    for (let i = 0; i < puzzles.length; i += LEVELS_PER_ROW) {
      rows.push(puzzles.slice(i, i + LEVELS_PER_ROW));
    }
    return rows;
  };

  const renderPuzzleGrid = (puzzles) => {
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
                playTap();
                if (showTutorial) {
                  const json = await AsyncStorage.getItem('completedTutorials') || '{}';
                  const c = JSON.parse(json);
                  c['level0'] = true;
                  await AsyncStorage.setItem('completedTutorials', JSON.stringify(c));
                  setShowTutorial(false);
                }
                onSelectPuzzle(puzzle);
              }}
              onLongPress={async () => {
                playTap();
                const json = await AsyncStorage.getItem('clearedPuzzles') || '[]';
                const list = JSON.parse(json);
                const updated = list.includes(puzzle.id)
                  ? list.filter(id => id !== puzzle.id)
                  : [...list, puzzle.id];
                await AsyncStorage.setItem('clearedPuzzles', JSON.stringify(updated));
                setClearedPuzzles(updated);
              }}
              delayLongPress={800}
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

  const renderPage = ({ item, index }) => {
    const clearedCount = item.puzzles.filter(p => clearedPuzzles.includes(p.id)).length;
    const totalCount = item.puzzles.length;

    return (
      <View style={[styles.page, { height: listHeight }]}>
        <View style={styles.card}>
          {item.locked ? (
            <View style={styles.lockedPage}>
              <View style={styles.pageHeader}>
                <View style={[styles.pageBadge, { backgroundColor: item.color }]}>
                  <Text style={styles.pageBadgeText}>{item.label}</Text>
                </View>
              </View>
              <Ionicons name="lock-closed" size={56} color="#9aa5b0" />
              <Text style={styles.unlockHintText}>{item.unlockHint}</Text>
            </View>
          ) : (
            <>
              <View style={styles.cardImageSection}>
                {item.series === 0 ? (
                  <Image
                    source={require('../assets/GRP1.png')}
                    style={styles.groupImage}
                    resizeMode="cover"
                  />
                ) : item.series === 1 ? (
                  <Image
                    source={require('../assets/GRP2.png')}
                    style={styles.groupImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.groupImagePlaceholder, { backgroundColor: item.color + '18' }]}>
                    <View style={[styles.placeholderIconCircle, { backgroundColor: item.color + '25' }]}>
                      <Ionicons name={item.icon} size={40} color={item.color} />
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.cardContentSection}>
                <View style={styles.pageHeader}>
                  <View style={[styles.pageBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.pageBadgeText}>{item.label}</Text>
                  </View>
                  <Text style={styles.pageProgress}>
                    {clearedCount} / {totalCount}
                  </Text>
                </View>
                <View style={styles.gridContent}>
                  {renderPuzzleGrid(item.puzzles)}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderPageIndicator = () => {
    if (groupData.length <= 1) return null;
    return (
      <View style={styles.indicatorBar}>
        {groupData.map((g, i) => (
          <TouchableOpacity
            key={g.key}
            style={styles.indicatorDotWrap}
            onPress={() => { playTap(); handlePageChange(i); }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.indicatorDot,
                i === currentPage && styles.indicatorDotActive,
                { backgroundColor: i === currentPage ? g.color : '#c5cdd6' },
              ]}
            />
            {i === currentPage && (
              <Text style={[styles.indicatorLabel, { color: g.color }]}>{g.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => { playTap(); onBack(); }} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Level Select</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => { playTap(); onOptions(); }} activeOpacity={0.7}>
          <Ionicons name="options" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      {selectedChapter === 1 ? (
        loaded && groupData.length > 0 ? (
          <>
            {renderPageIndicator()}
            <FlatList
              ref={flatListRef}
              data={groupData}
              renderItem={renderPage}
              keyExtractor={(item) => item.key}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onScrollToIndexFailed={() => {}}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              style={{ flex: 1 }}
              onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
            />
          </>
        ) : (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonSubtext}>로딩 중...</Text>
          </View>
        )
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
              playTap();
              const json = await AsyncStorage.getItem('completedTutorials') || '{}';
              const completed = JSON.parse(json);
              completed['level0'] = true;
              await AsyncStorage.setItem('completedTutorials', JSON.stringify(completed));
              setShowTutorial(false);
            }}
            onSkip={() => { playTap(); setShowTutorial(false); }}
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
  // 페이지
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 4,
  },
  groupImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  groupImagePlaceholder: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageSection: {
    aspectRatio: 1.5,
    overflow: 'hidden',
    marginTop: 10,
    marginHorizontal: 10,
  },
  cardContentSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  placeholderIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 6,
  },
  pageBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  pageProgress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8a9aaa',
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    justifyContent: 'flex-start',
  },
  lockedPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  unlockHintText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9aa5b0',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 인디케이터
  indicatorBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 16,
    gap: 20,
  },
  indicatorDotWrap: {
    alignItems: 'center',
    gap: 5,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#c5cdd6',
  },
  indicatorDotActive: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  indicatorLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // 퍼즐 그리드
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  levelButton: {
    width: LEVEL_BTN_SIZE,
    height: LEVEL_BTN_SIZE,
    borderRadius: Math.round(LEVEL_BTN_SIZE * 0.32),
    backgroundColor: '#e8eef5',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderWidth: 1.5,
    borderColor: '#d0dae6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  clearedButton: {
    backgroundColor: '#d4e6f4',
    borderColor: '#b8d0e8',
  },
  levelText: {
    fontSize: Math.round(LEVEL_BTN_SIZE * 0.36),
    color: '#5a7a9a',
    fontWeight: '800',
  },
  clearedText: {
    color: '#2a5a8a',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#a8c8e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
      android: { elevation: 3 },
    }),
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
});
