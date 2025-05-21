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

const TutorialScreen = ({ isVisible, onClose, onSkip, levelId, steps = {} }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // levelId에 해당하는 튜토리얼 단계 가져오기
  const currentLevelSteps = steps[levelId] || [];
  const currentStepData = currentLevelSteps[currentStep] || {};

  useEffect(() => {
    if (!isVisible) return;
    
    // 이전에 하이라이트된 요소가 있다면 스타일 제거
    const prevHighlighted = document.querySelectorAll('.tutorial-highlight');
    prevHighlighted.forEach(el => {
      el.classList.remove('tutorial-highlight');
      el.style.zIndex = '';
    });
    
    // 현재 스텝에 하이라이트가 있으면 적용
    if (currentStepData.highlight?.selectors) {
      currentStepData.highlight.selectors.forEach(selector => {
        // 선택자 형식이 key=value 형식이면 [key="value"]로 변환
        let query = selector;
        if (selector.includes('=')) {
          const [key, value] = selector.split('=');
          query = `[${key}="${value}"]`;
        }
        
        const elements = document.querySelectorAll(query);
        console.log(`원본 선택자: ${selector}, 쿼리: ${query}, 찾은 요소 수: ${elements.length}`);
        
        elements.forEach(el => {
          console.log('하이라이트 요소:', el);
          // 스타일 직접 적용 (React Native Web에서도 동작하도록)
          el.style.position = 'relative';
          el.style.zIndex = '1000';
          el.style.boxShadow = '0 0 0 2px #4c6ef5';
          el.style.borderRadius = '8px';
          el.style.backgroundColor = 'rgba(76, 110, 245, 0.1)';
          
          // 부모 요소의 overflow 속성 확인 (웹뷰에서만 동작)
          if (el.parentElement) {
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent);
              if (style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden') {
                console.log('overflow: hidden을 가진 부모 요소 발견:', parent);
              }
              parent = parent.parentElement;
            }
          }
        });
      });
    }
  }, [currentStep, currentStepData.highlight, isVisible]);

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
      
      return () => {
        clearTimeout(timer);
        // 컴포넌트 언마운트 시 하이라이트 제거
        const highlighted = document.querySelectorAll('.tutorial-highlight');
        highlighted.forEach(el => {
          el.classList.remove('tutorial-highlight');
          el.style.zIndex = '';
        });
      };
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const nextStep = () => {
    if (currentStep < currentLevelSteps.length - 1) {
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
                    {currentLevelSteps.map((_, index) => (
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
                        {currentStep < currentLevelSteps.length - 1 ? '다음' : '시작하기'}
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