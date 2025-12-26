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
    const buttonX = 60;
    const buttonY = 30;

    // Button background
    this.backButton = this.add.rectangle(
      buttonX,
      buttonY,
      80,
      40,
      parseInt(COLORS.SECONDARY.replace('#', '0x'))
    ).setInteractive();

    // Button text
    this.backButtonText = this.add.text(buttonX, buttonY, 'Back', {
      fontSize: '18px',
      color: COLORS.TEXT,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Hover effects
    this.backButton.on('pointerover', () => {
      this.backButton.setFillStyle(parseInt(COLORS.SECONDARY.replace('#', '0x')), 0.8);
      this.backButtonText.setScale(1.1);
    });

    this.backButton.on('pointerout', () => {
      this.backButton.setFillStyle(parseInt(COLORS.SECONDARY.replace('#', '0x')), 1);
      this.backButtonText.setScale(1);
    });

    // Click handler
    this.backButton.on('pointerdown', () => {
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

    // Stop the comparison scene
    const currentMode = this.stateManager.getCurrentMode();
    if (currentMode === 'comparison') {
      this.scene.stop('CosmicComparisonScene');
    } else if (currentMode === 'powersOfTen') {
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

    // Phaser automatically cleans up scene-specific events
    // But we must manually remove external event listeners
  }
}
