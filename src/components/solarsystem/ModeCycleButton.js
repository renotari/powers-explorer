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
import { parseHexColor } from '@/utils/ColorUtils.js';

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
    const buttonWidth = 270;
    const buttonHeight = 68;
    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT - 60;

    // Button background
    this.buttonBackground = this.scene.add.rectangle(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      parseHexColor(COLORS.PRIMARY)
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.buttonBackground);

    // Button text
    this.buttonText = this.scene.add.text(
      buttonX,
      buttonY,
      this.getModeText(this.currentMode),
      {
        fontSize: '27px',
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
      // Remove event listeners before destroying
      this.buttonBackground.off('pointerdown');
      this.buttonBackground.off('pointerover');
      this.buttonBackground.off('pointerout');
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
