import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  StyleSheet,
  Platform,
  Modal,
  findNodeHandle,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './tutorialStyles';

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

  // 기본 스타일과 전달된 스타일을 병합
  const mergedStyle = [
    {
      fontSize: 16,
    },
    style
  ];

  return <Text style={mergedStyle}>{displayText}</Text>;
};

// 튜토리얼 건너뛰기 핸들러
const handleSkipTutorial = async (levelId, onSkip, onClose) => {
  console.log('handleSkipTutorial called with levelId:', levelId, 'type:', typeof levelId);
  
  try {
    let levelKey;
    
    // levelId가 객체인 경우를 처리
    if (levelId && typeof levelId === 'object') {
      console.log('levelId is an object, trying to extract id:', levelId);
      // 객체에서 id 속성을 추출
      levelKey = `level${levelId.id || levelId.number || 1}`;
    } 
    // levelId가 문자열이고 'level'로 시작하는 경우
    else if (typeof levelId === 'string' && levelId.startsWith('level')) {
      levelKey = levelId;
    }
    // levelId가 숫자인 경우
    else if (typeof levelId === 'number') {
      levelKey = `level${levelId}`;
    }
    // 그 외의 경우 기본값 사용
    else {
      console.warn('Unexpected levelId format, using default level1');
      levelKey = 'level1';
    }
    
    console.log('Saving tutorial completion for:', levelKey);
    
    const completedTutorials = await AsyncStorage.getItem('completedTutorials') || '{}';
    const completed = JSON.parse(completedTutorials);
    
    completed[levelKey] = true;
    await AsyncStorage.setItem('completedTutorials', JSON.stringify(completed));
    
    console.log(`튜토리얼이 건너뛰어졌습니다. (${levelKey})`);
    
    // 콜백 호출
    if (onSkip) {
      console.log('Calling onSkip callback');
      onSkip();
    } else if (onClose) {
      console.log('Calling onClose callback');
      onClose();
    } else {
      console.warn('No callback provided for skip/close');
    }
    
    return true;
  } catch (error) {
    console.error('튜토리얼 건너뛰기 중 오류 발생:', error);
    // 오류가 발생해도 콜백은 호출
    if (onSkip) {
      onSkip();
    } else if (onClose) {
      onClose();
    }
    return false;
  }
};

const TutorialScreen = ({ 
  isVisible, 
  onClose, 
  onSkip, 
  levelId, 
  steps = {},
  children 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false); // 기본값으로 false로 설정
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // 모든 하이라이트와 클론 요소를 제거하는 함수
  const cleanupAllHighlights = useCallback(() => {
    // 모든 클론 요소 제거
    const cloneElements = document.querySelectorAll('.tutorial-clone-element');
    cloneElements.forEach(el => {
      try {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (e) {
        // 클론 요소 제거 중 오류 무시
      }
    });

    // 모든 하이라이트 요소 복원
    const highlightElements = document.querySelectorAll('[data-highlight-id]');
    highlightElements.forEach(el => {
      try {
        // 이벤트 리스너 제거
        if (el._tutorialUpdatePosition) {
          window.removeEventListener('scroll', el._tutorialUpdatePosition, true);
          window.removeEventListener('resize', el._tutorialUpdatePosition);
          delete el._tutorialUpdatePosition;
        }
        
        // 원래 스타일 복원
        if (el.dataset.originalStyles) {
          try {
            const originalStyles = JSON.parse(el.dataset.originalStyles);
            Object.entries(originalStyles).forEach(([property, value]) => {
              if (property in el.style) {
                el.style[property] = value;
              }
            });
          } catch (e) {
            // JSON 파싱 오류 무시
          }
          delete el.dataset.originalStyles;
        }
        
        // 하이라이트 관련 속성 제거
        delete el.dataset.highlightId;
        el.classList.remove('tutorial-highlight');
      } catch (e) {
        // 하이라이트 요소 복원 중 오류 무시
      }
    });

    // 강제로 리플로우 발생시켜 변경사항 적용
    if (document.body) {
      document.body.offsetHeight;
    }
  }, []);
  
  // levelId에 해당하는 튜토리얼 단계 가져오기
  // getTutorialStepsByLevel 함수를 사용하여 단계 가져오기
  const currentLevelSteps = getTutorialStepsByLevel(levelId) || [];
  const currentStepData = currentLevelSteps[currentStep] || {};
  
  // 스킵 버튼 핸들러 - 단순하게 onSkip 호출만 처리
  const skipTutorial = useCallback(async () => {
    console.log('스킵 버튼 클릭됨 - TutorialScreen');
    cleanupAllHighlights();
    
    // onSkip이 있으면 호출 (LevelScreen의 handleSkipTutorial이 호출됨)
    if (onSkip) {
      console.log('Calling onSkip callback');
      onSkip();
    } 
    // onSkip이 없고 onClose가 있으면 onClose 호출
    else if (onClose) {
      console.log('Calling onClose callback');
      onClose();
    } else {
      console.warn('No skip or close callback provided');
    }
  }, [onSkip, onClose, cleanupAllHighlights]);

  useEffect(() => {
    // 항상 표시되도록 수정
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
        elements.forEach(el => {
          
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
            pointer-events: auto;
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
            element.style.pointerEvents = 'auto';
            Array.from(element.children).forEach(resetStyles);
          };
          
          resetStyles(clone);
          
          // 클론 클릭 시 원본 요소 클릭 이벤트 발생
          clone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 원본 요소 클릭 이벤트 발생
            if (el && typeof el.click === 'function') {
              el.click();
            } else if (el) {
              const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              });
              el.dispatchEvent(clickEvent);
            }
            
            // 다음 단계로 자동 이동
            if (currentStepData.autoNextOnClick) {
              handleNext();
            }
          });
          
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
      // 첫 단계의 showNextButton 값에 따라 버튼 표시 여부 결정
      const firstStepData = currentLevelSteps[0];
      setShowNextButton(firstStepData?.showNextButton || false);
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

  // 다음 스텝으로 이동하는 함수
  const nextStep = useCallback(() => {
    cleanupAllHighlights();
    
    if (currentStep < currentLevelSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setShowNextButton(currentLevelSteps[currentStep + 1]?.showNextButton || false);
      
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
      ]).start();
    } else {
      // 튜토리얼 완료
      if (onClose) {
        onClose();
      } else if (onSkip) {
        onSkip();
      }
    }
  }, [currentStep, currentLevelSteps, fadeAnim, slideAnim, onClose, onSkip, cleanupAllHighlights]);



  // 컴포넌트 언마운트 시 또는 isVisible이 false가 될 때 정리
  useEffect(() => {
    return () => {
      cleanupAllHighlights();
    };
  }, [cleanupAllHighlights]);

  if (!isVisible) return children || null;

  // 현재 스텝에 하이라이트가 있는지 확인
  const hasHighlight = currentStepData.highlight?.selectors?.length > 0;
  const cloneContainerRef = useRef(null);
  const highlightRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  
  // 요소 클론 생성 및 클릭 핸들링
  const cloneElement = useCallback((element) => {
    if (!element || !cloneContainerRef.current) return null;
    
    // 기존 클론 제거
    cloneContainerRef.current.innerHTML = '';
    
    // 요소 클론 생성
    const clone = element.cloneNode(true);
    
    // 스타일 복사
    const style = window.getComputedStyle(element);
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      try {
        clone.style[prop] = style[prop];
      } catch (e) {
        // 일부 읽기 전용 속성은 무시
      }
    }
    
    // 클릭 이벤트 핸들러
    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.click();
    };
    
    clone.style.pointerEvents = 'auto';
    clone.style.position = 'absolute';
    clone.style.zIndex = '1001';
    
    clone.addEventListener('click', clickHandler);
    cloneContainerRef.current.appendChild(clone);
    
    return () => {
      clone.removeEventListener('click', clickHandler);
    };
  }, []);

  // 요소 위치 업데이트 함수
  const updateHighlightPosition = useCallback(() => {
    if (!currentStepData.highlight?.selectors) return;
    
    let selector = currentStepData.highlight.selectors[0];
    // data-testid 속성 선택자로 변환
    if (selector.startsWith('data-testid=')) {
      const testId = selector.replace('data-testid=', '');
      selector = `[data-testid="${testId}"]`;
    }
    
    const element = document.querySelector(selector);
    if (!element) return;
    
    // 요소의 위치 계산
    const rect = element.getBoundingClientRect();
    const modal = document.querySelector('[role="dialog"]');
    const modalRect = modal ? modal.getBoundingClientRect() : { left: 0, top: 0 };
    
    // 모달 내부에서의 상대 위치 계산
    const left = rect.left - modalRect.left;
    const top = rect.top - modalRect.top;
    
    // 클론된 요소 위치 조정
    if (cloneContainerRef.current) {
      cloneContainerRef.current.style.left = `${left - 5}px`;
      cloneContainerRef.current.style.top = `${top}px`;
      cloneContainerRef.current.style.width = `${rect.width}px`;
      cloneContainerRef.current.style.height = `${rect.height}px`;
    }
    
    // 하이라이트 효과 크기 조정
    if (highlightRef.current) {
      const highlightPadding = 4; // 하이라이트 패딩
      highlightRef.current.style.width = `${rect.width + (highlightPadding * 2)}px`;
      highlightRef.current.style.height = `${rect.height + (highlightPadding * 2)}px`;
      highlightRef.current.style.left = `${left - highlightPadding}px`;
      highlightRef.current.style.top = `${top - highlightPadding}px`;
      highlightRef.current.style.opacity = '1';
    }
    
    // 요소 클론 생성
    cloneElement(element);
    setIsReady(true);
  }, [currentStepData.highlight, cloneElement]);

  // 하이라이트 위치 업데이트 이펙트
  useEffect(() => {
    if (!isVisible || !currentStepData.highlight) return;
    
    updateHighlightPosition();
    const interval = setInterval(updateHighlightPosition, 100);
    
    return () => {
      clearInterval(interval);
      if (cloneContainerRef.current) {
        cloneContainerRef.current.innerHTML = '';
      }
    };
  }, [isVisible, currentStepData.highlight, updateHighlightPosition]);

  return (
    <View style={styles.container}>
      {/* 자식 컴포넌트 렌더링 */}
      {children}
      
      {/* 튜토리얼 오버레이 */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={onSkip || skipTutorial}
      >
        <View style={styles.modalContainer}>
          {/* 반투명 검은 배경 */}
          <View style={[styles.overlay, styles.absoluteFill, { zIndex: 1000 }]} />
          
          {/* 클론된 요소 컨테이너 */}
          <div 
            ref={cloneContainerRef}
            style={{
              position: 'absolute',
              zIndex: 1001,
              pointerEvents: 'auto',
              overflow: 'visible',
              opacity: isReady ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
          
          {/* 하이라이트 영역 (가장 위에 렌더링) */}
          <View 
            ref={highlightRef}
            style={[
              styles.highlightArea,
              {
                position: 'absolute',
                zIndex: 1002, // 가장 위에 표시
                pointerEvents: 'none', // 클릭 이벤트는 클론이 처리
                opacity: isReady ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out'
              },
              currentStepData.highlight?.style
            ]}
          />
          
          {/* 튜토리얼 툴팁 (하단에 위치) */}
          <Animated.View 
            style={[
              styles.tooltipWrapper,
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }],
                zIndex: 1000
              }
            ]}
          >
            <View style={styles.tooltipContainer}>
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={onSkip || skipTutorial}
              >
                <Text style={styles.skipButtonText}>SKIP</Text>
              </TouchableOpacity>
              
              <View style={styles.tooltipContent}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={require('../assets/images/nurse.png')} 
                    style={styles.avatar}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.speechBubble}>
                    <View style={styles.speechBubbleTriangle} />
                    <TypeWriterText
                      text={currentStepData.text || "안녕하세요. 선생님! 저는 선생님을 보조할 간호사 아크라입니다."}
                      style={styles.tooltipText}
                      onTypingDone={() => {
                        // currentStepData.showNextButton 값에 따라 버튼 표시 여부 설정
                        setShowNextButton(currentStepData.showNextButton === true);
                      }}
                    />
                  </View>
                </View>
              </View>
              
              {/* 하단 컨트롤 (진행 상태 표시기 + 다음 버튼) */}
              <View style={styles.bottomContainer}>
                {/* 진행 상태 표시기 */}
                {currentLevelSteps.length > 1 && (
                  <View style={styles.progressContainer}>
                    {currentLevelSteps.map((_, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.progressDot,
                          index === currentStep && styles.progressDotActive
                        ]} 
                      />
                    ))}
                  </View>
                )}
                
                {/* 다음 버튼 */}
                {showNextButton && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={nextStep}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.nextButtonText}>
                       다음
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// 스타일은 tutorialStyles.js에서 가져와 사용

export { handleSkipTutorial };
export default TutorialScreen;