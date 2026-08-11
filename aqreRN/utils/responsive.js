import { Dimensions } from 'react-native';

const TABLET_BREAKPOINT = 600;
const MAX_TABLET_SCALE = 1.18;

export const UI_SCALE = Math.min(
  Math.max(Dimensions.get('window').width / TABLET_BREAKPOINT, 1),
  MAX_TABLET_SCALE
);

const UNSCALED_KEYS = new Set([
  'flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'elevation',
  'fontWeight', 'shadowOpacity', 'aspectRatio',
]);

function scaleValue(key, value) {
  if (typeof value !== 'number' || UNSCALED_KEYS.has(key)) return value;
  if (key === 'width' && value >= TABLET_BREAKPOINT) return value;
  return Math.round(value * UI_SCALE * 100) / 100;
}

export function scaleStyles(styleSheet) {
  const scaleStyle = style => {
    if (!style || typeof style !== 'object' || Array.isArray(style)) return style;
    return Object.fromEntries(
      Object.entries(style).map(([key, value]) => [
        key,
        value && typeof value === 'object' && !Array.isArray(value)
          ? scaleStyle(value)
          : scaleValue(key, value),
      ])
    );
  };

  return Object.fromEntries(
    Object.entries(styleSheet).map(([key, value]) => [key, scaleStyle(value)])
  );
}
