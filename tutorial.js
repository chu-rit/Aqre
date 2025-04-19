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
    
    // -SKIP- 버튼 추가
    const skipButton = document.createElement('div');
    skipButton.textContent = '-SKIP-';
    skipButton.classList.add('skip-button'); 
    skipButton.style.position = 'absolute';
    skipButton.style.top = '10px';
    skipButton.style.right = '10px';
    tutorialOverlay.appendChild(skipButton); 

    // -SKIP- 버튼 클릭 시 듀토리얼 숨기기
    skipButton.addEventListener('click', function() {
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        if (tutorialOverlay) {
            tutorialOverlay.style.display = 'none';
        }
    });

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

        // 이전 하이라이트 오버레이 제거
        document.querySelectorAll('.highlight-overlay').forEach(el => {
            el.remove();
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
                        
                        // 실제 하이라이트 오버레이 요소 생성
                        const rect = cell.getBoundingClientRect();
                        createHighlightOverlay(rect);
                        
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
                        
                        // 실제 하이라이트 오버레이 요소 생성
                        const rect = el.getBoundingClientRect();
                        createHighlightOverlay(rect);
                        
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
                    cell.classList.remove('with-z-index');
                });
                
                // 모든 하이라이트 오버레이 제거
                document.querySelectorAll('.highlight-overlay').forEach(el => {
                    el.remove();
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
                cell.classList.remove('with-z-index');
            });
            
            // 모든 하이라이트 오버레이 제거
            document.querySelectorAll('.highlight-overlay').forEach(el => {
                el.remove();
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
            
            // 하이라이트된 모든 요소의 클래스 제거
            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight');
                el.classList.remove('with-z-index');
            });
            
            // 모든 하이라이트 오버레이 제거
            document.querySelectorAll('.highlight-overlay').forEach(el => {
                el.remove();
            });
        }
    };
}

function tutorialOpen(levelId) {
    if(levelId === 0) {
        createTutorial({
            steps: [
                {
                    text: '안녕하세요. 선생님! 저는 선생님을 보조할 간호사 아크라라고 합니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: 'AQRE 시스템을 사용해 어떻게 고객들의 기억을 복원할 수 있는지 설명해드리고자 합니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '먼저 레벨1부터 차례대로 듀토리얼을 시작해 볼까요?',
                    highlight: {
                        selectors: ["[data-level='1']"]
                    },
                    condition: null,
                    showNextButton: false
                }
            ]
        });
    }else if(levelId === 1) {
        createTutorial({
            steps: [
                {
                    text: '위에 보이는 신경만 패턴을 조작해 고객들의 뉴런을 조작해 기억을 되살릴 수 있습니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '먼저 표시된 뉴런을 조작해 뉴런을 활성화 해보세요.',
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
                    text: '졸습니다! 이번에는 우측의 뉴런을 클릭해서 다시 비활성화해보세요.',
                    highlight: {
                        cells: [
                            {row: 2, col: 3}
                        ]
                    },
                    condition: {
                        row: 2,
                        col: 3,
                        expectedState: 0 // 흰색(0)으로 변경
                    },
                    showNextButton: false
                }
            ]
        });
    }else if(levelId === 2) {
        createTutorial({
            steps: [
                {
                    text: '뉴런은 특정 규칙에 맞게 조작해야만 기억을 정상적으로 되돌릴 수 있습니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
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
                    text: '이렇게 같은 방향으로 뉴런이 4개 이상 활성화 되면 기억이 왜곡됩니다. 이 뉴런을 조작해 연결을 끊어주세요.',
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
                    text: '이번에는 뉴런을 활성화하여 연결을 끊어주세요.',
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
            steps: [
                {
                    text: '뇌의 각 영역은 지정된 수의 활성 뉴런만 있어야 합니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '그 영역은 이 파란생 경계선을 통해 알 수 있습니다.',
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
                    text: '또 영역에 표시된 숫자는 그 영역에서 활성화되어야 할 정확한 뉴런의 수입니다.',
                    highlight: {
                        selectors: ['.cell[data-row="1"][data-col="2"] .area-overlay']
                    },
                    condition: null,
                    showNextButton: true
                },
                {
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
                    text: '완벽합니다! 이제 나머지 영역도 같은 방법으로 조정해보세요. <br>앞에서 배웠던 규칙도 함께 지켜야 합니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                }
            ]
        });
    }else if(levelId === 4) {
        createTutorial({
            steps: [
                {
                    text: '마지막으로 활성화된 뉴런은 하나의 영역을 이루고 있어야 됩니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '현재 화면을 보시면, 활성화된 뉴런(회색)이 세 군데로 분리되어 있습니다.',
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
                    text: '이 뉴런을 활성화하여 분리된 뉴런를 연결하세요.',
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
                    text: '좋습니다! 하지만 아직 우측에 고립된 뉴런들이 있네요. 이 뉴런들도 연결해주세요.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                }
            ]
        });   
    }else if(levelId === 5) {
        createTutorial({
            steps: [
                {
                    text: '훌륭합니다, 기억 복원사님! 이제 아크레 기술의 모든 핵심 규칙을 이해하셨습니다.',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '기억 복원 작업 중에 문제가 생기면, 우측 상단의 초기화 버튼을 사용하여 신경망 패턴을 처음 상태로 되돌릴 수 있습니다.',
                    highlight: {
                        selectors: ['.refreshLevel']
                    },
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '또한, 규칙 위반이 발생한 부분을 확인하려면 아래의 규칙 위반 항목을 선택하세요. 문제가 있는 뉴런을 시각적으로 표시해 드립니다. <br>(단, 회색연결성 규칙은 예외)',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                },
                {
                    text: '이제 열심히 고객들의 기억을 복원해 보실까요?',
                    highlight: null,
                    condition: null,
                    showNextButton: true
                }
            ]
        });
    }
}

// 하이라이트 오버레이 생성 함수
function createHighlightOverlay(rect) {
    const highlightOverlay = document.createElement('div');
    highlightOverlay.classList.add('highlight-overlay');
    highlightOverlay.style.top = `${rect.top - 5}px`;
    highlightOverlay.style.left = `${rect.left - 5}px`;
    highlightOverlay.style.width = `${rect.width + 10}px`;
    highlightOverlay.style.height = `${rect.height + 10}px`;
    document.body.appendChild(highlightOverlay);
}