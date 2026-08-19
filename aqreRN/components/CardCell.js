import React, { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const COLORS = {
  empty: '#f8f9fb',
  filled: '#3a6b9c',
  fixed: '#34495e',
};
const LOCK_HOLD_DURATION = 1000;
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

const getCellColor = cell => cell === 0 ? COLORS.empty : cell === 1 ? COLORS.filled : COLORS.fixed;

const CardCell = React.memo(function CardCell({
  rowIdx,
  colIdx,
  cell,
  previousCell = cell,
  size,
  cellSize,
  areaMap,
  areaFilledCount,
  isViolation,
  onPress,
  onTapStart,
  onLongPress,
  isLocked = false,
  clearPending = false,
  puzzle,
  cellRef,
  dotResetKey,
  hintMode = false,
  clearEffectVisible = false,
  clearEffectIndex,
  clearWaveAnim,
}) {
  const progress = useSharedValue(0);
  const [frontCell, setFrontCell] = useState(cell);
  const [backCell, setBackCell] = useState(cell === 0 ? 1 : 0);
  const isFlippingRef = useRef(false);
  const hasFlippedRef = useRef(false);
  const dotAnim = useRef(new RNAnimated.Value(0)).current;
  const lockAnim = useRef(new RNAnimated.Value(0)).current;
  const holdAnim = useRef(new RNAnimated.Value(0)).current;
  const holdGaugeTimer = useRef(null);
  const loopRef = useRef(null);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    if (isFlippingRef.current || hasFlippedRef.current) return;
    if (previousCell !== cell) {
      setFrontCell(cell);
      setBackCell(cell === 0 ? 1 : 0);
    }
  }, [cell, previousCell]);

  useEffect(() => {
    RNAnimated.timing(lockAnim, { toValue: isLocked ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [isLocked, lockAnim]);

  useEffect(() => {
    dotAnim.stopAnimation();
    dotAnim.setValue(0);
    if (loopRef.current) { loopRef.current.stop(); loopRef.current = null; }
    if (!isViolation) return undefined;
    const loop = RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(dotAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
      RNAnimated.timing(dotAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
    ]));
    loopRef.current = loop;
    loop.start();
    return () => { loop.stop(); dotAnim.stopAnimation(); loopRef.current = null; };
  }, [isViolation, dotResetKey, dotAnim]);

  useEffect(() => () => {
    if (holdGaugeTimer.current) clearTimeout(holdGaugeTimer.current);
  }, []);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ perspective: 600 }, { rotateY: `${progress.value * 90}deg` }, { scale: 1 - progress.value * 0.2 }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ perspective: 600 }, { rotateY: `${90 - progress.value * 90}deg` }, { scale: 0.8 + progress.value * 0.2 }],
  }));

  const startHoldProgress = () => {
    holdAnim.stopAnimation();
    holdAnim.setValue(0);
    if (holdGaugeTimer.current) clearTimeout(holdGaugeTimer.current);
    holdGaugeTimer.current = setTimeout(() => setIsHolding(true), 500);
    RNAnimated.timing(holdAnim, { toValue: 1, duration: LOCK_HOLD_DURATION, useNativeDriver: false }).start();
  };
  const stopHoldProgress = () => {
    if (holdGaugeTimer.current) clearTimeout(holdGaugeTimer.current);
    holdGaugeTimer.current = null;
    holdAnim.stopAnimation();
    holdAnim.setValue(0);
    setIsHolding(false);
  };

  const areaIdx = areaMap[rowIdx][colIdx];
  const showLabel = areaIdx !== -1 && puzzle.areas[areaIdx].required !== 'J'
    && puzzle.areas[areaIdx].cells[0][0] === rowIdx && puzzle.areas[areaIdx].cells[0][1] === colIdx;
  const areaSatisfied = showLabel && areaFilledCount === Number(puzzle.areas[areaIdx].required);
  const clearInput = clearEffectVisible || clearPending;
  const handleCellPress = () => {
    if (cell === 2 || isLocked || !onPress || clearInput || isFlippingRef.current) return;
    if (hasFlippedRef.current) {
      setFrontCell(cardBackCell);
      setBackCell(cardFrontCell);
    }
    isFlippingRef.current = true;
    onTapStart?.();
    progress.value = 0;
    progress.value = withTiming(1, { duration: 300 }, finished => {
      if (finished) hasFlippedRef.current = true;
      isFlippingRef.current = false;
    });
    onPress(rowIdx, colIdx);
  };

  const dotBaseSize = Math.max(8, Math.round(cellSize * 0.18));
  const dotSize = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [dotBaseSize, dotBaseSize * 1.75] });
  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const clearCellOpacity = !clearEffectVisible || clearEffectIndex == null || !clearWaveAnim ? null : clearWaveAnim.interpolate({
    inputRange: [clearEffectIndex, clearEffectIndex + 1, clearEffectIndex + 2], outputRange: [0, 1, 0], extrapolate: 'clamp',
  });
  const clearFlipScale = !clearEffectVisible || clearEffectIndex == null || !clearWaveAnim ? 1 : clearWaveAnim.interpolate({
    inputRange: [clearEffectIndex, clearEffectIndex + 0.5, clearEffectIndex + 1, clearEffectIndex + 2], outputRange: [1, 1.5, 1.5, 1], extrapolate: 'clamp',
  });
  const clearFrontRotation = !clearEffectVisible || clearEffectIndex == null || !clearWaveAnim ? '0deg' : clearWaveAnim.interpolate({
    inputRange: [clearEffectIndex, clearEffectIndex + 1, clearEffectIndex + 2], outputRange: ['0deg', '180deg', '360deg'], extrapolate: 'clamp',
  });
  const clearBackRotation = !clearEffectVisible || clearEffectIndex == null || !clearWaveAnim ? '180deg' : clearWaveAnim.interpolate({
    inputRange: [clearEffectIndex, clearEffectIndex + 1, clearEffectIndex + 2], outputRange: ['180deg', '360deg', '540deg'], extrapolate: 'clamp',
  });

  const content = (
    <>
      {isHolding && <Svg pointerEvents="none" width={Math.round(cellSize * 0.72)} height={Math.round(cellSize * 0.72)} style={styles.holdGauge}>
        <Circle cx={Math.round(cellSize * 0.36)} cy={Math.round(cellSize * 0.36)} r={Math.round(cellSize * 0.29)} stroke="rgba(30, 58, 95, 0.22)" strokeWidth={3} fill="none" />
        <AnimatedCircle cx={Math.round(cellSize * 0.36)} cy={Math.round(cellSize * 0.36)} r={Math.round(cellSize * 0.29)} stroke="#3b82c4" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * Math.round(cellSize * 0.29)} strokeDashoffset={holdAnim.interpolate({ inputRange: [0, 1], outputRange: [2 * Math.PI * Math.round(cellSize * 0.29), 0] })} rotation="-90" origin={`${Math.round(cellSize * 0.36)}, ${Math.round(cellSize * 0.36)}`} />
      </Svg>}
      {isLocked && <RNAnimated.View style={[styles.lockOverlay, { opacity: lockAnim }]}><Ionicons name="lock-closed" size={Math.round(cellSize * 0.5)} color="#1e3a5f" /></RNAnimated.View>}
      {clearCellOpacity && <RNAnimated.View pointerEvents="none" style={[styles.clearHighlight, { opacity: clearCellOpacity, transform: [{ scale: clearWaveAnim.interpolate({ inputRange: [clearEffectIndex, clearEffectIndex + 1, clearEffectIndex + 2], outputRange: [0.96, 1.05, 0.98], extrapolate: 'clamp' }) }] }]} />}
      {isViolation && <RNAnimated.View style={[styles.violationDot, { transform: [{ translateX: dotSize.interpolate({ inputRange: [dotBaseSize, dotBaseSize * 1.75], outputRange: [-dotBaseSize / 2, -dotBaseSize * 0.875] }) }, { translateY: dotSize.interpolate({ inputRange: [dotBaseSize, dotBaseSize * 1.75], outputRange: [-dotBaseSize / 2, -dotBaseSize * 0.875] }) }], width: dotSize, height: dotSize, borderRadius: dotSize.interpolate({ inputRange: [dotBaseSize, dotBaseSize * 1.75], outputRange: [dotBaseSize / 2, dotBaseSize * 0.875] }), opacity: dotOpacity }]} />}
      {hintMode && cell !== 2 && <View pointerEvents="none" style={styles.hintOutline} />}
    </>
  );

  return <View style={styles.card}>
    {clearEffectVisible ? <>
      <RNAnimated.View pointerEvents="none" style={[styles.face, { backgroundColor: getCellColor(cell) }, { transform: [{ perspective: 600 }, { scale: clearFlipScale }, { rotateY: clearFrontRotation }] }]}>{content}</RNAnimated.View>
      <RNAnimated.View pointerEvents="none" style={[styles.face, styles.clearFace, { transform: [{ perspective: 600 }, { scale: clearFlipScale }, { rotateY: clearBackRotation }] }]}><Ionicons name="checkmark" size={Math.round(cellSize * 0.42)} color="#fff7cc" /></RNAnimated.View>
    </> : <>
      <Reanimated.View pointerEvents="none" style={[styles.face, { backgroundColor: getCellColor(frontCell) }, frontStyle]} />
      <Reanimated.View pointerEvents="none" style={[styles.face, { backgroundColor: getCellColor(cell) }, backStyle]} />
      <TouchableOpacity ref={cellRef} style={styles.touchTarget} disabled={cell === 2 || clearInput} onPress={isLocked ? undefined : handleCellPress} onPressIn={hintMode ? undefined : startHoldProgress} onPressOut={hintMode ? undefined : stopHoldProgress} onLongPress={onLongPress ? () => onLongPress(rowIdx, colIdx) : undefined} delayLongPress={LOCK_HOLD_DURATION} activeOpacity={0.7}>{content}</TouchableOpacity>
    </>}
    {showLabel && <View pointerEvents="none" testID={`area-${rowIdx}-${colIdx}`} style={styles.areaLabel}><Text style={[styles.areaLabelText, { fontSize: Math.min(Math.round(cellSize * 0.4), 24), textShadowColor: areaSatisfied ? '#10b981' : '#fff', textShadowRadius: areaSatisfied ? 4 : 3 }]}>{puzzle.areas[areaIdx]?.required}</Text></View>}
    {clearEffectVisible && <TouchableOpacity ref={cellRef} style={styles.touchTarget} disabled onPress={handleCellPress} />}
  </View>;
});

export default CardCell;

const styles = StyleSheet.create({
  card: { width: '100%', height: '100%', position: 'relative' },
  face: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 4, backfaceVisibility: 'hidden' },
  clearFace: { backgroundColor: '#ffd34e', justifyContent: 'center', alignItems: 'center' },
  touchTarget: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'transparent', zIndex: 40 },
  holdGauge: { position: 'absolute', alignSelf: 'center', top: 0, zIndex: 15 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  clearHighlight: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 5, borderWidth: 3, borderColor: '#ffd34e', backgroundColor: 'rgba(255,211,78,0.16)', zIndex: 25 },
  violationDot: { position: 'absolute', top: '50%', left: '50%', backgroundColor: 'rgba(46,204,113,1)' },
  hintOutline: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255, 215, 0, 0.7)', zIndex: 5 },
  areaLabel: { position: 'absolute', left: 2, top: 2, zIndex: 30, justifyContent: 'center', alignItems: 'center' },
  areaLabelText: { color: '#1e3a5f', fontWeight: 'bold' },
});
