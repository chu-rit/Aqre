const { parentPort, workerData } = require('worker_threads');

let solver;
if (workerData.solverType === 'reasoning') {
    const { ReasoningSolver } = require('./solver2');
    solver = new ReasoningSolver();
} else {
    const { PuzzleSolver } = require('./solver');
    solver = new PuzzleSolver();
}

solver._onProgress = (progress) => {
    parentPort.postMessage({ type: 'progress', ...progress });
};

try {
    const result = solver.solve(workerData);
    parentPort.postMessage({ type: 'done', result });
} catch (err) {
    parentPort.postMessage({ type: 'error', error: err.message });
}
