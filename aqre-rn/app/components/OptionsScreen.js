import React from 'react';
import { View, Text, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import { styles } from '../styles';

export default function OptionsScreen({ 
  soundEnabled, 
  setSoundEnabled, 
  bgmEnabled, 
  setBgmEnabled, 
  vibrationEnabled, 
  setVibrationEnabled,
  onClose 
}) {
  return (
    <SafeAreaView style={styles.optionsContainer}>
      <TouchableOpacity style={[styles.backButton, { position: 'absolute', top: 10, left: 10 }]} onPress={onClose}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <View style={{ height: 44 }} />
      <TouchableOpacity style={styles.clearDataButton}>
        <Text style={styles.clearDataButtonText}>클리어 데이터 지우기</Text>
      </TouchableOpacity>
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
