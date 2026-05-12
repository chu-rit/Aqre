# Aqre Puzzle Solver API

ASP.NET Core Minimal API로 구현된 Aqre 퍼즐 솔버 서버입니다.

## 기능

- 백트래킹 알고리즘을 사용한 Aqre 퍼즐 해결
- 비트마스크 최적화로 성능 향상
- 영역 제약 조건 검사
- 연속 색상 규칙 검사 (4개 연속 금지)
- 회색 셀 연결성 검사
- 사전 셀 확정 로직 (영역 규칙 기반)

## 시작 방법

```bash
cd solver
dotnet run
```

API는 `http://localhost:5000`에서 실행됩니다.

## API 엔드포인트

### 1. Health Check
```
GET /
```

### 2. 퍼즐 해결
```
POST /api/solve
Content-Type: application/json

{
  "size": 5,
  "areas": [
    {
      "cells": [[0,0], [0,1], [1,0], [1,1]],
      "required": 2
    }
  ],
  "initialBoard": [
    [-1, -1, 2, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1]
  ],
  "blackCellBitmask": [0, 0, 0, 0, 0, 0, 0, 0],
  "maxSolutions": 3
}
```

**응답:**
```json
{
  "solutions": [
    [[0,1,2,0,1], [1,0,0,1,0], ...],
    ...
  ],
  "iterations": 12345,
  "elapsedTime": 0.123,
  "status": "Success"
}
```

### 3. 사전 셀 확정
```
POST /api/preset
Content-Type: application/json

{
  "size": 5,
  "areas": [
    {
      "cells": [[0,0], [0,1], [1,0], [1,1]],
      "required": 2
    }
  ],
  "initialBoard": [
    [-1, -1, 2, -1, -1],
    ...
  ]
}
```

**응답:**
```json
{
  "presetBoard": [[0, -1, 2, -1, -1], ...],
  "blackCellBitmask": [4, 0, ...],
  "presetCount": 1
}
```

## 데이터 모델

- **initialBoard**: 2 = 블랙 셀 (고정), -1 = 빈 셀, 0 = 흰색, 1 = 회색
- **blackCellBitmask**: 블랙 셀 위치를 비트마스크로 표현 (32비트 단위)
- **areas.required**: 해당 영역에 필요한 회색 셀 수

## Swagger UI

개발 모드에서는 `http://localhost:5000/swagger`에서 Swagger UI를 통해 API를 테스트할 수 있습니다.
