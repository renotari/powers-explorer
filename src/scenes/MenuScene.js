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
import { COLORS } from '@/utils/Constants.js';
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

    // Title
    this.add.text(width / 2, height / 3, 'Powers Explorer', {
      fontSize: '64px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3 + 60, 'Explore the Universe from Quarks to Quasars', {
      fontSize: '18px',
      color: COLORS.TEXT,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Create mode selection buttons
    this.createButtons(width, height);

    // Footer text
    this.add.text(width / 2, height - 40, 'Educational Tool for Scale Visualization', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  /**
   * Create mode selection buttons
   */
  createButtons(width, height) {
    const buttonY = height / 2;

    // Cosmic Comparison button
    this.cosmicComparisonBtn = new Button(this, width / 2, buttonY, {
      text: 'Cosmic Comparison',
      width: 300,
      height: 60,
      fontSize: '24px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT
    });
    this.cosmicComparisonBtn.on('clicked', () => {
      console.log('[MenuScene] Cosmic Comparison selected');
      this.startCosmicComparison();
    });

    // Description
    this.add.text(width / 2, buttonY + 45, 'Compare sizes and distances of cosmic objects', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Solar System button
    this.solarSystemBtn = new Button(this, width / 2, buttonY + 80, {
      text: 'Solar System',
      width: 300,
      height: 60,
      fontSize: '24px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT
    });
    this.solarSystemBtn.on('clicked', () => {
      console.log('[MenuScene] Solar System selected');
      this.startSolarSystem();
    });

    // Description
    this.add.text(width / 2, buttonY + 125, 'Explore the solar system with three visualization modes', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Powers of Ten button (disabled - coming soon)
    this.powersOfTenBtn = new Button(this, width / 2, buttonY + 160, {
      text: 'Powers of Ten',
      width: 300,
      height: 60,
      fontSize: '24px',
      backgroundColor: COLORS.SECONDARY,
      textColor: '#999999',
      enabled: false
    });

    // Description
    this.add.text(width / 2, buttonY + 205, 'Zoom through 61 levels of scale (Coming Soon)', {
      fontSize: '14px',
      color: '#777777',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
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
  }
}
