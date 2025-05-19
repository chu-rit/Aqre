import React from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { styles } from '../styles';

export default function StartScreen({ 
  setCurrentScreen, 
  tapSound 
}) {
  const handleStart = () => {
    if (tapSound && tapSound.current) {
      tapSound.current.replayAsync();
    }
    setCurrentScreen('level');
  };

  return (
    <SafeAreaView style={styles.startScreen}>
      <View style={styles.innerContainer}>
        <Image
          source={require('../../assets/images/image.png')}
          style={styles.mainImage}
        />
        <Image
          source={require('../../assets/images/logo1.png')}
          style={styles.logo}
        />
        <Text style={styles.versionTag}>v1.0.14</Text>
        <View style={styles.startContainer}>
          <TouchableOpacity
            style={styles.gameButton}
            onPress={handleStart}
          >
            <Text style={styles.startText}>Touch to start</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
