import { ComponentBase } from '../ComponentBase.js';
import { COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

/**
 * Reusable button component with hover effects, click debouncing, and enable/disable support
 * Extends ComponentBase following existing component patterns (ModeCycleButton, ObjectSelector)
 * 
 * @extends ComponentBase
 * @fires Button#clicked - Emitted when button is clicked (debounced to prevent double-clicks)
 */
export class Button extends ComponentBase {
  /**
   * @param {Phaser.Scene} scene - The scene this button belongs to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Button configuration
   * @param {string} config.text - Button label text
   * @param {number} [config.width=200] - Button width in pixels
   * @param {number} [config.height=50] - Button height in pixels
   * @param {string} [config.fontSize='20px'] - Text font size
   * @param {string} [config.backgroundColor=COLORS.PRIMARY] - Background color (hex string)
   * @param {string} [config.textColor=COLORS.TEXT] - Text color (hex string)
   * @param {number} [config.hoverAlpha=0.8] - Alpha value when hovering
   * @param {number} [config.hoverScale=1.05] - Text scale when hovering
   * @param {boolean} [config.enabled=true] - Whether button is interactive
   */
  constructor(scene, x, y, config = {}) {
    super(scene, config);

    // Store position
    this.x = x;
    this.y = y;

    // Store configuration with defaults
    this.config = {
      text: config.text || 'Button',
      width: config.width || 200,
      height: config.height || 50,
      fontSize: config.fontSize || '20px',
      backgroundColor: config.backgroundColor || COLORS.PRIMARY,
      textColor: config.textColor || COLORS.TEXT,
      hoverAlpha: config.hoverAlpha !== undefined ? config.hoverAlpha : 0.8,
      hoverScale: config.hoverScale !== undefined ? config.hoverScale : 1.05,
      enabled: config.enabled !== undefined ? config.enabled : true
    };

    // Click debouncing state
    this.lastClickTime = 0;
    this.debounceDelay = 300; // milliseconds

    // Create visual elements
    this.createButton();

    // Position the container at specified coordinates
    this.container.setPosition(this.x, this.y);

    // Set initial enabled state
    this.setEnabled(this.config.enabled);
  }

  /**
   * Creates the button visual elements (background rectangle and text)
   * @private
   */
  createButton() {
    const { width, height, fontSize, backgroundColor, textColor, text } = this.config;

    // Create background rectangle
    this.background = this.scene.add.rectangle(
      0,
      0,
      width,
      height,
      parseHexColor(backgroundColor)
    );
    this.background.setStrokeStyle(2, parseHexColor(COLORS.TEXT));
    this.container.add(this.background);

    // Create text label
    this.label = this.scene.add.text(0, 0, text, {
      fontSize: fontSize,
      fontFamily: 'Arial, sans-serif',
      color: textColor,
      align: 'center'
    });
    this.label.setOrigin(0.5);
    this.container.add(this.label);

    // Set up interactive area
    this.background.setInteractive({ useHandCursor: true });

    // Bind event handlers
    this.onPointerOver = this.handlePointerOver.bind(this);
    this.onPointerOut = this.handlePointerOut.bind(this);
    this.onPointerDown = this.handlePointerDown.bind(this);

    // Register event listeners
    this.background.on('pointerover', this.onPointerOver);
    this.background.on('pointerout', this.onPointerOut);
    this.background.on('pointerdown', this.onPointerDown);
  }

  /**
   * Handle pointer over (hover start)
   * @private
   */
  handlePointerOver() {
    if (!this.config.enabled) return;

    this.background.setAlpha(this.config.hoverAlpha);
    this.label.setScale(this.config.hoverScale);
  }

  /**
   * Handle pointer out (hover end)
   * @private
   */
  handlePointerOut() {
    if (!this.config.enabled) return;

    this.background.setAlpha(1);
    this.label.setScale(1);
  }

  /**
   * Handle pointer down (click) with debouncing
   * @private
   */
  handlePointerDown() {
    if (!this.config.enabled) return;

    // Debounce rapid clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.debounceDelay) {
      return; // Ignore click if within debounce window
    }
    this.lastClickTime = now;

    // Emit clicked event
    this.emit('clicked');
  }

  /**
   * Enable or disable the button
   * @param {boolean} enabled - Whether button should be interactive
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;

    if (enabled) {
      // Enabled state
      this.background.setAlpha(1);
      this.label.setAlpha(1);
      this.background.setInteractive({ useHandCursor: true });
    } else {
      // Disabled state (grayed out, non-interactive)
      this.background.setAlpha(0.5);
      this.label.setAlpha(0.5);
      this.background.disableInteractive();
    }
  }

  /**
   * Update button text
   * @param {string} text - New text label
   */
  setText(text) {
    this.label.setText(text);
  }

  /**
   * Clean up resources and event listeners
   * @override
   */
  destroy() {
    // Remove event listeners
    if (this.background) {
      this.background.off('pointerover', this.onPointerOver);
      this.background.off('pointerout', this.onPointerOut);
      this.background.off('pointerdown', this.onPointerDown);
    }

    // Call parent cleanup
    super.destroy();
  }
}
