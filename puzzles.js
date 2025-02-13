// 퍼즐 맵 데이터
const PUZZLE_MAPS = [
    {   // 1
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
    {   // 2
        id: 2,
        name: "Tutorial 2",
        size: 5,
        areas: [
            {
                cells: [[0,1], [0,2], [0,3], [0,4]],
                required: 1
            },
            {
                cells: [[0,0], [1,0], [2,0], [3,0]],
                required: 3
            }
        ],
        initialState: [
            [1, 0, 0, 0, 0],
            [1, 2, 2, 2, 2],
            [1, 2, 2, 2, 2],
            [1, 2, 2, 2, 2],
            [2, 2, 2, 2, 2]
        ]
    },
    {   // 3
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
    {    // 4
        id: 4,
        name: "Tutorial 4",
        size: 4,
        areas: [
            {
                cells: [[0,0], [1,0]],
                required: 2
            },
            {
                cells: [[0,1], [1,1]],
                required: 0
            },
            {
                cells: [[0,2], [1,2]],
                required: 2
            },
            {
                cells: [[2,1],[3,1]],
                required: 2
            },
            {
                cells: [[2,3], [3,3]],
                required: 2
            }
        ],
        initialState: [
            [1, 0, 1, 2],
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [2, 1, 0, 1]
        ]
    },
    {   // 5
        id: 5,
        name: "Tutorial 5",
        size: 4,
        areas: [
            {
                cells: [[0,0], [0,1]],
                required: 1
            },
            {
                cells: [[3,2], [3,3]],
                required: 1
            },
            {
                cells: [[2,0], [3,0], [2,1], [2,2]],
                required: 4
            },
            {
                cells: [[0,3], [1,3], [1,2], [1,1]],
                required: 4
            }
        ],
        initialState: [
            [0, 0, 0, 0],
            [2, 0, 0, 0],
            [0, 0, 0, 2],
            [0, 0, 0, 0]
        ]
    },
    {   // 6
        id: 6,
        name: "level 6",
        size: 4,
        areas: [
            {   // A
                cells: [[0,0], [0,1], [1,0]],
                required: 2
            },
            {   // B
                cells: [[2,0], [2,1], [3,0]],
                cells: [[0,2], [1,2]],
                required: 1
            },
            {   // C
                cells: [[0,3], [1,3]],
                required: 1
            },
            {   // D
                cells: [[1,1], [2,1]],
                required: 1
            },
            {   // E
                cells: [[2,0], [3,0]],
                required: 1
            },
            {   // F
                cells: [[2,2], [2,3]],
                required: 1
            },
            {   // G
                cells: [[3,1], [3,2]],
                required: 1
            },
            {   // H
                cells: [[3,3]],
                required: 0
            }
        ],
        initialState: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    {   // 7
        id: 7,
        name: "level 7",
        size: 5,
        areas: [
            {
                cells: [[0,0], [0,1]],
                required: 1
            },
            {
                cells: [[1,0], [1,1], [1,2]],
                required: 2
            },
            {
                cells: [[2,2], [2,3],[2,4]],
                required: 2
            },
            {
                cells: [[3,3], [3,4]],
                required: 1
            },
            {
                cells: [[0,4]],
                required: 0
            },
            {
                cells: [[4,0], [4,1], [4,2], [4,3], [4,4]],
                required: 3
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ]
    },
    {   // 8
        id: 8,
        name: "level 8",
        size: 6,
        areas: [
            {
                cells: [[0,0], [1,0], [2,0]],
                required: 2
            },
            {
                cells: [[0,5], [1,5], [2,5]],
                required: 2
            },
            {
                cells: [[3,0], [4,0], [5,0]],
                required: 2
            },
            {
                cells: [[3,5], [4,5], [5,5]],
                required: 2
            },
            {
                cells: [[2,2], [2,3], [3,2], [3,3]],
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
    },
    {   // 9
        id: 9,
        name: "level 9",
        size: 6,
        areas: [
            {
                cells: [[0,0], [0,1], [0,2]],
                required: 2
            },
            {
                cells: [[1,3], [1,4], [1,5]],
                required: 2
            },
            {
                cells: [[2,0], [2,1], [2,2]],
                required: 1
            },
            {
                cells: [[3,3], [3,4], [3,5]],
                required: 1
            },
            {
                cells: [[4,0], [4,1], [4,2], [4,3]],
                required: 3
            },
            {
                cells: [[5,4], [5,5]],
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
    },
    {   // 10
        id: 10,
        name: "level 10",
        size: 6,
        areas: [
            {
                cells: [[0,0], [1,0]],
                required: 1
            },
            {
                cells: [[0,5], [1,5]],
                required: 1
            },
            {
                cells: [[2,1], [2,2], [3,1], [3,2]],
                required: 2
            },
            {
                cells: [[2,3], [2,4], [3,3], [3,4]],
                required: 2
            },
            {
                cells: [[4,0], [4,1], [5,0], [5,1]],
                required: 2
            },
            {
                cells: [[4,4], [4,5], [5,4], [5,5]],
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
    },
    {   // 11
        id: 11,
        name: "level 11",
        size: 6,
        areas: [
            {
                cells: [[0,0], [0,1], [1,0], [1,1]],
                required: 2
            },
            {
                cells: [[0,4], [0,5], [1,4], [1,5]],
                required: 2
            },
            {
                cells: [[2,2], [2,3], [3,2], [3,3]],
                required: 2
            },
            {
                cells: [[4,0], [4,1], [5,0], [5,1]],
                required: 1
            },
            {
                cells: [[4,4], [4,5], [5,4], [5,5]],
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
    },
    {   // 12
        id: 12,
        name: "Level 12",
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
    {   // 13
        id: 13,
        name: "Level 13",
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
    {   // 14
        id: 14,
        name: "Level 14",
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


/*
    
*/
