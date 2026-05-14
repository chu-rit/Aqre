using AqreSolver.Models;
using AqreSolver.Services;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<PuzzleSolver>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure pipeline
// Swagger UI 활성화 (모든 환경)
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAll");

// API Endpoints

// Health check
app.MapGet("/", () => "Aqre Puzzle Solver API is running");

// Solve puzzle endpoint
app.MapPost("/api/solve", (SolveRequest request, PuzzleSolver solver) =>
{
    try
    {
        var response = solver.Solve(request);
        return Results.Ok(response);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("SolvePuzzle")
.WithOpenApi();

// Preset cells by area rules (helper endpoint)
app.MapPost("/api/preset", (SolveRequest request) =>
{
    try
    {
        var board = request.InitialBoard.Select(row => row.ToArray()).ToArray();
        var size = request.Size;
        var areas = request.Areas;
        
        int presetCount = 0;
        
        foreach (var area in areas)
        {
            int required = area.Required;
            
            if (required == 0)
            {
                // Set all cells to white (0)
                foreach (var cell in area.Cells)
                {
                    int row = cell[0];
                    int col = cell[1];
                    if (board[row][col] == -1)
                    {
                        board[row][col] = 0;
                        presetCount++;
                    }
                }
            }
            else if (required == area.Cells.Count)
            {
                // Set all cells to gray (1)
                foreach (var cell in area.Cells)
                {
                    int row = cell[0];
                    int col = cell[1];
                    if (board[row][col] == -1)
                    {
                        board[row][col] = 1;
                        presetCount++;
                    }
                }
            }
        }
        
        // Build black cell bitmask
        int[] blackCellBitmask = new int[(int)Math.Ceiling((size * size) / 32.0)];
        for (int row = 0; row < size; row++)
        {
            for (int col = 0; col < size; col++)
            {
                if (board[row][col] == 2)
                {
                    int pos = row * size + col;
                    int idx = pos / 32;
                    blackCellBitmask[idx] |= (1 << (pos % 32));
                }
            }
        }
        
        return Results.Ok(new
        {
            presetBoard = board,
            blackCellBitmask = blackCellBitmask,
            presetCount = presetCount
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("PresetCells")
.WithOpenApi();

// Get puzzles from RN puzzles.js
app.MapGet("/api/puzzles", () =>
{
    try
    {
        var puzzlesJsPath = Path.Combine(builder.Environment.ContentRootPath, "..", "aqreRN", "src", "logic", "puzzles.js");
        if (!File.Exists(puzzlesJsPath))
        {
            return Results.NotFound(new { error = "puzzles.js not found at " + puzzlesJsPath });
        }

        var content = File.ReadAllText(puzzlesJsPath);
        var puzzles = ParsePuzzles(content);
        return Results.Ok(puzzles);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("GetPuzzles")
.WithOpenApi();

app.Run();

// Simple puzzle parser
static List<PuzzleData> ParsePuzzles(string content)
{
    var puzzles = new List<PuzzleData>();
    
    // Extract PUZZLE_MAPS array
    var arrayStart = content.IndexOf("[");
    if (arrayStart == -1) return puzzles;
    
    var arrayEnd = content.LastIndexOf("]");
    if (arrayEnd == -1 || arrayEnd <= arrayStart) return puzzles;
    
    var arrayContent = content.Substring(arrayStart, arrayEnd - arrayStart + 1);
    
    // Convert to valid JSON
    // Remove comments
    arrayContent = Regex.Replace(arrayContent, @"//.*?\n", "\n");
    // Quote property names
    arrayContent = Regex.Replace(arrayContent, @"(\w+):\s*", "\"$1\": ");
    // Handle single quotes
    arrayContent = arrayContent.Replace("'", "\"");
    // Handle J value
    arrayContent = arrayContent.Replace("\"J\"", "-99").Replace(": J", ": -99");
    
    puzzles = JsonConvert.DeserializeObject<List<PuzzleData>>(arrayContent) ?? puzzles;
    return puzzles;
}

public class PuzzleData
{
    public int id { get; set; }
    public string name { get; set; } = "";
    public int size { get; set; }
    public List<AreaData> areas { get; set; } = new();
    public List<List<int>> initialState { get; set; } = new();
}

public class AreaData
{
    public List<List<int>> cells { get; set; } = new();
    public int required { get; set; }
}
