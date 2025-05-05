import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { styles } from '../styles';


export default function LevelScreen({ rows, soundEnabled, tapSound, vibrationEnabled, bgmEnabled, bgmPlay, setScreen, handleLevelSelect, setSoundEnabled, setBgmEnabled, setVibrationEnabled, clearedPuzzles }) {
  return (
    <SafeAreaView style={styles.levelScreen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.side} onPress={async () => {
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
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.title}>Level Select</Text>
        </View>
        <TouchableOpacity style={styles.side} onPress={() => setScreen('options')}>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.levelContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.levelGrid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.levelRow}>
              {row.map((puzzle) => (
                <TouchableOpacity
                  key={puzzle.id}
                  style={[
                    styles.levelButton,
                    clearedPuzzles.includes(puzzle.id) && { 
                      borderWidth: 3,
                      borderColor: 'rgba(76, 175, 80, 0.8)'
                    }
                  ]}
                  onPress={() => {
                    if (bgmEnabled && Platform.OS === 'web') {
                      bgmPlay();
                    }
                    handleLevelSelect(puzzle);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <Text style={styles.levelButtonText}>{puzzle.id}</Text>
                    {clearedPuzzles.includes(puzzle.id) && (
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{
                          color: 'rgba(0, 200, 0, 0.5)',
                          fontSize: 24,
                          fontWeight: 'bold'
                        }}>✓</Text>
                      </View>
                    )}
                  </View>
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
