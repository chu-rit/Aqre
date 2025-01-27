// 게임 상수
const BOARD_SIZE = 6;
const COLOR_STATES = ['white', 'gray'];

// 퍼즐 데이터 
let currentLevel = 0;
let gameBoard = [];
let moves = 0;
let gameStarted = false;

// 게임 초기화
function startGame(levelIndex = 0) {
    currentLevel = levelIndex;
    moves = 0;
    gameStarted = true;
    
    const puzzle = PUZZLE_MAPS[levelIndex];
    gameBoard = JSON.parse(JSON.stringify(puzzle.initialState));
    
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
function createAreaOverlay(area) {
    // 영역의 크기와 위치 계산
    const cellSize = 60; // --cell-size 값
    const borderWidth = 2; // border width
    
    // 영역의 경계 계산
    const minRow = Math.min(...area.cells.map(cell => cell[0]));
    const maxRow = Math.max(...area.cells.map(cell => cell[0]));
    const minCol = Math.min(...area.cells.map(cell => cell[1]));
    const maxCol = Math.max(...area.cells.map(cell => cell[1]));
    
    const width = (maxCol - minCol + 1) * cellSize;
    const height = (maxRow - minRow + 1) * cellSize;
    const left = minCol * cellSize - borderWidth;
    const top = minRow * cellSize - borderWidth;
    
    // 영역 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'area-container';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;

    // 숫자 오버레이 생성 (0보다 큰 경우에만)
    if (area.required > 0 && area.required !== 'J') {
        const overlay = document.createElement('div');
        overlay.className = 'area-overlay';
        overlay.textContent = area.required;
        
        // 컨테이너에 오버레이 추가
        container.appendChild(overlay);
    }
    
    return container;
}

// 보드 렌더링
function renderBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    // 셀 생성
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (gameBoard[i][j] === 1) {
                cell.classList.add('gray');
            }
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }
    
    // 영역 오버레이 추가
    const currentPuzzle = PUZZLE_MAPS[currentLevel];
    currentPuzzle.areas.forEach(area => {
        const areaContainer = createAreaOverlay(area);
        board.appendChild(areaContainer);
    });
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
        
        if (grayCount !== area.required) {
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
        
        if (grayCount > area.required) {
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
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;
    
    document.querySelector('.game-content').appendChild(messageElement);
    
    setTimeout(() => messageElement.remove(), 3000);
}

// 게임 초기화
document.getElementById('startButton').addEventListener('click', () => startGame(currentLevel));

// 레벨 선택 UI 추가
function createLevelSelector() {
    const selector = document.createElement('div');
    selector.className = 'level-selector';
    selector.innerHTML = `
        <h3>Select Level</h3>
        <div class="level-buttons">
            ${PUZZLE_MAPS.map(puzzle => `
                <button class="level-btn" data-level="${puzzle.id - 1}">
                    Level ${puzzle.id}
                    <span class="difficulty ${puzzle.difficulty.toLowerCase()}">${puzzle.difficulty}</span>
                </button>
            `).join('')}
        </div>
    `;
    
    document.querySelector('.game-content').insertBefore(
        selector,
        document.getElementById('gameBoard')
    );
    
    // 레벨 선택 이벤트 리스너
    selector.addEventListener('click', (e) => {
        if (e.target.classList.contains('level-btn')) {
            const level = parseInt(e.target.dataset.level);
            startGame(level);
        }
    });
}

// 게임 초기화
window.onload = () => {
    createLevelSelector();
    startGame(0);
};