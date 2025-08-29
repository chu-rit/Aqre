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
  const [highlightRects, setHighlightRects] = useState([]);
  const [boardRect, setBoardRect] = useState(null);
  const autoAdvancedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;

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
    // RN 상태 하이라이트도 초기화하여 즉시 테두리 제거
    try {
      setHighlightRect(null);
      setHighlightRects([]);
    } catch {}
  }, []);

  // 단계 소스: 전달된 steps prop 우선, 없으면 levelId로 조회
  const currentLevelSteps = (Array.isArray(steps) && steps.length > 0)
    ? steps
    : (getTutorialStepsByLevel(levelId) || []);
  const currentStepData = currentLevelSteps[currentStep] || {};

  // 스텝 변경/표시 상태 변경 시, 스텝 진입과 동시에 차단/버튼 노출 상태를 반영
  // (텍스트 타이핑 완료를 기다리지 않고 즉시 적용)
  useEffect(() => {
    setShowNextButton(!!currentStepData.showNextButton);
  }, [currentStep, isVisible, currentStepData.showNextButton]);

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
    if (typeof document !== 'undefined' && (currentStepData.highlight?.selectors || currentStepData.highlight?.selectorGroups)) {
      try {
        const boxes = [];
        const padding = Number(currentStepData.highlight?.padding ?? 4);
        const useMultiple = !!currentStepData.highlight?.multipleBoxes;
        const blockAll = !!currentStepData.showNextButton; // showNextButton=true이면 모든 클릭 차단

        const processSelector = (selector) => {
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
              // RN Web의 오버레이 컨테이너는 뷰포트 기준 절대 위치이므로
              // getBoundingClientRect()의 뷰포트 좌표를 그대로 사용한다.
              boxes.push({
                left: r.left,
                top: r.top,
                right: r.left + r.width,
                bottom: r.top + r.height,
              });

              // --- 버튼(타겟 요소) 클론 생성 및 배치 ---
              try {
                // 원본 요소 식별자 부여
                if (!el.dataset.highlightId) {
                  el.dataset.highlightId = `tut-${Math.random().toString(36).slice(2)}`;
                }
                const targetId = el.dataset.highlightId;

                // 기존 동일 타겟의 클론이 있으면 재사용, 없으면 생성
                let clone = document.querySelector(`.tutorial-clone-element[data-target-id="${targetId}"]`);
                if (!clone) {
                  clone = el.cloneNode(true);
                  // id 충돌 방지
                  if (clone.id) clone.id = `${clone.id}__tutorial_clone`;
                  clone.classList.add('tutorial-clone-element');
                  clone.setAttribute('data-target-id', targetId);
                  // 클릭을 원본으로 위임 (blockAll=false일 때만 허용)
                  if (!blockAll) {
                    clone.addEventListener('click', (e) => {
                      try {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof el.click === 'function') el.click();
                      } catch {}
                    });
                  }
                  document.body.appendChild(clone);
                }

                // 스타일 적용: 뷰포트 기준 고정 배치
                const style = clone.style;
                style.position = 'fixed';
                style.left = '0px';
                style.top = '0px';
                const rw = Math.round(r.width);
                const rh = Math.round(r.height);
                const rx = Math.round(r.left);
                const ry = Math.round(r.top);
                style.width = `${rw}px`;
                style.height = `${rh}px`;
                style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
                style.transformOrigin = 'top left';
                style.willChange = 'transform';
                style.zIndex = '2003'; // 하이라이트 박스(2002)보다 위
                // showNextButton=true이면 클릭 비활성화
                style.pointerEvents = blockAll ? 'none' : 'auto';
                style.overflow = 'visible';
                style.boxSizing = 'border-box';
                style.margin = '0';

                // 스크롤/리사이즈 시 위치 업데이트 핸들러
                if (!el._tutorialUpdatePosition) {
                  el._tutorialUpdatePosition = () => {
                    try {
                      const rr = el.getBoundingClientRect();
                      const c = document.querySelector(`.tutorial-clone-element[data-target-id="${targetId}"]`);
                      if (!c) return;
                      const cs = c.style;
                      const rw2 = Math.round(rr.width);
                      const rh2 = Math.round(rr.height);
                      const rx2 = Math.round(rr.left);
                      const ry2 = Math.round(rr.top);
                      cs.width = `${rw2}px`;
                      cs.height = `${rh2}px`;
                      cs.transform = `translate3d(${rx2}px, ${ry2}px, 0)`;
                    } catch {}
                  };
                  window.addEventListener('scroll', el._tutorialUpdatePosition, true);
                  window.addEventListener('resize', el._tutorialUpdatePosition);
                }
              } catch {}
            }
          });
        };

        // 1) 그룹 기반: selectorGroups가 있으면 그룹별로 하나의 박스 생성
        if (Array.isArray(currentStepData.highlight?.selectorGroups) && currentStepData.highlight.selectorGroups.length > 0) {
          const groupRects = [];
          currentStepData.highlight.selectorGroups.forEach((group) => {
            const groupBoxes = [];
            (group || []).forEach((sel) => processSelector(sel));
            // processSelector가 boxes에 모두 push하므로, 이번 그룹에 해당하는 요소만 따로 모으려면
            // 임시 분리 로직이 필요하지만, 간결성을 위해 새로 수집
            (group || []).forEach((sel) => {
              let q = sel;
              const isKV = typeof sel === 'string' && sel.includes('=') && !sel.includes('[') && !sel.includes(']') && !sel.includes(' ') && !sel.includes('.') && !sel.includes('#');
              if (isKV) {
                const eqIdx = sel.indexOf('=');
                const key = sel.slice(0, eqIdx).trim();
                const value = sel.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
                q = `[${key}="${value}"]`;
              }
              document.querySelectorAll(q).forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r && r.width > 0 && r.height > 0) {
                  groupBoxes.push({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height });
                }
              });
            });
            if (groupBoxes.length > 0) {
              const minLeft = Math.min(...groupBoxes.map(b => b.left));
              const minTop = Math.min(...groupBoxes.map(b => b.top));
              const maxRight = Math.max(...groupBoxes.map(b => b.right));
              const maxBottom = Math.max(...groupBoxes.map(b => b.bottom));
              groupRects.push({
                left: minLeft - padding,
                top: minTop - padding,
                width: (maxRight - minLeft) + padding * 2,
                height: (maxBottom - minTop) + padding * 2,
              });
            }
          });
          if (groupRects.length > 0) {
            setHighlightRects(groupRects);
            setHighlightRect(null);
          } else {
            setHighlightRect(null);
            setHighlightRects([]);
          }
        } else if (Array.isArray(currentStepData.highlight?.selectors)) {
          // 2) 기존: selectors 전체를 대상으로
          currentStepData.highlight.selectors.forEach((selector) => processSelector(selector));
          if (boxes.length > 0) {
            if (useMultiple) {
              const rects = boxes.map(b => ({
                left: b.left - padding,
                top: b.top - padding,
                width: (b.right - b.left) + padding * 2,
                height: (b.bottom - b.top) + padding * 2,
              }));
              setHighlightRects(rects);
              setHighlightRect(null);
            } else {
              const minLeft = Math.min(...boxes.map(b => b.left));
              const minTop = Math.min(...boxes.map(b => b.top));
              const maxRight = Math.max(...boxes.map(b => b.right));
              const maxBottom = Math.max(...boxes.map(b => b.bottom));
              setHighlightRect({
                left: minLeft - padding,
                top: minTop - padding,
                width: (maxRight - minLeft) + padding * 2,
                height: (maxBottom - minTop) + padding * 2,
              });
              setHighlightRects([]);
            }
          } else {
            setHighlightRect(null);
            setHighlightRects([]);
          }
        }
      } catch (e) {
        setHighlightRect(null);
        setHighlightRects([]);
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

  // 하이라이트 펄스 애니메이션 (살짝 커졌다 작아졌다)
  useEffect(() => {
    const hasAnyHighlight = !!highlightRect || (Array.isArray(highlightRects) && highlightRects.length > 0);
    if (!isVisible || !hasAnyHighlight) {
      return;
    }
    pulseAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [isVisible, highlightRect, highlightRects, pulseAnim]);

  // 보드 영역(rect) 계산: 하이라이트가 있을 때만 보드 딤을 비우기 위해 사용
  useEffect(() => {
    if (!isVisible) {
      setBoardRect(null);
      return;
    }
    const node = typeof document !== 'undefined' ? document.querySelector('[data-testid="game-board"]') : null;
    if (!node) {
      setBoardRect(null);
      return;
    }
    try {
      const r = node.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        setBoardRect({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
      } else {
        setBoardRect(null);
      }
    } catch {
      setBoardRect(null);
    }
  }, [isVisible, currentStep, highlightRect]);

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

  // RN: 셀 좌표 기반 하이라이트 박스 계산 (cells: 1D 또는 2D 배열 지원)
  const updateHighlightPosition = useCallback(async () => {
    try {
      const cells = currentStepData.highlight?.cells;
      const hasCells = Array.isArray(cells) && cells.length > 0;
      // 셀 기반 하이라이트가 없으면 좌표를 건드리지 않음
      if (!isVisible || !hasCells || !getCellRect) {
        return;
      }
      const padding = Number(currentStepData.highlight?.padding ?? 4);
      const useMultiple = !!currentStepData.highlight?.multipleBoxes;
      
      // 1) cells가 2차원 배열이면 그룹 모드로 처리
      if (Array.isArray(cells[0])) {
        const groupRects = [];
        for (const group of cells) {
          const groupRectsMeasured = await Promise.all((group || []).map(({ row, col }) => getCellRect(row, col)));
          if (groupRectsMeasured.length > 0) {
            const minLeft = Math.min(...groupRectsMeasured.map(r => r.left));
            const minTop = Math.min(...groupRectsMeasured.map(r => r.top));
            const maxRight = Math.max(...groupRectsMeasured.map(r => r.left + r.width));
            const maxBottom = Math.max(...groupRectsMeasured.map(r => r.top + r.height));
            groupRects.push({
              left: minLeft - padding,
              top: minTop - padding,
              width: (maxRight - minLeft) + padding * 2,
              height: (maxBottom - minTop) + padding * 2,
            });
          }
        }
        if (groupRects.length > 0) {
          setHighlightRects(groupRects);
          setHighlightRect(null);
          return;
        } else {
          setHighlightRect(null);
          setHighlightRects([]);
          return;
        }
      }

      // 2) 1차원 배열: cells 전체를 대상으로
      const rects = await Promise.all(cells.map(({ row, col }) => getCellRect(row, col)));
      if (useMultiple) {
        const perCellRects = rects.map(r => ({
          left: r.left - padding,
          top: r.top - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        }));
        setHighlightRects(perCellRects);
        setHighlightRect(null);
      } else {
        const minLeft = Math.min(...rects.map(r => r.left));
        const minTop = Math.min(...rects.map(r => r.top));
        const maxRight = Math.max(...rects.map(r => r.left + r.width));
        const maxBottom = Math.max(...rects.map(r => r.top + r.height));
        setHighlightRect({
          left: minLeft - padding,
          top: minTop - padding,
          width: (maxRight - minLeft) + padding * 2,
          height: (maxBottom - minTop) + padding * 2,
        });
        setHighlightRects([]);
      }
    } catch (e) {
      setHighlightRect(null);
      setHighlightRects([]);
    }
  }, [isVisible, currentStepData.highlight, getCellRect]);

  useEffect(() => {
    if (!isVisible) return;
    // 셀 하이라이트가 있을 때 위치 업데이트 (1D/2D 모두)
    const hasCells = Array.isArray(currentStepData?.highlight?.cells) && currentStepData.highlight.cells.length > 0;
    if (hasCells) {
      updateHighlightPosition();
    }
  }, [isVisible, currentStep, updateHighlightPosition, currentStepData]);

  if (!isVisible) return children || null;

  // 현재 스텝 하이라이트: 단일/다중 모두 고려
  const rectsToRender = (highlightRects && highlightRects.length > 0)
    ? highlightRects
    : (highlightRect ? [highlightRect] : []);
  const hasHighlight = rectsToRender.length > 0;
  const isSingleHighlight = rectsToRender.length === 1;
  const isSelectorBased = Array.isArray(currentStepData?.highlight?.selectors) && currentStepData.highlight.selectors.length > 0;
  const allowOnlyHighlight = !showNextButton && isSingleHighlight;

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
            {/* 딤드 배경 렌더링 정책 */}
            {hasHighlight && isSingleHighlight && isSelectorBased ? (
              // 단일 하이라이트일 때: 해당 영역을 제외하고 상/하/좌/우로 나눠 딤을 깔아 홀을 만든다
              (() => {
                const r = rectsToRender[0];
                return (
                  <>
                    {/* 상단 딤 */}
                    <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: 0, right: 0, top: 0, height: r.top, zIndex: 1000 }]} />
                    {/* 하단 딤 */}
                    <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: 0, right: 0, top: r.top + r.height, bottom: 0, zIndex: 1000 }]} />
                    {/* 좌측 딤 (하이라이트 수직 범위에 한정) */}
                    <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: 0, top: r.top, width: r.left, height: r.height, zIndex: 1000 }]} />
                    {/* 우측 딤 (하이라이트 수직 범위에 한정) */}
                    <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: r.left + r.width, right: 0, top: r.top, height: r.height, zIndex: 1000 }]} />
                  </>
                );
              })()
            ) : hasHighlight && boardRect ? (
              // 기본: 보드 영역만 밝게 유지 (셀/그룹 하이라이트 등)
              <>
                <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: 0, right: 0, top: 0, height: boardRect.top, zIndex: 1000 }]} />
                <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: 0, right: 0, top: boardRect.bottom, bottom: 0, zIndex: 1000 }]} />
                <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: 0, top: boardRect.top, width: boardRect.left, height: boardRect.height, zIndex: 1000 }]} />
                <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', left: boardRect.right, right: 0, top: boardRect.top, height: boardRect.height, zIndex: 1000 }]} />
              </>
            ) : (
              // 하이라이트가 없으면 전체 딤
              <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }]} />
            )}

            {/* showNextButton=false && 하이라이트가 있을 때, 하이라이트 영역 외부만 터치 차단하는 블로커 4개 */}
            {allowOnlyHighlight && (
              <>
                {/* 상단 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, height: rectsToRender[0].top, zIndex: 2001 }}
                />
                {/* 하단 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: 0, right: 0, top: rectsToRender[0].top + rectsToRender[0].height, bottom: 0, zIndex: 2001 }}
                />
                {/* 좌측 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: 0, top: rectsToRender[0].top, width: rectsToRender[0].left, height: rectsToRender[0].height, zIndex: 2001 }}
                />
                {/* 우측 블로커 */}
                <View
                  pointerEvents="auto"
                  style={{ position: 'absolute', left: rectsToRender[0].left + rectsToRender[0].width, right: 0, top: rectsToRender[0].top, height: rectsToRender[0].height, zIndex: 2001 }}
                />
              </>
            )}
            {/* RN 하이라이트 박스: 항상 렌더 (스텝 종료 시 상태 초기화로 사라지게 함) */}
            {hasHighlight && rectsToRender.map((r, idx) => (
              <Animated.View
                key={`hl-${idx}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: r.left,
                  top: r.top,
                  width: r.width,
                  height: r.height,
                  zIndex: 2002,
                  borderWidth: 5,
                  borderColor: '#FFD400',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  transform: [
                    { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.08] }) },
                  ],
                  elevation: 0,
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  shadowColor: 'transparent',
                }}
              />
            ))}
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