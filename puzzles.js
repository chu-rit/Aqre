// 퍼즐 맵 데이터
const PUZZLE_MAPS = [
    {
        id: 1,
        name: "Tutorial",
        difficulty: "Easy",
        // 각 영역의 정의: { cells: [[row, col], ...], required: 회색 칸 수 }
        areas: [
            {
                cells: [[0,0], [1,0]], 
                required: 'J'
            },
            {
                cells: [[0,1], [0,2], [0,3],
                        [1,1], [1,2], [1,3]],
                required: 2
            },
            {
                cells: [[0,4], [0,5]],
                required: 'J'
            },
            {
                cells: [[2,0], [2,1],
                        [3,0], [3,1],
                        [4,0], [4,1]],
                required: 0
            },
            {
                cells: [[5,0], [5,1]],
                required: 'J'
            },
            {
                cells: [[2,2], [2,3],
                        [3,2], [3,3]],
                required: 'J'
            },
            {
                cells: [[1,4], [1,5],
                        [2,4], [2,5],
                        [3,4], [3,5]],
                required: '5'
            },
            {
                cells: [[4,2], [4,3], [4,4],
                        [5,2], [5,3], [5,4]],
                required: '4'
            },
            {
                cells: [[4,5], [5,5]],
                required: 'J'
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 2,
        name: "T Shape",
        difficulty: "Medium",
        areas: [
            {
                // T 모양 영역
                cells: [
                    [0,2], [0,3],  // T의 상단
                    [1,2], [1,3],
                    [2,2], [2,3],
                    [3,2], [3,3],  // T의 세로 부분
                    [2,0], [2,1], [2,4], [2,5]  // T의 가로 부분
                ],
                required: 4
            },
            {
                // 왼쪽 상단 영역
                cells: [[0,0], [0,1], [1,0], [1,1]],
                required: 2
            },
            {
                // 오른쪽 상단 영역
                cells: [[0,4], [0,5], [1,4], [1,5]],
                required: 1
            },
            {
                // 왼쪽 하단 영역
                cells: [[3,0], [3,1], [4,0], [4,1], [5,0], [5,1]],
                required: 2
            },
            {
                // 중앙 하단 영역
                cells: [[4,2], [4,3], [5,2], [5,3]],
                required: 1
            },
            {
                // 오른쪽 하단 영역
                cells: [[3,4], [3,5], [4,4], [4,5], [5,4], [5,5]],
                required: 2
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ]
    }
];

// 영역 제약 조건을 확인하는 함수 수정
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

// 숫자 배치의 유효성을 확인하는 함수 수정
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

