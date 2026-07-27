import { Platform } from 'react-native';

const registry = new Map();

export const registerRef = (testID, ref) => {
  if (ref) {
    registry.set(testID, ref);
  } else {
    registry.delete(testID);
  }
};

export const getRef = (testID) => registry.get(testID);

export const measureRef = (testID) => {
  return new Promise((resolve) => {
    const ref = registry.get(testID);
    if (!ref) {
      resolve(null);
      return;
    }
    try {
      ref.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          resolve({ left: pageX, top: pageY, width, height, right: pageX + width, bottom: pageY + height });
        } else {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
};

export const measureSelector = async (selector) => {
  let testID = null;
  if (typeof selector !== 'string') return null;

  // Format 1: data-testid=value (plain key-value)
  if (selector.includes('=') && !selector.includes('[')) {
    const eqIdx = selector.indexOf('=');
    const key = selector.slice(0, eqIdx).trim();
    const value = selector.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (key === 'data-testid') {
      testID = value;
    }
  }

  // Format 2: [data-testid="value"] (CSS attribute selector)
  if (!testID) {
    const match = selector.match(/\[data-testid\s*=\s*"([^"]+)"\]/);
    if (match) {
      testID = match[1];
    }
  }

  // Format 3: #id (id selector)
  if (!testID && selector.startsWith('#')) {
    testID = selector.slice(1);
  }

  if (!testID) return null;
  return measureRef(testID);
};
