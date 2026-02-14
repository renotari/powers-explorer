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
import { I18nManager } from '@/managers/I18nManager.js';
import { COLORS, SOLAR_SYSTEM, GAME_WIDTH, GAME_HEIGHT } from '@/utils/Constants.js';
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

    // Get translated name for display
    const tr = I18nManager.getInstance().getObjectTranslation(this.planetData.id);
    this.displayName = tr?.name ?? this.planetData.name;

    // Create label (initially hidden)
    this.label = this.scene.add.text(
      this.x,
      this.y + this.radius + SOLAR_SYSTEM.LABEL_OFFSET_Y,
      this.displayName,
      {
        fontSize: '21px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5);
    this.container.add(this.label);
    this.label.setVisible(false);

    // Tooltip references (created on hover)
    this.tooltip = null;
    this.tooltipBg = null;

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
    this.showTooltip();
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
    this.hideTooltip();
  }

  /**
   * Show tooltip above planet (only when label is hidden)
   */
  showTooltip() {
    // Skip if label is already visible (avoids redundant info)
    if (this.label && this.label.visible) return;
    // Clean up any existing tooltip first
    this.hideTooltip();

    const padding = SOLAR_SYSTEM.TOOLTIP_PADDING;

    // Create tooltip text
    this.tooltip = this.scene.add.text(
      this.x,
      0, // positioned below
      this.displayName,
      {
        fontSize: SOLAR_SYSTEM.TOOLTIP_FONT_SIZE,
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Determine position: above the planet by default
    let tooltipY = this.y - this.radius - SOLAR_SYSTEM.TOOLTIP_OFFSET_Y;
    const textHeight = this.tooltip.height;
    // Flip below planet if too close to top
    if (tooltipY - textHeight / 2 - padding < 5) {
      tooltipY = this.y + this.radius + SOLAR_SYSTEM.TOOLTIP_OFFSET_Y;
    }
    this.tooltip.setY(tooltipY);

    // Clamp X to stay within screen bounds
    const textWidth = this.tooltip.width;
    const halfW = textWidth / 2 + padding;
    if (this.tooltip.x - halfW < 0) {
      this.tooltip.setX(halfW);
    } else if (this.tooltip.x + halfW > GAME_WIDTH) {
      this.tooltip.setX(GAME_WIDTH - halfW);
    }

    // Create background rectangle behind the text
    this.tooltipBg = this.scene.add.rectangle(
      this.tooltip.x,
      this.tooltip.y,
      textWidth + padding * 2,
      textHeight + padding * 2,
      SOLAR_SYSTEM.TOOLTIP_BG_COLOR,
      SOLAR_SYSTEM.TOOLTIP_BG_ALPHA
    ).setOrigin(0.5);

    // Add bg first (behind text), then text on top
    this.container.add(this.tooltipBg);
    this.container.add(this.tooltip);
  }

  /**
   * Hide and destroy tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
    if (this.tooltipBg) {
      this.tooltipBg.destroy();
      this.tooltipBg = null;
    }
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
    this.hideTooltip();
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
    this.hideTooltip();

    // Kill any active tweens on the circle
    if (this.circle && this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this.circle);
    }

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
