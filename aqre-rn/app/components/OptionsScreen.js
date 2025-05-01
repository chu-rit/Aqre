import React from 'react';
import { View, Text, Switch, TouchableOpacity, SafeAreaView, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export default function OptionsScreen({ 
  soundEnabled, 
  setSoundEnabled, 
  bgmEnabled, 
  setBgmEnabled, 
  vibrationEnabled, 
  setVibrationEnabled,
  onClose,
  clearedPuzzles,
  setClearedPuzzles
}) {
  const clearAllData = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('게임 클리어 데이터를 정말로 지우시겠습니까?')) {
        setClearedPuzzles([]);
        window.alert('게임 데이터를 성공적으로 초기화하였습니다.');
      }
    } else {
      Alert.alert(
        '데이터 초기화', 
        '게임 클리어 데이터를 정말로 지우시겠습니까?', 
        [
          {
            text: '취소', 
            style: 'cancel'
          },
          {
            text: '초기화', 
            style: 'destructive', 
            onPress: () => {
              setClearedPuzzles([]);
              Alert.alert('초기화 완료', '게임 데이터를 성공적으로 초기화하였습니다.');
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
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={soundEnabled ? '#fff' : '#eee'}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>배경음</Text>
        <Switch
          value={bgmEnabled}
          onValueChange={setBgmEnabled}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={bgmEnabled ? '#fff' : '#eee'}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>진동</Text>
        <Switch
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
          trackColor={{ false: '#bcd6f7', true: '#2196F3' }}
          thumbColor={vibrationEnabled ? '#fff' : '#eee'}
        />
      </View>
    </SafeAreaView>
  );
}
