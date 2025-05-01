import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { styles } from '../styles';


export default function LevelScreen({ rows, soundEnabled, tapSound, vibrationEnabled, bgmEnabled, bgmPlay, setScreen, handleLevelSelect, setSoundEnabled, setBgmEnabled, setVibrationEnabled }) {
  return (
    <SafeAreaView style={styles.levelScreen}>
      <View style={styles.levelHeader}>
        <TouchableOpacity style={styles.backButton} onPress={async () => {
          if (tapSound.current) {
            try {
              if (soundEnabled) {
                await tapSound.current.replayAsync();
              }
              if (vibrationEnabled && Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } catch (e) {}
          }
          if (bgmEnabled && Platform.OS === 'web') {
            bgmPlay();
          }
          setScreen('start');
        }}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.levelTitle}>Level Select</Text>
        <TouchableOpacity style={styles.optionsButton} onPress={() => setScreen('options')}>
          <Text style={styles.optionsButtonText}>☰</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.levelContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.levelGrid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.levelRow}>
              {row.map((puzzle) => (
                <TouchableOpacity
                  key={puzzle.id}
                  style={styles.levelButton}
                  onPress={() => {
                    if (bgmEnabled && Platform.OS === 'web') {
                      bgmPlay();
                    }
                    handleLevelSelect(puzzle);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.levelButtonText}>{puzzle.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.levelContinued}>To Be Continued...</Text>
      </ScrollView>


    </SafeAreaView>
  );
}
