import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, SafeAreaView, Alert, Platform, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OptionsScreen({ 
  soundEnabled, 
  bgmEnabled, 
  vibrationEnabled, 
  onChangeSoundEnabled,
  onChangeBgmEnabled,
  onClose
}) {
  const [soundEnabledState, setSoundEnabledState] = useState(soundEnabled);
  const [bgmEnabledState, setBgmEnabledState] = useState(bgmEnabled ?? true);
  const [vibrationEnabledState, setVibrationEnabledState] = useState(vibrationEnabled);
  const [isLoaded, setIsLoaded] = useState(false);

  // 옵션 저장
  const saveOptions = async (options) => {
    try {
      await AsyncStorage.setItem('options', JSON.stringify(options));
    } catch (e) {}
  };

  // 옵션 불러오기
  const loadOptions = async () => {
    try {
      const options = await AsyncStorage.getItem('options');
      if (options) {
        const parsed = JSON.parse(options);
        setSoundEnabledState(parsed.soundEnabled ?? true);
        setVibrationEnabledState(parsed.vibrationEnabled ?? true);
      }
    } catch (e) {}
  };

  // 설정값 로드 함수
  const loadSettings = async () => {
    try {
      const sound = await AsyncStorage.getItem('soundEnabled');
      const haptics = await AsyncStorage.getItem('hapticsEnabled');
      
      setSoundEnabledState(sound !== null ? JSON.parse(sound) : true);
      setVibrationEnabledState(haptics !== null ? JSON.parse(haptics) : true);
    } catch (e) {
      console.error('설정 불러오기 실패:', e);
    }
  };

  // 설정값 저장 함수
  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('설정 저장 실패:', e);
    }
  };

  // 최초 로드시 props와 저장값을 조합하여 초기화
  useEffect(() => {
    const init = async () => {
      try {
        const options = await AsyncStorage.getItem('options');
        if (options) {
          const parsed = JSON.parse(options);
          setBgmEnabledState(
            typeof parsed.bgmEnabled === 'boolean' ? parsed.bgmEnabled : (bgmEnabled ?? true)
          );
        } else {
          setBgmEnabledState(bgmEnabled ?? true);
        }
      } catch (e) {
        console.error('옵션 초기화 실패:', e);
        setBgmEnabledState(bgmEnabled ?? true);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  // 부모에서 bgmEnabled가 바뀌면 토글도 동기화
  useEffect(() => {
    if (typeof bgmEnabled === 'boolean') {
      setBgmEnabledState(bgmEnabled);
    }
  }, [bgmEnabled]);

  useEffect(() => {
    loadOptions();
    loadSettings();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveOptions({
        soundEnabled: soundEnabledState,
        bgmEnabled: bgmEnabledState,
        vibrationEnabled: vibrationEnabledState
      });
    }
  }, [bgmEnabledState, isLoaded, soundEnabledState, vibrationEnabledState]);

  const clearAllData = async () => {
  if (Platform.OS === 'web') {
    if (window.confirm('게임 클리어 데이터를 정말로 지우시겠습니까?')) {
      try {
        await AsyncStorage.removeItem('clearedPuzzles');
        console.log('clearedPuzzles 데이터 성공적으로 삭제됨');
        window.alert('게임 데이터를 성공적으로 초기화하였습니다.');
        if (onClose) onClose();
      } catch (e) {
        console.error('clearedPuzzles 삭제 실패:', e);
        window.alert('초기화 실패: ' + e.message);
      }
    }
  } else {
    Alert.alert(
      '데이터 초기화',
      '게임 클리어 데이터를 정말로 지우시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('clearedPuzzles');
              console.log('clearedPuzzles 데이터 성공적으로 삭제됨');
              Alert.alert('초기화 완료', '게임 데이터를 성공적으로 초기화하였습니다.');
              if (onClose) onClose();
            } catch (e) {
              console.error('clearedPuzzles 삭제 실패:', e);
              Alert.alert('초기화 실패', e.message);
            }
          }
        }
      ]
    );
  }
};

  return (
    <SafeAreaView style={styles.levelScreen}>
      <View style={localStyles.header}>
        <TouchableOpacity style={localStyles.side} onPress={onClose}>
          <Ionicons name="chevron-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={[localStyles.title, { flex: 1, textAlign: 'center' }]}>Options</Text>
      </View>
      <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 20 }}>
        <TouchableOpacity 
          style={styles.clearDataButton}
          onPress={clearAllData}
        >
          <Text style={styles.clearDataButtonText}>클리어 데이터 지우기</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>효과음</Text>
        <Switch
          value={soundEnabledState}
          onValueChange={(value) => {
            setSoundEnabledState(value);
            saveSetting('soundEnabled', value);
            if (typeof onChangeSoundEnabled === 'function') {
              onChangeSoundEnabled(value);
            }
          }}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={soundEnabledState ? '#fff' : '#eee'}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>배경음</Text>
        <Switch
          value={bgmEnabledState}
          onValueChange={(value) => {
            setBgmEnabledState(value);
            // 즉시 부모에 반영하여 재생/정지를 수행
            if (typeof onChangeBgmEnabled === 'function') {
              onChangeBgmEnabled(value);
            }
          }}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={bgmEnabledState ? '#fff' : '#eee'}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>진동</Text>
        <Switch
          value={vibrationEnabledState}
          onValueChange={(value) => {
            setVibrationEnabledState(value);
            saveSetting('hapticsEnabled', value);
          }}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={vibrationEnabledState ? '#fff' : '#eee'}
        />
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  side: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
});
