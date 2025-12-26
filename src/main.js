/**
 * Powers Explorer - Main Entry Point
 *
 * Application initialization:
 * 1. Import Phaser configuration
 * 2. Import all scenes
 * 3. Register scenes with Phaser
 * 4. Start Phaser game with BootScene
 */

import Phaser from 'phaser';
import { phaserConfig } from '@/config/phaserConfig.js';

// Import scenes
import { BootScene } from '@/scenes/BootScene.js';
import { MenuScene } from '@/scenes/MenuScene.js';
import { UIOverlayScene } from '@/scenes/UIOverlayScene.js';
import { CosmicComparisonScene } from '@/scenes/CosmicComparisonScene.js';

// Register all scenes in the configuration
phaserConfig.scene = [
  BootScene,
  MenuScene,
  CosmicComparisonScene,
  UIOverlayScene
];

// Log application start
console.log('='.repeat(60));
console.log('Powers Explorer - Cosmic Scale Visualization');
console.log('Version: 1.0.0-dev');
console.log('='.repeat(60));
console.log('Registered scenes:', phaserConfig.scene.map(s => s.name).join(', '));
console.log('Starting Phaser game...');

// Create and start Phaser game instance
const game = new Phaser.Game(phaserConfig);

// Make game instance globally accessible for debugging
window.game = game;

console.log('Phaser game instance created successfully');
console.log('Initial scene: BootScene');
console.log('='.repeat(60));

// Export game instance for potential external access
export default game;
