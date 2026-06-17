import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  SafeAreaView, Alert, Platform, StyleSheet, PanResponder, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { showToast } from '../components/Toast';

import { setBGMEnabled, setSoundEnabled as setGlobalSoundEnabled, setBGMVolume, setSoundVolume, playTap } from '../utils/sound';

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

export default function OptionsScreen({ onClose, onChangeBgm }) {
  const [soundVolume, setSoundVolumeState] = useState(4);
  const [bgmVolume, setBgmVolumeState] = useState(2);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
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
        const json = await AsyncStorage.getItem('options');
        if (json) {
          const p = JSON.parse(json);
          if (typeof p.soundVolumeStep === 'number') setSoundVolumeState(p.soundVolumeStep);
          if (typeof p.bgmVolumeStep === 'number') setBgmVolumeState(p.bgmVolumeStep);
          if (typeof p.vibrationEnabled === 'boolean') setVibrationEnabled(p.vibrationEnabled);
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
        showToast('성공적으로 초기화되었습니다');
        if (onClose) setTimeout(onClose, 1200);
      } catch (e) {
        showToast('초기화 실패: ' + (e?.message || '오류'));
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('게임 클리어 데이터를 정말로 지우시겠습니까?')) doDelete();
    } else {
      Alert.alert('데이터 초기화', '게임 클리어 데이터를 정말로 지우시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { playTap(); onClose(); }}>
            <Ionicons name="chevron-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.title}>Options</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.section}>
          <View style={styles.volumeRow}>
            <Text style={styles.rowLabel}>효과음</Text>
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
            <Text style={styles.rowLabel}>배경음</Text>
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
            <Text style={styles.rowLabel}>진동</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={v => { playTap(); setVibrationEnabled(v); saveMultiple({ vibrationEnabled: v }); }}
              trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => { playTap(); clearAllData(); }}>
            <Text style={styles.dangerBtnText}>클리어 데이터 초기화</Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: overlayAnim }}
        />
      </SafeAreaView>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dde4ed',
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
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
    paddingVertical: 15,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: 16, color: '#e53935', fontWeight: '600',
  },
});
