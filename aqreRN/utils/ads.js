import { Platform } from 'react-native';

let mobileAds = null;
let AdEventType = null;
let InterstitialAd = null;
let RewardedAd = null;
let RewardedAdEventType = null;

try {
  const adsModule = require('react-native-google-mobile-ads');
  mobileAds = adsModule.default;
  AdEventType = adsModule.AdEventType;
  InterstitialAd = adsModule.InterstitialAd;
  RewardedAd = adsModule.RewardedAd;
  RewardedAdEventType = adsModule.RewardedAdEventType;
} catch (e) {
  // react-native-google-mobile-ads not available (e.g. Expo Go)
}

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

const isAdsAvailable = () => !!mobileAds;

const preloadInterstitialAd = () => {
  if (!isAdsAvailable() || interstitialAd) return;
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
  if (!isAdsAvailable() || rewardedAd) return;
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
  if (!isAdsAvailable()) return;
  await mobileAds().initialize();
  preloadInterstitialAd();
  preloadRewardedAd();
};

export const showTestInterstitialAd = (onComplete) => {
  if (!isAdsAvailable() || !isInterstitialLoaded || !interstitialAd) {
    onComplete?.();
    return;
  }
  interstitialCompleteCallback = onComplete;
  interstitialAd.show();
};

export const showTestRewardedAd = (onReward) => {
  if (!isAdsAvailable() || !isRewardedLoaded || !rewardedAd) {
    onReward?.();
    return;
  }
  rewardedCallback = onReward;
  rewardedAd.show();
};
