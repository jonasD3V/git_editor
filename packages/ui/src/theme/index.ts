/**
 * Theme system for Git GUI
 * @module theme
 */

import { colors } from './colors';

export { colors };

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const typography = {
  fontFamily: {
    mono: '"SF Mono", "Monaco", "Cascadia Code", "Courier New", monospace',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '13px',
    lg: '14px',
    xl: '16px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const theme = {
  colors,
  spacing,
  typography,
};

export type Theme = typeof theme;
