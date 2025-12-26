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

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('[MenuScene] Creating menu...');

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
    this.createCosmicComparisonButton(width, height);
    this.createPowersOfTenButton(width, height);

    // Footer text
    this.add.text(width / 2, height - 40, 'Educational Tool for Scale Visualization', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  /**
   * Create Cosmic Comparison mode button
   */
  createCosmicComparisonButton(width, height) {
    const buttonY = height / 2;

    // Button background
    const button = this.add.rectangle(
      width / 2,
      buttonY,
      300,
      60,
      parseInt(COLORS.PRIMARY.replace('#', '0x'))
    ).setInteractive();

    // Button text
    const buttonText = this.add.text(width / 2, buttonY, 'Cosmic Comparison', {
      fontSize: '24px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Description
    this.add.text(width / 2, buttonY + 45, 'Compare sizes and distances of cosmic objects', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Hover effects
    button.on('pointerover', () => {
      button.setFillStyle(parseInt(COLORS.PRIMARY.replace('#', '0x')), 0.8);
      buttonText.setScale(1.05);
    });

    button.on('pointerout', () => {
      button.setFillStyle(parseInt(COLORS.PRIMARY.replace('#', '0x')), 1);
      buttonText.setScale(1);
    });

    // Click handler
    button.on('pointerdown', () => {
      console.log('[MenuScene] Cosmic Comparison selected');
      this.startCosmicComparison();
    });
  }

  /**
   * Create Powers of Ten mode button (placeholder for future)
   */
  createPowersOfTenButton(width, height) {
    const buttonY = height / 2 + 120;

    // Button background (disabled style)
    const button = this.add.rectangle(
      width / 2,
      buttonY,
      300,
      60,
      parseInt(COLORS.SECONDARY.replace('#', '0x'))
    );

    // Button text
    this.add.text(width / 2, buttonY, 'Powers of Ten', {
      fontSize: '24px',
      color: '#999999',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Description
    this.add.text(width / 2, buttonY + 45, 'Zoom through 61 levels of scale (Coming Soon)', {
      fontSize: '14px',
      color: '#777777',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Future: Enable this button when PowersOfTenScene is implemented
    // button.setInteractive();
    // button.on('pointerdown', () => this.startPowersOfTen());
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
   * Start Powers of Ten mode (future implementation)
   */
  startPowersOfTen() {
    // Update state
    StateManager.getInstance().setMode('powersOfTen');

    // Stop this scene
    this.scene.stop('MenuScene');

    // Start Powers of Ten scene (to be implemented)
    // this.scene.start('PowersOfTenScene');

    // Launch overlay scene (runs in parallel)
    // this.scene.launch('UIOverlayScene');
  }
}
