/**
 * Phaser Game Configuration
 *
 * Configures the Phaser game engine with optimal settings for
 * cosmic scale visualization
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/utils/Constants.js';

export const phaserConfig = {
  // Rendering type: AUTO selects WebGL with Canvas fallback
  type: Phaser.AUTO,

  // Canvas dimensions
  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  // DOM container ID
  parent: 'game-container',

  // Background color (black for space)
  backgroundColor: COLORS.BACKGROUND,

  // Physics configuration
  physics: {
    default: 'arcade',
    arcade: {
      debug: false  // Set to true for development debugging
    }
  },

  // Scene registration (will be populated in main.js)
  scene: [],

  // Scale manager configuration
  scale: {
    mode: Phaser.Scale.FIT,                // Fit to container while maintaining aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH   // Center both horizontally and vertically
  },

  // DOM element support
  dom: {
    createContainer: true  // Enable DOM elements within Phaser
  },

  // Rendering settings
  render: {
    pixelArt: false,     // Smooth scaling for realistic imagery
    antialias: true,     // Enable antialiasing
    roundPixels: false   // Allow sub-pixel rendering for smooth animations
  }
};
