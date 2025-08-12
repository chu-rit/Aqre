/**
 * 튜토리얼 단계별 안내 메시지
 * @type {Object<string, Array<{
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
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: 'AQRE 시스템을 사용해 어떻게 고객들의 기억을 복원할 수 있는지 말씀드리겠습니다.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '먼저 레벨1부터 차례대로 시작해보실까요?',
      highlight: {
        selectors: ["data-testid=level-1"]
      },
      condition: null,
      showNextButton: false
    }
  ],
  
  // 레벨 1 튜토리얼
  'level1': [
    {
      text: '위에 보이는 신경만 패턴을 조작해 고객들의 뉴런을 조작해 기억을 되살릴 수 있습니다.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '먼저 표시된 뉴런을 조작해 뉴런을 활성화 해보세요.',
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
      text: '잘하셨습니다! 이번에는 우측의 뉴런을 클릭해서 다시 비활성화해보세요.',
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
  'level2': [
    {
      text: '뉴런은 특정 규칙에 맞게 조작해야만 기억을 정상적으로 되돌릴 수 있습니다.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      id: 1,
      text: '보시다시피, 이 영역에서는 세로로 4개의 뉴런이 같은 상태를 유지하고 있습니다.',
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
      id: 2,
      text: '이렇게 같은 방향으로 뉴런이 4개 이상 활성화 되면 기억이 왜곡됩니다. 이 뉴런을 조작해 연결을 끊어주세요.',
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
      id: 3,
      text: '훌륭합니다! 이 규칙은 비활성 뉴런(흰색)에도 적용됩니다.',
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
      id: 4,
      text: '이번에는 뉴런을 활성화하여 연결을 끊어주세요.',
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
  'level3': [
    {
      id: 0,
      text: '뇌의 각 영역은 지정된 수의 활성 뉴런만 있어야 합니다.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      id: 1,
      text: '그 영역은 이 파란색 경계선을 통해 알 수 있습니다.',
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
      id: 2,
      text: '또 영역에 표시된 숫자는 그 영역에서 활성화되어야 할 정확한 뉴런의 수입니다.',
      highlight: {
        selectors: ['.cell[data-row="1"][data-col="2"] .area-overlay']
      },
      condition: null,
      showNextButton: true
    },
    {
      id: 3,
      text: '이제 표시된 숫자만큼 이 영역의 뉴런을 활성화해보세요.',
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
      id: 4,
      text: '완벽합니다! 이제 나머지 영역도 같은 방법으로 조정해보세요. <br>앞에서 배웠던 규칙도 함께 지켜야 합니다.',
      highlight: null,
      condition: null,
      showNextButton: true
    }
  ],
  
  // 레벨 4 튜토리얼
  'level4': [
    {
      id: 0,
      text: '마지막으로 활성화된 뉴런은 하나의 영역을 이루고 있어야 됩니다.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      id: 1,
      text: '현재 화면을 보시면, 활성화된 뉴런(회색)이 세 군데로 분리되어 있습니다.',
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
  return levelSteps.find(step => step.id === stepId);
}
