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
import { I18nManager } from '@/managers/I18nManager.js';
import { COLORS, FULLSCREEN_BUTTON } from '@/utils/Constants.js';
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
    this.createFullscreenButton();

    console.log('[UIOverlayScene] Overlay UI created');
  }

  /**
   * Create back button
   */
  createBackButton() {
    // Create Back button
    this.backButton = new Button(this, 90, 45, {
      text: I18nManager.getInstance().t('overlay.back'),
      width: 120,
      height: 60,
      fontSize: '27px',
      backgroundColor: COLORS.SECONDARY,
      textColor: COLORS.TEXT,
      hoverScale: 1.1
    });

    this.backButton.on('clicked', () => {
      this.returnToMenu();
    });
  }

  /**
   * Create fullscreen toggle button
   */
  createFullscreenButton() {
    const isFullscreen = this.scale.isFullscreen;

    this.fullscreenButton = new Button(this, FULLSCREEN_BUTTON.X, FULLSCREEN_BUTTON.Y, {
      text: isFullscreen ? FULLSCREEN_BUTTON.TEXT_FULLSCREEN : FULLSCREEN_BUTTON.TEXT_WINDOWED,
      width: FULLSCREEN_BUTTON.WIDTH,
      height: FULLSCREEN_BUTTON.HEIGHT,
      fontSize: FULLSCREEN_BUTTON.FONT_SIZE,
      backgroundColor: COLORS.SECONDARY,
      textColor: COLORS.TEXT,
      hoverScale: 1.1
    });

    this.fullscreenButton.on('clicked', () => {
      this.scale.toggleFullscreen();
    });

    // Listen to scale events to update button text (catches Escape key exits too)
    this.onEnterFullscreen = () => {
      this.fullscreenButton.setText(FULLSCREEN_BUTTON.TEXT_FULLSCREEN);
    };
    this.onLeaveFullscreen = () => {
      this.fullscreenButton.setText(FULLSCREEN_BUTTON.TEXT_WINDOWED);
    };

    this.scale.on('enterfullscreen', this.onEnterFullscreen);
    this.scale.on('leavefullscreen', this.onLeaveFullscreen);
  }

  /**
   * Create mode indicator text
   */
  createModeIndicator() {
    const width = this.cameras.main.width;

    this.modeIndicator = this.add.text(width / 2, 30, '', {
      fontSize: '24px',
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
    const t = (key, params) => I18nManager.getInstance().t(key, params);
    if (mode === 'comparison') {
      this.modeIndicator.setText(t('overlay.modeComparison'));
    } else if (mode === 'solarSystem') {
      this.modeIndicator.setText(t('overlay.modeSolarSystem'));
    } else if (mode === 'powersOfTen') {
      this.modeIndicator.setText(t('overlay.modePowersOfTen'));
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

    // Destroy buttons
    if (this.backButton) {
      this.backButton.off('clicked');
      this.backButton.destroy();
    }

    // Remove scale listeners (ScaleManager persists across scenes)
    if (this.fullscreenButton) {
      this.scale.off('enterfullscreen', this.onEnterFullscreen);
      this.scale.off('leavefullscreen', this.onLeaveFullscreen);
      this.fullscreenButton.off('clicked');
      this.fullscreenButton.destroy();
    }
  }
}
