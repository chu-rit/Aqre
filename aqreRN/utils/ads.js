import { Platform } from 'react-native';

let MobileAds = null;
let AdEventType = null;
let InterstitialAd = null;
let RewardedAd = null;
let RewardedAdEventType = null;

try {
  const m = require('react-native-google-mobile-ads');
  MobileAds = m.default;
  AdEventType = m.AdEventType;
  InterstitialAd = m.InterstitialAd;
  RewardedAd = m.RewardedAd;
  RewardedAdEventType = m.RewardedAdEventType;
} catch (e) {
  // module not available
}

const AD_UNIT_IDS = {
  interstitial: {
    android: 'ca-app-pub-4086309578344734/7854843780',
    ios: 'ca-app-pub-4086309578344734/9436679883',
  },
  rewarded: {
    android: 'ca-app-pub-4086309578344734/5406201465',
    ios: 'ca-app-pub-4086309578344734/8962303096',
  },
};

const getAdUnitId = (format) => AD_UNIT_IDS[format][Platform.OS];

let interstitialAdInstance = null;
let interstitialLoaded = false;
let interstitialCallback = null;

let rewardedAdInstance = null;
let rewardedLoaded = false;
let rewardedCallback = null;
let rewardedEarned = false;
let rewardedRetryTimer = null;

let initialized = false;

// === Interstitial ===

function loadInterstitial() {
  if (!MobileAds || interstitialAdInstance) return;
  const ad = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'));
  interstitialAdInstance = ad;

  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, (e) => {
    interstitialAdInstance = null;
    interstitialLoaded = false;
    setTimeout(loadInterstitial, 5000);
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    const cb = interstitialCallback;
    interstitialAdInstance = null;
    interstitialLoaded = false;
    interstitialCallback = null;
    cb?.();
    loadInterstitial();
  });
  ad.load();
}

// === Rewarded ===

function loadRewarded() {
  if (!MobileAds || rewardedAdInstance) return;
  if (rewardedRetryTimer) { clearTimeout(rewardedRetryTimer); rewardedRetryTimer = null; }

  const ad = RewardedAd.createForAdRequest(getAdUnitId('rewarded'));
  rewardedAdInstance = ad;

  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });
  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewardedEarned = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, (e) => {
    rewardedAdInstance = null;
    rewardedLoaded = false;
    rewardedCallback = null;
    rewardedEarned = false;
    rewardedRetryTimer = setTimeout(loadRewarded, 5000);
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    if (rewardedEarned) {
      rewardedCallback?.();
    }
    rewardedAdInstance = null;
    rewardedLoaded = false;
    rewardedCallback = null;
    rewardedEarned = false;
    loadRewarded();
  });
  ad.load();
}

// === Public API ===

export async function initializeAds() {
  if (!MobileAds || initialized) return;
  initialized = true;
  try {
    await MobileAds().initialize();
  } catch (e) {
    initialized = false;
    return;
  }
  loadInterstitial();
  loadRewarded();
}

export function showTestInterstitialAd(onComplete) {
  if (!MobileAds || !interstitialLoaded || !interstitialAdInstance) {
    onComplete?.();
    return;
  }
  interstitialCallback = onComplete;
  interstitialAdInstance.show();
}

const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000;
let interstitialAvailableAt = Date.now() + INTERSTITIAL_COOLDOWN_MS;

export function showPuzzleSelectInterstitial(onComplete) {
  if (Date.now() < interstitialAvailableAt) {
    onComplete?.();
    return;
  }
  interstitialAvailableAt = Date.now() + INTERSTITIAL_COOLDOWN_MS;
  showTestInterstitialAd(onComplete);
}

export function showTestRewardedAd(onReward) {
  if (!MobileAds) return false;
  if (rewardedLoaded && rewardedAdInstance) {
    rewardedCallback = onReward;
    rewardedAdInstance.show();
    return true;
  }
  if (!rewardedAdInstance) {
    loadRewarded();
  }
  return false;
}
