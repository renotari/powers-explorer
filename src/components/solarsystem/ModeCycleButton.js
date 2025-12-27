/**
 * ModeCycleButton - Button to cycle through visualization modes
 *
 * Responsibilities:
 * - Display current mode
 * - Cycle: Sizes → Distances → Orbits → Sizes
 * - Emit cycle event
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/utils/Constants.js';

export class ModeCycleButton extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.currentMode = 'sizeComparison';
    this.buttonBackground = null;
    this.buttonText = null;

    this.create();
  }

  /**
   * Create the button
   */
  create() {
    const buttonWidth = 180;
    const buttonHeight = 45;
    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT - 40;

    // Button background
    this.buttonBackground = this.scene.add.rectangle(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      parseInt(COLORS.PRIMARY.replace('#', '0x'))
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.buttonBackground);

    // Button text
    this.buttonText = this.scene.add.text(
      buttonX,
      buttonY,
      this.getModeText(this.currentMode),
      {
        fontSize: '18px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.container.add(this.buttonText);

    // Click handler
    this.buttonBackground.on('pointerdown', () => {
      this.emit('modeCycleRequested');
    });

    // Hover effects
    this.buttonBackground.on('pointerover', () => {
      this.buttonBackground.setAlpha(0.8);
      this.buttonText.setScale(1.05);
    });

    this.buttonBackground.on('pointerout', () => {
      this.buttonBackground.setAlpha(1);
      this.buttonText.setScale(1);
    });
  }

  /**
   * Set current mode
   * @param {string} mode - Mode name
   */
  setMode(mode) {
    this.currentMode = mode;
    this.buttonText.setText(this.getModeText(mode));
  }

  /**
   * Get mode display text
   * @param {string} mode - Mode name
   * @returns {string} Display text
   */
  getModeText(mode) {
    const modeNames = {
      sizeComparison: 'View: Sizes',
      distanceView: 'View: Distances',
      orbitalView: 'View: Orbits'
    };
    return modeNames[mode] || 'Cycle View';
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.buttonBackground) {
      this.buttonBackground.destroy();
      this.buttonBackground = null;
    }
    if (this.buttonText) {
      this.buttonText.destroy();
      this.buttonText = null;
    }
    super.destroy();
  }
}
