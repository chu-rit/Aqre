namespace AqreSolver.Models;

public class Puzzle
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Size { get; set; }
    public List<Area> Areas { get; set; } = new();
    public int[][]? InitialState { get; set; }
}

public class Area
{
    public List<int[]> Cells { get; set; } = new();
    public int Required { get; set; }
}

public class SolveRequest
{
    public int Size { get; set; }
    public List<Area> Areas { get; set; } = new();
    public int[][] InitialBoard { get; set; } = Array.Empty<int[]>();
    public int[] BlackCellBitmask { get; set; } = Array.Empty<int>();
    public int MaxSolutions { get; set; } = 3;
}

public class SolveResponse
{
    public List<int[][]> Solutions { get; set; } = new();
    public int Iterations { get; set; }
    public double ElapsedTime { get; set; }
    public string Status { get; set; } = string.Empty;
}
