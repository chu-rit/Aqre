import { Platform } from 'react-native';

// 퍼즐 맵 데이터
export const PUZZLE_MAPS = [
    // Tutorial
    {
        id: 26000001,
        chapter: 1,
        difficulty: 0,
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
        id: 26000002,
        chapter: 1,
        difficulty: 0,
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
    {
        id: 26000003,
        chapter: 1,
        difficulty: 0,
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
        id: 26000004,
        chapter: 1,
        difficulty: 0,
        size: 5,
        areas: [
            {
                cells: [[0,1], [0,2], [0,3]],
                required: 0
            },
            {
                cells: [[3,0], [3,1]],
                required: 0
            },
            {
                cells: [[2,3], [2,4],
                        [3,3], [3,4]],
                required: 0
            },
            {  
                cells: [[0,0]],
                required: 1
            },
            {  
                cells: [[3,2]],
                required: 1
            },
            {
                cells: [[0,4]],
                required: 1
            }
        ],
        initialState: [
            [1, 0, 0, 0, 1],
            [1, 2, 0, 0, 1],
            [1, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [2, 2, 2, 2, 2]
        ]
    },
    {
        id: 26000005,
        chapter: 1,
        difficulty: 0,
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
    
    // Easy
    
    {
        id: 26000006,
        chapter: 1,
        difficulty: 1,
        size: 4,
        areas: [
            {
                cells: [[0,0], [0,1], [1,0], [1,1]],
                required: 4
            },
            {
                cells: [[2,2], [2,3], [3,2], [3,3]],
                required: 4
            },
            {
                cells: [[0,2], [0,3], [1,2], [1,3]],
                required: 2
            },
            {
                cells: [[2,0], [2,1], [3,0], [3,1]],
                required: 1
            }
        ],
        initialState: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    {
        id: 26000007,
        chapter: 1,
        difficulty: 1,
        size: 4,
        areas: [
            {
                cells: [[0,0], [0,1], [1,0], [1,1]],
                required: 3
            },
            {
                cells: [[2,2], [2,3], [3,2], [3,3]],
                required: 3
            },
            {
                cells: [[3,0]],
                required: 1
            },
            {
                cells: [[0,3]],
                required: 1
            }
        ],
        initialState: [
            [0, 0, 2, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 2, 0, 0]
        ]
    },
    {
        id: 2606152,
        chapter: 1,
        difficulty: 1,
        size: 4,
        areas: [
            { cells: [[0,0], [0,1], [0,2], [0,3], [1,0], [1,1], [1,2], [1,3]], required: 3 },
            { cells: [[2,0], [2,1], [2,2], [3,0]], required: 1 },
            { cells: [[2,3], [3,1], [3,2], [3,3]], required: 3 }
        ],
        initialState: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    {
        id: 26061511,
        chapter: 1,
        difficulty: 1,
        size: 4,
        areas: [
            { cells: [[0,2], [1,2], [0,3], [1,1]], required: 3 },
            { cells: [[2,2], [2,1], [1,0], [2,0], [3,0], [0,0], [3,2], [3,1]], required: 7 },
            { cells: [[1,3], [2,3], [3,3]], required: 2 }
        ],
        initialState: [
            [0, 2, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    { //5
        id: 26000008,
        chapter: 1,
        difficulty: 1,
        size: 4,
        areas: [
            {
                cells: [[0,0], [0,1], [1,0]],
                required: 2
            },
            {
                cells: [[2,0], [2,1], [3,0]],
                cells: [[0,2], [1,2]],
                required: 1
            },
            {
                cells: [[0,3], [1,3]],
                required: 1
            },
            {
                cells: [[1,1], [2,1]],
                required: 1
            },
            {
                cells: [[2,0], [3,0], [3,1]],
                required: 2
            },
            {
                cells: [[2,2], [2,3]],
                required: 1
            },
            {
                cells: [[3,2], [3,3]],
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
    {
        id: 26000009,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            {   
                cells: [[0, 1], 
                        [1, 0], [1, 1], [1, 2]],
                required: 2
            },
            {   
                cells: [[2, 0], [2, 1],
                        [3, 0], [3, 1]],
                required: 2
            },
            {   
                cells: [[0, 3], [0, 4],
                        [1, 3], [1, 4]],
                required: 3
            },
            {   
                cells: [[2, 2], [2, 3], [2, 4],
                        [3, 3]],
                required: 3
            }
        ],
        initialState: [
            [2, 0, 2, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 2, 0, 2],
            [2, 2, 2, 2, 2]
        ]
    },
    {
        id: 26000011,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            {
                cells: [[0, 0], [0, 1]],
                required: 1
            },
            {
                cells: [[0, 3], [0, 4]],
                required: 1
            },
            {
                cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
                required: 2
            },
            {
                cells: [[2, 0], [2, 1], [2, 2],
                        [3, 1]],
                required: 3
            },
            {
                cells: [[2, 3], [2, 4],
                        [3, 2], [3, 3],
                        [4, 2]],
                required: 4
            }
        ],
        initialState: [
            [0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [2, 0, 0, 0, 2],
            [2, 2, 0, 2, 2]
        ]
    },
    {
        id: 26061614,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            { cells: [[2,2], [3,1], [3,2], [3,3], [4,0], [4,1], [4,2], [4,3]], required: 7 },
            { cells: [[0,2], [0,3], [1,2], [1,3], [2,3]], required: 3 },
            { cells: [[0,0], [0,1], [1,1], [2,0], [2,1]], required: 3 }
        ],
        initialState: [
            [0, 0, 0, 0, 2],
            [2, 0, 0, 0, 2],
            [0, 0, 0, 0, 2],
            [2, 0, 0, 0, 2],
            [0, 0, 0, 0, 2]
        ]
    },
    {
        id: 26000010,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            {
                cells: [[0,0], [0,1], [0,2],
                        [1,0], [1,1], [1,2]],
                required: 5
            },
            {
                cells: [[2,0], [2,1],
                        [3,0], [3,1]],
                required: 2
            },
            {
                cells: [[0,3], [0,4]
                       ,[1,3], [1,4]],
                required: 3
            },
            {
                cells: [[2, 2], [2, 3], [2, 4],
                        [3, 2], [3, 3], [3, 4]],
                required: 5
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [2, 2, 2, 2, 2]
        ]
    },
    { //10
        id: 26061621,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            { cells: [[1,0], [2,0], [3,0], [3,1], [4,0], [4,1]], required: 5 },
            { cells: [[0,4], [1,4], [2,3], [2,4], [3,4]], required: 3 },
            { cells: [[0,0], [0,1], [0,2], [0,3]], required: 3 },
            { cells: [[1,2], [2,1], [2,2], [3,2]], required: 3 },
            { cells: [[3,3], [4,3], [4,4]], required: 2 }
        ],
        initialState: [
            [0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0]
        ]
    },
    {
        id: 26000012,
        chapter: 1,
        difficulty: 1,
        size: 6,
        areas: [
            {
                cells: [[0,2], [0,3], 
                        [1,2], [1,3]],
                required: 3
            },
            {
                cells: [[1, 0], [1, 1], 
                        [2, 0], [2, 1]],
                required: 2
            },
            {
                cells: [[1, 4], [1, 5],
                        [2, 4], [2, 5]],
                required: 1
            },
            {
                cells: [[5, 2], [5, 3]],
                required: 1
            },
            {
                cells: [[2, 2], [2, 3],
                        [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5],
                        [4, 1], [4, 2], [4, 3], [4, 4]],
                required: 'J'
            }
        ],
        initialState: [
            [2, 2, 0, 0, 2, 2],
            [2, 0, 0, 0, 0, 2],
            [0, 2, 0, 0, 2, 0],
            [0, 0, 0, 0, 0, 0],
            [2, 0, 0, 0, 0, 2],
            [2, 2, 0, 0, 2, 2]
        ]
    },
    {
        id: 26000014,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            {
                cells: [[2, 0], [3, 0]],
                required: 0
            },
            {
                cells: [[1, 4],[2, 4]],
                required: 1
            },
            {
                cells: [[0, 1], [1, 0], [1, 1]],
                required: 2
            },
            {
                cells: [[3, 3], [4, 3], [3, 4]],
                required: 2
            },
            {
                cells: [[0, 2], [0, 3], [1, 3]],
                required: 2
            },
            {
                cells: [[3, 1], [4, 1], [4, 2]],
                required: 2
            },
            {
                cells: [[4, 0]],
                required: 1
            },
            {
                cells: [[0, 4]],
                required: 1
            },
            {
                cells: [[1, 2],
                        [2, 1], [2, 2], [2, 3],
                        [3, 2]],
                required: 'J'
            }
        ],
        initialState: [
            [2, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 2]
        ]
    },
    {
        id: 26000017,
        chapter: 1,
        difficulty: 1,
        size: 6,
        areas: [
            { 
                cells: [[0, 2], [0, 3], 
                        [1, 1], [1, 2]], 
                required: 3
            },
            { 
                cells: [[1, 3], [1, 4], 
                        [2, 4], [2, 5]], 
                required: 3
            },
            { 
                cells: [[3, 0], [3, 1],
                        [4, 1], [4, 2]], 
                required: 3
            },
            { 
                cells: [[4, 3], [4, 4],
                        [5, 3], [5, 4]], 
                required: 4
            },
            {
                cells: [[5, 1], [5, 2]],
                required: 'J'
            },
            {
                cells: [[2, 0], [2, 1], [2, 2],[2, 3]],
                required: 3
            },
            {
                cells: [[3, 2], [3, 3], [3, 4], [3, 5]],
                required: 3
            }
        ],
        initialState: [
            [2, 2, 0, 0, 2, 2],
            [2, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [2, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 2],
        ],
    },
    {
        id: 26000016,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            {
                cells: [[0, 0], [0, 1], [0, 2], [0, 3]],
                required: 3
            },
            {
                cells: [[3, 0], [3, 1], [3, 2],
                        [4, 0]],
                required: 3
            },
            {
                cells: [[0, 4], [1, 4], [2, 4]],
                required: 1
            },
            {
                cells: [[3, 4]],
                required: 1
            },
            {
                cells: [[1, 2],
                        [2, 1], [2, 2], [2, 3]],
                required: 1
            },
            {
                cells: [[3, 3],
                        [4, 3]],
                required: 1
            },
            {  
                cells: [[4, 1], [4, 2]],
                required: 1
            },
            {
                cells: [[4, 4]],
                required: 0
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
    {
        id: 26000015,
        chapter: 1,
        difficulty: 1,
        size: 5,
        areas: [
            {
                cells: [[0, 0],[1, 0]],
                required: 1
            },
            {
                cells: [[2, 0],[3, 0],[4, 0]],
                required: 2
            },
            {
                cells: [[0, 1],[0, 2],
                        [1, 1],[1, 2]],
                required: 3
            },
            {
                cells: [[2, 1], [2, 2],
                        [3, 1], [3, 2]],
                required: 3
            },
            {
                cells: [[4, 1], [4, 2]],
                required: 1
            },
            {
                cells: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]],
                required: 3
            },
            {
                cells: [[0, 4]],
                required: 1
            },
            {
                cells: [[1, 4], [2, 4], [3, 4]],
                required: 1
            },
            {
                cells: [[4, 4]],
                required: 1,
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
    
    // LEVEL difficulty 2 

    {
        id: 26061606,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[1,0], [1,1], [1,2], [1,3], [1,4], [1,5], [2,1], [3,1]], required: 7 },
            { cells: [[2,2], [3,2], [4,1], [4,2]], required: 3 },
            { cells: [[2,0], [3,0], [4,0]], required: 1 },
            { cells: [[2,3], [3,3], [4,3], [4,4]], required: 1 },
            { cells: [[2,4], [2,5], [3,4], [3,5], [4,5]], required: 2 }
        ],
        initialState: [
            [2, 2, 2, 2, 2, 2],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [2, 2, 2, 2, 2, 2]
        ]
    },
    {
        id: 26061608,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[0,1], [1,1], [2,1], [3,1], [4,1]], required: 2 },
            { cells: [[1,2], [2,2], [3,2], [4,2], [5,2]], required: 4 },
            { cells: [[0,3], [1,3], [2,3], [3,3], [4,3]], required: 2 },
            { cells: [[1,4], [2,4], [3,4], [4,4], [5,4]], required: 4 }
        ],
        initialState: [
            [2, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 2]
        ]
    },
    {
        id: 26000013,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            {
                cells: [[0, 0], [0, 1], 
                        [1, 0], [1, 1]],
                required: 'J'
            },
            {
                cells: [[0, 3], [0, 4],
                        [1, 3], [1, 4]],
                required: 3
            },
            {
                cells: [[0, 2], [1, 2], [2, 2], [3, 2]],
                required: 1
            },
            {
                cells: [[2, 0], [2, 1], 
                        [3, 0], [3, 1],
                        [4, 0], [4, 1],
                        [5, 1]
                    ],
                required: 6
            },
            {
                cells: [[3, 3], [3, 4],
                        [4, 3], [4, 4], 
                        [5, 3], [5, 4]],
                required: 5
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 2, 0, 0, 2],
            [0, 0, 2, 0, 0, 2]
        ]
    },
    {
        id: 26061707,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[0,0], [1,0], [1,1], [2,0]], required: 2 },
            { cells: [[0,1], [0,2], [0,3], [0,4]], required: 1 },
            { cells: [[3,5], [4,3], [4,4], [4,5]], required: 2 },
            { cells: [[3,0], [4,0], [4,1], [4,2]], required: 2 },
            { cells: [[0,5], [1,4], [1,5], [2,5]], required: 2 },
            { cells: [[1,3], [2,3], [2,4], [3,4]], required: 2 },
            { cells: [[2,1], [2,2], [3,1], [3,2]], required: 3 }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [2, 2, 2, 2, 2, 2]
        ]
    },
    { //5
        id: 26000018,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[0,0], [0,1], [1,0]], required: 1 },
            { cells: [[0,2], [0,3], [1,2]], required: 2 },
            { cells: [[1,1], [2,1], [2,2]], required: 2 },
            { cells: [[1,3], [2,3], [2,4]], required: 2 },
            { cells: [[3,0], [3,1], [4,0]], required: 2 },
            { cells: [[3,2], [3,3], [4,2]], required: 1 },
            { cells: [[4,3], [5,3], [5,4]], required: 1 },
            { cells: [[4,1], [5,1], [5,2]], required: 1 }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2]
        ]
    },
    {
        id: 260615,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[0,0], [1,0], [0,1]], required: 3 },
            { cells: [[0,3], [0,4], [0,5]], required: 1 },
            { cells: [[1,1], [2,1], [1,2], [1,3], [1,4], [1,5], [2,4], [2,2], [2,3]], required: 6 },
            { cells: [[2,5], [3,4], [4,3], [4,5], [5,2], [5,5], [5,4], [5,3], [3,3], [3,5]], required: 3 },
            { cells: [[0,2]], required: 1 },
            { cells: [[3,1], [4,1], [3,0], [5,1], [4,0], [4,2], [2,0], [5,0]], required: 5 },
            { cells: [[4,4]], required: 1 }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 26000019,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[0,0], [0,1], [0,2], [0,3]], required: 2 },
            { cells: [[1,1], [2,0], [2,1], [2,2]], required: 2 },
            { cells: [[1,3], [1,4], [2,3], [2,4]], required: 3 },
            { cells: [[3,0], [3,1], [4,0], [4,1]], required: 2 },
            { cells: [[3,2], [3,3], [3,4], [4,3]], required: 3 },
            { cells: [[5,1], [5,2], [5,3], [5,4]], required: 2 },
            { cells: [[0,4], [0,5], [1,5], [2,5]], required: 1 },
            { cells: [[3,5], [4,4], [4,5], [5,5]], required: 2 }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0],
            [2, 0, 2, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0, 0],
            [2, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 26061705,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[2,2], [2,3], [3,2], [3,3]], required: 1 },
            { cells: [[0,0], [0,1], [0,2], [1,0], [1,1]], required: 4 },
            { cells: [[0,4], [0,5], [1,4], [1,5], [2,5]], required: 4 },
            { cells: [[3,0], [4,0], [4,1], [5,0], [5,1]], required: 4 },
            { cells: [[4,4], [4,5], [5,3], [5,4], [5,5]], required: 2 }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 2, 0, 0, 2, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 26061821,
        chapter: 1,
        difficulty: 2,
        size: 6,
        areas: [
            { cells: [[0,3], [1,2], [1,3], [1,4], [2,3]], required: 4 },
            { cells: [[1,1], [2,0], [2,1], [2,2], [3,1]], required: 3 },
            { cells: [[3,2], [4,1], [4,2], [4,3], [5,2]], required: 2 },
            { cells: [[2,4], [3,3], [3,4], [3,5], [4,4]], required: 1 },
            { cells: [[4,0], [5,0], [5,1]], required: 1 },
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
        id: 26000022,
        chapter: 1,
        difficulty: 2,
        size: 7,
        areas: [
            {
                cells: [[0, 5], [0, 6],
                        [1, 5], [1, 6]],
                required: 2
            },
            {
                cells: [[5, 0], [5, 1],
                        [6, 0], [6, 1]],
                required: 2
            },
            {
                cells: [[1, 0], [1, 1],
                        [2, 0], [2, 1],
                        [3, 0], [3, 1]],
                required: 2
            },
            {   
                cells: [[3, 5], [3, 6],
                        [4, 5], [4, 6],
                        [5, 5], [5, 6]],
                required: 2
            },
            {
                cells: [[1, 4],
                        [2, 3], [2, 4], 
                        [3, 4]],
                required: 1
            },
            {
                cells: [[3, 2],
                        [4, 2], [4, 3],
                        [5, 2]],
                required: 3
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 2, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 0, 0, 0, 0],
            [2, 0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 26000023,
        chapter: 1,
        difficulty: 2,
        size: 7,
        areas: [
            {
                cells: [[0, 0]],
                required: 1
            },
            {
                cells: [[0, 1]],
                required: 0
            },
            {
                cells: [[0, 2]],
                required: 1
            },
            {
                cells: [[0, 3]],
                required: 1
            },
            {
                cells: [[0, 4]],
                required: 0
            },
            {
                cells: [[0, 5]],
                required: 1
            },
            {
                cells: [[0, 6]],
                required: 1
            },
            {
                cells: [[6, 0]],
                required: 0
            },
            {
                cells: [[6, 1]],
                required: 1
            },
            {
                cells: [[6, 2]],
                required: 1
            },
            {
                cells: [[6, 3]],
                required: 1
            },
            {
                cells: [[6, 4]],
                required: 0
            },
            {
                cells: [[6, 5]],
                required: 1
            },
            {
                cells: [[6, 6]],
                required: 0
            },
            {
                cells: [[1, 0]],
                required: 1
            },
            {
                cells: [[2, 0]],
                required: 0
            },
            {
                cells: [[3, 0]],
                required: 0
            },
            {
                cells: [[4, 0]],
                required: 1
            },
            {
                cells: [[5, 0]],
                required: 1
            },
            {
                cells: [[1, 6]],
                required: 0
            },
            {
                cells: [[2, 6]],
                required: 1
            },
            {
                cells: [[3, 6]],
                required: 0
            },
            {
                cells: [[4, 6]],
                required: 1
            },
            {
                cells: [[5, 6]],
                required: 0
            },
            {
                cells: [[3, 3]],
                required: 1
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 26062201,
        chapter: 1,
        difficulty: 2,
        size: 7,
        areas: [
            { cells: [[2,2], [2,3], [2,4], [3,2], [4,2], [4,3], [4,4]], required: 2 },
            { cells: [[0,0], [0,1], [0,2], [1,0], [1,1], [1,2], [2,0], [2,1]], required: 7 },
            { cells: [[0,4], [0,5], [0,6], [1,4], [1,5], [1,6], [2,5], [2,6]], required: 3 },
            { cells: [[4,0], [4,1], [5,0], [5,1], [5,2], [6,0], [6,1], [6,2]], required: 2 },
            { cells: [[4,5], [4,6], [5,4], [5,5], [5,6], [6,4], [6,5], [6,6]], required: 5 }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ]
    },

    // LEVEL difficulty 3

    {
        id: 26000024,
        chapter: 1,
        difficulty: 3,
        size: 8,
        areas: [
            {
                cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
                required: 4
            },
            {
                cells: [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6]],
                required: 5
            },
            {
                cells: [[7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
                required: 4
            },
            {
                cells: [[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],
                required: 5
            },
            {
                cells: [[2, 2]],
                required: 0
            },
            {
                cells: [[2, 4]],
                required: 0
            },
            {
                cells: [[4, 2]],
                required: 0
            },
            {
                cells: [[4, 4]],
                required: 0
            },
            {
                cells: [[6, 2]],
                required: 0
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 2]
        ]
    },
    {
        id: 26000025,
        chapter: 1,
        difficulty: 3,
        size: 8,
        areas: [
            { 
                cells: [[0, 0], [0, 1],
                        [1, 0], [1, 1], 
                        [2, 1], [2, 2],
                        [3, 2], [3, 3],
                        [4, 3], [4, 4],
                        [5, 4], [5, 5],
                        [6, 5], [6, 6], // [6, 7],
                        [7, 6], [7, 7]
                       ], 
                required: 2
            },
            {
                cells: [[0, 6], [0, 7], 
                        [1, 5], [1, 6], [1, 7],
                        [2, 4], [2, 5], [2, 6],
                        [3, 4], [3, 5]],
                required: 6
            },
            {
                cells: [[4, 2],
                        [5, 1], [5, 2], [5, 3],
                        [6, 0], [6, 1], [6, 2],
                        [7, 0], [7, 1]],
                required: 6
            },
            {
                cells: [[0, 3]],
                required: 0
            },
            {
                cells: [[2, 0]],
                required: 1
            },
            {
                cells: [[2, 3]],
                required: 1
            },
            {
                cells: [[4, 5]],
                required: 0
            },
            {
                cells: [[2, 7],
                        [3, 7],
                        [4, 7],
                        [5, 7]],
                required: 1
            },
            // {
            //     cells: [[7, 0]],
            //     required: 0
            // },
            {
                cells: [[5, 0]],
                required: 1
            },
            {
                cells: [[6, 7]],
                required: 1
            },
            {
                cells: [[7, 5]],
                required: 1
            }
        ],
        initialState: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ]
    }
];

/*
    {
        id: 26061807,
        chapter: 1,
        difficulty: 3,
        size: 8,
        areas: [
            { cells: [[1,0], [2,0]], required: 1 },
            { cells: [[3,0], [4,0]], required: 1 },
            { cells: [[5,0]], required: 1 },
            { cells: [[3,7], [4,7], [5,7]], required: 2 },
            { cells: [], required: 1 },
            { cells: [[1,7]], required: 1 },
            { cells: [[4,2], [4,3], [5,2], [5,3]], required: 2 },
            { cells: [[1,5], [1,6], [2,5], [2,6]], required: 2 }
        ],
        initialState: [
            [2, 2, 2, 2, 2, 2, 2, 2],
            [0, 0, 0, 0, 0, 0, 2, 0],
            [0, 0, 0, 0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 0, 0, 0, 0],
            [2, 2, 2, 2, 2, 2, 2, 2],
            [2, 2, 2, 2, 2, 2, 2, 2]
        ]
    }
*/