// 현재 튜토리얼 허용 타일 목록
let tutorialAllowedCells = [];

// 전역 튜토리얼 이벤트 리스너 관리
let globalTutorialCellClickHandler = null;

// 튜토리얼 생성 함수 (범용적으로 사용 가능)
function createTutorial(config = {}) {

    // 기존 전역 이벤트 리스너 제거
    if (globalTutorialCellClickHandler) {
        document.removeEventListener('click', globalTutorialCellClickHandler);
    }

    // config가 없으면 튜토리얼 발동 안함
    if (!config) {
        return null;
    }

    steps = config.steps;

    // 기존 튜토리얼 오버레이 제거
    const existingTutorial = document.getElementById('tutorialOverlay');
    if (existingTutorial) {
        existingTutorial.remove();
    }

    // 허용된 타일 초기화
    tutorialAllowedCells = [];

    // 튜토리얼 오버레이 생성
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.id = 'tutorialOverlay';
    tutorialOverlay.classList.add('tutorial-overlay');
    
    // 튜토리얼 컨테이너 생성
    const tutorialContainer = document.createElement('div');
    tutorialContainer.classList.add('tutorial-container');

    // 튜토리얼 제목
    const tutorialTitle = document.createElement('h3');
    tutorialTitle.textContent = `레벨 ${config.levelId} 튜토리얼`;
    tutorialContainer.appendChild(tutorialTitle);

    // 튜토리얼 텍스트
    const tutorialText = document.createElement('p');
    tutorialText.classList.add('tutorial-text');
    tutorialContainer.appendChild(tutorialText);

    // 다음 버튼
    const nextButton = document.createElement('button');
    nextButton.textContent = '다음';
    nextButton.classList.add('tutorial-next-button');
    tutorialContainer.appendChild(nextButton);

    tutorialOverlay.appendChild(tutorialContainer);

    let currentStep = 0;

    function updateTutorialStep() {
        // 허용된 타일 초기화
        tutorialAllowedCells = [];

        // 이전 하이라이트 제거
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            el.classList.remove('with-z-index');
            el.style.zIndex = ''; // z-index 초기화
        });

        // 현재 단계의 정보로 업데이트
        tutorialTitle.textContent = steps[currentStep].title;
        tutorialText.innerHTML = steps[currentStep].text;

        // 하이라이트 로직
        if (steps[currentStep].highlight) {
            const gameBoardCells = document.querySelectorAll('.cell');
            
            // 셀 하이라이트
            if (steps[currentStep].highlight.cells) {
                const uniqueCells = Array.from(new Set(steps[currentStep].highlight.cells.map(cell => JSON.stringify(cell)))).map(cell => JSON.parse(cell));
                uniqueCells.forEach(({row, col}) => {
                    const cell = Array.from(gameBoardCells).find(
                        cell => 
                            parseInt(cell.getAttribute('data-row')) === row && 
                            parseInt(cell.getAttribute('data-col')) === col
                    );
                    
                    if (cell) {
                        // showNextButton이 false일 때만 z-index 클래스 추가
                        if (steps[currentStep].highlight.cells.length > 0 && !steps[currentStep].showNextButton) {
                            cell.classList.add('with-z-index');
                        }
                        cell.classList.add('tutorial-highlight');
                        tutorialAllowedCells.push({ row, col });
                    }
                });
            }

            // 선택자 하이라이트 추가
            if (steps[currentStep].highlight.selectors) {
                steps[currentStep].highlight.selectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        el.classList.add('tutorial-highlight');
                        
                        // showNextButton이 false일 때만 z-index 클래스 추가
                        if (!steps[currentStep].showNextButton) {
                            el.classList.add('with-z-index');
                        }
                    });
                });
            }
        }

        // 다음 버튼 표시/숨김 처리
        nextButton.style.display = steps[currentStep].showNextButton ? 'block' : 'none';

        // 다음 버튼 텍스트 업데이트
        nextButton.textContent = currentStep === steps.length - 1 ? '시작하기' : '다음';
    }

    // 타일 조작 조건 확인 함수
    function checkTutorialStepCondition(row, col, state) {
        // 튜토리얼 오버레이가 존재하는지 확인
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        if (!tutorialOverlay) return false;

        // steps 배열과 현재 단계가 존재하는지 확인
        if (!steps || steps.length === 0 || currentStep === undefined || currentStep === null) {
            return false;
        }

        // 현재 단계의 조건 확인
        const currentStepCondition = steps[currentStep].condition;
        
        // 조건이 없으면 true 반환 (다음 단계로 진행)
        if (!currentStepCondition) return true;
        
        // 단일 조건일 경우
        if (currentStepCondition.row !== undefined) {
            return (
                currentStepCondition.row === row &&
                currentStepCondition.col === col &&
                currentStepCondition.expectedState === state
            );
        }
        
        // 다중 조건일 경우
        if (currentStepCondition.conditions) {
            // 모든 조건의 타일이 expectedState와 일치하는지 확인
            return currentStepCondition.conditions.every(condition => 
                gameBoard[condition.row][condition.col] === condition.expectedState
            );
        }
        
        return false;
    }

    // 타일 클릭 이벤트 리스너
    globalTutorialCellClickHandler = function handleTutorialCellClick(event) {
        const clickedCell = event.target.closest('.cell');
        if (!clickedCell) return;

        const row = parseInt(clickedCell.getAttribute('data-row'));
        const col = parseInt(clickedCell.getAttribute('data-col'));
        const state = clickedCell.classList.contains('white') ? 0 : 1;

        // 현재 단계의 조건 확인
        if (checkTutorialStepCondition(row, col, state)) {
            currentStep++;
            
            if (currentStep >= steps.length) {
                // 튜토리얼 완료
                // 하이라이트된 모든 셀의 하이라이트 제거
                document.querySelectorAll('.cell.tutorial-highlight').forEach(cell => {
                    cell.classList.remove('tutorial-highlight');
                });
                
                tutorialOverlay.remove();
                document.removeEventListener('click', globalTutorialCellClickHandler);
                globalTutorialCellClickHandler = null;
                return;
            }
            
            updateTutorialStep();
        }
    };

    // 다음 버튼 클릭 이벤트
    nextButton.addEventListener('click', () => {
        currentStep++;
        
        if (currentStep >= steps.length) {
            // 튜토리얼 완료
            // 하이라이트된 모든 셀의 하이라이트 제거
            document.querySelectorAll('.cell.tutorial-highlight').forEach(cell => {
                cell.classList.remove('tutorial-highlight');
            });
            
            tutorialOverlay.remove();
            document.removeEventListener('click', globalTutorialCellClickHandler);
            globalTutorialCellClickHandler = null;
            return;
        }
        
        updateTutorialStep();
    });

    // 이벤트 리스너 추가
    document.addEventListener('click', globalTutorialCellClickHandler);

    // 초기 단계 설정
    updateTutorialStep();

    // DOM에 추가
    document.body.appendChild(tutorialOverlay);

    return {
        close: () => {
            tutorialOverlay.remove();
            document.removeEventListener('click', globalTutorialCellClickHandler);
            globalTutorialCellClickHandler = null;
        }
    };
}

// 레벨 1 기본 튜토리얼 함수
function tutorialOpen(levelId) {
    if(levelId === 1) {
        createTutorial({
            levelId: 1,
            steps: [
                {
                    title: 'Tutorial',
                    text: '이 게임은 특정 규칙에 맞추어 타일을 바꾸어나가면서 퍼즐을 푸는 것이 목적입니다.',
                    highlight: {
                        cells: []
                    },
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Tutorial',
                    text: '먼저 표시된 흰색 타일을 눌러보시기 바랍니다.',
                    highlight: {
                        cells: [
                            {row: 2, col: 1}
                        ]
                    },
                    condition: {
                        row: 2,
                        col: 1,
                        expectedState: 1 // 회색(1)으로 변경
                    },
                    showNextButton: false
                },
                {
                    title: 'Tutorial',
                    text: '색이 바뀐 것을 확인할 수 있습니다. 이번에는 우측에 있는 흰색 타일을 눌러보시기 바랍니다.',
                    highlight: {
                        cells: [
                            {row: 2, col: 3}
                        ]
                    },
                    condition: {
                        row: 2,
                        col: 1,
                        expectedState: 0 // 흰색(0)으로 변경
                    },
                    showNextButton: false
                }
            ]
        });
    }else if(levelId === 2) {
        createTutorial({
            levelId: 2,
            steps: [
                {
                    title: 'Rule 1',
                    text: '첫번째 규칙은 같은 색의 타일이 네 칸 이상 연속되지 않게 하는 것입니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 1',
                    text: '현재 표시된 타일을 보면 세로로 네 칸의 타일이 같은 색임을 알 수 있습니다.',
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
                    title: 'Rule 1',
                    text: '표시된 타일을 클릭하여 연속되지 않게 할 수 있습니다.',
                    highlight: {
                        cells: [
                            {row: 3, col: 0}
                        ]
                    },
                    condition: {
                        row: 3,
                        col: 0,
                        expectedState: 0 
                    },
                    showNextButton: false
                },
                {
                    title: 'Rule 1',
                    text: '이 규칙은 흰색에도 적용됩니다. <br>여기도 흰색 타일이 4개 이상 연속되고 있습니다.',
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
                    title: 'Rule 1',
                    text: '이 타일도 바꾸어 연속되는 곳이 없어지게 할 수 있습니다.',
                    highlight: {
                        cells: [
                            {row: 0, col: 1}
                        ]
                    },
                    condition: {
                        row: 0,
                        col: 1,
                        expectedState: 1 
                    },
                    showNextButton: false
                }
            ]
        });
    }else if(levelId === 3) {
        createTutorial({
            levelId: 3,
            steps: [
                {
                    title: 'Rule 2',
                    text: 'AQRE의 두번째 규칙은 각 영역에 적혀있는 숫자만큼 회색으로 바꾸는 것입니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 2',
                    text: '맵을 보시면 하늘색으로 타일 3개를 감싸서 영역을 표시하고 있고 숫자 3이 쓰여져 있습니다.<br> 그에 맞추어 3개의 타일을 회색으로 바꾸어 보실까요?',
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
                    title: 'Rule 2',
                    text: '좋습니다.<br>이제 같은 색으로 4개 연속되면 안된다는 규칙을 지키면서 나머지 영역도 숫자에 맞추어 바꾸어보세요.',
                    highlight: {
                        cells: []
                    },
                    condition: null,
                    showNextButton: true
                }
            ]
        });
    }else if(levelId === 4) {
        createTutorial({
            levelId: 4,
            steps: [
                {
                    title: 'Rule 3',
                    text: '마지막 세번째 규칙은 회색 타일은 가로나 세로로 연결되어 맵 전체에 하나만 있어야 합니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 3',
                    text: '현재는 표시된 대로 회색 타일은 4개로 되어 있습니다. 하나가 되도록 연결하세요.',
                    highlight: {
                        cells: [
                            {row: 0, col: 0},
                            {row: 1, col: 0},
                            {row: 0, col: 2},
                            {row: 1, col: 2},
                            {row: 2, col: 1},
                            {row: 3, col: 1},
                            {row: 2, col: 3},
                            {row: 3, col: 3},
                        ]
                    },
                    condition: null,
                    showNextButton: true
                }
            ]
        });   
    }else if(levelId === 5) {
        createTutorial({
            levelId: 5,
            steps: [
                {
                    title: 'Tutorial',
                    text: '이제 모든 규칙을 배웠습니다.<br>추가로 몇 가지 부가기능을 알려드리겠습니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Tutorial',
                    text: ' 우측 위의 버튼을 사용하면 게임을 원상태로 되돌릴 수 있습니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Tutorial',
                    text: '아래의 규칙 위반의 항목을 선택하면 위반된 타일을 표시해줍니다.<br>(회색칸의 연결성 규칙은 예외)',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Tutorial',
                    text: '즐거운 게임 되시길 바랍니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                }
            ]
        });
    }
}