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
  const [bgmEnabledState, setBgmEnabledState] = useState(bgmEnabled);
  const [vibrationEnabledState, setVibrationEnabledState] = useState(vibrationEnabled);


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
        setBgmEnabledState(parsed.bgmEnabled ?? true);
        setVibrationEnabledState(parsed.vibrationEnabled ?? true);
      }
    } catch (e) {}
  };


  useEffect(() => {
    loadOptions();
  }, []);

  // setter 래핑


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
          onValueChange={setSoundEnabledState}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={soundEnabledState ? '#fff' : '#eee'}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>배경음</Text>
        <Switch
          value={bgmEnabledState}
          onValueChange={setBgmEnabledState}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={bgmEnabledState ? '#fff' : '#eee'}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>진동</Text>
        <Switch
          value={vibrationEnabledState}
          onValueChange={setVibrationEnabledState}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={vibrationEnabled ? '#fff' : '#eee'}
        />
      </View>
    </SafeAreaView>
  );
}
