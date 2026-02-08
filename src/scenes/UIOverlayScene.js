/**
 * UIOverlayScene - Persistent UI layer
 *
 * Runs in parallel with main scenes (CosmicComparisonScene, PowersOfTenScene)
 * Provides:
 * - Back button (return to menu)
 * - Mode indicator
 * - Help button (future)
 *
 * CRITICAL: Must properly clean up event listeners in shutdown event
 * to prevent memory leaks!
 */

import Phaser from 'phaser';
import { StateManager } from '@/managers/StateManager.js';
import { COLORS } from '@/utils/Constants.js';
import { Button } from '@/components/ui/Button.js';

export class UIOverlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIOverlayScene' });
  }

  create() {
    console.log('[UIOverlayScene] Creating overlay UI...');

    // CRITICAL: Register cleanup on shutdown to prevent memory leaks
    this.events.on('shutdown', this.cleanup, this);

    // Get StateManager reference
    this.stateManager = StateManager.getInstance();

    // Subscribe to state changes
    this.stateManager.on('modeChanged', this.updateMode, this);

    // Create UI elements
    this.createBackButton();
    this.createModeIndicator();

    console.log('[UIOverlayScene] Overlay UI created');
  }

  /**
   * Create back button
   */
  createBackButton() {
    // Create Back button
    this.backButton = new Button(this, 60, 30, {
      text: 'Back',
      width: 80,
      height: 40,
      fontSize: '18px',
      backgroundColor: COLORS.SECONDARY,
      textColor: COLORS.TEXT,
      hoverScale: 1.1
    });

    this.backButton.on('clicked', () => {
      this.returnToMenu();
    });
  }

  /**
   * Create mode indicator text
   */
  createModeIndicator() {
    const width = this.cameras.main.width;

    this.modeIndicator = this.add.text(width / 2, 20, '', {
      fontSize: '16px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Update with current mode
    this.updateMode(this.stateManager.getCurrentMode());
  }

  /**
   * Update mode indicator when mode changes
   * @param {string} mode - Current mode
   */
  updateMode(mode) {
    if (mode === 'comparison') {
      this.modeIndicator.setText('Cosmic Comparison Mode');
    } else if (mode === 'solarSystem') {
      this.modeIndicator.setText('Solar System Mode');
    } else if (mode === 'powersOfTen') {
      this.modeIndicator.setText('Powers of Ten Mode');
    } else {
      this.modeIndicator.setText('');
    }
  }

  /**
   * Return to main menu
   */
  returnToMenu() {
    console.log('[UIOverlayScene] Returning to menu...');

    // Stop the current scene (with existence checks)
    const currentMode = this.stateManager.getCurrentMode();
    if (currentMode === 'comparison' && this.scene.isActive('CosmicComparisonScene')) {
      this.scene.stop('CosmicComparisonScene');
    } else if (currentMode === 'solarSystem' && this.scene.isActive('SolarSystemScene')) {
      this.scene.stop('SolarSystemScene');
    } else if (currentMode === 'powersOfTen' && this.scene.isActive('PowersOfTenScene')) {
      this.scene.stop('PowersOfTenScene');
    }

    // Stop this overlay scene
    this.scene.stop('UIOverlayScene');

    // Start menu scene
    this.scene.start('MenuScene');

    // Clear mode
    this.stateManager.setMode(null);
  }

  /**
   * Cleanup event listeners
   *
   * CRITICAL: This prevents memory leaks!
   * Called automatically when scene shuts down
   */
  cleanup() {
    console.log('[UIOverlayScene] Cleaning up event listeners...');

    // Remove StateManager event listeners
    this.stateManager.off('modeChanged', this.updateMode, this);

    // Destroy button
    if (this.backButton) {
      this.backButton.off('clicked');
      this.backButton.destroy();
    }

    // Phaser automatically cleans up scene-specific events
    // But we must manually remove external event listeners
  }
}
