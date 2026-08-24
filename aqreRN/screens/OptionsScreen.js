import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  Alert, Platform, StyleSheet, PanResponder, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { showToast } from '../components/Toast';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setBGMEnabled, setSoundEnabled as setGlobalSoundEnabled, setBGMVolume, setSoundVolume, playTap, setVibrationEnabled as setGlobalVibrationEnabled } from '../utils/sound';
import { scaleStyles } from '../utils/responsive';
import { getDeviceLanguage, getText, setCurrentLanguage, SUPPORTED_LANGUAGES } from '../utils/i18n';

const VOLUME_STEPS = [0, 0.1, 0.25, 0.5, 0.75, 1.0];
const STEP_WIDTH = 18;
const STEP_GAP = 8;
const NUM_BARS = VOLUME_STEPS.length - 1;
const TOTAL_WIDTH = NUM_BARS * STEP_WIDTH + (NUM_BARS - 1) * STEP_GAP;

function VolumeSlider({ value, onChange }) {
  const containerRef = useRef(null);
  const offsetX = useRef(0);
  const lastStep = useRef(value);

  const getStepFromX = (x) => {
    const ratio = x / TOTAL_WIDTH;
    const step = Math.round(ratio * (VOLUME_STEPS.length - 1));
    return Math.max(0, Math.min(VOLUME_STEPS.length - 1, step));
  };

  const handleStepChange = (x) => {
    const newStep = getStepFromX(x);
    if (newStep !== lastStep.current) {
      lastStep.current = newStep;
      onChange(newStep);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        lastStep.current = getStepFromX(x);
        onChange(lastStep.current);
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        handleStepChange(x);
      },
    })
  ).current;

  return (
    <View
      style={styles.stepsContainer}
      {...panResponder.panHandlers}
    >
      {VOLUME_STEPS.slice(1).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepBtn,
            { height: 10 + i * 6 },
            value > i && styles.stepBtnActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OptionsScreen({ onClose, onChangeBgm, onResetData, renderToast = true, embedded = false }) {
  const insets = useSafeAreaInsets();
  const [soundVolume, setSoundVolumeState] = useState(4);
  const [bgmVolume, setBgmVolumeState] = useState(2);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [language, setLanguage] = useState(() => setCurrentLanguage(getDeviceLanguage()));
  const [masterModeReady, setMasterModeReady] = useState(false);
  const [masterMode, setMasterMode] = useState(false);
  const isEnglish = language === 'en';
  const overlayAnim = useRef(new Animated.Value(1)).current;
  const churitBlueTimer = useRef(null);

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
        const json = await AsyncStorage.getItem('options');
        if (json) {
          const p = JSON.parse(json);
          if (typeof p.soundVolumeStep === 'number') setSoundVolumeState(p.soundVolumeStep);
          if (typeof p.bgmVolumeStep === 'number') setBgmVolumeState(p.bgmVolumeStep);
          if (typeof p.vibrationEnabled === 'boolean') setVibrationEnabled(p.vibrationEnabled);
          if (SUPPORTED_LANGUAGES.includes(p.language)) {
            setLanguage(setCurrentLanguage(p.language));
          } else {
            const deviceLanguage = getDeviceLanguage();
            setLanguage(setCurrentLanguage(deviceLanguage));
            await AsyncStorage.setItem('options', JSON.stringify({ ...p, language: deviceLanguage }));
          }
          if (p.masterMode) setMasterMode(true);
        } else {
          const deviceLanguage = getDeviceLanguage();
          setLanguage(deviceLanguage);
          await AsyncStorage.setItem('options', JSON.stringify({ language: deviceLanguage }));
        }
      } catch {}
    };
    load();
  }, []);

  const saveMultiple = async (updates) => {
    try {
      const json = await AsyncStorage.getItem('options');
      const current = json ? JSON.parse(json) : {};
      await AsyncStorage.setItem('options', JSON.stringify({ ...current, ...updates }));
    } catch {}
  };

  const clearAllData = () => {
    const doDelete = async () => {
      try {
        await AsyncStorage.removeItem('clearedPuzzles');
        await AsyncStorage.removeItem('completedTutorials');
        await AsyncStorage.removeItem('skippedTutorials');
        await AsyncStorage.removeItem('levelSwipeTutorialShown');
        await AsyncStorage.removeItem('basicTutorialsCompletedDate');
        await AsyncStorage.removeItem('lastDailyEventDate');
        await AsyncStorage.removeItem('claimedHintRewards');
        if (masterModeReady) {
          const json = await AsyncStorage.getItem('options');
          const current = json ? JSON.parse(json) : {};
          await AsyncStorage.setItem('options', JSON.stringify({ ...current, masterMode: true }));
          showToast(getText('options.masterActivated'));
        } else {
          showToast(getText('options.resetDataSuccess'));
        }
        if (onResetData) setTimeout(onResetData, 1200);
        else if (onClose) setTimeout(onClose, 1200);
      } catch (e) {
        showToast((isEnglish ? 'Reset failed: ' : '초기화 실패: ') + (e?.message || (isEnglish ? 'Error' : '오류')));
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(getText('options.resetDataConfirm'))) doDelete();
    } else {
      Alert.alert(getText('options.resetDataTitle'), getText('options.resetDataConfirm'), [
        { text: getText('button.cancel'), style: 'cancel' },
        { text: getText('button.reset'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={embedded ? styles.embeddedRoot : styles.modalRoot}>
      <View style={embedded ? styles.embeddedContent : [styles.modalContainer, { paddingTop: Math.max(insets.top, 0) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <Text style={styles.title} selectable={false}>Options</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { playTap(); onClose(); }}>
            <Ionicons name="close" size={24} color="#2c3e50" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.volumeRow}>
            <Text style={styles.rowLabel} selectable={false}>{getText('options.soundEffects')}</Text>
            <VolumeSlider
              value={soundVolume}
              onChange={(i) => {
                if (i !== soundVolume) playTap();
                setSoundVolumeState(i);
                setGlobalSoundEnabled(i > 0);
                setSoundVolume(VOLUME_STEPS[i]);
                saveMultiple({ soundVolumeStep: i, soundVolume: VOLUME_STEPS[i], soundEnabled: i > 0 });
              }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.volumeRow}>
            <Text style={styles.rowLabel} selectable={false}>{getText('options.backgroundMusic')}</Text>
            <VolumeSlider
              value={bgmVolume}
              onChange={(i) => {
                if (i !== bgmVolume) playTap();
                setBgmVolumeState(i);
                const vol = VOLUME_STEPS[i];
                setBGMVolume(vol);
                setBGMEnabled(i > 0);
                if (onChangeBgm) onChangeBgm(i > 0);
                saveMultiple({ bgmVolumeStep: i, bgmVolume: vol, bgmEnabled: i > 0 });
              }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel} selectable={false}>{getText('options.vibration')}</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={v => { playTap(); setVibrationEnabled(v); setGlobalVibrationEnabled(v); saveMultiple({ vibrationEnabled: v }); }}
              trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.languageRow}>
            <Text style={styles.rowLabel} selectable={false}>{getText('options.language')}</Text>
            <View style={styles.languageSelector}>
              {[
                ['en', 'English'],
                ['ko', '한국어'],
                ['ja', '日本語'],
                ['zh', '中文'],
              ].map(([code, label]) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.languageButton, language === code && styles.languageButtonActive]}
                  onPress={() => { playTap(); setLanguage(setCurrentLanguage(code)); saveMultiple({ language: code }); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.languageButtonText, language === code && styles.languageButtonTextActive]} selectable={false}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => { playTap(); clearAllData(); }}
            delayLongPress={1500}
            onLongPress={async () => {
              if (!masterMode) return;
              const todayStr = new Date().toDateString();
              const yesterday = new Date(Date.now() - 86400000).toDateString();
              await AsyncStorage.setItem('basicTutorialsCompletedDate', yesterday);
              await AsyncStorage.removeItem('lastDailyEventDate');
              const claimedJson = await AsyncStorage.getItem('claimedHintRewards');
              const claimed = claimedJson ? JSON.parse(claimedJson) : {};
              delete claimed[`daily-event-reward-${todayStr}`];
              await AsyncStorage.setItem('claimedHintRewards', JSON.stringify(claimed));
              showToast(getText('options.dailyReset'));
            }}
          >
            <Text style={styles.dangerBtnText} selectable={false}>{getText('options.resetClearData')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.creditContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.creditLine} selectable={false}>Developed by </Text>
              <TouchableOpacity
                activeOpacity={1}
                delayLongPress={3000}
                onLongPress={async () => {
                  if (masterMode) {
                    const json = await AsyncStorage.getItem('options');
                    const current = json ? JSON.parse(json) : {};
                    await AsyncStorage.setItem('options', JSON.stringify({ ...current, masterMode: false }));
                    setMasterMode(false);
                    setMasterModeReady(false);
                    showToast(getText('options.masterDeactivated'));
                  } else {
                    setMasterModeReady(true);
                    if (churitBlueTimer.current) clearTimeout(churitBlueTimer.current);
                    churitBlueTimer.current = setTimeout(() => setMasterModeReady(false), 2000);
                  }
                }}
              >
                <Text style={[styles.creditLine, (masterMode || masterModeReady) && { color: '#3b82c4' }]} selectable={false}>ChuRit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.creditLine} selectable={false}>Special Thanks to Eric Fox</Text>
          </View>
        </View>
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: overlayAnim }}
        />
      </View>
      {renderToast && <Toast />}
    </View>
  );
}

const styles = StyleSheet.create(scaleStyles({
  container: {
    flex: 1,
    backgroundColor: '#dde4ed',
  },
  modalRoot: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(20,35,52,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 0,
    width: '92%',
    minHeight: 520,
    maxWidth: 420,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.96)',
    overflow: 'hidden',
  },
  embeddedRoot: {
    width: '100%',
    minHeight: 520,
    maxWidth: 420,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.96)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  embeddedContent: {
    width: '100%',
    backgroundColor: 'transparent',
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
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#2c3e50', letterSpacing: 1.5,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  languageRow: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageButton: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#d7e3ef',
    backgroundColor: 'rgba(248,251,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#4a90d9',
    backgroundColor: '#4a90d9',
  },
  languageButtonText: {
    fontSize: 13,
    color: '#6b7c8d',
    fontWeight: '700',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  stepsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  stepBtn: {
    width: 18,
    borderRadius: 3,
    backgroundColor: '#c8d8e8',
  },
  stepBtnActive: {
    backgroundColor: '#4a90d9',
  },
  rowLabel: {
    fontSize: 16, color: '#2c3e50', fontWeight: '500',
  },
  divider: {
    height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginHorizontal: 16,
  },
  dangerBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(229,57,53,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.3)',
  },
  dangerBtnText: {
    fontSize: 16, color: '#e53935', fontWeight: '600',
  },
  creditContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  creditLine: {
    fontSize: 14, color: '#6b7c8d', fontWeight: '500', lineHeight: 22,
  },
}));
