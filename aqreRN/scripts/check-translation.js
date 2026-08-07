const fs = require('fs');

const src = fs.readFileSync('aqreRN/src/logic/tutorialSteps.js', 'utf8');

// Parse it simply by searching for text: and textEn:
let currentText = null;
let currentTextEn = null;
const lines = src.split('\n');
const missing = [];
const pairs = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('text:')) {
        currentText = line;
    } else if (line.startsWith('textEn:')) {
        currentTextEn = line;
    }
    
    // Check if we hit the end of an object
    if (line === '},' || line === '}') {
        if (currentText) {
            pairs.push({ text: currentText, textEn: currentTextEn });
            if (!currentTextEn) {
                missing.push(currentText);
            }
            currentText = null;
            currentTextEn = null;
        }
    }
}

console.log('Total texts found:', pairs.length);
console.log('Missing English translations:', missing.length);
if (missing.length > 0) {
    console.log('Missing items:');
    missing.forEach(m => console.log('  ', m));
}
