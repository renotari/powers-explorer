/**
 * ZoomControl - Toggle button to switch between orbital zoom levels
 *
 * Responsibilities:
 * - Display current zoom level label
 * - Toggle between zoom presets on click
 * - Emit 'zoomChanged' event with level data
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { I18nManager } from '@/managers/I18nManager.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SOLAR_SYSTEM } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class ZoomControl extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.currentIndex = 0;
    this.zoomLevels = SOLAR_SYSTEM.ORBITAL_ZOOM_LEVELS;
    this.buttonBackground = null;
    this.buttonText = null;

    this.create();
  }

  /**
   * Create the zoom toggle button
   */
  create() {
    const buttonWidth = 230;
    const buttonHeight = 56;
    const buttonX = 160;
    const buttonY = GAME_HEIGHT - 60;

    // Button background
    this.buttonBackground = this.scene.add.rectangle(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      parseHexColor(COLORS.SECONDARY)
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.buttonBackground);

    // Button text
    this.buttonText = this.scene.add.text(
      buttonX,
      buttonY,
      this.getLabelText(this.currentIndex),
      {
        fontSize: '24px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.container.add(this.buttonText);

    // Click handler
    this.buttonBackground.on('pointerdown', () => {
      this.toggle();
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
   * Toggle to the next zoom level
   */
  toggle() {
    const nextIndex = (this.currentIndex + 1) % this.zoomLevels.length;
    this.setLevel(nextIndex);
  }

  /**
   * Set zoom level by index
   * @param {number} index - Zoom level index
   */
  setLevel(index) {
    if (index < 0 || index >= this.zoomLevels.length) return;
    if (index === this.currentIndex) return;

    this.currentIndex = index;
    this.buttonText.setText(this.getLabelText(index));

    this.emit('zoomChanged', {
      levelIndex: index,
      zoomLevel: this.zoomLevels[index]
    });
  }

  /**
   * Get the display label for a zoom level
   * @param {number} index - Level index
   * @returns {string} Translated label
   */
  getLabelText(index) {
    const t = (key) => I18nManager.getInstance().t(key);
    const level = this.zoomLevels[index];
    return level ? t(level.labelKey) : '';
  }

  /**
   * Reset to default zoom (index 0)
   */
  reset() {
    this.currentIndex = 0;
    this.buttonText.setText(this.getLabelText(0));
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.buttonBackground) {
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
