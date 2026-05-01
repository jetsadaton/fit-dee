// Coachly design tokens (mirrors design source `tokens.js`).
// Use these for inline styles where the design demands hex values
// (e.g. SVG strokes, gradients). For Tailwind classes, prefer
// the named colors in tailwind.config.ts.

export const T = {
  // Surface
  bg: '#0E0F12',
  bg2: '#15171C',
  bg3: '#1C1F26',
  bg4: '#262A33',
  border: '#2A2E38',
  borderHi: '#3A3F4B',

  // Text
  text: '#F2F3F5',
  textDim: '#A8ADB8',
  textMute: '#6B7080',

  // Brand
  coral: '#FF6B47',
  coralHi: '#FF8666',
  coralDim: '#3A1A14',
  coralBg: 'rgba(255,107,71,0.12)',

  lime: '#C6FF4D',
  limeHi: '#D7FF7A',
  limeDim: '#2A3414',
  limeBg: 'rgba(198,255,77,0.12)',

  // Macro
  protein: '#FF8585',
  carb: '#FFCB66',
  fat: '#7FB8FF',

  // Activity ring
  ringMove: '#FF6B47',
  ringEat: '#C6FF4D',
  ringBurn: '#7FB8FF',

  // Semantic
  success: '#5BD68F',
  warn: '#FFB84D',
  danger: '#FF5252',
} as const;

export type DesignTokens = typeof T;
