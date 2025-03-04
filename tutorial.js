// 현재 튜토리얼 허용 타일 목록
let tutorialAllowedCells = [];

// 전역 튜토리얼 이벤트 리스너 관리
let globalTutorialCellClickHandler = null;

// 타이핑 효과 함수
function typeWriter(element, text, speed = 30, callback = null) {
    element.innerHTML = '';
    let i = 0;
    let htmlContent = '';
    let plainText = '';
    let htmlTags = [];
    
    // HTML 태그와 텍스트 분리
    let inTag = false;
    let currentTag = '';
    
    for (let j = 0; j < text.length; j++) {
        if (text[j] === '<') {
            inTag = true;
            currentTag = '<';
        } else if (text[j] === '>' && inTag) {
            inTag = false;
            currentTag += '>';
            htmlTags.push({
                tag: currentTag,
                position: plainText.length
            });
            currentTag = '';
        } else if (inTag) {
            currentTag += text[j];
        } else {
            plainText += text[j];
        }
    }
    
    function typing() {
        if (i < plainText.length) {
            // 현재까지의 일반 텍스트
            let currentPlainText = plainText.substring(0, i + 1);
            
            // HTML 태그 삽입
            htmlContent = currentPlainText;
            for (let tag of htmlTags) {
                if (tag.position <= i) {
                    // 태그 위치에 태그 삽입
                    htmlContent = htmlContent.substring(0, tag.position) + 
                                 tag.tag + 
                                 htmlContent.substring(tag.position);
                }
            }
            
            element.innerHTML = htmlContent;
            i++;
            setTimeout(typing, speed);
        } else if (callback) {
            // 타이핑이 끝나면 콜백 함수 실행
            callback();
        }
    }
    
    typing();
}

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
    
    // 튜토리얼 컨테이너를 대화창으로 변경
    const tutorialContainer = document.createElement('div');
    tutorialContainer.classList.add('dialog-container');

    // 아바타 추가
    const nurseAvatar = document.createElement('img');
    nurseAvatar.src = 'img/nurse.png';
    nurseAvatar.classList.add('dialog-avatar');
    tutorialContainer.appendChild(nurseAvatar);

    // 대화 콘텐츠 컨테이너
    const dialogContent = document.createElement('div');
    dialogContent.classList.add('dialog-content');

    // 대화 텍스트
    const tutorialText = document.createElement('p');
    tutorialText.classList.add('dialog-text');
    dialogContent.appendChild(tutorialText);

    // 버튼 컨테이너
    const dialogButtons = document.createElement('div');
    dialogButtons.classList.add('dialog-buttons');

    // 다음 버튼
    const nextButton = document.createElement('button');
    nextButton.textContent = '다음';
    nextButton.classList.add('dialog-button');
    dialogButtons.appendChild(nextButton);

    dialogContent.appendChild(dialogButtons);
    tutorialContainer.appendChild(dialogContent);
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

        // 다음 버튼 초기에 숨기기
        nextButton.style.display = 'none';

        // 현재 단계의 정보로 업데이트
        nextButton.textContent = currentStep === steps.length - 1 ? '시작하기' : '다음';
        
        // 타이핑 효과 후 다음 버튼 표시
        typeWriter(tutorialText, steps[currentStep].text, 30, function() {
            // 타이핑이 끝난 후 다음 버튼 표시 (showNextButton이 true인 경우에만)
            if (steps[currentStep].showNextButton) {
                nextButton.style.display = 'block';
            }
        });

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
                        
                        // 모든 하이라이트된 요소에 z-index 클래스 추가
                        el.classList.add('with-z-index');
                        
                        // area-overlay인 경우 부모 셀의 z-index도 조정
                        if (el.classList.contains('area-overlay')) {
                            const parentCell = el.closest('.cell');
                            if (parentCell) {
                                parentCell.classList.add('with-z-index');
                            }
                        }
                    });
                });
            }
        }

        // 다음 버튼 표시/숨김 처리
        // nextButton.style.display = steps[currentStep].showNextButton ? 'block' : 'none';
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
            // 실제 게임보드의 상태와 비교 (state는 0: 흰색, 1: 회색)
            const currentCellState = gameBoard[row][col];

            return (
                currentStepCondition.row === row &&
                currentStepCondition.col === col &&
                currentStepCondition.expectedState === currentCellState
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
                    text: '두번째 규칙은 각 영역에 적혀있는 숫자만큼 타일을 회색으로 바꾸는 것입니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 2',
                    text: '맵을 표시된 부분을 보시면 하늘색으로 타일 3개를 감싸서 영역을 표시하고 있습니다.',
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
                    title: 'Rule 2',
                    text: '그리고 그 영역엔 숫자가 있음을 확인할 수 있습니다.',
                    highlight: {
                        selectors: ['.cell[data-row="1"][data-col="2"] .area-overlay']
                    },
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 2',
                    text: '이제 확인한 숫자만큼 해당영역을 회색 타일로 바꾸어보세요.',
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
                    text: '좋습니다. 이제 나머지 영역도 같은 방법으로 바꾸세요. <br>단 첫번째 규칙에서 배웠던 것처럼 네 칸이 같은 색으로 연속되지 않게 하세요.',
                    highlight: null,
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
                    text: '마지막 세번째 규칙은 회색 타일은 가로나 세로로 연결되어 하나의 길처럼 되어야 합니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 3',
                    text: '현재는 표시된 대로 회색 타일이 3군데 뭉쳐있습니다.',
                    highlight: {
                        cells: [
                            {row: 0, col: 0},
                            {row: 1, col: 0},
                            {row: 2, col: 0},
                            {row: 2, col: 2},
                            {row: 3, col: 2},
                            {row: 0, col: 4},
                            {row: 1, col: 4}
                        ]
                    },
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Rule 3',
                    text: '이 타일을 바꾸어 회색 타일들을 연결하세요.',
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
                    title: 'Rule 3',
                    text: '아직 우측의 연결되지 않은 회색 타일도 연결해보세요.',
                    highlight: null,
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
                    text: '모든 규칙을 배웠습니다.<br>이제 몇 가지 부가기능에 대해 알려드리겠습니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    title: 'Tutorial',
                    text: '우측 위의 버튼을 사용하면 게임을 초기상태로 되돌릴 수 있습니다.',
                    highlight: {
                        selectors: ['.refreshLevel']
                    },
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
                    text: '규칙 위반을 확인해 가면서 타일을 바꾸어 퍼즐을 풀어보시기 바랍니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                }
            ]
        });
    }
}