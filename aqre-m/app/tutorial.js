import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  Platform,
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
  try {
    let levelKey;
    // levelId가 객체인 경우를 처리
    if (levelId && typeof levelId === 'object') {
      levelKey = `level${levelId.id || levelId.number || 1}`;
    } else if (typeof levelId === 'string' && levelId.startsWith('level')) {
      levelKey = levelId;
    } else if (typeof levelId === 'number') {
      levelKey = `level${levelId}`;
    } else {
      levelKey = 'level1';
    }
    const completedTutorials = await AsyncStorage.getItem('completedTutorials') || '{}';
    const completed = JSON.parse(completedTutorials);
    completed[levelKey] = true;
    await AsyncStorage.setItem('completedTutorials', JSON.stringify(completed));
    if (onSkip) {
      onSkip();
    } else if (onClose) {
      onClose();
    }
    return true;
  } catch (error) {
    console.error('Error skipping tutorial:', error);
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
  children,
  getCellRect,
  board,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false); // 기본값으로 false로 설정
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [highlightRect, setHighlightRect] = useState(null);
  const autoAdvancedRef = useRef(false);

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

  // 단계 소스: 전달된 steps prop 우선, 없으면 levelId로 조회
  const currentLevelSteps = (Array.isArray(steps) && steps.length > 0)
    ? steps
    : (getTutorialStepsByLevel(levelId) || []);
  const currentStepData = currentLevelSteps[currentStep] || {};

  // 스킵 버튼 핸들러 - 단순하게 onSkip 호출만 처리
  const skipTutorial = useCallback(async () => {
    cleanupAllHighlights();
    if (onSkip) {
      onSkip();
    } else if (onClose) {
      onClose();
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
            animation: tutorialPulse 1.5s infinite ease-out;
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

  // 스텝이 바뀔 때 자동 진행 플래그 리셋
  useEffect(() => {
    autoAdvancedRef.current = false;
  }, [currentStep]);

  // 보드 상태에 따른 조건 충족 시 자동으로 다음 단계로 이동
  useEffect(() => {
    if (!isVisible) return;
    const cond = currentStepData?.condition;
    if (!cond) return; // 조건이 없는 스텝은 수동 진행(버튼)

    const evalCell = (b, c) => {
      if (!b || !Array.isArray(b) || b[c.row] == null || b[c.row][c.col] == null) return false;
      return b[c.row][c.col] === c.expectedState;
    };

    let satisfied = false;
    if (Array.isArray(cond?.conditions)) {
      satisfied = cond.conditions.every(c => evalCell(board, c));
    } else if (typeof cond === 'object') {
      satisfied = evalCell(board, cond);
    }

    if (satisfied && !autoAdvancedRef.current) {
      autoAdvancedRef.current = true;
      // 조건 스텝은 자동으로 다음 단계로 이동
      nextStep();
    }
  }, [isVisible, currentStepData, board, nextStep]);

  // RN: 셀 좌표 기반 하이라이트 박스 계산
  const updateHighlightPosition = useCallback(async () => {
    try {
      const cells = currentStepData.highlight?.cells;
      if (!isVisible || !cells || cells.length === 0 || !getCellRect) {
        setHighlightRect(null);
        return;
      }
      const rects = await Promise.all(cells.map(({ row, col }) => getCellRect(row, col)));
      const minLeft = Math.min(...rects.map(r => r.left));
      const minTop = Math.min(...rects.map(r => r.top));
      const maxRight = Math.max(...rects.map(r => r.left + r.width));
      const maxBottom = Math.max(...rects.map(r => r.top + r.height));
      const padding = Number(currentStepData.highlight?.padding ?? 4);
      setHighlightRect({
        left: minLeft - padding,
        top: minTop - padding,
        width: (maxRight - minLeft) + padding * 2,
        height: (maxBottom - minTop) + padding * 2,
      });
    } catch (e) {
      setHighlightRect(null);
    }
  }, [isVisible, currentStepData.highlight, getCellRect]);

  useEffect(() => {
    if (!isVisible) return;
    updateHighlightPosition();
  }, [isVisible, currentStep, updateHighlightPosition]);

  if (!isVisible) return children || null;

  // 현재 스텝에 하이라이트가 있는지 확인 (RN cells 기준)
  const hasHighlight = !!(currentStepData.highlight?.cells?.length > 0);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {children}
      {isVisible && (
        <>
          {/* 1) 비인터랙티브 오버레이 레이어 (전역 패스스루) */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* 딤드 배경 */}
            <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }]} />
            {/* RN 하이라이트 박스 */}
            {hasHighlight && highlightRect && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: highlightRect.left,
                  top: highlightRect.top,
                  width: highlightRect.width,
                  height: highlightRect.height,
                  zIndex: 1001,
                  borderWidth: 3,
                  borderColor: '#4c6ef5',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  ...Platform.select({ ios: { shadowColor: '#4c6ef5', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 6 } })
                }}
              />
            )}
          </View>

          {/* 2) 인터랙티브 툴팁 레이어 (하단 고정) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tooltipWrapper,
              { zIndex: 2000, position: 'absolute', left: 0, right: 0, bottom: 0 }
            ]}
          >
            <Animated.View style={[styles.tooltipContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} pointerEvents="auto">
              <TouchableOpacity style={styles.skipButton} onPress={onSkip || skipTutorial}>
                <Text style={styles.skipButtonText}>SKIP</Text>
              </TouchableOpacity>
              <View style={styles.tooltipContent}>
                <View style={styles.avatarContainer}>
                  <Image source={require('../assets/images/nurse.png')} style={styles.avatar} resizeMode="contain" />
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.speechBubble}>
                    <View style={styles.speechBubbleTriangle} />
                    <TypeWriterText
                      text={currentStepData.text || '안녕하세요. 선생님! 저는 선생님을 보조할 간호사 아크라입니다.'}
                      style={styles.tooltipText}
                      onTypingDone={() => setShowNextButton(currentStepData.showNextButton === true)}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.bottomContainer}>
                {currentLevelSteps.length > 1 && (
                  <View style={styles.progressContainer}>
                    {currentLevelSteps.map((_, index) => (
                      <View key={index} style={[styles.progressDot, index === currentStep && styles.progressDotActive]} />
                    ))}
                  </View>
                )}
                {showNextButton && (
                  <TouchableOpacity style={styles.nextButton} onPress={nextStep} activeOpacity={0.8}>
                    <Text style={styles.nextButtonText}>다음</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </Animated.View>
        </>
      )}
    </View>
  );
};

// 스타일은 tutorialStyles.js에서 가져와 사용

export { handleSkipTutorial };
export default TutorialScreen;