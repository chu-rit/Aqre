/**
 * Aqre Puzzle Solver - Node.js Version
 * C# PuzzleSolver.cs를 JavaScript로 포팅
 */

class PuzzleSolver {
    constructor() {
        this._size = 0;
        this._areas = [];
        this._board = [];
        this._blackCellBitmask = [];
        this._areaMap = null;
        this._solutions = [];
        this._knownSolutionIds = new Set();
        this._globalIterationCount = 0;
        this._backtrackCount = 0;
        this._maxDepth = 0;
        this._maxSolutions = 3;
        this._areaGrayCount = [];
        this._areaEmptyCount = [];
        this._emptyCellList = [];
        this._totalGrayCount = 0;
        this._dfsStack = [];
    }

    solve(request) {
        const startTime = Date.now();
        this._size = request.size;
        this._areas = request.areas;
        this._board = request.initialBoard.map(row => [...row]);
        this._blackCellBitmask = [...request.blackCellBitmask];
        this._maxSolutions = request.maxSolutions || 3;
        this._solutions = [];
        this._knownSolutionIds.clear();
        this._globalIterationCount = 0;
        this._backtrackCount = 0;
        this._maxDepth = 0;

        this._areaGrayCount = new Array(this._areas.length).fill(0);
        this._areaEmptyCount = new Array(this._areas.length).fill(0);
        this._areaMap = Array(this._size).fill(null).map(() => Array(this._size).fill(-1));
        this._totalGrayCount = 0;
        this.buildAreaMapAndStates();

        this._emptyCellList = [];
        for (let i = 0; i < this._size * this._size; i++) {
            const r = Math.floor(i / this._size);
            const c = i % this._size;
            const pos = r * this._size + c;
            const idx = Math.floor(pos / 32);
            const mask = 1 << (pos % 32);
            
            if ((this._blackCellBitmask[idx] & mask) === 0 && this._board[r][c] === -1) {
                this._emptyCellList.push([r, c]);
            }
        }

        if (this._emptyCellList.length === 0) {
            // 빈 셀이 없으면 현재 상태 검증
            const violations = this.verifyFullPuzzle();
            
            if (violations.length === 0) {
                // 유효한 완성된 퍼즐
                const solution = this._board.map(row => [...row]);
                this._solutions.push(solution);
                return {
                    solutions: this._solutions,
                    iterations: 0,
                    elapsedTime: 0,
                    status: "Valid completed puzzle",
                    success: true
                };
            } else {
                // 규칙 위반
                return {
                    solutions: [],
                    violations: violations,
                    iterations: 0,
                    elapsedTime: 0,
                    status: "Invalid puzzle - rule violations",
                    success: false
                };
            }
        }

        const emptyCellCount = this._emptyCellList.length;
        this.backtrack(0, 0);

        const iterations = this._globalIterationCount;
        const backtrackCount = this._backtrackCount;
        const maxDepth = this._maxDepth;
        const backtrackRate = backtrackCount / Math.max(iterations, 1);
        const difficultyScore = emptyCellCount > 0
            ? Math.round((iterations / emptyCellCount) * (1 + backtrackRate) * 10) / 10
            : 0;
        const difficultyLabel =
            difficultyScore < 20  ? 'Easy' :
            difficultyScore < 100 ? 'Normal' :
            difficultyScore < 500 ? 'Hard' : 'Expert';

        return {
            solutions: this._solutions,
            iterations,
            backtrackCount,
            maxDepth,
            emptyCellCount,
            difficultyScore,
            difficultyLabel,
            elapsedTime: (Date.now() - startTime) / 1000,
            status: this._solutions.length > 0 ? "Success" : "No solutions found"
        };
    }

    buildAreaMapAndStates() {
        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                this._areaMap[row][col] = -1;
            }
        }

        for (let i = 0; i < this._areas.length; i++) {
            this._areaEmptyCount[i] = this._areas[i].cells.length;
            for (const cell of this._areas[i].cells) {
                this._areaMap[cell[0]][cell[1]] = i;
            }
        }

        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                const cellValue = this._board[row][col];
                if (cellValue !== -1) {
                    const areaIndex = this._areaMap[row][col];
                    if (areaIndex !== -1) {
                        this._areaEmptyCount[areaIndex]--;
                        if (cellValue === 1) this._areaGrayCount[areaIndex]++;
                    }
                    if (cellValue === 1) this._totalGrayCount++;
                }
            }
        }
    }

    backtrack(listIdx, depth) {
        this._globalIterationCount++;
        if (depth > this._maxDepth) this._maxDepth = depth;

        if (listIdx === this._emptyCellList.length) {
            if (this.checkGrayConnectivity()) {
                const solution = this._board.map(row => [...row]);
                const solutionStr = JSON.stringify(solution);
                
                if (!this._knownSolutionIds.has(solutionStr)) {
                    this._solutions.push(solution);
                    this._knownSolutionIds.add(solutionStr);
                    if (this._solutions.length >= this._maxSolutions) return true;
                }
            }
            return false;
        }

        const [r, c] = this._emptyCellList[listIdx];
        const areaIdx = this._areaMap[r][c];

        let req = -1, curGray = 0, unassigned = 0;
        if (areaIdx >= 0) {
            req = this._areas[areaIdx].required;
            curGray = this._areaGrayCount[areaIdx];
            unassigned = this._areaEmptyCount[areaIdx];
        }

        let firstColor = 1, secondColor = 0;
        let skipSecond = false;

        if (req !== -1) {
            if (curGray === req) { firstColor = 0; skipSecond = true; }
            else if (curGray + unassigned === req) { firstColor = 1; skipSecond = true; }
        }

        if (this.tryColor(r, c, firstColor, listIdx, depth)) return true;
        if (!skipSecond && this.tryColor(r, c, secondColor, listIdx, depth)) return true;

        this._backtrackCount++;
        return false;
    }

    tryColor(r, c, color, listIdx, depth) {
        if (!this.isValidColor(r, c, color)) return false;
        if (!this.checkAreaConstraints(r, c, color)) return false;
        if (color === 0 && !this.isStillConnectable(r, c)) return false;
        if (color === 1 && !this.canConnectToGray(r, c)) return false;

        this._board[r][c] = color;
        this.updateAreaState(r, c, color, 1);

        if (this.backtrack(listIdx + 1, depth + 1)) return true;

        this.updateAreaState(r, c, color, -1);
        this._board[r][c] = -1;
        return false;
    }

    isValidColor(row, col, color) {
        // 가로 검사
        let count = 1;
        for (let c = col - 1; c >= 0; c--) {
            if (this._board[row][c] === color) {
                count++;
                if (count >= 4) return false;
            } else break;
        }
        for (let c = col + 1; c < this._size; c++) {
            if (this._board[row][c] === color) {
                count++;
                if (count >= 4) return false;
            } else break;
        }

        // 세로 검사
        count = 1;
        for (let r = row - 1; r >= 0; r--) {
            if (this._board[r][col] === color) {
                count++;
                if (count >= 4) return false;
            } else break;
        }
        for (let r = row + 1; r < this._size; r++) {
            if (this._board[r][col] === color) {
                count++;
                if (count >= 4) return false;
            } else break;
        }

        return true;
    }

    checkAreaConstraints(row, col, color) {
        const areaIndex = this._areaMap[row][col];
        if (areaIndex === -1) return true;

        const required = this._areas[areaIndex].required;
        if (required === -1) return true;

        let grayCount = this._areaGrayCount[areaIndex];
        let unassignedCount = this._areaEmptyCount[areaIndex];

        if (color === 1) grayCount++;
        unassignedCount--;

        if (grayCount > required) return false;
        if (grayCount + unassignedCount < required) return false;

        return true;
    }

    updateAreaState(row, col, color, delta) {
        if (row < 0 || row >= this._size || col < 0 || col >= this._size) return;
        const areaIndex = this._areaMap[row][col];

        if (areaIndex < 0 || areaIndex >= this._areas.length) return;

        if (color === 1) {
            this._areaGrayCount[areaIndex] += delta;
            this._totalGrayCount += delta;
        }
        this._areaEmptyCount[areaIndex] -= delta;
    }

    canConnectToGray(row, col) {
        if (this._totalGrayCount === 0) return true;

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let hasEmptyNearby = false;

        for (const [dr, dc] of directions) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size) {
                if (this._board[nr][nc] === 1) return true;
                if (this._board[nr][nc] === -1) hasEmptyNearby = true;
            }
        }

        return hasEmptyNearby;
    }

    isStillConnectable(row, col) {
        this._board[row][col] = 0;

        let firstR = -1, firstC = -1, totalGray = 0;
        for (let r = 0; r < this._size; r++) {
            for (let c = 0; c < this._size; c++) {
                if (this._board[r][c] === 1) {
                    if (firstR === -1) { firstR = r; firstC = c; }
                    totalGray++;
                }
            }
        }
        if (totalGray <= 1) { this._board[row][col] = -1; return true; }

        const visited = Array(this._size).fill(null).map(() => Array(this._size).fill(false));
        let reachableGray = 0;

        this._dfsStack = [[firstR, firstC]];
        visited[firstR][firstC] = true;

        while (this._dfsStack.length > 0) {
            const [currR, currC] = this._dfsStack.pop();
            if (this._board[currR][currC] === 1) reachableGray++;

            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = currR + dr, nc = currC + dc;
                if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size && 
                    !visited[nr][nc] && this._board[nr][nc] !== 0) {
                    visited[nr][nc] = true;
                    this._dfsStack.push([nr, nc]);
                }
            }
        }

        this._board[row][col] = -1;
        return reachableGray === totalGray;
    }

    checkGrayConnectivity() {
        const grayBitmaskSize = Math.ceil((this._size * this._size) / 32);
        const grayBitmask = new Array(grayBitmaskSize).fill(0);
        let grayCount = 0;
        let firstGrayRow = -1, firstGrayCol = -1;

        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                if (this._board[row][col] === 1) {
                    const pos = row * this._size + col;
                    const idx = Math.floor(pos / 32);
                    grayBitmask[idx] |= (1 << (pos % 32));
                    grayCount++;

                    if (firstGrayRow === -1) {
                        firstGrayRow = row;
                        firstGrayCol = col;
                    }
                }
            }
        }

        if (grayCount <= 1) return true;

        const visitedBitmask = new Array(grayBitmaskSize).fill(0);
        this.dfsGray(firstGrayRow, firstGrayCol, visitedBitmask);

        for (let i = 0; i < grayBitmaskSize; i++) {
            if ((grayBitmask[i] & ~visitedBitmask[i]) !== 0) {
                return false;
            }
        }

        return true;
    }

    dfsGray(row, col, visitedBitmask) {
        if (row < 0 || row >= this._size || col < 0 || col >= this._size) return;

        const pos = row * this._size + col;
        const idx = Math.floor(pos / 32);
        const mask = 1 << (pos % 32);

        if ((visitedBitmask[idx] & mask) !== 0 || this._board[row][col] !== 1) return;

        visitedBitmask[idx] |= mask;

        this.dfsGray(row - 1, col, visitedBitmask);
        this.dfsGray(row + 1, col, visitedBitmask);
        this.dfsGray(row, col - 1, visitedBitmask);
        this.dfsGray(row, col + 1, visitedBitmask);
    }

    // 완성된 퍼즐 전체 검증
    verifyFullPuzzle() {
        const violations = [];
        
        // 1. 4연속 체크 (가로/세로) - 회색(1)과 검정(2) 모두 체크
        for (let r = 0; r < this._size; r++) {
            for (let c = 0; c < this._size - 3; c++) {
                const val = this._board[r][c];
                if (val === 1 || val === 2) {
                    if (this._board[r][c+1] === val && this._board[r][c+2] === val && this._board[r][c+3] === val) {
                        const colorName = val === 1 ? '회색' : '검정';
                        violations.push(`4연속 위반: (${r},${c})~(${r},${c+3}) 가로 ${colorName}`);
                    }
                }
            }
        }
        for (let c = 0; c < this._size; c++) {
            for (let r = 0; r < this._size - 3; r++) {
                const val = this._board[r][c];
                if (val === 1 || val === 2) {
                    if (this._board[r+1][c] === val && this._board[r+2][c] === val && this._board[r+3][c] === val) {
                        const colorName = val === 1 ? '회색' : '검정';
                        violations.push(`4연속 위반: (${r},${c})~(${r+3},${c}) 세로 ${colorName}`);
                    }
                }
            }
        }
        
        // 2. 영역별 required 정확히 체크
        for (let i = 0; i < this._areas.length; i++) {
            const area = this._areas[i];
            const required = area.required;
            const actualGray = area.cells.filter(([r, c]) => this._board[r][c] === 1).length;
            
            if (required > 0 && actualGray !== required) {
                violations.push(`영역 ${area.cells[0]}: required ${required} ≠ 실제 회색 ${actualGray}`);
            }
        }
        
        // 3. 2x2 회색 체크
        for (let r = 0; r < this._size - 1; r++) {
            for (let c = 0; c < this._size - 1; c++) {
                if (this._board[r][c] === 1 && this._board[r][c+1] === 1 &&
                    this._board[r+1][c] === 1 && this._board[r+1][c+1] === 1) {
                    violations.push(`2x2 회색 위반: (${r},${c})~(${r+1},${c+1})`);
                }
            }
        }
        
        // 4. 회색 연결성 체크
        const grayCells = [];
        for (let r = 0; r < this._size; r++) {
            for (let c = 0; c < this._size; c++) {
                if (this._board[r][c] === 1) grayCells.push([r, c]);
            }
        }
        if (grayCells.length > 0) {
            const visited = new Set();
            const queue = [grayCells[0]];
            visited.add(`${grayCells[0][0]},${grayCells[0][1]}`);
            const directions = [[-1,0],[1,0],[0,-1],[0,1]];
            
            while (queue.length > 0) {
                const [r, c] = queue.shift();
                for (const [dr, dc] of directions) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size &&
                        this._board[nr][nc] === 1 && !visited.has(`${nr},${nc}`)) {
                        visited.add(`${nr},${nc}`);
                        queue.push([nr, nc]);
                    }
                }
            }
            
            if (visited.size !== grayCells.length) {
                violations.push(`회색 연결성 위반: ${grayCells.length}개 중 ${visited.size}개만 연결`);
            }
        }
        
        return violations;
    }
}

module.exports = { PuzzleSolver };
