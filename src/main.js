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
import { I18nManager } from '@/managers/I18nManager.js';
import { DataManager } from '@/managers/DataManager.js';

// Import scenes
import { BootScene } from '@/scenes/BootScene.js';
import { MenuScene } from '@/scenes/MenuScene.js';
import { UIOverlayScene } from '@/scenes/UIOverlayScene.js';
import { CosmicComparisonScene } from '@/scenes/CosmicComparisonScene.js';
import { SolarSystemScene } from '@/scenes/SolarSystemScene.js';

// Register all scenes in the configuration
phaserConfig.scene = [
  BootScene,
  MenuScene,
  CosmicComparisonScene,
  SolarSystemScene,
  UIOverlayScene
];

// Log application start
console.log('='.repeat(60));
console.log('Powers Explorer - Cosmic Scale Visualization');
console.log('Version: 1.2.0-dev');
console.log('='.repeat(60));
console.log('Registered scenes:', phaserConfig.scene.map(s => s.name).join(', '));
console.log('Starting Phaser game...');

// Create and start Phaser game instance
const game = new Phaser.Game(phaserConfig);

// Make game instance globally accessible for debugging
window.game = game;

// Expose external JS API for language control
window.PowersExplorer = {
  /**
   * Set the application language.
   * Call before game init to start in that language,
   * or after to trigger a full reload from BootScene.
   *
   * @param {string} code - Locale code ('en' or 'it')
   */
  setLanguage(code) {
    const i18n = I18nManager.getInstance();
    const previousLocale = i18n.getLocale();
    i18n.setLocale(code);

    // If already initialized and locale actually changed, restart from BootScene
    if (i18n.initialized && code !== previousLocale) {
      console.log(`[PowersExplorer] Language changed to '${code}', restarting...`);
      // Stop all active scenes and restart from BootScene
      game.scene.getScenes(true).forEach(scene => {
        if (scene.scene.key !== 'BootScene') {
          game.scene.stop(scene.scene.key);
        }
      });
      // Reset managers so they re-initialize with new locale
      DataManager.resetInstance();
      I18nManager.resetInstance();
      // Re-create I18nManager with new locale
      I18nManager.getInstance().setLocale(code);
      game.scene.start('BootScene');
    }
  }
};

console.log('Phaser game instance created successfully');
console.log('Initial scene: BootScene');
console.log('External API: window.PowersExplorer.setLanguage()');
console.log('='.repeat(60));

// Export game instance for potential external access
export default game;
