import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSolutionCell } from '../src/logic/hints';
import { showToast } from '../components/Toast';
import { playTap } from '../utils/sound';
import { showTestRewardedAd } from '../utils/ads';

export function createAddHintPoints(setHintPoints) {
  return async (amount, rewardKey) => {
    const pointsToAdd = Number(amount);
    if (!Number.isFinite(pointsToAdd) || pointsToAdd === 0) return;
    const [pointsJson, rewardsJson] = await Promise.all([
      AsyncStorage.getItem('hintPoints'),
      AsyncStorage.getItem('claimedHintRewards'),
    ]);
    const claimedRewards = JSON.parse(rewardsJson || '{}');
    const nextPoints = Math.max(0, (Number(pointsJson) || 0) + pointsToAdd);
    if (rewardKey) claimedRewards[rewardKey] = true;
    await Promise.all([
      AsyncStorage.setItem('hintPoints', String(nextPoints)),
      AsyncStorage.setItem('claimedHintRewards', JSON.stringify(claimedRewards)),
    ]);
    setHintPoints(nextPoints);
  };
}

export async function loadHintPoints(setHintPoints) {
  const points = Number(await AsyncStorage.getItem('hintPoints')) || 0;
  setHintPoints(points);
}

export function createUseHint(hintPoints, addHintPoints, setHintMode) {
  return () => {
    if (hintPoints <= 0) {
      if (Platform.OS === 'web') {
        addHintPoints(2);
        showToast('힌트 2개가 충전되었습니다.');
      } else {
        showTestRewardedAd(() => {
          addHintPoints(2);
          showToast('힌트 2개가 충전되었습니다.');
        });
      }
      return;
    }
    setHintMode(prev => !prev);
  };
}

export function createApplyHintCell(
  puzzleId,
  board,
  setBoard,
  setHintMode,
  setLockedCells,
  setMoveCount,
  addHintPoints,
  showTutorial,
  tutorialStep,
) {
  return (r, c) => {
    if (board[r][c] === 2) return;

    try {
      const correctValue = getSolutionCell(puzzleId, r, c);
      if (correctValue === null) {
        showToast('해답 데이터를 불러올 수 없습니다.');
        setHintMode(false);
        return;
      }
      if (board[r][c] === correctValue) {
        setHintMode(false);
        setLockedCells(prev => ({ ...prev, [`${r}-${c}`]: true }));
        showToast('이 셀은 이미 정답입니다.');
        return;
      }
      playTap();
      setBoard(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = correctValue;
        return next;
      });
      setMoveCount(n => n + 1);
      if (!(showTutorial && puzzleId === 26000005 && tutorialStep === 2)) {
        addHintPoints(-1);
      }
      setHintMode(false);
      setLockedCells(prev => ({ ...prev, [`${r}-${c}`]: true }));
      showToast(`힌트: ${r + 1}행 ${c + 1}열을 확인했습니다.`);
    } catch {
      showToast('힌트를 불러오지 못했습니다.');
      setHintMode(false);
    }
  };
}
