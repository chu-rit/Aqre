using AqreSolver.Models;

namespace AqreSolver.Services;

public class PuzzleSolver
{
    private int _size;
    private List<Area> _areas = new();
    private int[][] _board = Array.Empty<int[]>();
    private int[] _blackCellBitmask = Array.Empty<int>();
    private int[,] _areaMap = null!;
    private List<int[][]> _solutions = new();
    private HashSet<string> _knownSolutionIds = new();
    private long _globalIterationCount = 0;
    private int _maxSolutions = 3;
    private int[] _areaGrayCount = Array.Empty<int>();
    private int[] _areaEmptyCount = Array.Empty<int>();
    private List<(int r, int c)> _emptyCellList = new();

    public SolveResponse Solve(SolveRequest request)
    {
        var startTime = DateTime.Now;
        _size = request.Size;
        _areas = request.Areas;
        _board = request.InitialBoard.Select(row => row.ToArray()).ToArray();
        _blackCellBitmask = request.BlackCellBitmask.ToArray();
        _maxSolutions = request.MaxSolutions;
        _solutions = new();
        _knownSolutionIds = new();
        _globalIterationCount = 0;

        _areaGrayCount = new int[_areas.Count];
        _areaEmptyCount = new int[_areas.Count];
        _areaMap = new int[_size, _size];
        BuildAreaMapAndStates();

        _emptyCellList.Clear();
        for (int i = 0; i < _size * _size; i++)
        {
            int r = i / _size, c = i % _size;
            int pos = r * _size + c;
            if ((_blackCellBitmask[pos / 32] & (1 << (pos % 32))) == 0 && _board[r][c] == -1)
            {
                _emptyCellList.Add((r, c));
            }
        }

        if (_emptyCellList.Count == 0)
            return new SolveResponse
            {
                Solutions = _solutions,
                Iterations = 0,
                ElapsedTime = 0,
                Status = "No empty cells to fill"
            };

        Backtrack(0);

        return new SolveResponse
        {
            Solutions = _solutions,
            Iterations = (int)_globalIterationCount,
            ElapsedTime = (DateTime.Now - startTime).TotalSeconds,
            Status = _solutions.Count > 0 ? "Success" : "No solutions found"
        };
    }

    private void BuildAreaMapAndStates()
    {
        for (int row = 0; row < _size; row++)
            for (int col = 0; col < _size; col++)
                _areaMap[row, col] = -1;

        for (int i = 0; i < _areas.Count; i++)
        {
            _areaEmptyCount[i] = _areas[i].Cells.Count;
            foreach (var cell in _areas[i].Cells)
                _areaMap[cell[0], cell[1]] = i;
        }

        for (int row = 0; row < _size; row++)
        {
            for (int col = 0; col < _size; col++)
            {
                int cellValue = _board[row][col];
                if (cellValue != -1)
                {
                    int areaIndex = _areaMap[row, col];
                    if (areaIndex != -1)
                    {
                        _areaEmptyCount[areaIndex]--;
                        if (cellValue == 1) _areaGrayCount[areaIndex]++;
                    }
                }
            }
        }
    }


    private bool Backtrack(int listIdx)
    {
        _globalIterationCount++;

        if (listIdx == _emptyCellList.Count)
        {
            if (CheckGrayConnectivity())
            {
                int[][] solution = new int[_size][];
                for (int i = 0; i < _size; i++)
                {
                    solution[i] = new int[_size];
                    Array.Copy(_board[i], solution[i], _size);
                }

                string solutionStr = System.Text.Json.JsonSerializer.Serialize(solution);
                if (!_knownSolutionIds.Contains(solutionStr))
                {
                    _solutions.Add(solution);
                    _knownSolutionIds.Add(solutionStr);
                    if (_solutions.Count >= _maxSolutions) return true;
                }
            }
            return false;
        }

        var (currentRow, currentCol) = _emptyCellList[listIdx];

        foreach (int color in new[] { 1, 0 })
        {
            if (!IsValidColor(currentRow, currentCol, color)) continue;
            if (!CheckAreaConstraints(currentRow, currentCol, color)) continue;
            if (color == 1 && !CanConnectToGray(currentRow, currentCol)) continue;

            _board[currentRow][currentCol] = color;
            UpdateAreaState(currentRow, currentCol, color, 1);

            if (Backtrack(listIdx + 1)) return true;

            UpdateAreaState(currentRow, currentCol, color, -1);
            _board[currentRow][currentCol] = -1;
        }

        return false;
    }

    private bool IsValidColor(int row, int col, int color)
    {
        // Check horizontal
        int count = 1;
        for (int c = col - 1; c >= 0; c--)
        {
            if (_board[row][c] == color)
            {
                count++;
                if (count >= 4) return false;
            }
            else
            {
                break;
            }
        }
        for (int c = col + 1; c < _size; c++)
        {
            if (_board[row][c] == color)
            {
                count++;
                if (count >= 4) return false;
            }
            else
            {
                break;
            }
        }

        // Check vertical
        count = 1;
        for (int r = row - 1; r >= 0; r--)
        {
            if (_board[r][col] == color)
            {
                count++;
                if (count >= 4) return false;
            }
            else
            {
                break;
            }
        }
        for (int r = row + 1; r < _size; r++)
        {
            if (_board[r][col] == color)
            {
                count++;
                if (count >= 4) return false;
            }
            else
            {
                break;
            }
        }

        return true;
    }

    private bool CheckAreaConstraints(int row, int col, int color)
    {
        int areaIndex = _areaMap[row, col];
        if (areaIndex == -1) return true;

        int required = _areas[areaIndex].Required;
        if (required == -1) return true;

        int grayCount = _areaGrayCount[areaIndex];
        int emptyCount = _areaEmptyCount[areaIndex];

        if (color == 1) grayCount++;
        else emptyCount--;

        if (grayCount > required) return false;
        if (grayCount + emptyCount < required) return false;

        return true;
    }
    
    private void UpdateAreaState(int row, int col, int color, int delta)
    {
        int areaIndex = _areaMap[row, col];
        if (areaIndex == -1) return;
        if (color == 1) _areaGrayCount[areaIndex] += delta;
        else _areaEmptyCount[areaIndex] += delta;
    }

    private bool CanConnectToGray(int row, int col)
    {
        int[][] directions = new[] { new[] { -1, 0 }, new[] { 1, 0 }, new[] { 0, -1 }, new[] { 0, 1 } };

        // Check adjacent gray cells
        foreach (var dir in directions)
        {
            int newRow = row + dir[0];
            int newCol = col + dir[1];

            if (newRow >= 0 && newRow < _size && newCol >= 0 && newCol < _size)
            {
                if (_board[newRow][newCol] == 1)
                {
                    return true;
                }
            }
        }

        // Check adjacent empty cells
        bool hasEmptyNearby = false;
        foreach (var dir in directions)
        {
            int newRow = row + dir[0];
            int newCol = col + dir[1];

            if (newRow >= 0 && newRow < _size && newCol >= 0 && newCol < _size)
            {
                if (_board[newRow][newCol] == -1)
                {
                    hasEmptyNearby = true;
                    break;
                }
            }
        }

        // Check if any gray cells exist
        bool hasExistingGray = false;
        for (int r = 0; r < _size; r++)
        {
            for (int c = 0; c < _size; c++)
            {
                if (_board[r][c] == 1)
                {
                    hasExistingGray = true;
                    break;
                }
            }
            if (hasExistingGray) break;
        }

        // First gray cell is OK without nearby empty/gray
        return !hasExistingGray || hasEmptyNearby;
    }

    private bool CheckGrayConnectivity()
    {
        int[] grayBitmask = new int[(int)Math.Ceiling((_size * _size) / 32.0)];
        int grayCount = 0;
        int firstGrayRow = -1, firstGrayCol = -1;

        // Find gray cells and build bitmask
        for (int row = 0; row < _size; row++)
        {
            for (int col = 0; col < _size; col++)
            {
                if (_board[row][col] == 1)
                {
                    int pos = row * _size + col;
                    int idx = pos / 32;
                    grayBitmask[idx] |= (1 << (pos % 32));
                    grayCount++;

                    if (firstGrayRow == -1)
                    {
                        firstGrayRow = row;
                        firstGrayCol = col;
                    }
                }
            }
        }

        if (grayCount <= 1)
            return true;

        // DFS to check connectivity
        int[] visitedBitmask = new int[grayBitmask.Length];
        DfsGray(firstGrayRow, firstGrayCol, visitedBitmask);

        // Check if all gray cells were visited
        for (int i = 0; i < grayBitmask.Length; i++)
        {
            if ((grayBitmask[i] & ~visitedBitmask[i]) != 0)
            {
                return false;
            }
        }

        return true;
    }

    private void DfsGray(int row, int col, int[] visitedBitmask)
    {
        if (row < 0 || row >= _size || col < 0 || col >= _size)
            return;

        int pos = row * _size + col;
        int idx = pos / 32;
        int mask = 1 << (pos % 32);

        if ((visitedBitmask[idx] & mask) != 0 || _board[row][col] != 1)
            return;

        visitedBitmask[idx] |= mask;

        DfsGray(row - 1, col, visitedBitmask);
        DfsGray(row + 1, col, visitedBitmask);
        DfsGray(row, col - 1, visitedBitmask);
        DfsGray(row, col + 1, visitedBitmask);
    }
}
