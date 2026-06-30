const { fork } = require('child_process');
const path = require('path');

let child;

function startServer() {
    child = fork(path.join(__dirname, 'server.js'), [], { stdio: 'inherit' });
    child.on('exit', (code) => {
        if (code === 0) {
            console.log('[start.js] Server requested restart, relaunching...');
            setTimeout(startServer, 500);
        } else {
            console.log(`[start.js] Server exited with code ${code}`);
            console.log('[start.js] Relaunching in 1 second...');
            setTimeout(startServer, 1000);
        }
    });
}

startServer();
