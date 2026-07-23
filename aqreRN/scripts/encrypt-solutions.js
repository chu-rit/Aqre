const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const sourcePath = path.resolve(__dirname, '../../solver/solution.js');
const destinationPath = path.resolve(__dirname, '../src/logic/encryptedSolutions.js');
const source = fs.readFileSync(sourcePath, 'utf8').replace('export const PUZZLE_SLT =', 'var PUZZLE_SLT =');
const context = {};

vm.runInNewContext(source, context);

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const ciphertext = Buffer.concat([
  cipher.update(JSON.stringify(context.PUZZLE_SLT), 'utf8'),
  cipher.final(),
]).toString('base64');
const output = `export const ENCRYPTED_SOLUTIONS = {
  key: ${JSON.stringify(key.toString('hex'))},
  iv: ${JSON.stringify(iv.toString('hex'))},
  ciphertext: ${JSON.stringify(ciphertext)},
};
`;

fs.writeFileSync(destinationPath, output);
