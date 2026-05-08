import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function StartScreen({ onStart }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.innerContainer}>
        <Image
          source={require('../assets/image.png')}
          style={styles.mainImage}
        />
        <Image
          source={require('../assets/logo1.png')}
          style={styles.logo}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.gameSubtitle}>Fill & Flow</Text>
        </View>
        <Text style={styles.versionTag}>v1.0.0</Text>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={onStart}>
          <Text style={styles.startText}>Touch to Start</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a4c8e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mainImage: {
    width: Math.min(width * 0.82, 320),
    height: Math.min(width * 0.82, 320),
    resizeMode: 'cover',
    borderRadius: 24,
  },
  logo: {
    width: 220,
    height: 80,
    resizeMode: 'contain',
    marginTop: 20,
    marginBottom: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  gameSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 3,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.10)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  versionTag: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
    marginTop: 4,
  },
  startButton: {
    width: '72%',
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  startText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
