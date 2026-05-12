using AqreSolver.Models;
using AqreSolver.Services;

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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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

app.Run();
