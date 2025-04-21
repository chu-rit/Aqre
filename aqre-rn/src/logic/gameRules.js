// Aqre 퍼즐 순수 로직 함수 모듈 (React Native/웹 공용)
// 모든 DOM 접근 제거, 오직 데이터 기반 함수만 남김

// 퍼즐 규칙 위반 검사 함수
export function checkGameRules(gameBoard, puzzleData) {
  // gameBoard: 2차원 배열, puzzleData: {id, size, areas, ...}
  const violations = {
    areaOverflow: false,
    consecutiveColors: {
      horizontal: false,
      vertical: false
    },
    cellConnectivity: false
  };
  const violationMessages = new Set();

  // 1. 각 영역의 회색 칸 수 확인
  for (const area of puzzleData.areas) {
    const grayCount = area.cells.reduce((count, [row, col]) => {
      return count + (gameBoard[row][col] === 1 ? 1 : 0);
    }, 0);
    if (area.required === 'J') continue;
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
    { dx: 1, dy: 0, name: '가로', key: 'horizontal' },
    { dx: 0, dy: 1, name: '세로', key: 'vertical' }
  ];
  for (const dir of directions) {
    for (let i = 0; i < puzzleData.size; i++) {
      for (let j = 0; j <= puzzleData.size - 4; j++) {
        const sequence = [];
        for (let k = 0; k < 4; k++) {
          const row = dir.dy === 1 ? j + k : i;
          const col = dir.dx === 1 ? j + k : i;
          if (row < 0 || row >= puzzleData.size || col < 0 || col >= puzzleData.size) continue;
          const color = dir.dx === 1 
            ? gameBoard[i][j + k] 
            : gameBoard[j + k][i];
          sequence.push(color);
        }
        if (sequence.every(color => color === 0) || sequence.every(color => color === 1)) {
          violations.consecutiveColors[dir.key] = true;
          violationMessages.add(`${dir.name} 방향 4칸 연속 색상 위반`);
          break;
        }
      }
      if (violations.consecutiveColors[dir.key]) break;
    }
  }

  // 3. 회색 칸 연결성 확인
  if (!checkGrayCellConnectivity(gameBoard, puzzleData)) {
    violations.cellConnectivity = true;
    violationMessages.add('회색 칸들이 서로 연결되어 있지 않습니다.');
  }

  return {
    violations,
    violationMessages: Array.from(violationMessages)
  };
}

// 회색 칸 연결성 확인 함수
export function checkGrayCellConnectivity(gameBoard, puzzleData) {
  // 회색 칸 위치 찾기
  const grayCells = [];
  for (let i = 0; i < puzzleData.size; i++) {
    for (let j = 0; j < puzzleData.size; j++) {
      if (gameBoard[i][j] === 1) {
        grayCells.push([i, j]);
      }
    }
  }
  if (grayCells.length === 0) return true;
  const visited = Array.from({ length: puzzleData.size }, () => Array(puzzleData.size).fill(false));
  const [startRow, startCol] = grayCells[0];
  dfsConnectivity(startRow, startCol, visited, gameBoard, puzzleData);
  return grayCells.every(([row, col]) => visited[row][col]);
}

// 깊이 우선 탐색으로 회색 칸 연결성 탐색
export function dfsConnectivity(row, col, visited, gameBoard, puzzleData) {
  if (row < 0 || row >= puzzleData.size || col < 0 || col >= puzzleData.size || visited[row][col] || gameBoard[row][col] !== 1) {
    return;
  }
  visited[row][col] = true;
  const directions = [
    [0, 1], [0, -1], [1, 0], [-1, 0]
  ];
  for (const [dx, dy] of directions) {
    dfsConnectivity(row + dx, col + dy, visited, gameBoard, puzzleData);
  }
}

// 영역 제약 조건을 확인하는 함수
export function checkAreaConstraints(puzzle, area, num) {
  if (area.required === 0) {
    const filledInArea = area.cells.filter(([r, c]) => puzzle.initialState[r][c] !== 0).length;
    return filledInArea === 0 && num === 0;
  }
  if (area.required > 0) {
    const filledInArea = area.cells.filter(([r, c]) => puzzle.initialState[r][c] !== 0).length;
    return filledInArea < area.required || num === 0;
  }
  return true;
}

// 숫자 배치의 유효성을 확인하는 함수
export function isValidPlacement(puzzle, row, col, num) {
  for (let i = 0; i < puzzle.initialState.length; i++) {
    if (puzzle.initialState[row][i] === num && i !== col) return false;
    if (puzzle.initialState[i][col] === num && i !== row) return false;
  }
  const area = puzzle.areas.find(a => a.cells.some(([r, c]) => r === row && c === col));
  if (area) {
    return checkAreaConstraints(puzzle, area, num);
  }
  return true;
}

// 영역 경계 체크 함수 (React Native에선 실제 UI에서 처리)
export function checkAreaBoundaries(/* currentPuzzle, gameBoard 등 */) {
  // 경계선 정보 계산이 필요하다면 여기서 데이터만 반환
  // 실제 셀 스타일링은 React Native 컴포넌트에서 처리
  return null;
}
