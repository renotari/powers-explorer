/**
 * BootScene - Asset loading and initialization
 *
 * CRITICAL: This scene:
 * - Loads all JSON data files
 * - Initializes singleton managers
 * - Shows loading progress
 * - Transitions to MenuScene when ready
 *
 * Lifecycle: preload() → create() → MenuScene
 */

import Phaser from 'phaser';
import { DataManager } from '@/managers/DataManager.js';
import { StateManager } from '@/managers/StateManager.js';
import { COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('[BootScene] Preloading assets...');

    // Show loading bar
    this.createLoadingBar();

    // Loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height / 2 - 150, 'Powers Explorer', {
      fontSize: '72px',
      color: COLORS.TEXT,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.loadingText = this.add.text(width / 2, height / 2 + 150, 'Loading...', {
      fontSize: '30px',
      color: COLORS.TEXT,
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  /**
   * Create loading progress bar
   */
  createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress bar background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(parseHexColor(COLORS.LOADING_BG), 0.8);
    progressBox.fillRect(width / 2 - 240, height / 2 - 38, 480, 75);

    // Progress bar fill
    const progressBar = this.add.graphics();

    // Update progress bar as files load
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(parseHexColor(COLORS.LOADING_BAR), 1);
      progressBar.fillRect(width / 2 - 225, height / 2 - 23, 450 * value, 45);

      // Update loading text with percentage
      const percent = Math.floor(value * 100);
      this.loadingText.setText(`Loading... ${percent}%`);
    });

    // Clean up graphics when complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Handle load errors
    this.load.on('loaderror', (file) => {
      console.error('[BootScene] Load error:', file.key, file.src);
      this.loadingText.setText(`Error loading: ${file.key}`);
      this.loadingText.setColor('#ff0000');
    });
  }

  /**
   * Initialize managers and transition to menu
   *
   * CRITICAL: Must be async to await DataManager initialization
   */
  async create() {
    console.log('[BootScene] Initializing managers...');

    try {
      // Initialize DataManager (loads JSON files)
      await DataManager.getInstance().init(this);
      console.log('[BootScene] DataManager initialized');

      // Initialize StateManager
      StateManager.getInstance().init();
      console.log('[BootScene] StateManager initialized');

      // Brief delay to show completion
      await this.delay(500);

      console.log('[BootScene] Initialization complete. Transitioning to MenuScene...');

      // Transition to menu
      this.scene.start('MenuScene');

    } catch (error) {
      console.error('[BootScene] Initialization failed:', error);
      this.showError(error.message);
    }
  }

  /**
   * Display error message
   * @param {string} message - Error message
   */
  showError(message) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height / 2, `Error: ${message}`, {
      fontSize: '30px',
      color: '#ff0000',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: width - 150 }
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.rectangle(
      width / 2, height / 2 + 90, 210, 60,
      parseHexColor(COLORS.PRIMARY)
    ).setInteractive({ useHandCursor: true });

    const retryText = this.add.text(width / 2, height / 2 + 90, 'Retry', {
      fontSize: '27px',
      color: COLORS.TEXT,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    retryBtn.on('pointerover', () => retryBtn.setAlpha(0.8));
    retryBtn.on('pointerout', () => retryBtn.setAlpha(1));
    retryBtn.on('pointerdown', () => {
      retryBtn.destroy();
      retryText.destroy();
      this.scene.restart();
    });
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
