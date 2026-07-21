/**
 * 튜토리얼 단계별 안내 메시지
 * @type {Object<string, Array<{
 *   step?: number,                // 스텝 번호 (선택)
 *   text: string,                 // 표시할 텍스트
 *   highlight: Object | null,     // 하이라이트 설정
 *   condition: Object | null,     // 조건 설정
 *   showNextButton: boolean       // 다음 버튼 표시 여부
 * }>>}
 */
export const tutorialSteps = {
  // 레벨 0 튜토리얼
  'level0': [
    {
      text: '안녕하세요. 선생님! 저는 선생님을 보조할 간호사 아크라라고 합니다.',
      textEn: "Hello, Doctor. I'm Aqre, your assistant nurse.",
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '고객들의 기억을 복원하기 위해 AQRE 시스템의 사용법을 말씀드리겠습니다.',
      textEn: "To restore our clients' memories, I'll guide you through the AQRE system.",
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '레벨1부터 시작해보실까요?',
      textEn: 'Shall we begin with Level 1?',
      highlight: {
        selectors: ["data-testid=level-26000001"]
      },
      condition: null,
      showNextButton: false
    }
  ],
  
  // 레벨 1 튜토리얼
  'level26000001': [
    {
      text: '위에 보이는 뉴런 패턴을 조작해 기억을 되살릴 수 있습니다.',
      textEn: 'You can restore memories by adjusting the neural pattern above.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '표시된 뉴런을 클릭해 해보세요.',
      textEn: 'Tap the highlighted neuron.',
      highlight: {
        cells: [{row: 2, col: 1}]
      },
      condition: {
        row: 2,
        col: 1,
        expectedState: 1
      },
      showNextButton: false
    },
    {
      text: '정상적으로 활성화 되었습니다! <br>이번에는 우측의 뉴런을 클릭해서 다시 비활성화해보세요.',
      textEn: 'It has been activated successfully! <br>Now tap the neuron on the right to deactivate it again.',
      highlight: {
        cells: [{row: 2, col: 3}]
      },
      condition: {
        row: 2,
        col: 3,
        expectedState: 0
      },
      showNextButton: false
    }
  ],
  
  // 레벨 2 튜토리얼
  'level26000002': [
    {
      text: '뉴런은 특정 규칙에 맞게 조작해야 합니다.',
      textEn: 'Neurons must follow specific rules.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      step: 1,
      text: '보시다시피, 이 영역에서는 세로로 4개의 뉴런이 같은 상태를 유지하고 있습니다.',
      textEn: 'As you can see, four neurons in this area are vertically in the same state.',
      highlight: {
        cells: [
          {row: 0, col: 0},
          {row: 1, col: 0},
          {row: 2, col: 0},
          {row: 3, col: 0}
        ]
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 2,
      text: '이렇게 한 방향으로 4개 이상의 뉴런이 활성화 되면 안됩니다. <br>이 뉴런을 조작해 연결을 끊어주세요.',
      textEn: 'Four or more neurons in a row in one direction are not allowed. <br>Adjust this neuron to break the sequence.',
      highlight: {
        cells: [{row: 3, col: 0}]
      },
      condition: {
        row: 3,
        col: 0,
        expectedState: 0
      },
      showNextButton: false
    },
    {
      step: 3,
      text: '훌륭합니다! 이 규칙은 비활성 뉴런(흰색)에도 적용됩니다.',
      textEn: 'Excellent! This rule also applies to inactive (white) neurons.',
      highlight: {
        cells: [
          {row: 0, col: 1},
          {row: 0, col: 2},
          {row: 0, col: 3},
          {row: 0, col: 4}
        ]
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 4,
      text: '이번에는 표시된 흰색 뉴런을 활성화하여 4개의 뉴런이 연속되지 않도록 해주세요.',
      textEn: 'Now activate the highlighted white neuron so that four neurons do not form a sequence.',
      highlight: {
        cells: [{row: 0, col: 1}]
      },
      condition: {
        row: 0,
        col: 1,
        expectedState: 1
      },
      showNextButton: false
    }
  ],
  
  // 레벨 3 튜토리얼
  'level26000003': [
    {
      step: 0,
      text: '각 영역은 지정된 수의 활성 뉴런만 있어야 합니다.',
      textEn: 'Each area must contain exactly the specified number of active neurons.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      step: 1,
      text: '그 영역은 이 경계선을 통해 알 수 있습니다.',
      textEn: 'You can identify an area by its boundary lines.',
      highlight: {
        cells: [
          {row: 1, col: 2},
          {row: 2, col: 2},
          {row: 3, col: 2}
        ]
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 2,
      text: '또 영역에 표시된 숫자는 그 영역에서 활성화되어야 할 정확한 뉴런의 수입니다.',
      textEn: 'The number shown in an area is the exact number of neurons that must be active there.',
      highlight: {
        // RN Web: testID => data-testid
        selectors: ['[data-testid="area-1-2"]'],
        padding: 10
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 3,
      text: '이제 표시된 숫자만큼 이 영역의 뉴런을 활성화해보세요.',
      textEn: 'Now activate the required number of neurons in this area.',
      highlight: {
        cells: [
          {row: 1, col: 2},
          {row: 2, col: 2},
          {row: 3, col: 2}
        ]
      },
      condition: {
        conditions: [
          { row: 1, col: 2, expectedState: 1 },
          { row: 2, col: 2, expectedState: 1 },
          { row: 3, col: 2, expectedState: 1 }
        ]
      },
      showNextButton: false
    },
    {
      step: 4,
      text: '완벽합니다! 이제 나머지 영역도 같은 방법으로 조정해보세요. <br>앞에서 배웠던 규칙도 함께 지켜야 합니다.',
      textEn: 'Perfect! Adjust the remaining areas the same way. <br>Remember to follow the rules you learned earlier as well.',
      highlight: null,
      condition: null,
      showNextButton: true
    }
  ],
  
  // 레벨 4 튜토리얼
  'level26000004': [
    {
      step: 0,
      text: '마지막으로 활성화된 뉴런은 하나의 영역을 이루고 있어야 됩니다.',
      textEn: 'Finally, all active neurons must form a single connected area.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      step: 1,
      text: '현재 화면을 보시면, 활성화된 뉴런(회색)이 세 군데로 분리되어 있습니다.',
      textEn: 'As you can see, the active (gray) neurons are split into three separate groups.',
      highlight: {
        cells: [
          [
            {row: 0, col: 0}, {row: 1, col: 0}, {row: 2, col: 0}
          ],
          [
            {row: 2, col: 2}, {row: 3, col: 2}
          ],
          [
            {row: 0, col: 4}, {row: 1, col: 4}
          ]
        ]
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 2,
      text: '이 뉴런을 활성화하여 분리된 뉴런를 연결하세요.',
      textEn: 'Activate this neuron to connect the separated groups.',
      highlight: {
        cells: [
            {row: 2, col: 1}
          ]
        },      
      condition: {
        conditions: [
          { row: 2, col: 1, expectedState: 1 }
        ]
      },      
      showNextButton: false
    },
    {
      step: 4,
      text: '좋아요! 아직 우측에 고립된 뉴런도 영역의 숫자에 유의해서 연결해주세요.',
      textEn: 'Great! Connect the isolated neurons on the right too, while keeping the area number in mind.',
      highlight: {
        cells: [
            {row: 0, col: 4},
            {row: 1, col: 4}
          ]
        },
      condition: null,
      showNextButton: true
    }
  ],

  // 레벨 5 튜토리얼
  'level26000005': [
    {
      step: 0,
      text: '훌륭합니다. 모든 규칙을 이해하셨습니다.',
      textEn: 'Excellent. You now understand all the rules.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      step: 1,
      text: '앞으로는 작업 중에 문제가 생기면, 우측 상단의 초기화 버튼을 사용하여 처음으로 되돌릴 수 있습니다.',
      textEn: 'If you run into trouble, use the reset button at the top right to start over.',
      highlight: {
        selectors: ['[data-testid="reset-level"]']
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 2,
      text: '또 아래의 규칙 위반 항목을 선택하면 문제가 있는 뉴런을 시각적으로 표시해줍니다.',
      textEn: 'Select a rule violation below to highlight the neurons causing the problem.',
      highlight: {
        selectors: ['[data-testid="rule-card-area"]', '[data-testid="rule-card-connect"]', '[data-testid="rule-card-seq"]'],
        padding: 6
      },
      condition: null,
      showNextButton: true
    },
    {
      step: 3,
      text: '이제 열심히 고객들의 기억을 복원해 보실까요?',
      textEn: "Now, shall we get to work restoring our clients' memories?",
      highlight: null,
      condition: null,
      showNextButton: true
    }
  ]
};

/**
 * 특정 레벨의 튜토리얼 단계를 조회하는 헬퍼 함수
 * @param {number|string} levelId - 조회할 레벨 ID (숫자 또는 'level0' 형식)
 * @returns {Array<Object>} 해당 레벨의 모든 튜토리얼 단계 배열
 */
export function getTutorialStepsByLevel(levelId) {
  // levelId가 숫자면 'level' 접두사 추가, 이미 문자열이면 그대로 사용
  const key = typeof levelId === 'number' ? `level${levelId}` : levelId;
  return tutorialSteps[key] || [];
}

/**
 * 특정 레벨의 특정 ID를 가진 튜토리얼 단계를 조회하는 헬퍼 함수
 * @param {number|string} levelId - 조회할 레벨 ID (숫자 또는 'level0' 형식)
 * @param {number} stepId - 조회할 단계 ID (해당 레벨 내에서의 ID)
 * @returns {Object | undefined} 해당하는 튜토리얼 단계 객체
 */
export function getTutorialStep(levelId, stepId) {
  // levelId가 숫자면 'level' 접두사 추가, 이미 문자열이면 그대로 사용
  const key = typeof levelId === 'number' ? `level${levelId}` : levelId;
  const levelSteps = tutorialSteps[key];
  if (!levelSteps) return undefined;
  // 우선 'step' 필드를 기준으로 탐색, 하위 호환을 위해 'id'도 함께 확인
  return levelSteps.find(s => s.step === stepId || s.id === stepId);
}
