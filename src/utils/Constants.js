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
  LIGHT_MIN: 100     // Minimum duration for light travel animation (0.1s for visibility)
};

// UI colors
export const COLORS = {
  BACKGROUND: '#000000',
  PRIMARY: '#4A90E2',
  SECONDARY: '#666666',
  GRAY: '#666666',
  TEXT: '#FFFFFF',
  LOADING_BAR: '#4A90E2',
  LOADING_BG: '#222222'
};

// Object selection limits
export const MAX_SELECTIONS = 2;

// Scale display settings
export const SCALE_DISPLAY = {
  MIN_SIZE: 2,         // Minimum visible size in pixels (allows accurate ratios)
  MAX_SCREEN_RATIO: 0.4 // Maximum size as fraction of screen width (40%)
};

// Proportional sizing settings for distance display
export const PROPORTIONAL_SIZING = {
  MIN_SIZE: 1,              // Absolute minimum size in pixels
  OVERLAY_THRESHOLD: 5,     // Show overlay if object < 5px
  OVERLAY_OFFSET_Y: 80,     // Vertical distance below actual object (pixels)
  CONNECTOR_COLOR: 0xaaaaaa,// Arrow connector color (gray)
  ARROW_SIZE: 12,            // Arrow triangle size (pixels)
  ARROW_GAP: 12,             // Gap between object and arrow (pixels)
  LABEL_OFFSET_Y: 15        // Gap between arrow and label (pixels)
};

// Light travel speedup control settings
export const SPEEDUP_CONTROL = {
  MIN_EXPONENT: 0,        // Minimum speedup exponent (10^0 = 1× real time)
  MAX_EXPONENT: 20,       // Maximum speedup exponent (10^20×)
  DEFAULT_EXPONENT: 0,    // Default to real time
  WIDTH: 300,             // Control width
  HEIGHT: 60,             // Control height
  BUTTON_WIDTH: 50,       // Button width
  BUTTON_HEIGHT: 40,      // Button height
  MARGIN: 10              // Spacing between elements
};

// Solar System visualization settings
export const SOLAR_SYSTEM = {
  PLANET_IDS: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],
  SUN_ID: 'sun',
  MIN_PLANET_RADIUS: 3,      // Minimum planet radius in pixels for visibility
  MAX_PLANET_RADIUS: 200,    // Maximum planet radius in size comparison mode
  TRANSITION_DURATION: 400,  // Mode transition animation duration (ms)
  LABEL_OFFSET_Y: 30,        // Distance below planet for label
  ORBIT_LINE_COLOR: 0x444444,// Gray color for orbit paths
  ORBIT_LINE_ALPHA: 0.6,     // Transparency for orbit paths
  INFO_PANEL_WIDTH: 350,     // Info panel width in pixels
  INFO_PANEL_SLIDE_DURATION: 300, // Info panel slide animation (ms)
  SUN_COLOR: 0xFDB813,       // Yellow-orange for the Sun
  DISTANCE_MARKER_COLOR: 0x666666, // Color for AU distance markers

  // Distance View constants
  DISTANCE_SUN_RADIUS: 25,       // Fixed Sun radius in distance view (pixels)
  DISTANCE_SUN_X: 60,            // Sun X position in distance view (pixels)
  DISTANCE_MARGIN: 60,           // Right margin in distance view (pixels)
  DISTANCE_MAX_PLANET_RADIUS: 15,// Maximum planet radius in distance view (pixels)

  // Orbital View constants
  ORBITAL_SUN_RADIUS: 12,        // Fixed Sun radius in orbital view (pixels)
  ORBITAL_MARGIN: 50,            // Margin from edge in orbital view (pixels)

  // Size Comparison View constants
  SIZE_HEIGHT_FACTOR: 0.7,       // Max height as fraction of screen (70%)
  SIZE_WIDTH_FACTOR: 0.9         // Target width as fraction of screen (90%)
};
