// 게임 상수
const BOARD_SIZE = 6;
const COLOR_STATES = ['white', 'gray'];

// 퍼즐 데이터 
let currentLevel = 0;
let gameBoard = [];
let moves = 0;
let gameStarted = false;

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const optionsButton = document.getElementById('optionsButton');
    const backToStart = document.getElementById('backToStart');
    const backToLevels = document.getElementById('backToLevels');
    const showRules = document.getElementById('showRules');
    const closeRules = document.getElementById('closeRules');
    const rulesPopup = document.getElementById('rulesPopup');

    // 시작 화면 버튼들
    if (startButton) {
        startButton.addEventListener('click', () => {
            showScreen('levelScreen');
            createLevelScreen();
        });
    }

    if (optionsButton) {
        optionsButton.addEventListener('click', () => {
            // 옵션 메뉴 표시 로직
            console.log('옵션 메뉴 열기');
            // TODO: 옵션 메뉴 구현
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
});

// 레벨 선택 화면 생성
function createLevelScreen() {
    const levelGrid = document.getElementById('levelGrid');
    levelGrid.innerHTML = ''; // 기존 내용 초기화

    // 30개의 레벨 버튼 생성
    for (let i = 1; i <= 30; i++) {
        const levelBtn = document.createElement('button');
        levelBtn.className = 'level-btn';
        levelBtn.dataset.level = i;
        levelBtn.textContent = `${i}`;
        
        levelBtn.addEventListener('click', () => {
            // showScreen('gameScreen');
            // startGame(i - 1);
            checkLevel(i - 1);
        });
        
        levelGrid.appendChild(levelBtn);
    }
}

// 레벨 유효성 검사 함수
function checkLevel(levelIndex) {

    // 레벨 인덱스가 유효한 범위를 벗어나는 경우
    if (levelIndex < 0 || levelIndex >= PUZZLE_MAPS.length) {
        showMessage('아직 준비중입니다.', 'warning');
        return false;
    }

    showScreen('gameScreen');
    startGame(levelIndex);
}

// 게임 초기화
function startGame(levelIndex = 0) {
    currentLevel = levelIndex;
    moves = 0;
    gameStarted = true;
    
    const puzzle = PUZZLE_MAPS[levelIndex];
    
    // initialState가 없는 경우 기본 게임판 생성
    gameBoard = puzzle.initialState || Array.from({ length: BOARD_SIZE }, () => 
        Array(BOARD_SIZE).fill(0)
    );
    
    updateGameInfo();
    renderBoard();
    updateViolationDisplay();
}

// 게임 정보 업데이트
function updateGameInfo() {
    const puzzle = PUZZLE_MAPS[currentLevel];
    const infoElement = document.querySelector('.level-info');
    if (infoElement) {
        infoElement.innerHTML = `
            <h3>Level ${puzzle.id}: ${puzzle.name}</h3>
            <p>Difficulty: ${puzzle.difficulty}</p>
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
    const currentPuzzle = PUZZLE_MAPS[currentLevel];
    
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
            
            // 셀의 색상 설정
            if (gameBoard[row][col] === 1) {
                cell.classList.add('gray');
            }
            
            // 셀의 행, 열 데이터 속성 설정
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 셀의 영역 정보 추가
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
            
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }
    
    // 영역 경계 체크
    checkAreaBoundaries(currentPuzzle);
}

// 셀 클릭 처리
function handleCellClick(event) {
    if (!gameStarted) return;
    
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    toggleCellColor(cell, row, col);
    moves++;
    updateGameInfo();
    updateViolationDisplay();
    
    // 게임 클리어 체크
    checkGameCompletion();
}

// 셀 색상 변경
function toggleCellColor(cell, row, col) {
    gameBoard[row][col] = (gameBoard[row][col] + 1) % COLOR_STATES.length;
    
    // 클래스를 한 번만 토글
    cell.classList.toggle('gray', gameBoard[row][col] === 1);
}

// 게임 완료 체크
function checkGameCompletion() {
    const currentPuzzle = PUZZLE_MAPS[currentLevel];
    
    // 각 영역의 회색 칸 수 확인
    for (const area of currentPuzzle.areas) {
        const grayCount = area.cells.reduce((count, [row, col]) => {
            return count + (gameBoard[row][col] === 1 ? 1 : 0);
        }, 0);
        
        // 'J'인 경우는 검사하지 않음
        if (area.required === 'J') continue;
        
        // 문자열로 된 숫자를 정수로 변환하여 비교
        const requiredCount = parseInt(area.required);
        if (grayCount !== requiredCount) {
            return false;
        }
    }
    
    // 4개 연속 체크
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 가로 체크
        for (let j = 0; j <= BOARD_SIZE - 4; j++) {
            const sum = gameBoard[i][j] + gameBoard[i][j+1] + 
                       gameBoard[i][j+2] + gameBoard[i][j+3];
            if (sum === 4 || sum === 0) return false;
        }
        
        // 세로 체크
        for (let j = 0; j <= BOARD_SIZE - 4; j++) {
            const sum = gameBoard[j][i] + gameBoard[j+1][i] + 
                       gameBoard[j+2][i] + gameBoard[j+3][i];
            if (sum === 4 || sum === 0) return false;
        }
    }
    
    return true;
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
    const currentPuzzle = PUZZLE_MAPS[currentLevel];
    
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
    }
    
    // 2. 연속된 같은 색상 체크 (가로, 세로)
    const directions = [
        { dx: 1, dy: 0, name: '가로', key: 'horizontal' },  // 가로
        { dx: 0, dy: 1, name: '세로', key: 'vertical' }   // 세로
    ];
    
    for (const dir of directions) {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j <= BOARD_SIZE - 4; j++) {
                const sequence = [];
                for (let k = 0; k < 4; k++) {
                    const color = dir.dx === 1 
                        ? gameBoard[i][j + k] 
                        : gameBoard[j + k][i];
                    sequence.push(color);
                }
                
                // 4개 연속 같은 색상 체크
                if (sequence.every(color => color === sequence[0])) {
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
    const grayCells = [];
    
    // 회색 칸 위치 찾기
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (gameBoard[i][j] === 1) {
                grayCells.push([i, j]);
            }
        }
    }
    
    // 회색 칸이 없으면 통과
    if (grayCells.length === 0) return true;
    
    // 방문 배열 초기화
    const visited = Array.from({ length: BOARD_SIZE }, () => 
        Array(BOARD_SIZE).fill(false)
    );
    
    // 첫 번째 회색 칸에서 DFS 시작
    const startCell = grayCells[0];
    dfsConnectivity(startCell[0], startCell[1], visited);
    
    // 모든 회색 칸이 방문되었는지 확인
    return grayCells.every(([row, col]) => visited[row][col]);
}

// 깊이 우선 탐색으로 회색 칸 연결성 탐색
function dfsConnectivity(row, col, visited) {
    // 보드 경계 및 방문, 회색 칸 체크
    if (row < 0 || row >= BOARD_SIZE || 
        col < 0 || col >= BOARD_SIZE || 
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
        dfsConnectivity(row + dx, col + dy, visited);
    }
}

// 규칙 위반 사항 표시 함수
function updateViolationDisplay() {
    const violationList = document.getElementById('violation-list');
    const ruleCheck = checkGameRules();
    
    violationList.innerHTML = '';
    
    if (ruleCheck.violationMessages.length === 0) {
        violationList.innerHTML = '<li>규칙 위반 없음</li>';
        return;
    }
    
    ruleCheck.violationMessages.forEach(violation => {
        const li = document.createElement('li');
        li.textContent = violation;
        violationList.appendChild(li);
    });
}

// 메시지 표시
function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        console.error('메시지 컨테이너를 찾을 수 없습니다.');
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
    console.log('이거맞아?');

    // 레벨 버튼 생성
    PUZZLE_MAPS.forEach((puzzle, index) => {
        const levelButton = document.createElement('button');
        levelButton.textContent = `Level ${puzzle.id}`;
        levelButton.addEventListener('click', () => {
            // 레벨 유효성 검사
            if (checkLevel(index)) {
                console.log(checkLevel(index));
                // startGame(index);
                // showGameScreen();
            }
        });
        levelGrid.appendChild(levelButton);
    });
}

// 게임 화면 전환 함수
function showGameScreen() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    onload(); // 게임 초기화
}

// 시작 화면으로 돌아가기
function showStartScreen() {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
}

// 게임 초기화
function onload() {
    // 레벨 선택기 생성
    createLevelSelector();
    
    // 초기 레벨 시작
    startGame(0);
    
    // startButton 대신 게임보드에 클릭 이벤트 추가
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        gameBoard.addEventListener('click', () => {
            // 현재 레벨 다시 시작
            startGame(currentLevel);
        });
    }
}
