import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { getTutorialStepsByLevel } from '../src/logic/tutorialSteps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path } from 'react-native-svg';
import styles from './tutorialStyles';
import { measureSelector } from '../utils/refRegistry';
import * as Localization from 'expo-localization';

// 정적 Dimensions 제거 - useWindowDimensions 훅 사용

// 타이핑 효과를 위한 컴포넌트
const TypeWriterText = React.memo(({ text, style, onTypingDone }) => {
  const [displayText, setDisplayText] = useState('');
  const typingSpeed = 15;
  const onTypingDoneRef = useRef(onTypingDone);
  onTypingDoneRef.current = onTypingDone;
  const generationRef = useRef(0);

  const charArray = React.useMemo(() => {
    if (typeof text !== 'string' || !text) return [];
    const processed = text.replace(/<br\s*\/?>(\r\n|\n|\r)?/gi, '\n');
    return Array.from(processed);
  }, [text]);

  useEffect(() => {
    const gen = ++generationRef.current;
    setDisplayText('');
    let i = 0;
    const tick = () => {
      if (gen !== generationRef.current) return;
      if (i < charArray.length) {
        const ch = charArray[i];
        if (ch === undefined || ch === null) return;
        setDisplayText(prev => prev + ch);
        i++;
        setTimeout(tick, typingSpeed);
      } else if (charArray.length > 0 && onTypingDoneRef.current) {
        onTypingDoneRef.current();
      }
    };
    if (charArray.length > 0) setTimeout(tick, typingSpeed);
    return () => { generationRef.current++; };
  }, [charArray]);

  const mergedStyle = [
    {
      fontSize: 16,
      lineHeight: 22,
    },
    style
  ];

  return (
    <View style={{ position: 'relative' }}>
      <Text allowFontScaling={false} style={[mergedStyle, { opacity: 0 }]}>{charArray.join('')}</Text>
      <Text allowFontScaling={false} style={[mergedStyle, { position: 'absolute', top: 0, left: 0, right: 0 }]}>{displayText}</Text>
    </View>
  );
});

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
    const skippedTutorials = await AsyncStorage.getItem('skippedTutorials') || '{}';
    const skipped = JSON.parse(skippedTutorials);
    completed[levelKey] = true;
    skipped[levelKey] = true;
    await Promise.all([
      AsyncStorage.setItem('completedTutorials', JSON.stringify(completed)),
      AsyncStorage.setItem('skippedTutorials', JSON.stringify(skipped)),
    ]);
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
  selectedRule = null,
  hasCompletedTutorialsWithoutSkipping = false,
  onGrantHintPoints,
  onStepChange,
  hintMode = false,
  bottomInset = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState(() => {
    const locales = Localization.getLocales();
    const locale = locales?.[0]?.languageCode || locales?.[0]?.languageTag || '';
    return String(locale).toLowerCase().startsWith('en') ? 'en' : 'ko';
  });
  const [showNextButton, setShowNextButton] = useState(false); // 기본값으로 false로 설정
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [highlightRect, setHighlightRect] = useState(null);
  const [highlightRects, setHighlightRects] = useState([]);
  const [boardRect, setBoardRect] = useState(null);
  const [measurementVersion, setMeasurementVersion] = useState(0);
  const [tooltipAtTop, setTooltipAtTop] = useState(false);
  const tooltipAtTopRef = useRef(false);
  useEffect(() => { tooltipAtTopRef.current = tooltipAtTop; }, [tooltipAtTop]);
  const [highlightReady, setHighlightReady] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const overlayRef = useRef(null);
  const autoAdvancedRef = useRef(false);
  const grantedHintStepsRef = useRef(new Set());
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [claimedRewards, setClaimedRewards] = useState({});
  const { width, height } = useWindowDimensions();

  // 모든 하이라이트와 클론 요소를 제거하는 함수
  const cleanupAllHighlights = useCallback(() => {
    // 네이티브(iOS/Android)에서는 DOM이 없으므로 RN 상태만 초기화 후 종료
    if (Platform.OS !== 'web') {
      try {
        setHighlightRect(null);
        setHighlightRects([]);
      } catch {}
      return;
    }
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

  useEffect(() => {
    AsyncStorage.getItem('claimedHintRewards').then(json => {
      if (json) setClaimedRewards(JSON.parse(json));
    });
  }, []);

  // 단계 소스: 전달된 steps prop 우선, 없으면 levelId로 조회
  const sourceSteps = (Array.isArray(steps) && steps.length > 0)
    ? steps
    : (getTutorialStepsByLevel(levelId) || []);
  const currentLevelSteps = sourceSteps.filter(step => (
    (!step.requiresCompletedTutorialsWithoutSkipping || hasCompletedTutorialsWithoutSkipping) &&
    (!step.hintRewardKey || !claimedRewards[step.hintRewardKey])
  ));
  const currentStepData = currentLevelSteps[currentStep] || {};

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const json = await AsyncStorage.getItem('options');
        const options = json ? JSON.parse(json) : {};
        setLanguage(options.language === 'en' ? 'en' : 'ko');
      } catch {}
    };
    loadLanguage();
  }, []);

  // 스텝 변경/표시 상태 변경 시, 스텝 진입과 동시에 차단/버튼 노출 상태를 반영
  // (텍스트 타이핑 완료를 기다리지 않고 즉시 적용)
  useEffect(() => {
    setShowNextButton(!!currentStepData.showNextButton);
  }, [currentStep, isVisible, currentStepData.showNextButton]);

  useEffect(() => {
    const amount = Number(currentStepData.hintPoints);
    const rewardKey = currentStepData.hintRewardKey || `tutorial-${levelId}-step-${currentStep}`;
    if (!isVisible || !onGrantHintPoints || !Number.isFinite(amount) || amount <= 0 || grantedHintStepsRef.current.has(rewardKey)) return;
    grantedHintStepsRef.current.add(rewardKey);
    onGrantHintPoints(amount, rewardKey);
  }, [currentStep, currentStepData.hintPoints, currentStepData.hintRewardKey, isVisible, levelId, onGrantHintPoints]);

  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  // 스킵 버튼 핸들러 - 단순하게 onSkip 호출만 처리
  const skipTutorial = useCallback(async () => {
    cleanupAllHighlights();
    if (onSkip) {
      onSkip();
    } else if (onClose) {
      onClose();
    }
  }, [onSkip, onClose, cleanupAllHighlights]);

  // Native(Android/iOS) 하이라이트: refRegistry 기반 측정
  useEffect(() => {
    if (!isVisible || Platform.OS === 'web') return;
    const highlight = currentStepData.highlight;
    if (!highlight) {
      setHighlightRect(null);
      setHighlightRects([]);
      setTooltipAtTop(false);
      setHighlightReady(true);
      return;
    }

    const padding = Number(highlight.padding ?? 4);
    const useMultiple = !!highlight.multipleBoxes;
    const isRetry = measurementVersion > 0;

    const computeTooltipAtTop = (rect) => {
      return rect && (rect.top + rect.height / 2) > height * 0.70;
    };

    const measureSelectors = async () => {
      try {
        if (Array.isArray(highlight.selectorGroups) && highlight.selectorGroups.length > 0) {
          const groupRects = [];
          for (const group of highlight.selectorGroups) {
            const measured = await Promise.all((group || []).map(s => measureSelector(s)));
            const valid = measured.filter(r => r && r.width > 0 && r.height > 0);
            if (valid.length > 0) {
              const minLeft = Math.min(...valid.map(r => r.left));
              const minTop = Math.min(...valid.map(r => r.top));
              const maxRight = Math.max(...valid.map(r => r.right));
              const maxBottom = Math.max(...valid.map(r => r.bottom));
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
            setTooltipAtTop(computeTooltipAtTop(groupRects[0]));
            if (!isRetry) setHighlightReady(true);
          } else if (!isRetry) {
            setHighlightRect(null);
            setHighlightRects([]);
            setHighlightReady(true);
          }
        } else if (Array.isArray(highlight.selectors) && highlight.selectors.length > 0) {
          const measured = await Promise.all(highlight.selectors.map(s => measureSelector(s)));
          const valid = measured.filter(r => r && r.width > 0 && r.height > 0);
          if (valid.length > 0) {
            if (useMultiple) {
              const multiRects = valid.map(r => ({
                left: r.left - padding,
                top: r.top - padding,
                width: r.width + padding * 2,
                height: r.height + padding * 2,
              }));
              setHighlightRects(multiRects);
              setHighlightRect(null);
              setTooltipAtTop(computeTooltipAtTop(multiRects[0]));
              if (!isRetry) setHighlightReady(true);
            } else {
              const minLeft = Math.min(...valid.map(r => r.left));
              const minTop = Math.min(...valid.map(r => r.top));
              const maxRight = Math.max(...valid.map(r => r.right));
              const maxBottom = Math.max(...valid.map(r => r.bottom));
              const singleRect = {
                left: minLeft - padding,
                top: minTop - padding,
                width: (maxRight - minLeft) + padding * 2,
                height: (maxBottom - minTop) + padding * 2,
              };
              setHighlightRect(singleRect);
              setHighlightRects([]);
              setTooltipAtTop(computeTooltipAtTop(singleRect));
              if (!isRetry) setHighlightReady(true);
            }
          } else if (!isRetry) {
            setHighlightRect(null);
            setHighlightRects([]);
            setHighlightReady(true);
          }
        } else if (!isRetry) {
          setHighlightRect(null);
          setHighlightRects([]);
          setHighlightReady(true);
        }
      } catch {
        if (!isRetry) {
          setHighlightRect(null);
          setHighlightRects([]);
          setHighlightReady(true);
        }
      }
    };

    measureSelectors();
  }, [currentStep, currentStepData.highlight, isVisible, measurementVersion]);

  // Web 하이라이트: DOM 기반
  useEffect(() => {
    if (Platform.OS !== 'web') return;

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
        const overlayRect = overlayRef.current?.getBoundingClientRect?.() || { left: 0, top: 0 };
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
            if (el.classList.contains('tutorial-clone-element')) return;
            const r = el.getBoundingClientRect();
            // 무효 rect 제외
            if (r && r.width > 0 && r.height > 0) {
              // RN Web의 오버레이 컨테이너는 뷰포트 기준 절대 위치이므로
              // getBoundingClientRect()의 뷰포트 좌표를 그대로 사용한다.
              boxes.push({
                left: r.left - overlayRect.left,
                top: r.top - overlayRect.top,
                right: r.left - overlayRect.left + r.width,
                bottom: r.top - overlayRect.top + r.height,
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
                  clone.removeAttribute('data-testid');
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
                const rw = r.width;
                const rh = r.height;
                const rx = r.left;
                const ry = r.top;
                style.width = `${rw}px`;
                style.height = `${rh}px`;
                style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
                style.transformOrigin = 'top left';
                style.willChange = 'transform';
                style.zIndex = '2003'; // 하이라이트 박스(2002)보다 위
                // showNextButton=true이면 클릭 비활성화
                style.visibility = 'hidden';
                style.pointerEvents = 'none';
                style.overflow = 'visible';
                style.boxSizing = 'border-box';
                style.margin = '0';
                requestAnimationFrame(() => {
                  const cloneRect = clone.getBoundingClientRect();
                  const offsetX = r.left - cloneRect.left;
                  const offsetY = r.top - cloneRect.top;
                  if (offsetX || offsetY) {
                    style.transform = `translate3d(${rx + offsetX}px, ${ry + offsetY}px, 0)`;
                  }
                });

                // 스크롤/리사이즈 시 위치 업데이트 핸들러
                if (!el._tutorialUpdatePosition) {
                  el._tutorialUpdatePosition = () => {
                    try {
                      const rr = el.getBoundingClientRect();
                      const c = document.querySelector(`.tutorial-clone-element[data-target-id="${targetId}"]`);
                      if (!c) return;
                      const cs = c.style;
                      const rw2 = rr.width;
                      const rh2 = rr.height;
                      const rx2 = rr.left;
                      const ry2 = rr.top;
                      cs.width = `${rw2}px`;
                      cs.height = `${rh2}px`;
                      cs.transform = `translate3d(${rx2}px, ${ry2}px, 0)`;
                      requestAnimationFrame(() => {
                        const cloneRect = c.getBoundingClientRect();
                        const offsetX = rr.left - cloneRect.left;
                        const offsetY = rr.top - cloneRect.top;
                        if (offsetX || offsetY) {
                          cs.transform = `translate3d(${rx2 + offsetX}px, ${ry2 + offsetY}px, 0)`;
                        }
                      });
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
            setTooltipAtTop(groupRects[0] && (groupRects[0].top + groupRects[0].height / 2) > height * 0.70);
          } else {
            setHighlightRect(null);
            setHighlightRects([]);
            setTooltipAtTop(false);
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
              setTooltipAtTop(rects[0] && (rects[0].top + rects[0].height / 2) > height * 0.70);
            } else {
              const minLeft = Math.min(...boxes.map(b => b.left));
              const minTop = Math.min(...boxes.map(b => b.top));
              const maxRight = Math.max(...boxes.map(b => b.right));
              const maxBottom = Math.max(...boxes.map(b => b.bottom));
              const singleRect = {
                left: minLeft - padding,
                top: minTop - padding,
                width: (maxRight - minLeft) + padding * 2,
                height: (maxBottom - minTop) + padding * 2,
              };
              setHighlightRect(singleRect);
              setHighlightRects([]);
              setTooltipAtTop(singleRect && (singleRect.top + singleRect.height / 2) > height * 0.70);
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
    setHighlightReady(true);
  }, [currentStep, currentStepData.highlight, isVisible, measurementVersion]);

  // Web용 measurementVersion 재시도 (native에서는 제거 - 깜빡임 방지)
  useEffect(() => {
    if (!isVisible || Platform.OS !== 'web') return undefined;
    const firstFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMeasurementVersion(version => version + 1));
    });
    const retryTimer = setTimeout(() => {
      setMeasurementVersion(version => version + 1);
    }, 300);
    return () => {
      cancelAnimationFrame(firstFrame);
      clearTimeout(retryTimer);
    };
  }, [currentStep, isVisible]);


  const startTooltipAnimation = useCallback(() => {
    if (fadeAnim._value > 0.5) {
      fadeAnim.setValue(1);
      return;
    }
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const hideTooltipAnimation = useCallback(() => {
    return new Promise((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }, [fadeAnim]);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setHighlightReady(false);
      cleanupAllHighlights();
      
      return () => {
        cleanupAllHighlights();
      };
    }
  }, [isVisible, cleanupAllHighlights]);

  // 툴팁 애니메이션 시작: 하이라이트가 없으면 즉시, 있으면 측정 완료 후
  useEffect(() => {
    if (!isVisible) return;
    const hasHighlightConfig = !!currentStepData?.highlight;
    if (!hasHighlightConfig || highlightReady) {
      startTooltipAnimation();
    }
  }, [isVisible, currentStep, highlightReady, currentStepData, startTooltipAnimation]);

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
    if (Platform.OS === 'web') {
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
    } else {
      measureSelector('data-testid=board').then(r => {
        if (r && r.width > 0 && r.height > 0) {
          setBoardRect({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
        } else {
          setBoardRect(null);
        }
      }).catch(() => setBoardRect(null));
    }
  }, [isVisible, currentStep, highlightRect]);

  // 다음 스텝으로 이동하는 함수
  const nextStep = useCallback(() => {
    if (currentStep < currentLevelSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setShowNextButton(currentLevelSteps[currentStep + 1]?.showNextButton || false);
      setHighlightReady(false);
    } else {
      hideTooltipAnimation().then(() => {
        cleanupAllHighlights();
        if (onClose) {
          onClose();
        } else if (onSkip) {
          onSkip();
        }
      });
    }
  }, [currentStep, currentLevelSteps, onClose, onSkip, hideTooltipAnimation, cleanupAllHighlights]);

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
      if (c.hintMode !== undefined) return hintMode === c.hintMode;
      if (c.rule !== undefined) return selectedRule === c.rule;
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
  }, [isVisible, currentStepData, board, selectedRule, hintMode, nextStep]);

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
          setTooltipAtTop(groupRects[0] && (groupRects[0].top + groupRects[0].height / 2) > height * 0.70);
          return;
        } else {
          setHighlightRect(null);
          setHighlightRects([]);
          setTooltipAtTop(false);
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
        setTooltipAtTop(perCellRects[0] && (perCellRects[0].top + perCellRects[0].height / 2) > height * 0.70);
      } else {
        const minLeft = Math.min(...rects.map(r => r.left));
        const minTop = Math.min(...rects.map(r => r.top));
        const maxRight = Math.max(...rects.map(r => r.left + r.width));
        const maxBottom = Math.max(...rects.map(r => r.top + r.height));
        const singleRect = {
          left: minLeft - padding,
          top: minTop - padding,
          width: (maxRight - minLeft) + padding * 2,
          height: (maxBottom - minTop) + padding * 2,
        };
        setHighlightRect(singleRect);
        setHighlightRects([]);
        setTooltipAtTop(singleRect && (singleRect.top + singleRect.height / 2) > height * 0.70);
      }
    } catch (e) {
      setHighlightRect(null);
      setHighlightRects([]);
    }
    setHighlightReady(true);
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

  return (
    <View
      ref={overlayRef}
      style={[
        styles.container,
        isVisible ? styles.absoluteFill : null,
        { zIndex: 50, elevation: 50, position: isVisible ? 'absolute' : 'relative' }
      ]}
      pointerEvents="box-none"
    >
      {children}
      {isVisible && (
        <>
          {/* === 레이어 1: 딤 배경 (시각용, 터치 없음) === */}
          {hasHighlight && isSingleHighlight ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width, height, zIndex: 1, elevation: 10 }}>
              <Svg width={width} height={height}>
                <Path d={`M0,0 H${width} V${height} H0 Z M${rectsToRender[0].left},${rectsToRender[0].top} h${rectsToRender[0].width} v${rectsToRender[0].height} h-${rectsToRender[0].width} Z`} fill="rgba(0,0,0,0.6)" fillRule="evenodd" />
              </Svg>
            </View>
          ) : (
            <View pointerEvents="none" style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, elevation: 10 }]} />
          )}

          {/* === 레이어 1.5: 터치 차단 === */}
          {/* showNextButton=true: 전체 차단 (툴팁은 zIndex 20에서 작동) */}
          {/* showNextButton=false: 하이라이트 영역만 터치 통과, 나머지 차단 */}
          {showNextButton ? (
            <View pointerEvents="auto" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, backgroundColor: 'transparent' }} />
          ) : hasHighlight && isSingleHighlight ? (() => {
            const r = rectsToRender[0];
            return (
              <>
                <View pointerEvents="auto" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, r.top), zIndex: 2, backgroundColor: 'rgba(0,0,0,0.01)' }} />
                <View pointerEvents="auto" style={{ position: 'absolute', top: r.top + r.height, left: 0, right: 0, bottom: 0, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.01)' }} />
                <View pointerEvents="auto" style={{ position: 'absolute', top: r.top, left: 0, width: Math.max(0, r.left), height: r.height, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.01)' }} />
                <View pointerEvents="auto" style={{ position: 'absolute', top: r.top, left: r.left + r.width, right: 0, height: r.height, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.01)' }} />
              </>
            );
          })() : (
            <View pointerEvents="auto" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.01)' }} />
          )}

          {/* === 레이어 2: 하이라이트 박스 === */}
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
                zIndex: 2,
                borderWidth: 5,
                borderColor: '#FFD400',
                borderRadius: 8,
                backgroundColor: 'transparent',
                transform: [
                  { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.08] }) },
                ],
              }}
            />
          ))}

          {/* === 레이어 3: 툴팁 === */}
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.tooltipWrapper,
              {
                zIndex: 20,
                elevation: 20,
                position: 'absolute',
                left: 0,
                right: 0,
                [tooltipAtTop ? 'top' : 'bottom']: 0,
                justifyContent: tooltipAtTop ? 'flex-start' : 'flex-end',
                paddingTop: tooltipAtTop ? 60 : 0,
                paddingBottom: tooltipAtTop ? 0 : (40 + bottomInset),
              }
            ]}
          >
            <Animated.View style={[styles.tooltipContainer, { opacity: fadeAnim }]} pointerEvents="auto">
              <TouchableOpacity
                style={styles.skipButton}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                onPress={onSkip || skipTutorial}
              >
                <Text allowFontScaling={false} style={styles.skipButtonText}>SKIP</Text>
              </TouchableOpacity>
              <View style={styles.tooltipContent}>
                <View style={styles.avatarContainer}>
                  <Image source={require('../assets/robot1.png')} style={styles.avatar} resizeMode="contain" />
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.speechBubble}>
                    <View style={styles.speechBubbleTriangle} />
                    <TypeWriterText
                      text={language === 'en'
                        ? (currentStepData.textEn || currentStepData.text || "Hello! I'm Arc, an AI robot here to help you solve puzzles.")
                        : (currentStepData.text || '안녕하세요. 저는 퍼즐을 푸는 것을 도울 AI 로봇 아크입니다.')}
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
                    <Text allowFontScaling={false} style={styles.nextButtonText}>{language === 'en' ? 'NEXT' : '다음'}</Text>
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