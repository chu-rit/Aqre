// 게임 상수
const BOARD_SIZE = 6;
const COLOR_STATES = ['white', 'gray'];

// 퍼즐 데이터 
let currentLevel = 0;
let gameBoard = [];
let moves = 0;
let gameStarted = false;

// 클리어된 레벨 정보 (localStorage 사용)
let clearedLevels = new Set(JSON.parse(localStorage.getItem('clearedLevels') || '[]'));

// 개발자 콘솔에서 쉽게 테스트할 수 있도록 전역 함수로 노출
window.testClear = testClear;

// 효과음 설정
let isSoundEnabled = true;

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 사용자 상호작용 후 오디오 컨텍스트 초기화 (브라우저 정책)
    document.body.addEventListener('click', () => {
    }, { once: true });

    const startButton = document.getElementById('startButton');
    const optionsButton = document.getElementById('optionsButton');
    const backToStart = document.getElementById('backToStart');
    const backToLevels = document.getElementById('backToLevels');
    const showRules = document.getElementById('showRules');
    const closeRules = document.getElementById('closeRules');
    const rulesPopup = document.getElementById('rulesPopup');
    const gameClearPopup = document.getElementById('gameClearPopup');

    // 더블 클릭 확대 방지
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    }, { passive: false });

    // 시작 화면 버튼들
    if (startButton) {
        startButton.addEventListener('click', () => {
            const startScreen = document.getElementById('startScreen');
            const levelScreen = document.getElementById('levelScreen');
            
            // 시작 화면에 fade-out 애니메이션 추가
            startScreen.classList.add('fade-out');
            
            // 애니메이션 종료 후 화면 전환
            setTimeout(() => {
                startScreen.style.display = 'none';
                startScreen.classList.remove('fade-out');
                
                levelScreen.style.display = 'flex';
                levelScreen.classList.add('fade-in');
                createLevelScreen();
                
                // 애니메이션 클래스 제거
                setTimeout(() => {
                    levelScreen.classList.remove('fade-in');
                }, 300);
            }, 300);
        });
    }

    function setupOptionsButton() {
        const optionsButton = document.getElementById('optionsButton');

        if (optionsButton) {
            optionsButton.addEventListener('click', () => {
                // 현재 화면 숨기기
                const currentScreens = ['startScreen', 'levelScreen'];
                currentScreens.forEach(screenId => {
                    const screen = document.getElementById(screenId);
                    if (screen) screen.style.display = 'none';
                });

                // 옵션 화면 표시
                const optionScreen = document.getElementById('option-screen');
                if (optionScreen) optionScreen.style.display = 'block';
            });
        }
    }

    setupOptionsButton();

    // 옵션 버튼 이벤트 리스너 단순화
    if (optionsButton) {
        optionsButton.addEventListener('click', () => {
            // 현재 화면 숨기기
            const currentScreens = ['startScreen', 'levelScreen'];
            currentScreens.forEach(screenId => {
                const screen = document.getElementById(screenId);
                if (screen) screen.style.display = 'none';
            });

            // 옵션 화면 표시
            const optionScreen = document.getElementById('option-screen');
            if (optionScreen) optionScreen.style.display = 'block';
        });
    }

    // 뒤로 가기 버튼들
    if (backToStart) {
        backToStart.addEventListener('click', () => {
            showScreen('startScreen');
        });
    }

    if (backToLevels) {
        backToLevels.addEventListener('click', () => {
            // 레벨 선택 화면으로 돌아갈 때 튜토리얼 완전히 제거
            const tutorialOverlay = document.getElementById('tutorialOverlay');
            if (tutorialOverlay) {
                tutorialOverlay.remove();
            }
            showScreen('levelScreen');
        });
    }

    // 규칙 보기 버튼 이벤트
    if (showRules) {
        showRules.addEventListener('click', () => {
            if (rulesPopup) {
                rulesPopup.classList.add('show');
            }
        });
    }

    if (closeRules) {
        closeRules.addEventListener('click', () => {
            if (rulesPopup) {
                rulesPopup.classList.remove('show');
            }
        });
    }

    // 팝업 외부 클릭시 닫기
    if (rulesPopup) {
        rulesPopup.addEventListener('click', (e) => {
            if (e.target === rulesPopup) {
                rulesPopup.classList.remove('show');
            }
        });
    }

    // 게임 클리어 팝업 외부 클릭시 닫기
    if (gameClearPopup) {
        gameClearPopup.addEventListener('click', (e) => {
            if (e.target === gameClearPopup) {
                gameClearPopup.style.display = 'none';
            }
        });
    }

    // 게임 클리어 팝업 이벤트 리스너 추가
    const backToLevelsButton = document.getElementById('backToLevelsButton');

    if (backToLevelsButton) {
        backToLevelsButton.addEventListener('click', () => {
            if (gameClearPopup) {
                gameClearPopup.style.display = 'none';
            }
            showScreen('levelScreen');
        });
    }

    // Refresh Level Button
    document.getElementById('refreshLevel').addEventListener('click', () => {
        startGame(currentLevel);
    });

    // 옵션 화면 이벤트 리스너 추가
    document.getElementById('optionsButton').addEventListener('click', function() {
        document.getElementById('option-screen').style.display = 'flex';
    });

    document.getElementById('back-button').addEventListener('click', function() {
        document.getElementById('option-screen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex'; // 스타트 스크린 보이기
    });

    document.getElementById('clear-data-button').addEventListener('click', function() {
        // 데이터 초기화 로직 추가
        clearedLevels.clear(); // clearedLevels Set 비우기
        localStorage.setItem('clearedLevels', JSON.stringify([])); // 로컬 스토리지도 비우기
        showMessage('클리어된 레벨이 삭제되었습니다!'); // showMessage 함수 사용
    });

    // 효과음 토글 이벤트 리스너
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.addEventListener('change', function() {
        isSoundEnabled = this.checked;
        localStorage.setItem('soundEnabled', isSoundEnabled);
    });

    // 로컬 스토리지에서 효과음 설정 불러오기
    const savedSoundSetting = localStorage.getItem('soundEnabled');
    if (savedSoundSetting !== null) {
        isSoundEnabled = savedSoundSetting === 'true';
        soundToggle.checked = isSoundEnabled;
    }

    // 레벨 선택 화면 옵션 버튼
    const OptionsButton = document.getElementById('OptionsButton');
    if (OptionsButton) {
        OptionsButton.addEventListener('click', () => {
            document.getElementById('levelScreen').style.display = 'none';
            document.getElementById('option-screen').style.display = 'block';
        });
    }
});

// 레벨 선택 화면 생성
function createLevelScreen() {
    const basicLevelGrid = document.getElementById('basicLevelGrid');
    const advancedLevelGrid = document.getElementById('advancedLevelGrid');
    basicLevelGrid.innerHTML = ''; // 기존 내용 초기화
    advancedLevelGrid.innerHTML = ''; // 기존 내용 초기화

    // 퍼즐 맵의 ID를 기반으로 레벨 버튼 생성
    PUZZLE_MAPS.forEach(puzzle => {
        const levelBtn = document.createElement('button');
        levelBtn.className = 'level-btn';
        levelBtn.dataset.level = puzzle.id;
        levelBtn.textContent = `${puzzle.id}`;

        // 클리어된 레벨인지 확인
        if (isLevelCleared(puzzle.id)) {
            levelBtn.classList.add('cleared');
        }

        if(puzzle.id < 6) {
            basicLevelGrid.appendChild(levelBtn);
        } else {
            advancedLevelGrid.appendChild(levelBtn);
        }
        
        levelBtn.addEventListener('click', () => {
            checkLevel(puzzle.id);
        });
    });
}

// 레벨 유효성 검사 함수
function checkLevel(levelId) {
    // 레벨 ID로 퍼즐 찾기
    const puzzle = PUZZLE_MAPS.find(p => p.id === levelId);

    // 퍼즐을 찾지 못한 경우
    if (!puzzle) {
        showMessage('아직 준비중입니다.', 'warning');
        return false;
    }

    showScreen('gameScreen');
    startGame(levelId);
    return true;
}

// 게임 초기화
function startGame(levelId = 11) {
    // 현재 레벨 설정
    currentLevel = levelId;
    
    // 현재 퍼즐 데이터 로드 (id로 찾기)
    const puzzle = PUZZLE_MAPS.find(p => p.id === levelId);
    
    // 게임 보드 초기화
    gameBoard = puzzle.initialState.map(row => [...row]);
    
    // 게임 시작 상태 설정
    gameStarted = true;
    moves = 0;
    
    // 게임 보드 렌더링
    renderBoard();
    
    // 게임 정보 업데이트
    updateGameInfo();
    
    // 현재 레벨 표시 업데이트
    updateCurrentLevelDisplay(levelId);
    
    // 게임 화면으로 전환
    showScreen('gameScreen');
    
    // 영역 오버레이 렌더링
    renderAreaOverlays(puzzle.areas);
    
    tutorialOpen(levelId);
    
    // 규칙 위반 체크
    updateViolationDisplay();
}

// 현재 레벨 표시 업데이트 함수
function updateCurrentLevelDisplay(level) {
    const levelDisplay = document.getElementById('currentLevelDisplayInGame');
    if (levelDisplay) {
        levelDisplay.textContent = `Level ${level}`;
    }
}

// 게임 정보 업데이트
function updateGameInfo() {
    const puzzle = PUZZLE_MAPS.find(p => p.id === currentLevel);
    const infoElement = document.querySelector('.level-info');
    if (infoElement && puzzle) {
        infoElement.innerHTML = `
            <h3>Level ${puzzle.id}: ${puzzle.name || '이름 없음'}</h3>
            <p>Moves: ${moves}</p>
        `;
    }
}

// 영역에 필요한 회색 칸 수를 표시하는 오버레이 생성
function renderAreaOverlays(areas) {
    // Do nothing, effectively removing area overlays
    return;
}

// 보드 렌더링
function renderBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    // 현재 퍼즐의 영역 정보 가져오기
    const currentPuzzle = PUZZLE_MAPS.find(p => p.id === currentLevel);
    
    // 퍼즐의 size 속성 사용
    const BOARD_SIZE = currentPuzzle.size || 6;
    
    // 게임판이 없거나 잘못된 경우 기본 게임판 생성
    if (!gameBoard || !Array.isArray(gameBoard) || gameBoard.length === 0) {
        gameBoard = Array.from({ length: BOARD_SIZE }, () => 
            Array(BOARD_SIZE).fill(0)
        );
    }
    
    // 기존 오버레이 제거
    const existingOverlays = board.querySelectorAll('.area-overlay');
    existingOverlays.forEach(overlay => overlay.remove());
    
    // 각 영역에 대해 숫자 표시를 추적할 Set
    const displayedAreas = new Set();
    
    // 셀 생성
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // 블럭 상태에 따라 클래스 추가
            if (gameBoard[row][col] === 1) {
                cell.classList.add('gray');
            } else if (gameBoard[row][col] === 2) {
                cell.classList.add('type3');
            }
            
            // 각 셀에 데이터셋 추가
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 각 영역에 대해 숫자 표시
            const areaWithCell = currentPuzzle.areas.find(area => 
                area.cells.some(([r, c]) => r === row && c === col)
            );
            
            if (areaWithCell) {
                cell.dataset.areaRequired = areaWithCell.required || '';
                
                // 해당 영역의 첫 번째 셀에만 숫자 오버레이 표시
                if (!displayedAreas.has(areaWithCell)) {
                    const areaOverlay = document.createElement('div');
                    areaOverlay.className = 'area-overlay';
                    
                    // 'J' 문자 처리 예외 
                    if (areaWithCell.required === 'J') {
                        // 아무것도 표시하지 않음
                        areaOverlay.textContent = '';
                        areaOverlay.style.display = 'none';
                    } else {
                        areaOverlay.textContent = areaWithCell.required;
                    }
                    
                    cell.appendChild(areaOverlay);
                    displayedAreas.add(areaWithCell);
                }
            }
            
            cell.addEventListener('click', (event) => {
                // 게임이 시작되지 않았으면 무시
                if (!gameStarted) return;

                // 사운드 재생
                playTapSound();

                // 클릭된 셀 요소
                const cell = event.target;
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);

                // 셀 색상 변경
                toggleCellColor(cell, row, col);
            });
            board.appendChild(cell);
        }
    }
    
    // 보드의 그리드 크기 조정
    board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    
    // 영역 경계 체크
    checkAreaBoundaries(currentPuzzle);
}

// 셀 색상 변경
function toggleCellColor(cell, row, col) {
    // 현재 색상 상태 확인
    const currentColorIndex = gameBoard[row][col];
    const nextColorIndex = (currentColorIndex + 1) % COLOR_STATES.length;
    
    // 보드 상태 업데이트
    gameBoard[row][col] = nextColorIndex;
    
    // 셀 색상 업데이트
    cell.style.backgroundColor = COLOR_STATES[nextColorIndex];
    
    // 움직임 카운트 증가
    moves++;
    
    // 게임 정보 업데이트
    updateGameInfo();
    
    // 규칙 위반 체크
    updateViolationDisplay();
}

// 규칙 위반 사항 체크 함수
function checkGameRules() {
    const violations = {
        areaOverflow: false,
        consecutiveColors: {
            horizontal: false,
            vertical: false
        },
        cellConnectivity: false
    };
    const violationMessages = new Set();
    const currentPuzzle = PUZZLE_MAPS.find(p => p.id === currentLevel);
    
    // 1. 각 영역의 회색 칸 수 확인
    for (const area of currentPuzzle.areas) {
        const grayCount = area.cells.reduce((count, [row, col]) => {
            return count + (gameBoard[row][col] === 1 ? 1 : 0);
        }, 0);
        
        // 'J'인 경우는 검사하지 않음
        if (area.required === 'J') continue;
        
        // 문자열로 된 숫자를 정수로 변환하여 비교
        const requiredCount = parseInt(area.required);
        if (grayCount > requiredCount) {
            violations.areaOverflow = true;
            violationMessages.add('영역의 회색 칸 수가 초과되었습니다.');
            break;
        }
        if (grayCount < requiredCount) {
            violations.areaOverflow = true;
            violationMessages.add('영역의 회색 칸 수가 부족합니다.');
            break;
        }
    }
    
    // 2. 연속된 같은 색상 체크 (가로, 세로)
    const directions = [
        { dx: 1, dy: 0, name: '가로', key: 'horizontal' },  // 가로
        { dx: 0, dy: 1, name: '세로', key: 'vertical' }   // 세로
    ];
    
    for (const dir of directions) {
        for (let i = 0; i < currentPuzzle.size; i++) {
            for (let j = 0; j <= currentPuzzle.size - 4; j++) {
                const sequence = [];
                const currentHighlightCells = [];
                
                for (let k = 0; k < 4; k++) {
                    const row = dir.dy === 1 ? j + k : i;
                    const col = dir.dx === 1 ? j + k : i;
                    
                    // 보드 범위 체크
                    if (row < 0 || row >= currentPuzzle.size || col < 0 || col >= currentPuzzle.size) {
                        continue;
                    }
                    
                    const color = dir.dx === 1 
                        ? gameBoard[i][j + k] 
                        : gameBoard[j + k][i];
                    sequence.push(color);
                    currentHighlightCells.push({row, col});
                }
                
                // 4개 연속 같은 색상 체크 (흰색 또는 회색만)
                if (sequence.every(color => color === 0) || sequence.every(color => color === 1)) {
                    violations.consecutiveColors[dir.key] = true;
                    violationMessages.add(`${dir.name} 방향 4칸 연속 색상 위반`);
                    break;
                }
            }
            
            // 이미 해당 방향의 위반을 찾았다면 더 이상 확인하지 않음
            if (violations.consecutiveColors[dir.key]) break;
        }
    }
    
    // 3. 회색 칸 연결성 확인
    if (!checkGrayCellConnectivity()) {
        violations.cellConnectivity = true;
        violationMessages.add('회색 칸들이 서로 연결되어 있지 않습니다.');
    }
    
    return {
        violations,
        violationMessages: Array.from(violationMessages)
    };
}

// 회색 칸 연결성 확인 함수
function checkGrayCellConnectivity() {
    const currentPuzzle = PUZZLE_MAPS.find(p => p.id === currentLevel);
    const grayCells = [];
    
    // 회색 칸 위치 찾기
    for (let i = 0; i < currentPuzzle.size; i++) {
        for (let j = 0; j < currentPuzzle.size; j++) {
            if (gameBoard[i][j] === 1) {
                grayCells.push([i, j]);
            }
        }
    }
    
    // 회색 칸이 없으면 통과
    if (grayCells.length === 0) return true;
    
    // 방문 배열 초기화
    const visited = Array.from({ length: currentPuzzle.size }, () => 
        Array(currentPuzzle.size).fill(false)
    );
    
    // 첫 번째 회색 칸에서 DFS 시작
    const startCell = grayCells[0];
    dfsConnectivity(startCell[0], startCell[1], visited, currentPuzzle);
    
    // 모든 회색 칸이 방문되었는지 확인
    return grayCells.every(([row, col]) => visited[row][col]);
}

// 깊이 우선 탐색으로 회색 칸 연결성 탐색
function dfsConnectivity(row, col, visited, currentPuzzle) {
    // 보드 경계 및 방문, 회색 칸 체크
    if (row < 0 || row >= currentPuzzle.size || 
        col < 0 || col >= currentPuzzle.size || 
        visited[row][col] || 
        gameBoard[row][col] !== 1) {
        return;
    }
    
    // 방문 표시
    visited[row][col] = true;
    
    // 상하좌우 탐색
    const directions = [
        [0, 1],   // 오른쪽
        [0, -1],  // 왼쪽
        [1, 0],   // 아래
        [-1, 0]   // 위
    ];
    
    for (const [dx, dy] of directions) {
        dfsConnectivity(row + dx, col + dy, visited, currentPuzzle);
    }
}

// 규칙 위반 사항 표시 함수
function updateViolationDisplay() {
    const violationList = document.getElementById('violation-list');
    const ruleCheck = checkGameRules();
    
    violationList.innerHTML = '';
    
    if (ruleCheck.violationMessages.length === 0) {
        violationList.innerHTML = '<li>규칙 위반 없음</li>';
        showGameClearPopup(); // 게임 클리어 팝업 표시

        // 튜토리얼 오버레이 제거
        const tutorialOverlay = document.querySelector('.tutorial-overlay');
        if (tutorialOverlay) {
            tutorialOverlay.remove();
        }
        return;
    }
    
    ruleCheck.violationMessages.forEach((violation, index) => {
        const li = document.createElement('li');
        li.textContent = violation;
        li.dataset.violationIndex = index;

        // 방향 정보 추가
        if (violation.includes('가로')) {
            li.dataset.direction = 'horizontal';
        } else if (violation.includes('세로')) {
            li.dataset.direction = 'vertical';
        }

        // 위반된 셀의 정보 추가
        let violationCells = [];

        // 연속된 같은 색상 위반 (가로)
        if (ruleCheck.violations.consecutiveColors.horizontal && violation.includes('가로')) {
            for (let i = 0; i < gameBoard.length; i++) {
                for (let j = 0; j <= gameBoard.length - 4; j++) {
                    const sequence = gameBoard[i].slice(j, j + 4);
                    const isUniformColor = sequence.every(color => color === sequence[0]);
                    
                    if (isUniformColor) {
                        violationCells = [
                            {row: i, col: j},
                            {row: i, col: j + 1},
                            {row: i, col: j + 2},
                            {row: i, col: j + 3}
                        ];
                        break;
                    }
                }
                if (violationCells.length > 0) break;
            }
        }

        // 연속된 같은 색상 위반 (세로)
        if (ruleCheck.violations.consecutiveColors.vertical && violation.includes('세로')) {
            for (let j = 0; j < gameBoard.length; j++) {
                for (let i = 0; i <= gameBoard.length - 4; i++) {
                    const sequence = [
                        gameBoard[i][j], 
                        gameBoard[i+1][j], 
                        gameBoard[i+2][j], 
                        gameBoard[i+3][j]
                    ];
                    const isUniformColor = sequence.every(color => color === sequence[0]);
                    
                    if (isUniformColor) {
                        violationCells = [
                            {row: i, col: j},
                            {row: i + 1, col: j},
                            {row: i + 2, col: j},
                            {row: i + 3, col: j}
                        ];
                        break;
                    }
                }
                if (violationCells.length > 0) break;
            }
        }

        // 영역 위반 처리
        if (ruleCheck.violations.areaOverflow && violation.includes('영역')) {
            const currentPuzzle = PUZZLE_MAPS.find(p => p.id === currentLevel);
            if (currentPuzzle) {
                for (const area of currentPuzzle.areas) {
                    const grayCount = area.cells.reduce((count, [row, col]) => {
                        return count + (gameBoard[row][col] === 1 ? 1 : 0);
                    }, 0);
                    
                    if (area.required !== 'J') {
                        const requiredCount = parseInt(area.required);
                        if (grayCount > requiredCount || grayCount < requiredCount) {
                            violationCells = area.cells.map(([row, col]) => ({row, col}));
                            break;
                        }
                    }
                }
            }
        }

        // 위반된 셀의 정보 저장
        if (violationCells.length > 0) {
            li.dataset.violationCells = JSON.stringify(violationCells);
        }

        li.addEventListener('click', handleViolationItemClick);
        li.addEventListener('mouseleave', handleViolationItemLeave);
        violationList.appendChild(li);
    });
}

function handleViolationItemLeave() {
    // 모든 하이라이트 제거
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('tutorial-highlight');
        cell.classList.remove('violation-highlight');
        cell.classList.remove('with-z-index');
        cell.style.zIndex = ''; // z-index 초기화
    });
}

function handleViolationItemClick(event) {
    // 모든 하이라이트 제거
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('tutorial-highlight');
        cell.classList.remove('violation-highlight');
        cell.classList.remove('with-z-index');
        cell.style.zIndex = ''; // z-index 초기화
    });

    // 클릭된 위반 항목의 방향 확인
    const direction = event.target.dataset.direction;
    
    // 위반된 셀의 정보 가져오기
    let highlightCells = [];
    if (event.target.dataset.violationCells) {
        highlightCells = JSON.parse(event.target.dataset.violationCells);
    }

    // 중복된 셀 방지
    const uniqueCells = new Set(highlightCells.map(cell => JSON.stringify(cell)));
    highlightCells = Array.from(uniqueCells).map(cell => JSON.parse(cell));

    // 하이라이트 적용
    highlightCells.forEach(({row, col}) => {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('tutorial-highlight');
            cell.classList.add('violation-highlight');
            cell.classList.add('with-z-index');
        }
    });
}

function handleViolationItemClick(event) {
    const violationIndex = event.target.dataset.violationIndex;
    const violationCells = JSON.parse(event.target.dataset.violationCells || '[]');
    
    violationCells.forEach(({row, col}) => {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('violation-highlight');
        }
    });
}

function handleViolationItemLeave() {
    const highlightedCells = document.querySelectorAll('.violation-highlight');
    highlightedCells.forEach(cell => {
        cell.classList.remove('violation-highlight');
    });
}

// 메시지 표시
function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;

    messageContainer.innerHTML = ''; // 기존 메시지 제거
    messageContainer.appendChild(messageElement);

    // 메시지 표시 애니메이션
    requestAnimationFrame(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'scale(1)';
    });

    // 일정 시간 후 메시지 제거
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'scale(0.8)';
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 300);
    }, 3000);
}

// 영역 제약 조건을 확인하는 함수
function checkAreaConstraints(puzzle, area, num) {
    // 영역의 required 값이 0인 경우 숫자가 하나도 없어야 함
    if (area.required === 0) {
        const filledInArea = area.cells.filter(([r, c]) => puzzle.initialState[r][c] !== 0).length;
        return filledInArea === 0 && num === 0;
    }

    // 영역의 required 값이 0보다 큰 경우에만 제약 조건 확인
    if (area.required > 0) {
        const filledInArea = area.cells.filter(([r, c]) => puzzle.initialState[r][c] !== 0).length;
        return filledInArea < area.required || num === 0;
    }
    
    // 다른 경우 어떤 숫자든 허용
    return true;
}

// 숫자 배치의 유효성을 확인하는 함수
function isValidPlacement(puzzle, row, col, num) {
    // 행과 열 제약 조건 확인
    for (let i = 0; i < puzzle.initialState.length; i++) {
        if (puzzle.initialState[row][i] === num && i !== col) return false;
        if (puzzle.initialState[i][col] === num && i !== row) return false;
    }

    // 현재 셀의 영역 찾기
    const area = puzzle.areas.find(a => a.cells.some(([r, c]) => r === row && c === col));
    
    // 영역이 존재하면 제약 조건 확인
    if (area) {
        return checkAreaConstraints(puzzle, area, num);
    }

    return true;
}

// 영역 경계 체크 함수
function checkAreaBoundaries(currentPuzzle) {
    const board = document.getElementById('gameBoard');
    
    // 모든 셀의 area-boundary 클래스 제거
    board.querySelectorAll('.area-boundary').forEach(cell => {
        cell.classList.remove('area-boundary');
        cell.removeAttribute('data-border-top');
        cell.removeAttribute('data-border-bottom');
        cell.removeAttribute('data-border-left');
        cell.removeAttribute('data-border-right');
    });
    
    // 각 영역에 대해 경계 체크
    for (const area of currentPuzzle.areas) {
        const areaCells = area.cells.map(([row, col]) => ({
            cell: board.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
            row,
            col
        }));
        
        // 각 셀에 대해 상하좌우 연결성 체크
        areaCells.forEach((cellData, index) => {
            const { cell, row, col } = cellData;
            
            // 상하좌우 방향 체크
            const directions = [
                { dx: 0, dy: -1, border: 'top' },    // 위
                { dx: 0, dy: 1, border: 'bottom' },  // 아래
                { dx: -1, dy: 0, border: 'left' },   // 왼쪽
                { dx: 1, dy: 0, border: 'right' }    // 오른쪽
            ];
            
            directions.forEach(dir => {
                // 같은 영역의 셀 중 현재 방향에 있는 셀 찾기
                const connectedCell = areaCells.find(
                    otherCell => 
                        otherCell.row === row + dir.dy && 
                        otherCell.col === col + dir.dx
                );
                
                // 연결된 셀이 없다면 경계선 추가
                if (!connectedCell) {
                    cell.classList.add('area-boundary');
                    cell.setAttribute(`data-border-${dir.border}`, 'true');
                }
            });
        });
    }
}

// 게임 클리어 팝업 표시 함수 개선
function showGameClearPopup() {
    const gameClearPopup = document.getElementById('gameClearPopup');
    const clearMoves = document.getElementById('clearMoves');
    const backToLevelsButton = document.getElementById('backToLevelsButton');
    const gameClearMessage = document.getElementById('gameClearMessage');

    // 요소 중 하나라도 없으면 경고 로그
    if (!gameClearPopup || !clearMoves || !backToLevelsButton || !gameClearMessage) {
        console.error('게임 클리어 팝업 요소를 찾을 수 없습니다.');
        return;
    }

    // 현재 레벨 클리어 처리
    const currentLevelId = currentLevel;
    markLevelCleared(currentLevelId);

    // 움직임 수 표시
    clearMoves.textContent = moves;

    // 클리어 메시지 설정 (레벨에 따라 다른 메시지)
    if (currentLevelId <= 5) {
        // 기본 레벨
        gameClearMessage.textContent = "축하합니다! 기본 레벨을 완료했습니다.";
    } else if (currentLevelId > 5 && currentLevelId <= 15) {
        // 중급 레벨
        gameClearMessage.textContent = "훌륭합니다! 중급 레벨을 클리어했습니다.";
    } else {
        // 고급 레벨
        gameClearMessage.textContent = "대단합니다! 고급 레벨을 정복했습니다.";
    }

    // 다음 레벨 버튼 텍스트 설정
    const nextLevelId = currentLevelId + 1;
    if (nextLevelId <= PUZZLE_MAPS.length) {
        backToLevelsButton.textContent = "다음 레벨";
        
        // 다음 레벨로 이동하는 이벤트 리스너 추가
        backToLevelsButton.onclick = () => {
            gameClearPopup.style.display = 'none';
            startGame(nextLevelId);
        };
    } else {
        // 마지막 레벨인 경우
        backToLevelsButton.textContent = "레벨 선택";
        
        // 레벨 선택 화면으로 돌아가는 이벤트 리스너 추가
        backToLevelsButton.onclick = () => {
            gameClearPopup.style.display = 'none';
            showScreen('levelScreen');
        };
    }

    // 클리어 사운드 재생
    playClearSound();

    // 팝업 표시
    gameClearPopup.style.display = 'flex';

    // 레벨 선택 화면 업데이트
    createLevelScreen();
}

// 레벨 클리어 메커니즘 전면 개선
function markLevelCleared(levelId) {
    clearedLevels.add(levelId);
    localStorage.setItem('clearedLevels', JSON.stringify(Array.from(clearedLevels)));
    
    // 레벨 버튼에 클리어 클래스 추가
    const levelBtn = document.querySelector(`.level-btn[data-level="${levelId}"]`);
    if (levelBtn) {
        levelBtn.classList.add('cleared');
    }
}

// 클리어된 레벨 확인 함수 개선
function isLevelCleared(levelId) {
    return clearedLevels.has(levelId);
}

// 게임 클리어 테스트 함수
function testClear() {    
    // 팝업 요소 직접 확인
    const gameClearPopup = document.getElementById('gameClearPopup');
    if (!gameClearPopup) {
        return false;
    }
    
    // 강제로 팝업 표시
    gameClearPopup.style.display = 'flex';
    
    return true;
}

// 화면 전환 함수들
function showScreen(screenId) {
    // 모든 화면 숨기기
    ['startScreen', 'levelScreen', 'gameScreen'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    // 요청된 화면 표시
    document.getElementById(screenId).style.display = screenId === 'levelScreen' ? 'block' : 
                                                    screenId === 'startScreen' ? 'flex' : 'block';
}

// 레벨 선택 UI 추가
function createLevelSelector() {
    const levelGrid = document.getElementById('levelGrid');
    const preparingOverlay = document.getElementById('preparingOverlay');
    levelGrid.innerHTML = ''; // 기존 내용 초기화

    // 퍼즐 맵이 없거나 비어있는 경우
    if (!PUZZLE_MAPS || PUZZLE_MAPS.length === 0) {
        // 준비 중 오버레이 표시
        preparingOverlay.style.display = 'flex';
        return;
    }

    // 준비 중 오버레이 숨기기
    preparingOverlay.style.display = 'none';

    // 레벨 버튼 생성
    PUZZLE_MAPS.forEach(puzzle => {
        const levelButton = document.createElement('button');
        levelButton.textContent = `Level ${puzzle.id}`;
        levelButton.addEventListener('click', () => {
            // 레벨 유효성 검사
            checkLevel(puzzle.id);
        });
        levelGrid.appendChild(levelButton);
    });
}

// 게임 초기화
function onload() {
    // 레벨 선택기 생성
    createLevelSelector();
    
    // 초기 레벨 시작 (첫 번째 퍼즐의 ID 사용)
    startGame(PUZZLE_MAPS[0].id);
    
    // startButton 대신 게임보드에 클릭 이벤트 추가
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        gameBoard.addEventListener('click', () => {
            // 현재 레벨 다시 시작
            startGame(currentLevel);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 모든 이벤트 리스너 추가
    document.getElementById('optionsButton').addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none'; // 스타트 스크린 숨기기
        document.getElementById('option-screen').style.display = 'block'; // 옵션 스크린 보이기
    });

    document.getElementById('back-button').addEventListener('click', function() {
        document.getElementById('option-screen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex'; // 스타트 스크린 보이기
    });

    document.getElementById('clear-data-button').addEventListener('click', function() {
        // 데이터 초기화 로직 추가
        clearedLevels.clear(); // clearedLevels Set 비우기
        localStorage.setItem('clearedLevels', JSON.stringify([])); // 로컬 스토리지도 비우기
        showMessage('레벨 클리어 데이터를 초기화 했습니다.'); // showMessage 함수 사용
    });
});

// 페이지가 로드될 때 17레벨로 이동
/*
document.addEventListener("DOMContentLoaded", function() {
    console.log('Page loaded');
    // const levelToLoad = 17;
    // startGame(levelToLoad);
});*/

document.getElementById('clear-data-button').addEventListener('click', function() {
    // 데이터 초기화 로직 추가
    clearedLevels.clear(); // clearedLevels Set 비우기
    localStorage.setItem('clearedLevels', JSON.stringify([])); // 로컬 스토리지도 비우기
    showMessage('레벨 클리어 데이터를 초기화 했습니다.'); // showMessage 함수 사용
});
