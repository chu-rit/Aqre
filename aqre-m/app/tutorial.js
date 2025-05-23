import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback
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
    
    // 이전에 생성된 하이라이트 요소 제거
    const highlightElements = document.querySelectorAll('.tutorial-highlight-element');
    highlightElements.forEach(el => el.remove());
    
    // 모든 하이라이트 요소 제거
    const removeAllHighlights = () => {
      // 모든 클론된 요소 제거
      document.querySelectorAll('.tutorial-clone-element').forEach(el => {
        // 이벤트 리스너 정리
        const targetId = el.dataset.targetId;
        if (targetId) {
          const originalElement = document.querySelector(`[data-highlight-id="${targetId}"]`);
          if (originalElement && originalElement._tutorialUpdatePosition) {
            window.removeEventListener('scroll', originalElement._tutorialUpdatePosition, true);
            window.removeEventListener('resize', originalElement._tutorialUpdatePosition);
            delete originalElement._tutorialUpdatePosition;
            delete originalElement.dataset.highlightId;
          }
        }
        el.remove();
      });
    };
    
    removeAllHighlights();
    
    // 원본 요소 복원
    const highlightedElements = document.querySelectorAll('.tutorial-highlight');
    highlightedElements.forEach(el => {
      // 원래 스타일 복원
      if (el.dataset.originalStyles) {
        const originalStyles = JSON.parse(el.dataset.originalStyles);
        Object.entries(originalStyles).forEach(([property, value]) => {
          if (property in el.style) {
            el.style[property] = value;
          }
        });
        delete el.dataset.originalStyles;
      }
      
      // 하이라이트 클래스 제거
      el.classList.remove('tutorial-highlight');
      delete el.dataset.highlightId;
    });
    
    // 현재 스텝에 하이라이트가 있으면 적용
    if (currentStepData.highlight?.selectors) {
      // 기존의 모든 클론 요소 제거
      document.querySelectorAll('.tutorial-clone-element').forEach(el => el.remove());
      
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
          
          // 요소의 원본 스타일 저장 (나중에 복원하기 위해)
          const originalPosition = el.style.position || '';
          const originalZIndex = el.style.zIndex || '';
          const originalBoxShadow = el.style.boxShadow || '';
          const originalBorderRadius = el.style.borderRadius || '';
          const originalBackgroundColor = el.style.backgroundColor || '';
          
          // 원본 요소의 스타일과 위치 정보 가져오기
          const originalStyle = window.getComputedStyle(el);
          const rects = el.getClientRects();
          const rect = rects.length > 0 ? rects[0] : el.getBoundingClientRect();
          
          // 뷰포트 기준 위치 계산
          const scrollX = window.scrollX || window.pageXOffset;
          const scrollY = window.scrollY || window.pageYOffset;
          
          // 요소의 실제 위치 계산 (스크롤 및 부모 요소의 위치 고려)
          let offsetX = 0;
          let offsetY = 0;
          let current = el;
          
          while (current && !current.isSameNode(document)) {
            offsetX += current.offsetLeft - current.scrollLeft + current.clientLeft;
            offsetY += current.offsetTop - current.scrollTop + current.clientTop;
            current = current.offsetParent;
          }
          
          // 기존 하이라이트 요소가 있으면 제거
          const existingHighlight = document.querySelector(`[data-highlight-id="${el.dataset.highlightId}"]`);
          if (existingHighlight) {
            existingHighlight.remove();
          }
          
          // 원본 요소를 클론하여 오버레이 위에 표시
          const clone = el.cloneNode(true);
          clone.className = 'tutorial-clone-element';
          
          // 원본 요소에 하이라이트 ID가 없으면 생성
          if (!el.dataset.highlightId) {
            el.dataset.highlightId = `highlight-${Date.now()}`;
          }
          
          // 원본 요소의 transform 값 가져오기
          const transform = originalStyle.transform !== 'none' ? originalStyle.transform : '';
          
          // 최종 위치 계산 (offset 값을 사용하여 정확한 위치 계산)
          const finalTop = offsetY + scrollY;
          const finalLeft = offsetX + scrollX;
          
          // CSS 애니메이션 키프레임 추가
          const styleId = 'tutorial-highlight-styles';
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
              @keyframes tutorialPulse {
                0% { 
                  box-shadow: 0 0 0 0 rgba(76, 110, 245, 0.8),
                              0 0 0 10px rgba(76, 110, 245, 0.5),
                              0 0 0 20px rgba(76, 110, 245, 0.2);
                }
                100% { 
                  box-shadow: 0 0 0 15px rgba(76, 110, 245, 0),
                              0 0 0 30px rgba(76, 110, 245, 0),
                              0 0 0 45px rgba(76, 110, 245, 0);
                }
              }
              @keyframes tutorialBorderPulse {
                0%, 100% { 
                  border-width: 3px;
                  border-color: #4c6ef5;
                }
                50% { 
                  border-width: 4px;
                  border-color: #00f7ff;
                }
              }
              /* 배경 펄스 애니메이션 제거 */
            `;
            document.head.appendChild(style);
          }
          
          // 클론 요소 스타일 설정
          clone.style.cssText = `
            position: fixed;
            top: ${finalTop}px;
            left: ${finalLeft}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            z-index: 1000;
            pointer-events: none;
            background-color: ${originalStyle.backgroundColor || 'transparent'};
            border: 3px solid #4c6ef5;
            border-radius: ${originalStyle.borderRadius || '6px'};
            padding: ${originalStyle.padding};
            margin: 0;
            display: ${originalStyle.display};
            flex-direction: ${originalStyle.flexDirection};
            justify-content: ${originalStyle.justifyContent};
            align-items: ${originalStyle.alignItems};
            font-size: ${originalStyle.fontSize};
            color: ${originalStyle.color};
            box-sizing: border-box;
            transform: ${transform};
            transform-origin: ${originalStyle.transformOrigin};
            opacity: 1;
            animation: 
              tutorialPulse 1.5s infinite ease-out,
              tutorialBorderPulse 1s infinite ease-in-out;
            box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.5);
            transition: all 0.3s ease;
          `;
          
          // 내부 요소 스타일 초기화
          const resetStyles = (element) => {
            if (!element) return;
            element.style.pointerEvents = 'none';
            Array.from(element.children).forEach(resetStyles);
          };
          
          resetStyles(clone);
          
          // body에 클론 요소 추가
          document.body.appendChild(clone);
          
          // 원본 요소 참조 저장
          el.dataset.highlightId = `highlight-${Date.now()}`;
          clone.dataset.targetId = el.dataset.highlightId;
          
          // 스크롤 이벤트 핸들러
          const updatePosition = () => {
            const newRect = el.getBoundingClientRect();
            clone.style.top = `${window.scrollY + newRect.top}px`;
            clone.style.left = `${window.scrollX + newRect.left}px`;
          };
          
          // 스크롤 및 리사이즈 이벤트 추가
          window.addEventListener('scroll', updatePosition, true);
          window.addEventListener('resize', updatePosition);
          
          // 이벤트 리스너 정리를 위한 참조 저장
          el._tutorialUpdatePosition = updatePosition;
          
          // 요소의 원본 스타일 저장 (나중에 복원하기 위해)
          el.dataset.originalStyles = JSON.stringify({
            position: originalPosition,
            zIndex: originalZIndex,
            boxShadow: originalBoxShadow,
            borderRadius: originalBorderRadius,
            backgroundColor: originalBackgroundColor
          });
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
    <View style={tutorialStyles.modalOverlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={tutorialStyles.overlayTouchable} />
      </TouchableWithoutFeedback>
      <Animated.View 
        style={[
          tutorialStyles.modalContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <TouchableOpacity 
          style={tutorialStyles.skipButton}
          onPress={onSkip || skipTutorial}
        >
          <Text style={tutorialStyles.skipButtonText}>SKIP</Text>
        </TouchableOpacity>
        
        <View style={[tutorialStyles.contentContainer, { flex: 1 }]}>
          {/* 기존 컨텐츠 */}
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
    </View>
  );
};

export default TutorialScreen;