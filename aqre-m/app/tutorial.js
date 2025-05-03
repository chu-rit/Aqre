import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';

// 레벨별 튜토리얼 단계 정의
const tutorialSteps = {
  0: [
    { 
      text: '첫 번째 레벨의 첫 번째 튜토리얼 단계입니다.', 
      highlight: { cells: [[0,0], [0,1]] },
      allowedCells: [[0,0], [0,1]],
      showNextButton: true
    },
    {
      text: '첫 번째 레벨의 두 번째 튜토리얼 단계입니다.',
      highlight: { cells: [[1,1], [1,2]] },
      allowedCells: [[1,1], [1,2]],
      showNextButton: true
    }
  ],
  // 다른 레벨들의 튜토리얼 단계들...
};

export const TutorialScreen = ({ 
  levelId,
  onClose, 
  onHighlight, 
  onAllowedCells 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);

  const steps = tutorialSteps[levelId] || [];

  useEffect(() => {
    // 각 단계별 하이라이트 및 허용된 셀 처리
    if (steps[currentStep].highlight) {
      onHighlight(steps[currentStep].highlight.cells || []);
    }
    
    if (steps[currentStep].allowedCells) {
      onAllowedCells(steps[currentStep].allowedCells);
    }

    setShowNextButton(steps[currentStep].showNextButton || false);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <View style={styles.tutorialOverlay}>
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={onClose}
      >
        <Text style={styles.skipButtonText}>-SKIP-</Text>
      </TouchableOpacity>

      <View style={styles.dialogContainer}>
        <Image 
          source={require('./assets/nurse.png')} 
          style={styles.dialogAvatar} 
        />
        
        <View style={styles.dialogContent}>
          <Text style={styles.dialogText}>
            {steps[currentStep].text}
          </Text>

          {showNextButton && (
            <TouchableOpacity 
              style={styles.dialogButton} 
              onPress={nextStep}
            >
              <Text style={styles.dialogButtonText}>
                {currentStep === steps.length - 1 ? '시작하기' : '다음'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// 레벨별 튜토리얼 단계 가져오기
export const tutorialOpen = (levelId) => {
  return tutorialSteps[levelId] || null;
};

export default TutorialScreen;
