// AQRE 퍼즐 솔버 웹 워커
// 메인 스레드로부터 퍼즐 데이터와 탐색 방향을 받아 백트래킹 알고리즘 실행

// 다른 워커가 이미 찾은 솔루션 ID 저장용 Set
const knownSolutionIds = new Set();

// 퍼즐 데이터
let size;
let areas;
let direction;

// 보드 초기화
let board;

// 블랙 셀 비트마스크 초기화
let blackCellBitmask;

// 영역 맵 초기화
let areaMap = {};

// 솔루션 배열
let solutions = [];

// 전역 변수 (진행 상황 추적용)
let globalIterationCount = 0;
let globalSolutionsCount = 0;
const progressInterval = 1000000; // 100만번 반복마다 진행 상황 업데이트 (기존 10,000에서 증가)

// 웹 워커 메시지 이벤트 리스너
self.onmessage = function(e) {
    const message = e.data;
    
    try {
        switch (message.type) {
            case 'init':
                // 퍼즐 데이터 초기화
                const puzzleData = message.data;
                size = puzzleData.size;
                areas = puzzleData.areas;
                direction = message.direction;
                
                // 보드 초기화 (사전 확정된 셀 적용)
                board = puzzleData.initialBoard;
                
                // 블랙 셀 비트마스크 설정
                blackCellBitmask = puzzleData.blackCellBitmask;
                
                // 영역 맵 생성
                for (let i = 0; i < areas.length; i++) {
                    const area = areas[i];
                    for (let j = 0; j < area.cells.length; j++) {
                        const [row, col] = area.cells[j];
                        areaMap[`${row},${col}`] = i;
                    }
                }
                
                // 시작 인덱스 결정 (방향에 따라)
                let startIndex;
                if (direction === 'forward') {
                    // 앞에서 뒤로 탐색
                    for (let i = 0; i < size * size; i++) {
                        const row = Math.floor(i / size);
                        const col = i % size;
                        const pos = row * size + col;
                        const idx = Math.floor(pos / 32);
                        const mask = 1 << (pos % 32);
                        
                        if (!(blackCellBitmask[idx] & mask) && board[row][col] === -1) {
                            startIndex = i;
                            break;
                        }
                    }
                } else {
                    // 뒤에서 앞으로 탐색
                    for (let i = size * size - 1; i >= 0; i--) {
                        const row = Math.floor(i / size);
                        const col = i % size;
                        const pos = row * size + col;
                        const idx = Math.floor(pos / 32);
                        const mask = 1 << (pos % 32);
                        
                        if (!(blackCellBitmask[idx] & mask) && board[row][col] === -1) {
                            startIndex = i;
                            break;
                        }
                    }
                }
                
                // 시작 메시지 전송
                self.postMessage({
                    type: 'log',
                    message: `${direction} 워커 시작: 인덱스 ${startIndex}부터 탐색`,
                    direction: direction
                });
                
                // 백트래킹 시작
                const startTime = Date.now();
                const result = backtrack(startIndex);
                const endTime = Date.now();
                const elapsedTime = (endTime - startTime) / 1000;
                
                // 완료 메시지 전송
                self.postMessage({
                    type: 'complete',
                    solutions: solutions.length,
                    iterations: globalIterationCount,
                    elapsedTime: elapsedTime,
                    direction: direction
                });
                break;
                
            case 'solutionFound':
                // 다른 워커가 찾은 솔루션 ID 추가
                knownSolutionIds.add(message.solutionId);
                break;
                
            default:
                console.error(`알 수 없는 메시지 타입: ${message.type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: `워커 오류: ${error.message}`,
            stack: error.stack,
            direction: direction
        });
    }
};

// 연속된 같은 색상 체크 함수 (최적화 버전)
function isValidColorOptimized(board, row, col, color) {
    // 가로 방향 체크
    let count = 1;
    // 왼쪽 체크
    for (let c = col - 1; c >= 0; c--) {
        if (board[row][c] === color) {
            count++;
            if (count >= 4) return false;
        } else {
            break;
        }
    }
    // 오른쪽 체크
    for (let c = col + 1; c < size; c++) {
        if (board[row][c] === color) {
            count++;
            if (count >= 4) return false;
        } else {
            break;
        }
    }
    
    // 세로 방향 체크
    count = 1;
    // 위쪽 체크
    for (let r = row - 1; r >= 0; r--) {
        if (board[r][col] === color) {
            count++;
            if (count >= 4) return false;
        } else {
            break;
        }
    }
    // 아래쪽 체크
    for (let r = row + 1; r < size; r++) {
        if (board[r][col] === color) {
            count++;
            if (count >= 4) return false;
        } else {
            break;
        }
    }
    
    return true;
}

// 영역 제약 조건 검사 함수
function checkAreaConstraints(board, row, col, color) {
    const areaIndex = areaMap[`${row},${col}`];
    if (areaIndex === undefined) return true;
    
    const area = areas[areaIndex];
    const required = area.required; // hint 대신 required 속성 사용
    
    // 힌트가 없으면 제약 없음
    if (required === undefined) return true;
    
    // 현재 영역의 회색 셀 수 계산
    let grayCount = 0;
    let undecidedCount = 0;
    
    for (let i = 0; i < area.cells.length; i++) {
        const [r, c] = area.cells[i];
        if (board[r][c] === 1 || (r === row && c === col && color === 1)) {
            grayCount++;
        } else if (board[r][c] === -1 && !(r === row && c === col)) {
            undecidedCount++;
        }
    }
    
    // 이미 힌트보다 많은 회색 셀이 있으면 실패
    if (grayCount > required) return false;
    
    // 남은 셀을 모두 회색으로 채워도 힌트를 만족할 수 없으면 실패
    if (grayCount + undecidedCount < required) return false;
    
    return true;
}

// 회색 셀 연결 가능성 체크 함수
function canConnectToGray(board, row, col) {
    // 인접한 셀 중 회색 셀이 있는지 확인
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
            if (board[newRow][newCol] === 1) {
                return true;
            }
        }
    }
    
    // 인접한 빈 칸 확인
    let hasEmptyNearby = false;
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
            if (board[newRow][newCol] === -1) {
                hasEmptyNearby = true;
                break;
            }
        }
    }
    
    if (!hasEmptyNearby) return false;
    
    // 기존 회색 타일 존재 여부 확인
    let hasExistingGray = false;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 1) {
                hasExistingGray = true;
                break;
            }
        }
        if (hasExistingGray) break;
    }
    
    return !hasExistingGray || hasEmptyNearby;
}

// DFS로 회색 셀 연결성 검사 (비트마스크 사용)
function dfsConnectivity(board, row, col, visitedBitmask, size) {
    const pos = row * size + col;
    const idx = Math.floor(pos / 32);
    const mask = 1 << (pos % 32);
    
    // 이미 방문했거나 회색 셀이 아니면 종료
    if ((visitedBitmask[idx] & mask) || board[row][col] !== 1) {
        return;
    }
    
    // 방문 표시
    visitedBitmask[idx] |= mask;
    
    // 인접한 셀 탐색
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
            dfsConnectivity(board, newRow, newCol, visitedBitmask, size);
        }
    }
}

// 회색 셀 연결성 검사 함수 (비트마스크 최적화 버전)
function checkGrayConnect(board, size) {
    // 회색 셀 비트마스크 생성
    const grayBitmask = new Array(Math.ceil((size * size) / 32)).fill(0);
    let grayCount = 0;
    let firstGrayCell = [-1, -1];
    
    // 회색 셀 찾기
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (board[row][col] === 1) {
                const pos = row * size + col;
                const idx = Math.floor(pos / 32);
                const mask = 1 << (pos % 32);
                grayBitmask[idx] |= mask;
                grayCount++;
                
                if (firstGrayCell[0] === -1) {
                    firstGrayCell = [row, col];
                }
            }
        }
    }
    
    // 회색 셀이 없거나 하나면 연결성 체크 불필요
    if (grayCount <= 1) return true;
    
    // 방문 배열 초기화 (비트마스크)
    const visitedBitmask = new Array(Math.ceil((size * size) / 32)).fill(0);
    
    // 첫 번째 회색 셀부터 DFS 시작
    const [startRow, startCol] = firstGrayCell;
    dfsConnectivity(board, startRow, startCol, visitedBitmask, size);
    
    // 모든 회색 셀 방문 확인 (비트마스크 비교)
    for (let i = 0; i < grayBitmask.length; i++) {
        // 방문하지 않은 회색 셀이 있는지 확인
        // grayBitmask에는 1이지만 visitedBitmask에는 0인 비트가 있으면 연결되지 않은 것
        if ((grayBitmask[i] & ~visitedBitmask[i]) !== 0) {
            return false;
        }
    }
    
    return true;
}

// 백트래킹 함수 (비트마스크 최적화 버전)
function backtrack(index) {
    globalIterationCount++;
    
    // 진행 상황 업데이트
    if (globalIterationCount % progressInterval === 0) {
        const progress = (globalIterationCount / 1000000) * 100; // 진행률 계산 (예상 반복 횟수 기준)
        self.postMessage({
            type: 'progress',
            progress: Math.min(progress, 99.9), // 100%가 되지 않도록 제한
            iterationCount: globalIterationCount,
            direction: direction
        });
    }
    
    // 모든 빈 셀을 처리했는지 확인
    if (index === -1) {
        // 회색 셀 연결성 확인
        if (!checkGrayConnect(board, size)) return false;
        
        // 솔루션 추가
        const solutionCopy = board.map(row => [...row]);
        const solutionStr = JSON.stringify(solutionCopy);
        
        // 이미 다른 워커가 찾은 솔루션인지 확인
        if (knownSolutionIds.has(solutionStr)) {
            return false; // 이미 알려진 솔루션이면 건너뛰기
        }
        
        solutions.push(solutionCopy);
        globalSolutionsCount++;
        
        // 솔루션 발견 메시지 전송
        self.postMessage({
            type: 'solution',
            solution: solutionCopy,
            solutionIndex: globalSolutionsCount,
            direction: direction
        });
        
        // 3개 솔루션을 찾으면 종료
        return solutions.length >= 3;
    }
    
    // 현재 위치 계산
    const row = Math.floor(index / size);
    const col = index % size;
    
    // 다음 빈 셀 찾기 - 단순히 방향에 따라 순차적으로 탐색
    let nextIndex = -1;
    
    if (direction === 'forward') {
        // 앞에서 뒤로 탐색
        for (let i = index + 1; i < size * size; i++) {
            const nextRow = Math.floor(i / size);
            const nextCol = i % size;
            const nextPos = nextRow * size + nextCol;
            const nextIdx = Math.floor(nextPos / 32);
            const nextMask = 1 << (nextPos % 32);
            
            // 블랙 셀이 아니고 아직 색이 결정되지 않은 셀인지 확인
            if (!(blackCellBitmask[nextIdx] & nextMask) && board[nextRow][nextCol] === -1) {
                nextIndex = i;
                break;
            }
        }
    } else {
        // 뒤에서 앞으로 탐색
        for (let i = index - 1; i >= 0; i--) {
            const nextRow = Math.floor(i / size);
            const nextCol = i % size;
            const nextPos = nextRow * size + nextCol;
            const nextIdx = Math.floor(nextPos / 32);
            const nextMask = 1 << (nextPos % 32);
            
            // 블랙 셀이 아니고 아직 색이 결정되지 않은 셀인지 확인
            if (!(blackCellBitmask[nextIdx] & nextMask) && board[nextRow][nextCol] === -1) {
                nextIndex = i;
                break;
            }
        }
    }
    
    // 두 가지 색상 시도 (회색, 흰색)
    // 항상 회색(1)부터 시도
    const colors = [1, 0];
    
    for (const color of colors) {
        // 색상 유효성 검사
        if (!isValidColorOptimized(board, row, col, color)) {
            continue;
        }
        
        // 회색 타일 연결 가능성 체크
        if (color === 1 && !canConnectToGray(board, row, col)) {
            continue;
        }
        
        // 영역 제약 조건 검사
        if (!checkAreaConstraints(board, row, col, color)) {
            continue;
        }
        
        // 색상 설정
        board[row][col] = color;
        
        // 재귀 호출
        if (backtrack(nextIndex)) {
            return true;
        }
        
        // 백트래킹
        board[row][col] = -1;
    }
    
    return false;
}
