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

// 퍼즐 ID
let puzzleId = 0;

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
                
                // 퍼즐 ID 저장
                self.puzzleId = puzzleData.id || 0;
                
                // 보드 초기화 (사전 확정된 셀 적용)
                board = puzzleData.initialBoard;
                
                // 블랙 셀 비트마스크 설정
                blackCellBitmask = puzzleData.blackCellBitmask;
                
                // 영역 맵 생성
                areaMap = {}; // 초기화
                for (let i = 0; i < areas.length; i++) {
                    const area = areas[i];
                    const cells = area.cells;
                    
                    for (let j = 0; j < cells.length; j++) {
                        const [row, col] = cells[j];
                        areaMap[`${row},${col}`] = i;
                    }
                }
                
                // 방향 파싱 - 워커 번호에 따라 방향 결정
                const workerNumber = parseInt(direction.split('워커_')[1]);
                // 워커 번호가 1~4면 forward, 5~8이면 backward
                let isForward = workerNumber <= 4;
                
                // 워커 번호 조정 (backward 워커는 5~8이지만 계산을 위해 1~4로 변환)
                const adjustedWorkerNumber = isForward ? workerNumber : (workerNumber - 4);
                
                // 전체 보드 크기
                const totalCells = size * size;
                
                // 시작 인덱스 결정
                let startIndex = -1;
                
                // 8x8 사이즈의 경우 각 워커의 시작점을 각 줄의 첫 번째 칸으로 지정
                if (size === 8 && workerNumber <= 8) {
                    // 워커 번호에 따라 담당 줄 결정 (0~7)
                    const row = workerNumber - 1;
                    
                    // 해당 줄의 첫 번째 빈 셀 찾기
                    for (let col = 0; col < size; col++) {
                        const pos = row * size + col;
                        const idx = Math.floor(pos / 32);
                        const mask = 1 << (pos % 32);
                        
                        if (!(blackCellBitmask[idx] & mask) && board[row][col] === -1) {
                            startIndex = pos;
                            break;
                        }
                    }
                    
                    // 시작 인덱스를 찾지 못했으면 다른 줄에서 찾기
                    if (startIndex === -1) {
                        for (let r = 0; r < size; r++) {
                            if (r === row) continue; // 이미 검사한 줄은 건너뛰기
                            
                            for (let col = 0; col < size; col++) {
                                const pos = r * size + col;
                                const idx = Math.floor(pos / 32);
                                const mask = 1 << (pos % 32);
                                
                                if (!(blackCellBitmask[idx] & mask) && board[r][col] === -1) {
                                    startIndex = pos;
                                    break;
                                }
                            }
                            
                            if (startIndex !== -1) break;
                        }
                    }
                    
                    // 시작 메시지 전송
                    self.postMessage({
                        type: 'log',
                        message: `워커 ${workerNumber} 시작: ${row}번 줄 첫 칸에서 시작, 인덱스 ${startIndex}`,
                        direction: direction
                    });
                } else if (isForward) {
                    // 정방향 워커는 앞에서부터 탐색
                    // 워커 번호에 따라 다른 시작점 사용 (균등 분배)
                    const startPercentage = (adjustedWorkerNumber - 1) / 4; // 0%, 25%, 50%, 75%
                    const startPos = Math.floor(totalCells * startPercentage);
                    
                    // 시작 인덱스 찾기
                    for (let i = startPos; i < totalCells; i++) {
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
                    
                    // 앞에서 빈 셀을 찾지 못했으면 처음부터 다시 찾기
                    if (startIndex === -1) {
                        for (let i = 0; i < startPos; i++) {
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
                } else {
                    // 역방향 워커는 뒤에서부터 탐색
                    // 워커 번호에 따라 다른 시작점 사용 (균등 분배)
                    const startPercentage = (adjustedWorkerNumber - 1) / 4; // 0%, 25%, 50%, 75%
                    const startPos = totalCells - 1 - Math.floor(totalCells * startPercentage);
                    
                    // 시작 인덱스 찾기
                    for (let i = startPos; i >= 0; i--) {
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
                    
                    // 뒤에서 빈 셀을 찾지 못했으면 끝에서부터 다시 찾기
                    if (startIndex === -1) {
                        for (let i = totalCells - 1; i > startPos; i--) {
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
                }
                
                // 시작 인덱스를 찾지 못했으면 오류
                if (startIndex === -1) {
                    self.postMessage({
                        type: 'log',
                        message: `워커 ${workerNumber}: 빈 셀을 찾을 수 없음`,
                        direction: direction
                    });
                    
                    self.postMessage({
                        type: 'complete',
                        solutions: 0,
                        iterations: 0,
                        elapsedTime: 0,
                        direction: direction,
                        workerNumber: workerNumber
                    });
                    return;
                }
                
                // 시작 메시지 전송
                self.postMessage({
                    type: 'log',
                    message: `워커 ${workerNumber} 시작: 인덱스 ${startIndex}부터 ${isForward ? '정방향' : '역방향'} 탐색`,
                    direction: direction
                });
                
                // 백트래킹 시작 - 전체 보드 탐색
                const startTime = Date.now();
                backtrack(board, startIndex, 0, totalCells - 1, isForward);
                const endTime = Date.now();
                
                // 완료 메시지 전송
                const elapsedTime = (endTime - startTime) / 1000;
                self.postMessage({
                    type: 'complete',
                    solutions: solutions.length,
                    iterations: globalIterationCount,
                    elapsedTime: elapsedTime,
                    direction: direction,
                    workerNumber: workerNumber
                });
                break;
                
            case 'solutionFound':
                // 다른 워커가 찾은 솔루션 ID 저장
                knownSolutionIds.add(message.solutionId);
                break;
                
            default:
                self.postMessage({
                    type: 'error',
                    message: `알 수 없는 메시지 타입: ${message.type}`,
                    direction: direction
                });
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

// 영역 제약 조건 검사 함수
function checkAreaConstraints(board, row, col, color) {
    // 현재 셀이 속한 영역 찾기
    const areaIndex = areaMap[`${row},${col}`];
    if (areaIndex === undefined) return true;
    
    const area = areas[areaIndex];
    const required = area.required; // hint 대신 required 속성 사용
    
    // 힌트가 없으면 제약 없음
    if (required === undefined) return true;
    
    // 현재 영역의 회색 셀 수와 빈 셀 수 계산
    let grayCount = 0;
    let undecidedCount = 0;
    
    for (let i = 0; i < area.cells.length; i++) {
        const [r, c] = area.cells[i];
        if (r === row && c === col) {
            // 현재 셀은 색상 적용 전이므로 파라미터로 받은 색상 사용
            if (color === 1) grayCount++;
        } else if (board[r][c] === 1) {
            grayCount++;
        } else if (board[r][c] === -1) {
            undecidedCount++;
        }
    }
    
    // 이미 힌트보다 많은 회색 셀이 있으면 실패
    if (grayCount > required) return false;
    
    // 남은 셀을 모두 회색으로 채워도 힌트를 만족할 수 없으면 실패
    if (grayCount + undecidedCount < required) return false;
    
    // 현재 셀을 회색으로 설정하려는데, 이미 영역 내 회색 셀이 힌트와 같으면 실패
    if (color === 1 && grayCount > required) return false;
    
    // 현재 셀을 흰색으로 설정하려는데, 남은 빈 셀을 모두 회색으로 채워도 힌트에 도달할 수 없으면 실패
    if (color === 0 && grayCount + undecidedCount < required) return false;
    
    return true;
}

// 연속된 같은 색상 체크 함수
function isValidColor(board, row, col, color) {
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

// 회색 셀 연결 가능성 체크 함수
function canConnectToGray(board, row, col) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    // 인접한 회색 타일 확인
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
    outerLoop: for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 1) {
                hasExistingGray = true;
                break outerLoop;
            }
        }
    }

    return !hasExistingGray || hasEmptyNearby;
}

// 회색 셀 연결성 검사 함수
function checkGrayConnect(board, size) {
    // 회색 셀 비트마스크 생성
    const grayBitmask = new Array(Math.ceil((size * size) / 32)).fill(0);
    let grayCount = 0;
    let firstGrayCell = [-1, -1];
    
    // 회색 셀 찾기 및 비트마스크 설정
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (board[row][col] === 1) {
                const pos = row * size + col;
                grayBitmask[Math.floor(pos / 32)] |= (1 << (pos % 32));
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
    
    // DFS로 연결된 회색 셀 탐색
    function dfs(row, col) {
        if (row < 0 || row >= size || col < 0 || col >= size) {
            return;
        }
        
        const pos = row * size + col;
        const idx = Math.floor(pos / 32);
        const mask = 1 << (pos % 32);
        
        // 이미 방문했거나 회색 셀이 아니면 건너뜀
        if ((visitedBitmask[idx] & mask) || board[row][col] !== 1) {
            return;
        }
        
        // 방문 표시
        visitedBitmask[idx] |= mask;
        
        // 4방향 탐색
        dfs(row - 1, col); // 위
        dfs(row + 1, col); // 아래
        dfs(row, col - 1); // 왼쪽
        dfs(row, col + 1); // 오른쪽
    }
    
    dfs(startRow, startCol);
    
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

// 백트래킹 알고리즘
function backtrack(board, index, startPosition, endPosition, isForward) {
    globalIterationCount++;
    if (globalIterationCount % 20000000 === 0) {
        updateProgress();
    }
    
    // 모든 셀이 채워졌는지 확인
    let allFilled = true;
    let nextIndex = -1;
    
    // 전체 보드 검사
    const totalCells = size * size;
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        const pos = row * size + col;
        const idx = Math.floor(pos / 32);
        const mask = 1 << (pos % 32);
        
        // 블랙 셀이 아니고 아직 채워지지 않은 셀인 경우
        if (!(blackCellBitmask[idx] & mask) && board[row][col] === -1) {
            allFilled = false;
            
            // 방향에 따라 다음 인덱스 결정
            if (isForward) {
                // 정방향은 현재 인덱스 이후의 첫 번째 빈 셀
                if (i >= index) {
                    nextIndex = i;
                    break;
                }
            } else {
                // 역방향은 현재 인덱스 이전의 첫 번째 빈 셀
                if (i <= index) {
                    nextIndex = i;
                    // 역방향은 계속 검색하여 가장 큰 인덱스 찾기
                }
            }
        }
    }
    
    // 역방향에서 nextIndex를 찾지 못했는데 빈 셀이 있는 경우, 처음부터 다시 검색
    if (!isForward && nextIndex === -1 && !allFilled) {
        for (let i = totalCells - 1; i >= 0; i--) {
            const row = Math.floor(i / size);
            const col = i % size;
            const pos = row * size + col;
            const idx = Math.floor(pos / 32);
            const mask = 1 << (pos % 32);
            
            if (!(blackCellBitmask[idx] & mask) && board[row][col] === -1) {
                nextIndex = i;
                break;
            }
        }
    }
    
    // 모든 셀이 채워졌으면 회색 셀 연결성 검사
    if (allFilled) {
        // 회색 셀 연결성 검사
        if (checkGrayConnect(board, size)) {
            // 솔루션 발견
            const solution = board.map(row => [...row]);
            
            // 솔루션 문자열 생성
            const solutionStr = JSON.stringify(solution);
            
            // 이미 알려진 솔루션인지 확인
            if (!knownSolutionIds.has(solutionStr)) {
                // 솔루션 저장
                solutions.push(solution);
                globalSolutionsCount++;
                
                // 솔루션 ID 저장
                knownSolutionIds.add(solutionStr);
                
                // 솔루션 메시지 전송
                self.postMessage({
                    type: 'solution',
                    solution: solution,
                    solutionIndex: globalSolutionsCount,
                    direction: direction
                });
                
                // 3개 솔루션을 찾으면 종료
                if (globalSolutionsCount >= 3) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // 다음 빈 셀이 없으면 실패
    if (nextIndex === -1) {
        return false;
    }
    
    const row = Math.floor(nextIndex / size);
    const col = nextIndex % size;
    
    // 회색(1)을 먼저 시도 (색상 순서 최적화)
    for (let color of [1, 0]) {
        // 색상 유효성 검사
        if (!isValidColor(board, row, col, color)) {
            continue;
        }
        
        // 영역 제약 조건 검사
        if (!checkAreaConstraints(board, row, col, color)) {
            continue;
        }
        
        // 회색 셀 연결 가능성 검사 (회색 셀인 경우만)
        if (color === 1 && !canConnectToGray(board, row, col)) {
            continue;
        }
        
        // 색상 적용
        board[row][col] = color;
        
        // 재귀 호출 - 다음 인덱스는 방향에 따라 결정
        const nextStartIndex = isForward ? nextIndex + 1 : nextIndex - 1;
        if (backtrack(board, nextStartIndex, startPosition, endPosition, isForward)) {
            return true;
        }
        
        // 백트래킹
        board[row][col] = -1;
    }
    
    return false;
}

// 진행 상황 업데이트 함수
function updateProgress() {
    // 진행률 계산 (대략적인 추정)
    const progress = Math.min((globalIterationCount / 10000000) * 100, 99.9);
    
    // 진행 상황 메시지 전송
    self.postMessage({
        type: 'progress',
        progress: Math.min(progress, 99.9), // 100%가 되지 않도록 제한
        iterationCount: globalIterationCount,
        direction: direction
    });
}
