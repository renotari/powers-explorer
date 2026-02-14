/**
 * SpeedupControl - Manual speedup control for light travel animation
 *
 * Features:
 * - Adjust speedup from 10^0 (1× real time) to 10^20
 * - +/- buttons to increment/decrement exponent
 * - Special display for exponent 0: "Speed: 1× (Real Time)"
 * - Can be enabled/disabled (grayed out during animation)
 * - Positioned at bottom center
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { I18nManager } from '@/managers/I18nManager.js';
import { COLORS, SPEEDUP_CONTROL, GAME_WIDTH, GAME_HEIGHT } from '@/utils/Constants.js';

export class SpeedupControl extends ComponentBase {
  /**
   * Constructor
   *
   * @param {Phaser.Scene} scene - Parent scene
   * @param {number} x - X position (center)
   * @param {number} y - Y position (center)
   */
  constructor(scene, x, y) {
    super(scene);

    this.x = x;
    this.y = y;
    this.exponent = SPEEDUP_CONTROL.DEFAULT_EXPONENT;
    this.enabled = true;

    this.createUI();

    console.log('[SpeedupControl] Created at position', { x, y });
  }

  /**
   * Create UI elements
   */
  createUI() {
    const deltaY = 50

    // Label (centered)
    this.speedupLabel = this.scene.add.text(
      this.x,
      this.y,
      I18nManager.getInstance().t('speedup.label'),
      {
        fontSize: '36px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 23, y: 12 }
      }
    ).setOrigin(0.5);

    // Decrease button [-]
    this.decreaseBtn = this.scene.add.text(
      this.x - 60,
      this.y + deltaY,
      '[-]',
      {
        fontSize: '36px',
        color: COLORS.TEXT,
        backgroundColor: 'gray',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5).setInteractive();


    // Increase button [+]
    this.increaseBtn = this.scene.add.text(
      this.x + 60,
      this.y + deltaY,
      ' [+] ',
      {
        fontSize: '36px',
        color: COLORS.TEXT,
        backgroundColor: 'gray',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0.5).setInteractive();

    // Label (centered)
    this.actualSpeedupLabel = this.scene.add.text(
      this.x,
      this.y + deltaY * 2,
      this.getActualSpeedupLabelText(),
      {
        fontSize: '27px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 23, y: 12 }
      }
    ).setOrigin(0.5);

    // Add to container
    this.container.add([this.speedupLabel, this.decreaseBtn, this.actualSpeedupLabel, this.increaseBtn]);

    // Register event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup button event handlers
   */
  setupEventHandlers() {
    // Decrease button
    this.decreaseBtn.on('pointerdown', () => {
      if (this.enabled) {
        this.adjustExponent(-1);
      }
    });

    this.decreaseBtn.on('pointerover', () => {
      if (this.enabled) {
        this.decreaseBtn.setColor(COLORS.PRIMARY);
        this.decreaseBtn.setScale(1.1);
      }
    });

    this.decreaseBtn.on('pointerout', () => {
      if (this.enabled) {
        this.decreaseBtn.setColor(COLORS.TEXT);
        this.decreaseBtn.setScale(1);
      }
    });

    // Increase button
    this.increaseBtn.on('pointerdown', () => {
      if (this.enabled) {
        this.adjustExponent(1);
      }
    });

    this.increaseBtn.on('pointerover', () => {
      if (this.enabled) {
        this.increaseBtn.setColor(COLORS.PRIMARY);
        this.increaseBtn.setScale(1.1);
      }
    });

    this.increaseBtn.on('pointerout', () => {
      if (this.enabled) {
        this.increaseBtn.setColor(COLORS.TEXT);
        this.increaseBtn.setScale(1);
      }
    });
  }

  /**
   * Adjust exponent with bounds checking
   *
   * @param {number} delta - Change in exponent (+1 or -1)
   */
  adjustExponent(delta) {
    const newExponent = this.exponent + delta;

    // Bounds checking
    if (newExponent < SPEEDUP_CONTROL.MIN_EXPONENT || newExponent > SPEEDUP_CONTROL.MAX_EXPONENT) {
      console.log(`[SpeedupControl] Exponent ${newExponent} out of bounds, ignoring`);
      return;
    }

    this.exponent = newExponent;
    this.updateDisplay();

    // Emit event
    this.emit('speedupChanged', this.exponent);

    console.log(`[SpeedupControl] Speedup changed to 10^${this.exponent}×`);
  }

  /**
   * Update label display based on current exponent
   */
  updateDisplay() {
    this.actualSpeedupLabel.setText(this.getActualSpeedupLabelText());
  }

  /**
   * Get label text based on current exponent
   *
   * @returns {string} - Display text
   */
  getActualSpeedupLabelText() {
    const t = (key, params) => I18nManager.getInstance().t(key, params);
    if (this.exponent === 0) {
      return t('speedup.realTime');
    }
    return t('speedup.multiplied', { exponent: String(this.exponent) });
  }

  /**
   * Enable or disable the control
   *
   * @param {boolean} enabled - Whether control is interactive
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    if (enabled) {
      // Enable buttons
      this.decreaseBtn.setColor(COLORS.TEXT);
      this.decreaseBtn.setAlpha(1);
      this.increaseBtn.setColor(COLORS.TEXT);
      this.increaseBtn.setAlpha(1);
      this.actualSpeedupLabel.setAlpha(1);
    } else {
      // Disable buttons (gray out)
      this.decreaseBtn.setColor(COLORS.GRAY);
      this.decreaseBtn.setAlpha(0.5);
      this.decreaseBtn.setScale(1); // Reset scale
      this.increaseBtn.setColor(COLORS.GRAY);
      this.increaseBtn.setAlpha(0.5);
      this.increaseBtn.setScale(1); // Reset scale
      this.actualSpeedupLabel.setAlpha(0.5);
    }

    console.log(`[SpeedupControl] Control ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current speedup exponent
   * 
   * @returns {number} - Current exponent value (0 to 20)
   */
  getExponent() {
    return this.exponent;
  }

  /**
   * Set speedup exponent programmatically
   * Clamps to bounds, updates display, does NOT emit event
   * 
   * @param {number} value - New exponent value
   */
  setExponent(value) {
    // Clamp to valid range
    const clampedValue = Math.max(
      SPEEDUP_CONTROL.MIN_EXPONENT,
      Math.min(SPEEDUP_CONTROL.MAX_EXPONENT, value)
    );

    this.exponent = clampedValue;
    this.updateDisplay();

    console.log(`[SpeedupControl] Exponent set to ${this.exponent}`);
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Remove event listeners
    this.decreaseBtn.off('pointerdown');
    this.decreaseBtn.off('pointerover');
    this.decreaseBtn.off('pointerout');
    this.increaseBtn.off('pointerdown');
    this.increaseBtn.off('pointerover');
    this.increaseBtn.off('pointerout');

    // Call parent destroy
    super.destroy();
  }
}
