import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, SafeAreaView, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OptionsScreen({ 
  soundEnabled, 
  bgmEnabled, 
  vibrationEnabled, 
  onClose
}) {
  const [soundEnabledState, setSoundEnabledState] = useState(soundEnabled);
  const [bgmEnabledState, setBgmEnabledState] = useState(true);
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

  useEffect(() => {
    const init = async () => {
      try {
        const options = await AsyncStorage.getItem('options');
        if (options) {
          const parsed = JSON.parse(options);
          setBgmEnabledState(parsed.bgmEnabled ?? true);
        }
      } catch (e) {
        console.error('옵션 초기화 실패:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.side} onPress={onClose}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.title}>Options</Text>
        </View>
        <View style={styles.side} />
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
