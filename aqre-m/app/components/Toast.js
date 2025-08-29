import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, Platform } from 'react-native';

let toastController = null;

export const showToast = (message, duration = 1500) => {
  if (toastController && typeof toastController.show === 'function') {
    toastController.show(message, duration);
  } else {
    console.warn('[Toast] Controller not ready');
  }
};

export default function Toast() {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimerRef = useRef(null);

  useEffect(() => {
    toastController = {
      show: (message, duration = 1500) => {
        try {
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
          }
          setMsg(String(message ?? ''));
          setVisible(true);
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true })
          ]).start();

          hideTimerRef.current = setTimeout(() => {
            Animated.parallel([
              Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true })
            ]).start(() => {
              setVisible(false);
            });
          }, Math.max(600, duration));
        } catch {}
      }
    };

    return () => {
      toastController = null;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [opacity, translateY]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 80, alignItems: 'center', zIndex: 4000 }}>
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }],
          maxWidth: '86%',
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.85)',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
            default: {}
          })
        }}
      >
        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>{msg}</Text>
      </Animated.View>
    </View>
  );
}
