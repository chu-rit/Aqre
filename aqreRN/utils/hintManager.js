import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSolutionCell } from '../src/logic/hints';
import { showToast } from '../components/Toast';
import { playTap } from '../utils/sound';
import { showTestRewardedAd } from '../utils/ads';

async function getIsEnglish() {
  try {
    const json = await AsyncStorage.getItem('options');
    const options = json ? JSON.parse(json) : {};
    return options.language === 'en';
  } catch {
    return false;
  }
}

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
  return async () => {
    if (hintPoints <= 0) {
      const isEnglish = await getIsEnglish();
      if (Platform.OS === 'web') {
        addHintPoints(2);
        showToast(isEnglish ? '2 hints have been added.' : '힌트 2개가 충전되었습니다.');
      } else {
        const adShown = showTestRewardedAd(() => {
          addHintPoints(2);
          showToast(isEnglish ? '2 hints have been added.' : '힌트 2개가 충전되었습니다.');
        });
        if (!adShown) {
          showToast(isEnglish ? 'Failed to load ad.' : '광고를 불러올 수 없습니다.');
        }
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
  return async (r, c) => {
    try {
      const correctValue = getSolutionCell(puzzleId, r, c);
      if (correctValue === null) {
        const isEnglish = await getIsEnglish();
        showToast(isEnglish ? 'Failed to load solution data.' : '해답 데이터를 불러올 수 없습니다.');
        setHintMode(false);
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
      const isEnglish = await getIsEnglish();
      showToast(isEnglish ? `Hint: Row ${r + 1}, Col ${c + 1} revealed.` : `힌트: ${r + 1}행 ${c + 1}열을 확인했습니다.`);
    } catch {
      const isEnglish = await getIsEnglish();
      showToast(isEnglish ? 'Failed to load hint.' : '힌트를 불러오지 못했습니다.');
      setHintMode(false);
    }
  };
}
