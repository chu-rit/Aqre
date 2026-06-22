/**
 * Aqre Puzzle Solver API Server (Node.js)
 */

const http = require('http');
const { Worker } = require('worker_threads');
const { PuzzleSolver } = require('./solver');

const PORT = 5000;
let currentProgress = { status: 'idle' };
let activeWorker = null;

function parseJSON(body) {
    try {
        return JSON.parse(body);
    } catch (e) {
        return null;
    }
}

const server = http.createServer((req, res) => {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    const method = req.method;

    // Health check
    if (url === '/' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Aqre Puzzle Solver API is running (Node.js)');
        return;
    }

    // Progress endpoint
    if (url === '/api/progress' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(currentProgress));
        return;
    }

    // Cancel solving
    if (url === '/api/cancel' && method === 'POST') {
        if (activeWorker) {
            activeWorker.terminate();
            activeWorker = null;
        }
        currentProgress = { status: 'idle' };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // Solve puzzle
    if (url === '/api/solve' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const request = parseJSON(body);
            if (!request) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
            }

            currentProgress = { status: 'running', iterations: 0, elapsedTime: 0 };

            const worker = new Worker(__dirname + '/solver-worker.js', { workerData: request });
            activeWorker = worker;

            worker.on('message', (msg) => {
                if (msg.type === 'progress') {
                    currentProgress = {
                        status: 'running',
                        iterations: msg.iterations,
                        backtracks: msg.backtracks,
                        maxDepth: msg.maxDepth,
                        emptyCellTotal: msg.emptyCellTotal,
                        currentDepth: msg.currentDepth,
                        elapsedTime: msg.elapsedTime,
                        solutionsFound: msg.solutionsFound
                    };
                } else if (msg.type === 'done') {
                    currentProgress = { status: 'idle' };
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(msg.result));
                    worker.terminate();
                    activeWorker = null;
                } else if (msg.type === 'error') {
                    currentProgress = { status: 'idle' };
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: msg.error }));
                    worker.terminate();
                    activeWorker = null;
                }
            });

            worker.on('error', (err) => {
                currentProgress = { status: 'idle' };
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                activeWorker = null;
            });
        });
        return;
    }

    // Get puzzles endpoint
    if (url === '/api/puzzles' && method === 'GET') {
        try {
            const fs = require('fs');
            const path = require('path');
            const puzzlesJsPath = path.join(__dirname, '..', 'aqreRN', 'src', 'logic', 'puzzles.js');
            
            if (!fs.existsSync(puzzlesJsPath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'puzzles.js not found' }));
                return;
            }
            
            let content = fs.readFileSync(puzzlesJsPath, 'utf8');
            
            // Remove block comments before finding array bounds
            content = content.replace(/\/\*[\s\S]*?\*\//g, '');
            
            // Simple parser for the JS format
            const arrayStart = content.indexOf('[');
            const arrayEnd = content.lastIndexOf(']');
            if (arrayStart === -1 || arrayEnd === -1) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid puzzles.js format' }));
                return;
            }
            
            let arrayContent = content.substring(arrayStart, arrayEnd + 1);

            // Convert to valid JSON
            arrayContent = arrayContent.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
            arrayContent = arrayContent.replace(/\/\/.*/g, ''); // Remove line comments
            arrayContent = arrayContent.replace(/'J'/g, '-99'); // Handle J value
            arrayContent = arrayContent.replace(/:\s*J/g, ': -99');
            arrayContent = arrayContent.replace(/,\s*}/g, '}'); // Remove trailing commas
            arrayContent = arrayContent.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

            // Quote property names - match word followed by colon (not inside strings)
            arrayContent = arrayContent.replace(/(\w+)\s*:/g, '"$1":');

            const puzzles = JSON.parse(arrayContent);
            
            // Convert required: -99 to -1
            const convertedPuzzles = puzzles.map(p => ({
                ...p,
                areas: p.areas.map(a => ({
                    ...a,
                    required: a.required === -99 ? -1 : a.required
                }))
            }));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(convertedPuzzles));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Preset cells endpoint
    if (url === '/api/preset' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const request = parseJSON(body);
            if (!request) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
            }

            try {
                const board = request.initialBoard.map(row => [...row]);
                const size = request.size;
                const areas = request.areas;
                let presetCount = 0;

                for (const area of areas) {
                    const required = area.required;
                    if (required === 0) {
                        for (const cell of area.cells) {
                            const row = cell[0], col = cell[1];
                            if (board[row][col] === -1) {
                                board[row][col] = 0;
                                presetCount++;
                            }
                        }
                    } else if (required === area.cells.length) {
                        for (const cell of area.cells) {
                            const row = cell[0], col = cell[1];
                            if (board[row][col] === -1) {
                                board[row][col] = 1;
                                presetCount++;
                            }
                        }
                    }
                }

                const blackCellBitmask = new Array(Math.ceil((size * size) / 32)).fill(0);
                for (let row = 0; row < size; row++) {
                    for (let col = 0; col < size; col++) {
                        if (board[row][col] === 2) {
                            const pos = row * size + col;
                            const idx = Math.floor(pos / 32);
                            blackCellBitmask[idx] |= (1 << (pos % 32));
                        }
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    presetBoard: board,
                    blackCellBitmask: blackCellBitmask,
                    presetCount: presetCount
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`Aqre Puzzle Solver API running at http://localhost:${PORT}`);
});
