import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  SafeAreaView, Alert, Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { showToast } from '../components/Toast';

import { setBGMEnabled, setSoundEnabled as setGlobalSoundEnabled } from '../utils/sound';

export default function OptionsScreen({ onClose, onChangeBgm }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem('options');
        if (json) {
          const p = JSON.parse(json);
          if (typeof p.soundEnabled === 'boolean') setSoundEnabled(p.soundEnabled);
          if (typeof p.bgmEnabled === 'boolean') setBgmEnabled(p.bgmEnabled);
          if (typeof p.vibrationEnabled === 'boolean') setVibrationEnabled(p.vibrationEnabled);
        }
      } catch {}
    };
    load();
  }, []);

  const save = async (key, value) => {
    try {
      const json = await AsyncStorage.getItem('options');
      const current = json ? JSON.parse(json) : {};
      await AsyncStorage.setItem('options', JSON.stringify({ ...current, [key]: value }));
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
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.title}>Options</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>효과음</Text>
            <Switch
              value={soundEnabled}
              onValueChange={v => { setSoundEnabled(v); setGlobalSoundEnabled(v); save('soundEnabled', v); }}
              trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>배경음</Text>
            <Switch
              value={bgmEnabled}
              onValueChange={v => { setBgmEnabled(v); setBGMEnabled(v); if (onChangeBgm) onChangeBgm(v); save('bgmEnabled', v); }}
              trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>진동</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={v => { setVibrationEnabled(v); save('vibrationEnabled', v); }}
              trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerBtn} onPress={clearAllData}>
            <Text style={styles.dangerBtnText}>클리어 데이터 초기화</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a4c8e0',
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
    fontSize: 20, fontWeight: '700', color: '#2c3e50', letterSpacing: 0.5,
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
