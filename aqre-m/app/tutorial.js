import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Modal,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tutorialStyles } from './tutorialStyles';

const { width, height } = Dimensions.get('window');

// 타이핑 효과를 위한 컴포넌트
const TypeWriterText = ({ text, style, onTypingDone }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const typingSpeed = 30; // ms

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else if (onTypingDone) {
      onTypingDone();
    }
  }, [currentIndex, text, onTypingDone]);

  useEffect(() => {
    // 텍스트가 바뀌면 리셋
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return <Text style={style}>{displayText}</Text>;
};

const TutorialScreen = ({ isVisible, onClose, onSkip, steps = [] }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const currentStepData = steps[currentStep] || {};

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setShowNextButton(false);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      // 애니메이션 시작
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // 자동으로 다음 단계로 넘어가기
      const timer = setTimeout(() => {
        setShowNextButton(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setShowNextButton(false);
      setCurrentStep(currentStep + 1);
      
      // 다음 단계로 넘어갈 때 애니메이션
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 애니메이션이 끝난 후 버튼 표시
        setShowNextButton(true);
      });
    } else {
      // 튜토리얼 완료
      onClose();
    }
  };

  const skipTutorial = async () => {
    try {
      await AsyncStorage.setItem('tutorialSkipped', 'true');
      onClose();
    } catch (error) {
      console.error('튜토리얼 스킵 상태 저장 실패:', error);
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={tutorialStyles.overlay}>
        <Animated.View 
          style={[
            tutorialStyles.container,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <TouchableOpacity 
            style={tutorialStyles.skipButton}
            onPress={onSkip || skipTutorial}
          >
            <Text style={tutorialStyles.skipButtonText}>SKIP</Text>
          </TouchableOpacity>
          
          <View style={tutorialStyles.contentContainer}>
            <View style={tutorialStyles.rowContainer}>
              <View style={tutorialStyles.imageContainer}>
                <Image 
                  source={require('../assets/images/nurse.png')} 
                  style={tutorialStyles.avatar}
                  resizeMode="contain"
                />
              </View>
              
              <View style={tutorialStyles.textContainer}>
                <TypeWriterText 
                  text={currentStepData.text || '안녕하세요. 선생님! 저는 선생님을 보조할 간호사 아크라입니다.'}
                  style={tutorialStyles.text}
                  onTypingDone={() => setShowNextButton(true)}
                />
                <View style={tutorialStyles.bottomContainer}>
                  <View style={tutorialStyles.progress}>
                    {steps.map((_, index) => (
                      <View 
                        key={index} 
                        style={[
                          tutorialStyles.progressDot, 
                          index === currentStep && tutorialStyles.progressDotActive
                        ]} 
                      />
                    ))}
                  </View>
                  {showNextButton && (
                    <TouchableOpacity 
                      style={tutorialStyles.button}
                      onPress={nextStep}
                      activeOpacity={0.8}
                    >
                      <Text style={tutorialStyles.buttonText}>
                        {currentStep < steps.length - 1 ? '다음' : '시작하기'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

export default TutorialScreen;