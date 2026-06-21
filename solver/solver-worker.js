const { parentPort, workerData } = require('worker_threads');
const { PuzzleSolver } = require('./solver');

const solver = new PuzzleSolver();

solver._onProgress = (progress) => {
    parentPort.postMessage({ type: 'progress', ...progress });
};

try {
    const result = solver.solve(workerData);
    parentPort.postMessage({ type: 'done', result });
} catch (err) {
    parentPort.postMessage({ type: 'error', error: err.message });
}
