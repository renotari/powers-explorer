/**
 * Application Constants
 * Centralized configuration for game dimensions, scale bounds, and timing
 */

// Canvas dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Scale bounds (exponents in powers of 10)
export const MIN_EXPONENT = -35;  // Planck length (10^-35 m)
export const MAX_EXPONENT = 26;   // Observable universe (10^26 m)

// Animation durations (milliseconds)
export const ANIMATION_DURATION = {
  DISTANCE: 2000,    // Duration for distance separation animation
  LIGHT_MAX: 10000   // Maximum duration for light travel animation (cap at 10s for UX)
};

// UI colors
export const COLORS = {
  BACKGROUND: '#000000',
  PRIMARY: '#4A90E2',
  SECONDARY: '#666666',
  TEXT: '#FFFFFF',
  LOADING_BAR: '#4A90E2',
  LOADING_BG: '#222222'
};

// Object selection limits
export const MAX_SELECTIONS = 2;

// Scale display settings
export const SCALE_DISPLAY = {
  MIN_SIZE: 10,        // Minimum visible size in pixels
  MAX_SCREEN_RATIO: 0.4 // Maximum size as fraction of screen width (40%)
};
