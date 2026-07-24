import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

const TEST_AD_UNIT_IDS = {
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  },
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  },
};

const getTestAdUnitId = (format) => TEST_AD_UNIT_IDS[format][Platform.OS];

let interstitialAd = null;
let isInterstitialLoaded = false;
let interstitialCompleteCallback = null;
let rewardedAd = null;
let isRewardedLoaded = false;
let rewardedCallback = null;

const preloadInterstitialAd = () => {
  if (Platform.OS === 'web' || interstitialAd) return;
  const ad = InterstitialAd.createForAdRequest(getTestAdUnitId('interstitial'));
  interstitialAd = ad;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    isInterstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    const onComplete = interstitialCompleteCallback;
    interstitialAd = null;
    isInterstitialLoaded = false;
    interstitialCompleteCallback = null;
    onComplete?.();
    preloadInterstitialAd();
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    const onComplete = interstitialCompleteCallback;
    interstitialAd = null;
    isInterstitialLoaded = false;
    interstitialCompleteCallback = null;
    onComplete?.();
  });
  ad.load();
};

const preloadRewardedAd = () => {
  if (Platform.OS === 'web' || rewardedAd) return;
  const ad = RewardedAd.createForAdRequest(getTestAdUnitId('rewarded'));
  rewardedAd = ad;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    isRewardedLoaded = true;
  });
  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewardedCallback?.();
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    rewardedAd = null;
    isRewardedLoaded = false;
    rewardedCallback = null;
    preloadRewardedAd();
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    rewardedAd = null;
    isRewardedLoaded = false;
    rewardedCallback = null;
  });
  ad.load();
};

export const initializeAds = async () => {
  if (Platform.OS === 'web') return;
  await mobileAds().initialize();
  preloadInterstitialAd();
  preloadRewardedAd();
};

export const showTestInterstitialAd = (onComplete) => {
  if (Platform.OS === 'web') {
    onComplete?.();
    return;
  }
  if (!isInterstitialLoaded || !interstitialAd) {
    onComplete?.();
    return;
  }
  interstitialCompleteCallback = onComplete;
  interstitialAd.show();
};

export const showTestRewardedAd = (onReward) => {
  if (Platform.OS === 'web') {
    onReward?.();
    return;
  }
  if (!isRewardedLoaded || !rewardedAd) {
    onReward?.(); // 광고가 준비 안 되면 테스트용으로 즉시 보상
    return;
  }
  rewardedCallback = onReward;
  rewardedAd.show();
};
