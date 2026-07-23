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
      text: '안녕하세요. 저는 퍼즐을 푸는 것을 도울 AI 로봇 아크입니다.',
      textEn: "Hello! I'm Arc, an AI robot here to help you solve puzzles.",
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: 'AQRE(Ay-kurr)라고 불리는 이 퍼즐은 세 가지 규칙을 통해 색칠해 나가야 합니다.',
      textEn: 'This puzzle, known as AQRE (Ay-kurr), is solved by coloring cells according to three rules.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '먼저 레벨 1부터 시작해 보실까요?',
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
      text: '첫 번째 규칙은 영역에 따른 규칙입니다.',
      textEn: 'The first rule is the area rule.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '룰 체크에 표시된 영역 규칙을 선택해 보세요.',
      textEn: 'Select the highlighted area rule in Rule Check.',
      highlight: {
        selectors: ['data-testid=rule-card-area'],
      },
      condition: {
        rule: 'area'
      },
      showNextButton: false
    },
    {
      text: '표시된 영역에는 숫자 3이 쓰여 있지만, 두 칸만 색칠되어 있습니다.',
      textEn: 'This area is labeled 3, but only two cells are colored.',
      highlight: {
        cells: [
          {row: 1, col: 1},
          {row: 2, col: 1},
          {row: 3, col: 1}
        ]
      },
      showNextButton: true
    },
    {
      text: '표시된 칸을 색칠해 숫자 3을 맞춰 보세요.',
      textEn: 'Color the highlighted cell to make the total 3.',
      highlight: {
        cells: [
          {row: 2, col: 1}
        ]
      },
      condition: {
        row: 2,
        col: 1,
        expectedState: 1
      },
      showNextButton: false
    },
    {
      text: '좋습니다! <br>오른쪽 영역에는 숫자 0이 쓰여 있지만, 한 칸이 색칠되어 있습니다.',
      textEn: 'Great! <br>The area on the right is labeled 0, but one cell is colored.',
      highlight: {
        cells: [
          {row: 1, col: 3},
          {row: 2, col: 3},
          {row: 3, col: 3}
        ]
      },
      showNextButton: true
    },
   {
      text: '표시된 칸을 탭해 색칠을 지워 보세요.',
      textEn: 'Tap the highlighted cell to erase its color.',
      highlight: {
        cells: [
          {row: 2, col: 3}
        ]
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
      text: '두 번째 규칙은 연결성 규칙입니다.',
      textEn: 'The second rule is the connectivity rule.',
      showNextButton: true
    },
    {
      text: '퍼즐판을 보시면, 색칠된 칸이 연결되어 있지 않고 서로 떨어져 있습니다.',
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
      text: '색칠된 칸들은 연결되어야 하므로, 표시된 칸을 색칠해 연결해 보세요.',
      textEn: 'Colored cells must be connected, so color the highlighted cell to connect them.',
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
      text: '연결되었습니다. 이제 룰 체크에서 연결 규칙을 눌러서 확인해 볼까요?',
      textEn: 'They are connected. Now select the connectivity rule in Rule Check.',
      highlight: {
        selectors: ['data-testid=rule-card-connect'],
      },
      condition: {
        rule: 'connect'
      },
      showNextButton: false
    },
    {
      text: '이런! 오른쪽에도 색칠된 칸들이 고립되어 있네요.',
      textEn: 'Uh-oh! There are isolated colored cells on the right too.',
      highlight: {
        cells: [
            {row: 0, col: 4},
            {row: 1, col: 4}
          ]
        },
      condition: null,
      showNextButton: true
    },
    {
      text: '여기도 색칠해 연결해 볼까요?',
      textEn: 'Let’s color these cells to connect them too.',
      highlight: {
        cells: [
            {row: 1, col: 2},
            {row: 1, col: 3}
          ]
        },
      condition: {
        conditions: [
          { row: 1, col: 2, expectedState: 1 },
          { row: 1, col: 3, expectedState: 1 }
        ]
      },
      showNextButton: false
    }
  ],
  
  // 레벨 3 튜토리얼
  'level26000003': [
    {
      text: '마지막 세 번째 규칙은 4연속 금지 규칙입니다. 룰 체크에서 4연속 규칙을 눌러 볼까요?',
      textEn: 'The final third rule prohibits four consecutive cells. Select the 4-in-a-row rule in Rule Check.',
      highlight: {
        selectors: ['data-testid=rule-card-seq'],
      },
      condition: {
        rule: 'seq'
      },
      showNextButton: false
    },
    {
      text: '여기 흰색 칸 네 개가 가로로 이어져 있다고 표시되고 있습니다.',
      textEn: 'Four white cells in a row are highlighted here.',
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
      text: '가로든 세로든 연속된 네 칸이 같은 색상이 되지 않도록 한 칸을 색칠해야 합니다.',
      textEn: 'Color one cell so that four consecutive cells do not share the same color.',
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
      text: '또한 이미 색칠된 칸들과 연결되어야 하므로, 표시된 칸을 색칠해 볼까요?',
      textEn: 'It must also remain connected to the colored cells, so color the highlighted cell.',
      highlight: {
        cells: [
            {row: 0, col: 1}
        ]
      },
      condition: {
        conditions: [
          { row: 0, col: 1, expectedState: 1 }
        ]
      },
      showNextButton: false
    },
    {
      text: '해결되었네요! 하지만 색칠된 칸도 세로로 네 칸이 연속되어 있습니다.',
      textEn: 'Solved! But four colored cells are also consecutive vertically.',
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
      text: '연결이 끊어지지 않도록 문제를 해결해 보세요.',
      textEn: 'Solve the problem without breaking the connection.',
      highlight: {
        cells: [
          {row: 0, col: 0},
          {row: 1, col: 0},
          {row: 2, col: 0},
          {row: 3, col: 0}
        ]
      },
      condition: {
        conditions: [
          { row: 3, col: 0, expectedState: 0 }
        ]
      },
      showNextButton: false
    } 
  ],
  
  // 레벨 4 튜토리얼
  'level26000004': [
    {
      text: '축하합니다! 이렇게 모든 규칙을 익히셨습니다.',
      textEn: 'Congratulations! You have now learned all the rules.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '본 게임에 앞서 규칙을 응용할 수 있는 퍼즐을 준비하였습니다.',
      textEn: 'Before the main game, we have prepared a puzzle where you can apply the rules.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '상단의 초기화 버튼을 통해 퍼즐을 처음 상태로 되돌릴 수 있으며,',
      textEn: 'You can use the reset button at the top to return the puzzle to its initial state,',
      highlight: {
        selectors: ['data-testid=reset-level']
      },
      condition: null,
      showNextButton: true
    },
    {
      text: '아래 룰 체크 박스를 잘 사용하여 모든 규칙에 맞는 하나의 답을 찾아보시기 바랍니다.',
      textEn: 'Use the Rule Check box below to find a solution that follows all the rules.',
      highlight: {
        selectors: ['[data-testid="rule-card-area"]', '[data-testid="rule-card-connect"]', '[data-testid="rule-card-seq"]']
      },
      condition: null,
      showNextButton: true
    },
  ],

  
  // 레벨 5 튜토리얼
  'level26000005': [
    {
      text: '드디어 마지막 튜토리얼입니다.',
      textEn: 'Excellent. You now understand all the rules.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '이제 점점 더 어려워지는 퍼즐에 대응할 수 있도록 힌트에 대해 알아볼 것입니다.',
      textEn: 'If you run into trouble, use the reset button at the top right to start over.',
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '임시로 힌트를 열어드릴테니 눌러보실까요?',
      textEn: 'Select a rule violation below to highlight the neurons causing the problem.',
      highlight: {
        selectors: ['[data-testid="hint"]']
      },
      condition: { hintMode: true },
      showNextButton: false
    },
    {
      text: '힌트 모드가 활성화 되었습니다. 답을 알고 싶은 셀을 선택하세요.',
      textEn: 'Select a rule violation below to highlight the neurons causing the problem.',
      highlight: {
        selectors: ['[data-testid="board"]']
      },
      condition: { hintMode: false },
      showNextButton: false
    },
    {
      text: '해당 칸의 답이 표시되고 잠금처리 되었습니다. 칸을 오래눌러도 잠금처리 할 수 있습니다.',
      textEn: 'Select a rule violation below to highlight the neurons causing the problem.',
      highlight: {
        selectors: ['[data-testid="board"]']
      },
      condition: null,
      showNextButton: true
    },
    {
      text: '다시 오래 누르면 잠금을 해제할 수 있습니다. 힌트 포인트는 광고보기를 통해 추가할 수 있습니다.',
      textEn: 'Select a rule violation below to highlight the neurons causing the problem.',
      highlight: {
        selectors: ['[data-testid="board"]']
      },
      condition: null,
      showNextButton: true
    },
    {
      requiresCompletedTutorialsWithoutSkipping: true,
      hintPoints: 5,
      hintRewardKey: 'tutorials-completion-reward',
      text: '마지막으로 응원하는 마음을 담아 힌트 포인트를 선물로 드리겠습니다.',
      textEn: "Now, shall we get to work restoring our clients' memories",
      highlight: null,
      condition: null,
      showNextButton: true
    },
    {
      text: '이제 즐거운 마음으로 퍼즐을 즐겨주시기 바랍니다.',
      textEn: 'Select a rule violation below to highlight the neurons causing the problem.',
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
