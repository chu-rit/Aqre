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

  // '<br>' 태그를 줄바꿈으로 변환
  const processedText = React.useMemo(() => {
    if (typeof text !== 'string') return '';
    return text.replace(/<br\s*\/?>(\r\n|\n|\r)?/gi, '\n');
  }, [text]);

  useEffect(() => {
    if (currentIndex < processedText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + processedText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else if (onTypingDone) {
      onTypingDone();
    }
  }, [currentIndex, processedText, onTypingDone]);

  useEffect(() => {
    // 텍스트가 바뀌면 리셋
    setDisplayText('');
    setCurrentIndex(0);
  }, [processedText]);

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

  // 스텝 변경/표시 상태 변경 시 Next 버튼을 기본적으로 감춤
  useEffect(() => {
    setShowNextButton(false);
  }, [currentStep, isVisible]);

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
    
    // 현재 스텝에 하이라이트가 있으면 적용 (selectors 기반)
    if (currentStepData.highlight?.selectors && typeof document !== 'undefined') {
      try {
        const boxes = [];
        currentStepData.highlight.selectors.forEach((selector) => {
          let query = selector;
          const isPlainKeyValue =
            typeof selector === 'string' &&
            selector.includes('=') &&
            !selector.includes('[') &&
            !selector.includes(']') &&
            !selector.includes(' ') &&
            !selector.includes('.') &&
            !selector.includes('#');

          if (isPlainKeyValue) {
            const eqIdx = selector.indexOf('=');
            const key = selector.slice(0, eqIdx).trim();
            const value = selector.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
            query = `[${key}="${value}"]`;
          }

          const nodeList = document.querySelectorAll(query);
          nodeList.forEach((el) => {
            const r = el.getBoundingClientRect();
            // 무효 rect 제외
            if (r && r.width > 0 && r.height > 0) {
              boxes.push({
                left: r.left + (window.scrollX || window.pageXOffset),
                top: r.top + (window.scrollY || window.pageYOffset),
                right: r.left + r.width + (window.scrollX || window.pageXOffset),
                bottom: r.top + r.height + (window.scrollY || window.pageYOffset),
              });
            }
          });
        });

        if (boxes.length > 0) {
          const minLeft = Math.min(...boxes.map(b => b.left));
          const minTop = Math.min(...boxes.map(b => b.top));
          const maxRight = Math.max(...boxes.map(b => b.right));
          const maxBottom = Math.max(...boxes.map(b => b.bottom));
          const padding = Number(currentStepData.highlight?.padding ?? 4);
          setHighlightRect({
            left: minLeft - padding,
            top: minTop - padding,
            width: (maxRight - minLeft) + padding * 2,
            height: (maxBottom - minTop) + padding * 2,
          });
        } else {
          setHighlightRect(null);
        }
      } catch (e) {
        setHighlightRect(null);
      }
    }
  }, [currentStep, currentStepData.highlight, isVisible]);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
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
      
      return () => {
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

  // 현재 스텝 하이라이트: cells/selector 기반 모두 highlightRect 존재 여부로 판단
  const hasHighlight = !!highlightRect;
  const allowOnlyHighlight = !showNextButton && hasHighlight;

  return (
    <View
      style={[
        styles.container,
        isVisible ? styles.absoluteFill : null,
        { zIndex: 3000, position: isVisible ? 'absolute' : 'relative' }
      ]}
      pointerEvents="box-none"
    >
      {children}
      {isVisible && (
        <>
          {/* 1) 오버레이 레이어: showNextButton=true 이면 전체 차단, false 이고 하이라이트가 있으면 하이라이트만 통과 */}
          <View
            pointerEvents={showNextButton ? 'auto' : (allowOnlyHighlight ? 'box-none' : 'none')}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {/* 딤드 배경 (항상 시각적 오버레이, 터치는 차단하지 않음) */}
            <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }]} />

            {/* showNextButton=false && 하이라이트가 있을 때, 하이라이트 영역 외부만 터치 차단하는 블로커 4개 */}
            {allowOnlyHighlight && (
              <>
                {/* 상단 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, height: highlightRect.top, zIndex: 1002 }}
                />
                {/* 하단 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: 0, right: 0, top: highlightRect.top + highlightRect.height, bottom: 0, zIndex: 1002 }}
                />
                {/* 좌측 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: 0, top: highlightRect.top, width: highlightRect.left, height: highlightRect.height, zIndex: 1002 }}
                />
                {/* 우측 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: highlightRect.left + highlightRect.width, right: 0, top: highlightRect.top, height: highlightRect.height, zIndex: 1002 }}
                />
              </>
            )}
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
                      onTypingDone={() => setShowNextButton(!!currentStepData.showNextButton)}
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