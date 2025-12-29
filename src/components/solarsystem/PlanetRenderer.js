/**
 * PlanetRenderer - Renders a single planet or celestial body
 *
 * Responsibilities:
 * - Create visual representation (circle with color)
 * - Handle click interactions
 * - Smooth position and size transitions
 * - Emit events for parent components
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { COLORS, SOLAR_SYSTEM } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class PlanetRenderer extends ComponentBase {
  /**
   * @param {Phaser.Scene} scene - Parent scene
   * @param {Object} planetData - Planet data from DataManager
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {number} radius - Initial radius in pixels
   * @param {Object} config - Additional configuration
   */
  constructor(scene, planetData, x, y, radius, config = {}) {
    super(scene, config);

    this.planetData = planetData;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.isInteractive = config.interactive !== false; // Default true

    this.create();
  }

  /**
   * Create the planet visual
   */
  create() {
    // Parse color from hex string to integer
    const color = this.planetData.color
      ? parseHexColor(this.planetData.color)
      : 0xFFFFFF;

    // Create planet circle
    this.circle = this.scene.add.circle(
      this.x,
      this.y,
      this.radius,
      color
    );
    this.container.add(this.circle);

    // Create label (initially hidden)
    this.label = this.scene.add.text(
      this.x,
      this.y + this.radius + SOLAR_SYSTEM.LABEL_OFFSET_Y,
      this.planetData.name,
      {
        fontSize: '14px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5);
    this.container.add(this.label);
    this.label.setVisible(false);

    // Make interactive if enabled
    if (this.isInteractive) {
      this.circle.setInteractive({ useHandCursor: true });
      this.setupInteractions();
    }
  }

  /**
   * Setup click and hover interactions
   */
  setupInteractions() {
    // Store bound handlers for later removal
    this.onPointerDown = () => {
      this.emit('planetClicked', {
        planetId: this.planetData.id,
        planetData: this.planetData,
        x: this.circle.x,
        y: this.circle.y
      });
    };

    this.onPointerOver = () => {
      this.highlight();
    };

    this.onPointerOut = () => {
      this.unhighlight();
    };

    // Add event listeners
    this.circle.on('pointerdown', this.onPointerDown);
    this.circle.on('pointerover', this.onPointerOver);
    this.circle.on('pointerout', this.onPointerOut);
  }

  /**
   * Highlight planet on hover
   */
  highlight() {
    this.scene.tweens.add({
      targets: this.circle,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      ease: 'Quad.easeOut'
    });
  }

  /**
   * Remove highlight
   */
  unhighlight() {
    this.scene.tweens.add({
      targets: this.circle,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 150,
      ease: 'Quad.easeOut'
    });
  }

  /**
   * Set planet position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.circle.setPosition(x, y);
    this.label.setPosition(x, y + this.radius + SOLAR_SYSTEM.LABEL_OFFSET_Y);
  }

  /**
   * Set planet size
   * @param {number} radius - Radius in pixels
   */
  setSize(radius) {
    this.radius = Math.max(radius, SOLAR_SYSTEM.MIN_PLANET_RADIUS);
    this.circle.setRadius(this.radius);
    // Update label position
    this.label.setY(this.y + this.radius + SOLAR_SYSTEM.LABEL_OFFSET_Y);
  }

  /**
   * Animate to new position and/or size
   * @param {number} x - Target X
   * @param {number} y - Target Y
   * @param {number} radius - Target radius
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Resolves when animation completes
   */
  animateTo(x, y, radius, duration = SOLAR_SYSTEM.TRANSITION_DURATION) {
    return new Promise((resolve) => {
      this.x = x;
      this.y = y;
      this.radius = Math.max(radius, SOLAR_SYSTEM.MIN_PLANET_RADIUS);

      // Animate circle position and radius
      this.scene.tweens.add({
        targets: this.circle,
        x: x,
        y: y,
        radius: this.radius,
        duration: duration,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          resolve();
        }
      });

      // Animate label position
      this.scene.tweens.add({
        targets: this.label,
        x: x,
        y: y + this.radius + SOLAR_SYSTEM.LABEL_OFFSET_Y,
        duration: duration,
        ease: 'Quad.easeInOut'
      });
    });
  }

  /**
   * Show/hide label
   * @param {boolean} visible - Label visibility
   */
  setLabelVisible(visible) {
    this.label.setVisible(visible);
  }

  /**
   * Enable/disable interactivity
   * @param {boolean} enabled - Interactive state
   */
  setInteractive(enabled) {
    this.isInteractive = enabled;
    if (enabled) {
      if (!this.circle.input) {
        this.circle.setInteractive({ useHandCursor: true });
      }
      // Only setup interactions if handlers don't exist yet
      if (!this.onPointerDown) {
        this.setupInteractions();
      }
    } else {
      // Remove listeners before disabling
      if (this.onPointerDown) {
        this.circle.off('pointerdown', this.onPointerDown);
        this.circle.off('pointerover', this.onPointerOver);
        this.circle.off('pointerout', this.onPointerOut);
      }
      this.circle.disableInteractive();
    }
  }

  /**
   * Get current position
   * @returns {Object} {x, y}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Get current radius
   * @returns {number} Radius in pixels
   */
  getRadius() {
    return this.radius;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners before destroying
    if (this.circle && this.onPointerDown) {
      this.circle.off('pointerdown', this.onPointerDown);
      this.circle.off('pointerover', this.onPointerOver);
      this.circle.off('pointerout', this.onPointerOut);
      this.onPointerDown = null;
      this.onPointerOver = null;
      this.onPointerOut = null;
    }

    if (this.circle) {
      this.circle.destroy();
      this.circle = null;
    }
    if (this.label) {
      this.label.destroy();
      this.label = null;
    }
    super.destroy();
  }
}
