import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LevelScreen from '../screens/LevelScreen';
import GameScreen from '../screens/GameScreen';
import { showPuzzleSelectInterstitial } from '../utils/ads';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TransitionHost({ onBackToStart, onChangeBgm }) {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [levelRefreshKey, setLevelRefreshKey] = useState(0);
  const transitionProgress = useSharedValue(0);
  const openingPuzzleRef = useRef(false);

  const finishOpening = () => {
    openingPuzzleRef.current = false;
  };

  const finishClosing = () => {
    setLevelRefreshKey(k => k + 1);
    setSelectedPuzzle(null);
  };

  useEffect(() => {
    if (!selectedPuzzle) return undefined;
    transitionProgress.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    }, finished => {
      if (finished) runOnJS(finishOpening)();
    });
    return () => cancelAnimation(transitionProgress);
  }, [selectedPuzzle, transitionProgress]);

  const openGame = (puzzle) => {
    if (openingPuzzleRef.current) return;
    openingPuzzleRef.current = true;
    transitionProgress.value = 0;
    setSelectedPuzzle(puzzle);
  };

  const closeGame = () => {
    openingPuzzleRef.current = false;
    transitionProgress.value = withTiming(0, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    }, finished => {
      if (finished) runOnJS(finishClosing)();
    });
  };

  const levelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SCREEN_WIDTH * transitionProgress.value }],
  }));
  const gameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: SCREEN_WIDTH * (1 - transitionProgress.value) }],
  }));

  return (
    <View style={styles.viewport}>
      <Animated.View style={[styles.transitionLayer, levelAnimatedStyle]}>
        <LevelScreen
          refreshKey={levelRefreshKey}
          onSelectPuzzle={(puzzle) => showPuzzleSelectInterstitial(() => openGame(puzzle))}
          onBack={onBackToStart}
          onChangeBgm={onChangeBgm}
        />
      </Animated.View>
      <Animated.View style={[styles.transitionLayer, gameAnimatedStyle]}>
        {selectedPuzzle ? (
          <GameScreen
            puzzle={selectedPuzzle}
            onBack={closeGame}
            onChangeBgm={onChangeBgm}
            onResetData={() => {
              setSelectedPuzzle(null);
              onBackToStart();
            }}
            isActive={!!selectedPuzzle}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  transitionLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
});
