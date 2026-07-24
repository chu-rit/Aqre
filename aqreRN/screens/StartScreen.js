import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
import { StatusBar } from 'expo-status-bar';
import { loadSoundSettings, initBGM } from '../utils/sound';

const { width, height } = Dimensions.get('window');
const aspectRatio = height / width;
const is16x9 = aspectRatio >= 1.6 && aspectRatio <= 1.85;

const LOADING_DURATION = 2500;

export default function StartScreen({ onStart }) {
  const [loaded, setLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleStart = () => {
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => onStart());
  };

  useEffect(() => {
    const makeDotAnim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    const dotAnim = Animated.parallel([
      makeDotAnim(dot1, 0),
      makeDotAnim(dot2, 267),
      makeDotAnim(dot3, 534),
    ]);
    dotAnim.start();

    // Preload sounds and finish loading immediately when ready
    const preload = async () => {
      await loadSoundSettings();
      await initBGM();
      dotAnim.stop();
      setLoaded(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    };
    preload();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/img/Loading.png')}
        style={styles.bgImage}
      />
      {!loaded && (
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      )}
      {loaded && (
        <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
          <Text style={styles.versionTag}>v1.0.1</Text>
          <AnimatedTouchableOpacity 
            style={[styles.startButton, { opacity: pulseAnim }]} 
            activeOpacity={0.8} 
            onPress={handleStart}
          >
            <Text style={styles.startText}>Touch to Start</Text>
          </AnimatedTouchableOpacity>
        </Animated.View>
      )}
      <Animated.View
        pointerEvents="none"
        style={[styles.overlay, { opacity: overlayAnim }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    position: 'absolute',
    bottom: is16x9 ? '15%' : '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: is16x9 ? '15%' : '20%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  startButton: {
    width: '75%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  startText: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '800',
    letterSpacing: 2.5,
  },
});
