/**
 * Color palette for Git GUI
 * Flat, developer-friendly design
 */

export const colors = {
  // Background colors
  bg: {
    primary: '#1e1e1e',
    secondary: '#252526',
    tertiary: '#2d2d30',
    hover: '#2a2d2e',
  },

  // Text colors
  text: {
    primary: '#cccccc',
    secondary: '#9d9d9d',
    disabled: '#6e6e6e',
    inverse: '#ffffff',
  },

  // Accent colors
  accent: {
    primary: '#007acc',
    secondary: '#0098ff',
    success: '#89d185',
    warning: '#cca700',
    error: '#f48771',
  },

  // Git-specific colors
  git: {
    added: '#89d185',
    modified: '#e2c08d',
    deleted: '#f48771',
    renamed: '#75beff',
    untracked: '#73c991',
    conflicted: '#f48771',
  },

  // Branch colors (for visualization)
  branch: [
    '#007acc',
    '#89d185',
    '#e2c08d',
    '#f48771',
    '#75beff',
    '#d18ce0',
    '#73c991',
    '#cca700',
  ],

  // Border colors
  border: {
    default: '#3e3e42',
    focus: '#007acc',
    subtle: '#2d2d30',
  },
};

export type Colors = typeof colors;
