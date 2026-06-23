/**
 * Aqre Puzzle Solver - Human Reasoning Style
 * 
 * 난이도 측정 방식:
 * Lv1 (1점): 기본 3규칙 - 영역, 4연속, 연결성 직접 적용
 * Lv2 (5점): 고급 전파 - 복합 제약, 가설 추론
 * Lv3 (20점): 얕은 가정 - 백트래킹 깊이 1~10
 * Lv4 (50점): 깊은 가정 - 백트래킹 깊이 11+
 * 
 * 최종 난이도 = 각 셀의 점수 합산
 */

class ReasoningSolver {
    constructor() {
        this._size = 0;
        this._areas = [];
        this._board = [];
        this._blackCellBitmask = [];
        this._areaMap = null;
        this._areaGrayCount = [];
        this._areaEmptyCount = [];
        this._emptyCells = new Set(); // "r,c" 문자열
        this._totalGrayCount = 0;
        this._dfsStack = [];
        this._maxSolutions = 3;
        this._solutions = [];
        this._knownSolutionIds = new Set();
        this._cellReasoning = {}; // "r,c" -> level (어떤 추론으로 확정했는지)
        this._onProgress = null;
        this._progressInterval = 10000;
        this._globalIterationCount = 0;
        this._backtrackCount = 0;
        this._maxDepth = 0;
    }

    solve(request) {
        const startTime = Date.now();
        this._solveStartTime = startTime;
        this._size = request.size;
        this._areas = request.areas;
        this._board = request.initialBoard.map(row => [...row]);
        this._blackCellBitmask = [...request.blackCellBitmask];
        this._maxSolutions = request.maxSolutions || 3;
        this._solutions = [];
        this._knownSolutionIds.clear();
        this._cellReasoning = {};
        this._solutionCellReasoning = null;
        this._globalIterationCount = 0;
        this._backtrackCount = 0;
        this._maxDepth = 0;

        this._areaGrayCount = new Array(this._areas.length).fill(0);
        this._areaEmptyCount = new Array(this._areas.length).fill(0);
        this._areaMap = Array(this._size).fill(null).map(() => Array(this._size).fill(-1));
        this._totalGrayCount = 0;
        this.buildAreaMapAndStates();

        this._emptyCells = new Set();
        for (let i = 0; i < this._size * this._size; i++) {
            const r = Math.floor(i / this._size);
            const c = i % this._size;
            const pos = r * this._size + c;
            const idx = Math.floor(pos / 32);
            const mask = 1 << (pos % 32);
            if ((this._blackCellBitmask[idx] & mask) === 0 && this._board[r][c] === -1) {
                this._emptyCells.add(`${r},${c}`);
            }
        }

        const emptyCellCount = this._emptyCells.size;
        if (emptyCellCount === 0) {
            const violations = this.verifyFullPuzzle();
            if (violations.length === 0) {
                this._solutions.push(this._board.map(row => [...row]));
                return { solutions: this._solutions, iterations: 0, elapsedTime: 0, status: "Valid", success: true };
            }
            return { solutions: [], violations, iterations: 0, elapsedTime: 0, status: "Invalid", success: false };
        }

        // 추론 기반 풀이 시도
        const reasoningSnap = this.snapshot();
        const reasoningResult = this.solveByReasoning();

        if (reasoningResult === 1) {
            const scores = this.getScoreBreakdown(emptyCellCount);
            return {
                solutions: this._solutions,
                iterations: this._globalIterationCount,
                backtrackCount: this._backtrackCount,
                maxDepth: this._maxDepth,
                emptyCellCount,
                ...scores,
                reasoningMap: this._buildReasoningMap(),
                cellReasoning: { ...(this._solutionCellReasoning || this._cellReasoning) },
                elapsedTime: (Date.now() - startTime) / 1000,
                status: this._solutions.length > 0 ? "Success" : "No solutions"
            };
        }

        if (reasoningResult === -1) {
            // 모순: 보드 초기화 후 백트랙 시도
            this.restore(reasoningSnap);
            this._globalIterationCount = 0;
            this._backtrackCount = 0;
            this._maxDepth = 0;
            this.backtrack(0, 0);
        } else {
            // 부분 완료: 보드 유효 상태에서 바로 백트랙
            this.backtrack(0, 0);
        }

        const scores = this.getScoreBreakdown(emptyCellCount);
        return {
            solutions: this._solutions,
            iterations: this._globalIterationCount,
            backtrackCount: this._backtrackCount,
            maxDepth: this._maxDepth,
            emptyCellCount,
            ...scores,
            reasoningMap: this._buildReasoningMap(),
            cellReasoning: { ...(this._solutionCellReasoning || this._cellReasoning) },
            elapsedTime: (Date.now() - startTime) / 1000,
            status: this._solutions.length > 0 ? "Success" : "No solutions"
        };
    }

    _buildReasoningMap() {
        const cr = this._solutionCellReasoning || this._cellReasoning;
        const map = Array(this._size).fill(null).map(() => Array(this._size).fill(0));
        for (const [key, level] of Object.entries(cr)) {
            const [r, c] = key.split(',').map(Number);
            map[r][c] = level;
        }
        return map;
    }

    getScoreBreakdown(emptyCellCount) {
        const cellReasoning = this._solutionCellReasoning || this._cellReasoning;
        // Lv1-Lv4로 분류
        const lv1Cells = Object.entries(cellReasoning).filter(([k, l]) => l === 1);
        const lv2Cells = Object.entries(cellReasoning).filter(([k, l]) => l === 2);
        const lv3Cells = Object.entries(cellReasoning).filter(([k, l]) => l === 3);
        const lv4Cells = Object.entries(cellReasoning).filter(([k, l]) => l === 4);
        
        const allCells = Object.entries(cellReasoning).filter(([k, l]) => l >= 1 && l <= 4);
        const difficultyScore = allCells.reduce((sum, [k, l]) => sum + this.getLevelScore(l), 0);
        const difficultyLabel =
            difficultyScore < 80 ? 'Easy' :
            difficultyScore < 300 ? 'Normal' :
            difficultyScore < 800 ? 'Hard' : 'Expert';

        return { 
            difficultyScore, 
            difficultyLabel,
            lv1Count: lv1Cells.length,
            lv2Count: lv2Cells.length,
            lv3Count: lv3Cells.length,
            lv4Count: lv4Cells.length
        };
    }

    // ============== 추론 기반 풀이 ==============

    // 반환: 1 = 완전 해결, 0 = 부분 진행 (백트랙 필요), -1 = 모순
    solveByReasoning() {
        let maxLevel = 2; // Lv1: 기본 3규칙, Lv2: 고급 전파
        let progress = true;

        while (progress && this._emptyCells.size > 0) {
            progress = false;

            for (let level = 1; level <= maxLevel; level++) {
                const changed = this.applyReasoning(level);
                if (changed === null) return -1; // 모순
                if (changed) {
                    progress = true;
                    break; // 낮은 레벨부터 다시 시작
                }
            }
        }

        if (this._emptyCells.size === 0) {
            // 모든 셀 확정, 전체 검증
            const violations = this.verifyFullPuzzle();
            if (violations.length === 0) {
                const sol = this._board.map(row => [...row]);
                const solStr = JSON.stringify(sol);
                if (!this._knownSolutionIds.has(solStr)) {
                    this._solutions.push(sol);
                    this._knownSolutionIds.add(solStr);
                }
                this._solutionCellReasoning = { ...this._cellReasoning };
                return 1;
            }
            return -1; // 모순
        }

        // 추론으로 다 못 품 → 백트랙 필요 (보드는 유효한 부분 상태)
        return 0;
    }

    applyReasoning(level) {
        switch (level) {
            case 1: return this.applyBasicRules(); // 기본 3규칙: 영역, 4연속, 연결성
            case 2: return this.applyAdvancedPropagation(); // 고급 전파: 브릿지, 통로, 복합 제약
            default: return false;
        }
    }

    // Lv1: 기본 3규칙 - 영역, 4연속, 연결성을 번갈아 적용
    applyBasicRules() {
        let changed = false;
        
        // 1. 영역 확정
        const areaChanged = this.applyAreaReasoning();
        if (areaChanged === null) return null;
        if (areaChanged) changed = true;
        
        // 2. 4연속 확정
        const fourChanged = this.applyFourRuleReasoning();
        if (fourChanged === null) return null;
        if (fourChanged) changed = true;
        
        // 3. 연결성 확정
        const connChanged = this.applyConnectivityReasoning();
        if (connChanged === null) return null;
        if (connChanged) changed = true;
        
        return changed;
    }

    // 영역 제약으로 셀 확정
    applyAreaReasoning() {
        let changed = false;
        for (let i = 0; i < this._areas.length; i++) {
            const req = this._areas[i].required;
            if (req === -1) continue;
            const curGray = this._areaGrayCount[i];
            const unassigned = this._areaEmptyCount[i];
            if (unassigned === 0) continue;

            let forceColor = -1;
            if (curGray === req) forceColor = 0;
            else if (curGray + unassigned === req) forceColor = 1;

            if (forceColor !== -1) {
                for (const [r, c] of this._areas[i].cells) {
                    if (this._board[r][c] !== -1) continue;
                    if (!this.setCell(r, c, forceColor, 1)) return null;
                    changed = true;
                }
            }
        }
        return changed;
    }

    // 4연속 규칙으로 셀 확정
    applyFourRuleReasoning() {
        let changed = false;
        const s = this._size;

        for (let dim = 0; dim < 2; dim++) {
            for (let i = 0; i < s; i++) {
                for (let j = 0; j < s - 3; j++) {
                    const p = dim === 0
                        ? [[i, j], [i, j + 1], [i, j + 2], [i, j + 3]]
                        : [[j, i], [j + 1, i], [j + 2, i], [j + 3, i]];

                    const a = this._board[p[0][0]][p[0][1]];
                    const b = this._board[p[1][0]][p[1][1]];
                    const d = this._board[p[2][0]][p[2][1]];
                    const e = this._board[p[3][0]][p[3][1]];

                    // 111? -> ?=0
                    if (a === 1 && b === 1 && d === 1 && e === -1) {
                        if (!this.setCell(p[3][0], p[3][1], 0, 1)) return null;
                        changed = true;
                    }
                    if (a === -1 && b === 1 && d === 1 && e === 1) {
                        if (!this.setCell(p[0][0], p[0][1], 0, 1)) return null;
                        changed = true;
                    }
                    if (a === 0 && b === 0 && d === 0 && e === -1) {
                        if (!this.setCell(p[3][0], p[3][1], 1, 1)) return null;
                        changed = true;
                    }
                    if (a === -1 && b === 0 && d === 0 && e === 0) {
                        if (!this.setCell(p[0][0], p[0][1], 1, 1)) return null;
                        changed = true;
                    }
                    if (a === 1 && b === 1 && d === -1 && e === 1) {
                        if (!this.setCell(p[2][0], p[2][1], 0, 1)) return null;
                        changed = true;
                    }
                    if (a === 1 && b === -1 && d === 1 && e === 1) {
                        if (!this.setCell(p[1][0], p[1][1], 0, 1)) return null;
                        changed = true;
                    }
                    if (a === 0 && b === 0 && d === -1 && e === 0) {
                        if (!this.setCell(p[2][0], p[2][1], 1, 1)) return null;
                        changed = true;
                    }
                    if (a === 0 && b === -1 && d === 0 && e === 0) {
                        if (!this.setCell(p[1][0], p[1][1], 1, 1)) return null;
                        changed = true;
                    }
                }
            }
        }
        return changed;
    }

    // 연결성 제약으로 셀 확정
    applyConnectivityReasoning() {
        let changed = false;
        const toCheck = [...this._emptyCells];
        for (const key of toCheck) {
            const [r, c] = key.split(',').map(Number);
            if (this._board[r][c] !== -1) continue;
            if (!this.isStillConnectable(r, c)) {
                if (!this.setCell(r, c, 1, 1)) return null;
                changed = true;
            }
        }
        return changed;
    }

    // Lv2: 고급 전파 - 복합 제약 + 가설 추론
    applyAdvancedPropagation() {
        let changed = false;
        
        // 1. 영역 + 4연속 복합 제약
        const areaFourChanged = this.applyAreaFourRuleCompound();
        if (areaFourChanged === null) return null;
        if (areaFourChanged) changed = true;
        
        // 2. 영역 + 연결성 복합 제약
        const areaConnChanged = this.applyAreaConnectivityCompound();
        if (areaConnChanged === null) return null;
        if (areaConnChanged) changed = true;
        
        // 3. 가설 추론: 한 색이 모순이면 다른 색 확정
        const hypoChanged = this.applyHypothesisReasoning(2);
        if (hypoChanged === null) return null;
        if (hypoChanged) changed = true;
        
        return changed;
    }

    // 영역 + 4연속 복합 제약
    applyAreaFourRuleCompound() {
        let changed = false;
        for (let i = 0; i < this._areas.length; i++) {
            const req = this._areas[i].required;
            if (req === -1) continue;

            const areaCells = this._areas[i].cells;
            const emptyInArea = areaCells.filter(([r, c]) => this._board[r][c] === -1);
            if (emptyInArea.length === 0) continue;

            const curGray = this._areaGrayCount[i];
            const need = req - curGray;
            if (need < 0) continue;
            if (need > emptyInArea.length) return null; // 모순

            // 4연속 + 영역 + 연결성 제약으로 회색이 될 수 없는 셀 카운트
            let cannotBeGray = 0;
            for (const [r, c] of emptyInArea) {
                if (!this.isValidColor(r, c, 1)) cannotBeGray++;
                else if (!this.checkAreaConstraints(r, c, 1)) cannotBeGray++;
                else if (!this.canConnectToGray(r, c)) cannotBeGray++;
            }

            // 남은 셀 중 회색이 가능한 셀 수
            const possibleGray = emptyInArea.length - cannotBeGray;
            if (possibleGray === need && possibleGray > 0) {
                for (const [r, c] of emptyInArea) {
                    if (!this.isValidColor(r, c, 1)) continue;
                    if (!this.checkAreaConstraints(r, c, 1)) continue;
                    if (!this.canConnectToGray(r, c)) continue;
                    if (!this.setCell(r, c, 1, 2)) return null;
                    changed = true;
                }
            }
        }
        return changed;
    }

    // 영역 + 연결성 복합 제약
    applyAreaConnectivityCompound() {
        let changed = false;
        for (let i = 0; i < this._areas.length; i++) {
            const req = this._areas[i].required;
            if (req === -1) continue;

            const areaCells = this._areas[i].cells;
            const emptyInArea = areaCells.filter(([r, c]) => this._board[r][c] === -1);
            if (emptyInArea.length === 0) continue;

            const curGray = this._areaGrayCount[i];
            const need = req - curGray;
            if (need < 0) continue;
            if (need > emptyInArea.length) return null; // 모순

            // 4연속 + 영역 + 연결성으로 인해 흰색이 될 수 없는 셀 (반드시 회색)
            let mustBeGray = 0;
            for (const [r, c] of emptyInArea) {
                if (!this.isValidColor(r, c, 0)) mustBeGray++;
                else if (!this.checkAreaConstraints(r, c, 0)) mustBeGray++;
                else if (!this.isStillConnectable(r, c)) mustBeGray++;
            }

            if (mustBeGray > need) return null; // 모순: 필요한 회색보다 많은 셀이 반드시 회색

            if (mustBeGray === need) {
                for (const [r, c] of emptyInArea) {
                    const cannotBeWhite = !this.isValidColor(r, c, 0) ||
                                          !this.checkAreaConstraints(r, c, 0) ||
                                          !this.isStillConnectable(r, c);
                    if (cannotBeWhite) {
                        if (!this.setCell(r, c, 1, 2)) return null;
                        changed = true;
                    } else {
                        if (!this.setCell(r, c, 0, 2)) return null;
                        changed = true;
                    }
                }
            }
        }
        return changed;
    }

    // 가설 추론 (depth = 1 또는 2) - testHypothesis로 한 색이 모순이면 다른 색 확정
    applyHypothesisReasoning(depth) {
        let changed = false;
        const level = 2; // Lv2: 고급 전파
        const toCheck = [...this._emptyCells];

        // 제약이 있는 영역의 셀을 우선, 없으면 모든 빈 셀
        const prioritized = toCheck.sort((a, b) => {
            const [ar, ac] = a.split(',').map(Number);
            const [br, bc] = b.split(',').map(Number);
            const aArea = this._areaMap[ar][ac];
            const bArea = this._areaMap[br][bc];
            const aHas = aArea >= 0 && this._areas[aArea].required !== -1 ? 0 : 1;
            const bHas = bArea >= 0 && this._areas[bArea].required !== -1 ? 0 : 1;
            return aHas - bHas;
        });

        for (const key of prioritized) {
            const [r, c] = key.split(',').map(Number);
            if (this._board[r][c] !== -1) continue;

            const grayOk = this.testHypothesis(r, c, 1, depth);
            const blackOk = this.testHypothesis(r, c, 0, depth);

            if (!grayOk && !blackOk) return null; // 모순

            if (!grayOk) {
                if (!this.setCell(r, c, 0, level)) return null;
                changed = true;
            } else if (!blackOk) {
                if (!this.setCell(r, c, 1, level)) return null;
                changed = true;
            }
        }
        return changed;
    }

    // 가설 테스트: (r,c)에 color를 놓고 추론 전파, 모순 여부 반환
    testHypothesis(r, c, color, depth) {
        const snapshot = this.snapshot();
        this._board[r][c] = color;
        this.updateAreaState(r, c, color, 1);
        this._emptyCells.delete(`${r},${c}`);

        const ok = this.propagateHypothesis(depth - 1);

        this.restore(snapshot);
        return ok;
    }

    // 가설 내에서 전파 (백트랙 없이 추론만)
    propagateHypothesis(remainingDepth) {
        let progress = true;
        while (progress) {
            progress = false;

            const r1 = this.applyAreaReasoning();
            if (r1 === null) return false;
            if (r1) progress = true;

            const r2 = this.applyFourRuleReasoning();
            if (r2 === null) return false;
            if (r2) progress = true;

            const r3 = this.applyConnectivityReasoning();
            if (r3 === null) return false;
            if (r3) progress = true;

            if (remainingDepth > 0 && !progress) {
                const r4 = this.applyHypothesisReasoning(1);
                if (r4 === null) return false;
                if (r4) progress = true;
            }
        }
        return true;
    }

    // ============== 유틸리티 ==============

    getLevelScore(level) {
        // Lv1=1, Lv2=5, Lv3=20, Lv4=50
        const scores = [0, 1, 5, 20, 50];
        return scores[level] || 0;
    }

    setCell(r, c, color, level) {
        if (this._board[r][c] === color) return true;
        if (this._board[r][c] !== -1) return false;
        if (!this.isValidColor(r, c, color)) return false;
        if (!this.checkAreaConstraints(r, c, color)) return false;
        if (color === 0 && !this.isStillConnectable(r, c)) return false;
        if (color === 1 && !this.canConnectToGray(r, c)) return false;

        this._board[r][c] = color;
        this.updateAreaState(r, c, color, 1);
        this._emptyCells.delete(`${r},${c}`);

        this._cellReasoning[`${r},${c}`] = level;
        return true;
    }

    isNearGray(r, c) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size && this._board[nr][nc] === 1) return true;
        }
        return false;
    }

    snapshot() {
        return {
            board: this._board.map(row => [...row]),
            areaGrayCount: [...this._areaGrayCount],
            areaEmptyCount: [...this._areaEmptyCount],
            emptyCells: new Set(this._emptyCells),
            totalGrayCount: this._totalGrayCount
        };
    }

    restore(snap) {
        this._board = snap.board.map(row => [...row]);
        this._areaGrayCount = [...snap.areaGrayCount];
        this._areaEmptyCount = [...snap.areaEmptyCount];
        this._emptyCells = new Set(snap.emptyCells);
        this._totalGrayCount = snap.totalGrayCount;

        // 되돌려진 셀(=-1)의 추론 기록 제거
        for (let r = 0; r < this._size; r++) {
            for (let c = 0; c < this._size; c++) {
                if (this._board[r][c] === -1) {
                    delete this._cellReasoning[`${r},${c}`];
                }
            }
        }
    }

    // ============== 백트랙 (최후의 수단) ==============

    backtrack(listIdx, depth) {
        this._globalIterationCount++;
        if (depth > this._maxDepth) this._maxDepth = depth;

        if (this._onProgress && this._globalIterationCount % this._progressInterval === 0) {
            this._onProgress({
                iterations: this._globalIterationCount,
                backtracks: this._backtrackCount,
                maxDepth: this._maxDepth,
                emptyCellTotal: this._emptyCells.size,
                currentDepth: depth,
                elapsedTime: (Date.now() - this._solveStartTime) / 1000,
                solutionsFound: this._solutions.length
            });
        }

        if (this._emptyCells.size === 0) {
            const violations = this.verifyFullPuzzle();
            if (violations.length === 0) {
                const sol = this._board.map(row => [...row]);
                const solStr = JSON.stringify(sol);
                if (!this._knownSolutionIds.has(solStr)) {
                    this._solutions.push(sol);
                    this._knownSolutionIds.add(solStr);
                    // 해답 찾을 때 추론 기록 스냅샷 저장
                    this._solutionCellReasoning = { ...this._cellReasoning };
                    if (this._solutions.length >= this._maxSolutions) return true;
                }
            }
            return false;
        }

        // _emptyCells에서 첫 번째 미충정 셀 선택
        const key = this._emptyCells.values().next().value;
        const [r, c] = key.split(',').map(Number);
        const areaIdx = this._areaMap[r][c];
        let req = -1, curGray = 0, unassigned = 0;
        if (areaIdx >= 0) {
            req = this._areas[areaIdx].required;
            curGray = this._areaGrayCount[areaIdx];
            unassigned = this._areaEmptyCount[areaIdx];
        }

        let firstColor = 1, secondColor = 0, skipSecond = false;
        if (req !== -1) {
            if (curGray === req) { firstColor = 0; skipSecond = true; }
            else if (curGray + unassigned === req) { firstColor = 1; skipSecond = true; }
        }

        if (this.tryColor(r, c, firstColor, depth)) return true;
        if (!skipSecond && this.tryColor(r, c, secondColor, depth)) return true;

        this._backtrackCount++;
        return false;
    }

    tryColor(r, c, color, depth) {
        if (!this.isValidColor(r, c, color)) return false;
        if (!this.checkAreaConstraints(r, c, color)) return false;
        if (color === 0 && !this.isStillConnectable(r, c)) return false;
        if (color === 1 && !this.canConnectToGray(r, c)) return false;

        const snap = this.snapshot();
        this._board[r][c] = color;
        this.updateAreaState(r, c, color, 1);
        this._emptyCells.delete(`${r},${c}`);

        // 백트래킹으로 확정한 셀: 깊이에 따라 Lv3(1-10) 또는 Lv4(11+)
        const level = depth <= 10 ? 3 : 4;
        this._cellReasoning[`${r},${c}`] = level;

        // 추론 전파 시도
        const ok = this.propagateHypothesis(0);
        if (!ok) {
            this.restore(snap);
            return false;
        }

        if (this.backtrack(0, depth + 1)) return true;

        this.restore(snap);
        return false;
    }

    // ============== 기존 검증 메서드들 ==============

    buildAreaMapAndStates() {
        for (let row = 0; row < this._size; row++)
            for (let col = 0; col < this._size; col++)
                this._areaMap[row][col] = -1;

        for (let i = 0; i < this._areas.length; i++) {
            this._areaEmptyCount[i] = this._areas[i].cells.length;
            for (const cell of this._areas[i].cells)
                this._areaMap[cell[0]][cell[1]] = i;
        }

        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                const v = this._board[row][col];
                if (v !== -1) {
                    const ai = this._areaMap[row][col];
                    if (ai !== -1) {
                        this._areaEmptyCount[ai]--;
                        if (v === 1) this._areaGrayCount[ai]++;
                    }
                    if (v === 1) this._totalGrayCount++;
                }
            }
        }
    }

    isValidColor(row, col, color) {
        let count = 1;
        for (let c = col - 1; c >= 0; c--) {
            if (this._board[row][c] === color) { count++; if (count >= 4) return false; } else break;
        }
        for (let c = col + 1; c < this._size; c++) {
            if (this._board[row][c] === color) { count++; if (count >= 4) return false; } else break;
        }
        count = 1;
        for (let r = row - 1; r >= 0; r--) {
            if (this._board[r][col] === color) { count++; if (count >= 4) return false; } else break;
        }
        for (let r = row + 1; r < this._size; r++) {
            if (this._board[r][col] === color) { count++; if (count >= 4) return false; } else break;
        }
        return true;
    }

    checkAreaConstraints(row, col, color) {
        const ai = this._areaMap[row][col];
        if (ai === -1) return true;
        const req = this._areas[ai].required;
        if (req === -1) return true;
        let gray = this._areaGrayCount[ai];
        let unassigned = this._areaEmptyCount[ai];
        if (color === 1) gray++;
        unassigned--;
        if (gray > req) return false;
        if (gray + unassigned < req) return false;
        return true;
    }

    updateAreaState(row, col, color, delta) {
        if (row < 0 || row >= this._size || col < 0 || col >= this._size) return;
        const ai = this._areaMap[row][col];
        if (ai < 0 || ai >= this._areas.length) return;
        if (color === 1) { this._areaGrayCount[ai] += delta; this._totalGrayCount += delta; }
        this._areaEmptyCount[ai] -= delta;
    }

    canConnectToGray(row, col) {
        if (this._totalGrayCount === 0) return true;
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let hasEmpty = false;
        for (const [dr, dc] of dirs) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size) {
                if (this._board[nr][nc] === 1) return true;
                if (this._board[nr][nc] === -1) hasEmpty = true;
            }
        }
        return hasEmpty;
    }

    isStillConnectable(row, col) {
        this._board[row][col] = 0;
        let firstR = -1, firstC = -1, totalGray = 0;
        for (let r = 0; r < this._size; r++)
            for (let c = 0; c < this._size; c++)
                if (this._board[r][c] === 1) { if (firstR === -1) { firstR = r; firstC = c; } totalGray++; }
        if (totalGray <= 1) { this._board[row][col] = -1; return true; }

        const visited = Array(this._size).fill(null).map(() => Array(this._size).fill(false));
        let reachable = 0;
        this._dfsStack = [[firstR, firstC]];
        visited[firstR][firstC] = true;
        while (this._dfsStack.length > 0) {
            const [cr, cc] = this._dfsStack.pop();
            if (this._board[cr][cc] === 1) reachable++;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = cr + dr, nc = cc + dc;
                if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size && !visited[nr][nc] &&
                    (this._board[nr][nc] === 1 || this._board[nr][nc] === -1)) {
                    visited[nr][nc] = true;
                    this._dfsStack.push([nr, nc]);
                }
            }
        }
        this._board[row][col] = -1;
        return reachable === totalGray;
    }

    checkGrayConnectivity() {
        let grayCount = 0, firstR = -1, firstC = -1;
        for (let r = 0; r < this._size; r++)
            for (let c = 0; c < this._size; c++)
                if (this._board[r][c] === 1) { if (firstR === -1) { firstR = r; firstC = c; } grayCount++; }
        if (grayCount <= 1) return true;

        const visited = Array(this._size).fill(null).map(() => Array(this._size).fill(false));
        let reachable = 0;
        this._dfsStack = [[firstR, firstC]];
        visited[firstR][firstC] = true;
        while (this._dfsStack.length > 0) {
            const [cr, cc] = this._dfsStack.pop();
            if (this._board[cr][cc] === 1) reachable++;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = cr + dr, nc = cc + dc;
                if (nr >= 0 && nr < this._size && nc >= 0 && nc < this._size && !visited[nr][nc] && this._board[nr][nc] === 1) {
                    visited[nr][nc] = true;
                    this._dfsStack.push([nr, nc]);
                }
            }
        }
        return reachable === grayCount;
    }

    verifyFullPuzzle() {
        const violations = [];

        // 1. 4연속 체크 (가로/세로) - 회색(1)과 흰색(0) 체크, 검정(2)은 벽이므로 제외
        for (let r = 0; r < this._size; r++) {
            for (let c = 0; c < this._size - 3; c++) {
                const val = this._board[r][c];
                if (val === 0 || val === 1) {
                    if (this._board[r][c+1] === val && this._board[r][c+2] === val && this._board[r][c+3] === val) {
                        const colorName = val === 1 ? '회색' : '흰색';
                        violations.push(`4연속 위반: (${r},${c})~(${r},${c+3}) 가로 ${colorName}`);
                    }
                }
            }
        }
        for (let c = 0; c < this._size; c++) {
            for (let r = 0; r < this._size - 3; r++) {
                const val = this._board[r][c];
                if (val === 0 || val === 1) {
                    if (this._board[r+1][c] === val && this._board[r+2][c] === val && this._board[r+3][c] === val) {
                        const colorName = val === 1 ? '회색' : '흰색';
                        violations.push(`4연속 위반: (${r},${c})~(${r+3},${c}) 세로 ${colorName}`);
                    }
                }
            }
        }

        // 2. 영역별 required 정확히 체크 (req = 0 포함)
        for (let i = 0; i < this._areas.length; i++) {
            const area = this._areas[i];
            const required = area.required;
            const actualGray = area.cells.filter(([r, c]) => this._board[r][c] === 1).length;
            if (required !== -1 && actualGray !== required) {
                violations.push(`영역 ${area.cells[0]}: required ${required} ≠ 실제 회색 ${actualGray}`);
            }
        }

        // 3. 회색 연결성 체크
        if (!this.checkGrayConnectivity()) violations.push('회색 연결성 위반');

        return violations;
    }
}

module.exports = { ReasoningSolver };
