/**
 * MenuScene - Mode selection and navigation
 *
 * Provides:
 * - Mode selection buttons (Cosmic Comparison, Powers of Ten)
 * - Application title
 * - Help/About access
 *
 * Navigation:
 * - Cosmic Comparison → CosmicComparisonScene + UIOverlayScene
 * - Powers of Ten → PowersOfTenScene + UIOverlayScene (future)
 */

import Phaser from 'phaser';
import { StateManager } from '@/managers/StateManager.js';
import { I18nManager } from '@/managers/I18nManager.js';
import { COLORS, FULLSCREEN_BUTTON } from '@/utils/Constants.js';
import { Button } from '@/components/ui/Button.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('[MenuScene] Creating menu...');

    // Register cleanup
    this.events.on('shutdown', this.cleanup, this);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const t = (key, params) => I18nManager.getInstance().t(key, params);

    // Title
    this.add.text(width / 2, height / 4, t('menu.title'), {
      fontSize: '96px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3, t('menu.subtitle'), {
      fontSize: '27px',
      color: COLORS.TEXT,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Create mode selection buttons
    this.createButtons(width, height);

    // Create fullscreen toggle button
    this.createFullscreenButton();

    // Footer text
    this.add.text(width / 2, height - 60, t('menu.footer'), {
      fontSize: '21px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  /**
   * Create mode selection buttons
   */
  createButtons(width, height) {
    const t = (key, params) => I18nManager.getInstance().t(key, params);
    let buttonY = height / 3 + 100;
    const textDeltaY = 65; // Space between button and description text
    const buttonSpacingY = 80; // Space between buttons

    // Cosmic Comparison button
    this.cosmicComparisonBtn = new Button(this, width / 2, buttonY, {
      text: t('menu.cosmicComparison'),
      width: 450,
      height: 90,
      fontSize: '36px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT
    });
    this.cosmicComparisonBtn.on('clicked', () => {
      console.log('[MenuScene] Cosmic Comparison selected');
      this.startCosmicComparison();
    });

    buttonY += textDeltaY;
    // Description
    this.add.text(width / 2, buttonY, t('menu.cosmicComparisonDesc'), {
      fontSize: '21px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Solar System button
    buttonY += buttonSpacingY;
    this.solarSystemBtn = new Button(this, width / 2, buttonY, {
      text: t('menu.solarSystem'),
      width: 450,
      height: 90,
      fontSize: '36px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT
    });
    this.solarSystemBtn.on('clicked', () => {
      console.log('[MenuScene] Solar System selected');
      this.startSolarSystem();
    });

    // Description
    buttonY += textDeltaY;
    this.add.text(width / 2, buttonY, t('menu.solarSystemDesc'), {
      fontSize: '21px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Powers of Ten button (disabled - coming soon)
    buttonY += buttonSpacingY;
    this.powersOfTenBtn = new Button(this, width / 2, buttonY, {
      text: t('menu.powersOfTen'),
      width: 450,
      height: 90,
      fontSize: '36px',
      backgroundColor: COLORS.SECONDARY,
      textColor: '#999999',
      enabled: false
    });

    // Description
    buttonY += textDeltaY;
    this.add.text(width / 2, buttonY, t('menu.powersOfTenDesc'), {
      fontSize: '21px',
      color: '#777777',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
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
   * Start Cosmic Comparison mode
   */
  startCosmicComparison() {
    // Update state
    StateManager.getInstance().setMode('comparison');

    // Stop this scene
    this.scene.stop('MenuScene');

    // Start comparison scene
    this.scene.start('CosmicComparisonScene');

    // Launch overlay scene (runs in parallel)
    this.scene.launch('UIOverlayScene');
  }

  /**
   * Start Solar System mode
   */
  startSolarSystem() {
    // Update state
    StateManager.getInstance().setMode('solarSystem');

    // Stop this scene
    this.scene.stop('MenuScene');

    // Start Solar System scene
    this.scene.start('SolarSystemScene');

    // Launch overlay scene (runs in parallel)
    this.scene.launch('UIOverlayScene');
  }

  /**
   * Cleanup when scene shuts down
   */
  cleanup() {
    console.log('[MenuScene] Cleaning up...');

    // Destroy buttons
    if (this.cosmicComparisonBtn) {
      this.cosmicComparisonBtn.off('clicked');
      this.cosmicComparisonBtn.destroy();
    }
    if (this.solarSystemBtn) {
      this.solarSystemBtn.off('clicked');
      this.solarSystemBtn.destroy();
    }
    if (this.powersOfTenBtn) {
      this.powersOfTenBtn.destroy();
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
