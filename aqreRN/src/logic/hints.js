import CryptoJS from 'crypto-js';
import { ENCRYPTED_SOLUTIONS } from './encryptedSolutions';

let solutions = null;

function getSolutions() {
  if (solutions) return solutions;

  const key = CryptoJS.enc.Hex.parse(ENCRYPTED_SOLUTIONS.key);
  const iv = CryptoJS.enc.Hex.parse(ENCRYPTED_SOLUTIONS.iv);
  const encrypted = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(ENCRYPTED_SOLUTIONS.ciphertext),
  });
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const plainText = decrypted.toString(CryptoJS.enc.Utf8);

  if (!plainText) throw new Error('Failed to decrypt puzzle solutions.');

  solutions = JSON.parse(plainText);
  return solutions;
}

export function hasSolution(puzzleId) {
  return getSolutions().some(item => item.id === puzzleId);
}

export function getSolutionCell(puzzleId, row, col) {
  const solution = getSolutions().find(item => item.id === puzzleId)?.solution;
  if (!solution) return null;
  return solution[row][col];
}
