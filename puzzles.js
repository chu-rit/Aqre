// 퍼즐 맵 데이터
const PUZZLE_MAPS = [
    {
        id: 1,
        name: "Tutorial 1",
        size: 5,
        areas: [
            {
                cells: [[2,1]],
                required: 1
            },
            {
                cells: [[2, 3]],
                required: 0
            }
        ],
        initialState: [
            [2, 2, 2, 2, 2],
            [2, 2, 2, 2, 2],
            [2, 0, 2, 1, 2],
            [2, 2, 2, 2, 2],
            [2, 2, 2, 2, 2]
        ]
    },
    {
        id: 2,
        name: "Tutorial 2",
        size: 5,
        areas: [
            {
                cells: [[0,1], [0,2], [0,3]],
                required: 3
            },
            {
                cells: [[1,0], [2,0], [3,0]],
                required: 3
            },
            {
                cells: [[4,1], [4,2], [4,3]],
                required: 3
            },
            {
                cells: [[1,4], [2,4], [3,4]],
                required: 3
            }
        ],
        initialState: [
            [1, 1, 1, 1, 1],
            [1, 1, 2, 1, 1],
            [1, 2, 2, 2, 1],
            [1, 1, 2, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    },
    {
        id: 3,
        name: "Tutorial 3",
        size: 4,
        areas: [
            {
                cells: [[3,0]],
                required: 1
            },
            {
                cells: [[2,1], [3,1]],
                required: 2
            },
            {
                cells: [[1,2], [2,2], [3,2]],
                required: 3
            },
            {
                cells: [[0,3], [1,3], [2,3], [3,3]],
                required: 3
            }
        ],
        initialState: [
            [2, 2, 2, 0],
            [2, 2, 0, 0],
            [2, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    {
        id: 4,
        name: "Tutorial 4",
        size: 4,
        areas: [
            {
                cells: [[0,0],[0,1]],
                required: 1
            },
            {
                cells: [[3,2], [3,3]],
                required: 1
            },
            {
                cells: [[2,0], [3,0], [2,1], [3,1], [2,2]],
                required: 4
            },
            {
                cells: [[0,3], [1,3], [0,2], [1,2], [1,1]],
                required: 4
            }
        ],
        initialState: [
            [0, 1, 0, 1],
            [2, 1, 0, 1],
            [1, 0, 1, 2],
            [1, 0, 1, 0]
        ]
    },
    {
        id: 5,
        name: "Tutorial 5",
        size: 4,
        areas: [
            {
                cells: [[0,0],[0,1]],
                required: 1
            },
            {
                cells: [[3,2], [3,3]],
                required: 1
            },
            {
                cells: [[2,0], [3,0], [2,1], [3,1], [2,2]],
                required: 4
            },
            {
                cells: [[0,3], [1,3], [0,2], [1,2], [1,1]],
                required: 4
            }
        ],
        initialState: [
            [0, 1, 0, 1],
            [2, 1, 0, 1],
            [1, 0, 1, 2],
            [1, 0, 1, 0]
        ]
    },
    {
        id: 11,
        name: "Level 11",
        size: 6,
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
                required: 5
            },
            {
                cells: [[4,2], [4,3], [4,4],
                        [5,2], [5,3], [5,4]],
                required: 4
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
        id: 12,
        name: "Level 12",
        size: 6,
        areas: [
            {
                cells: [[0,0], [0,1]],
                required: 1
            },
            {
                cells: [[1,0], [1,1], [2,0], [2,1]],
                required: 2
            },
            {
                cells: [[3,0], [3,1], [4,0], [4,1]],
                required: 'J'
            },
            {
                cells: [[5,0], [5,1]],
                required: 0
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
        id: 13,
        name: "Level 13",
        size: 6,
        areas: [
            {
                cells: [[0,0], [0,1], [1,0], [1,1]],
                required: 3
            },
            {
                cells: [[2,0], [2,1], [3,0], [3,1]],
                required: 'J'
            },
            {
                cells: [[4,0], [4,1], [5,0], [5,1]],
                required: 1
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
