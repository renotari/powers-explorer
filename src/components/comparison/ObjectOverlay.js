/**
 * ObjectOverlay - Renders proportionally-sized objects with visible overlays
 *
 * When objects become too small (< 5px) during distance display, this component:
 * - Renders the tiny proportional object at its actual position
 * - Creates a larger visible overlay directly above it
 * - Connects them with a vertical arrow
 *
 * This allows accurate proportional visualization while maintaining visibility.
 */

import { ComponentBase } from '../ComponentBase.js';
import { PROPORTIONAL_SIZING } from '../../utils/Constants.js';

export class ObjectOverlay extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    // Configuration (can be overridden via config parameter)
    this.overlaySize = config.overlaySize || PROPORTIONAL_SIZING.OVERLAY_SIZE;
    this.overlayOffsetY = config.overlayOffsetY || PROPORTIONAL_SIZING.OVERLAY_OFFSET_Y;
    this.connectorColor = config.connectorColor || PROPORTIONAL_SIZING.CONNECTOR_COLOR;

    // Visual elements (created by create() method)
    this.actualSprite = null;      // Tiny proportional object
    this.overlaySprite = null;     // Large visible object
    this.connectorLine = null;     // Vertical line connecting them
    this.connectorArrow = null;    // Arrowhead pointing down
    this.actualLabel = null;       // Size indicator text
    this.overlayLabel = null;      // Object name text
  }

  /**
   * Create the overlay system
   *
   * @param {number} actualSize - Proportional size in pixels (typically 1-4px)
   * @param {Object} actualPosition - {x, y} position of the actual object
   * @param {string} objectColor - Color as "#RRGGBB"
   * @param {string} objectName - Name for label display
   */
  create(actualSize, actualPosition, objectColor, objectName) {
    // Calculate overlay position (directly above actual object)
    const overlayX = actualPosition.x;
    const overlayY = actualPosition.y - this.overlayOffsetY;

    // Create tiny actual-size object
    this.actualSprite = this.scene.add.circle(
      actualPosition.x,
      actualPosition.y,
      actualSize / 2,
      parseInt(objectColor.replace('#', '0x'))
    );
    this.actualSprite.setAlpha(0);  // Start invisible, will fade in

    // Create large overlay object
    this.overlaySprite = this.scene.add.circle(
      overlayX,
      overlayY,
      this.overlaySize / 2,
      parseInt(objectColor.replace('#', '0x'))
    );
    this.overlaySprite.setAlpha(0);  // Start invisible, will fade in

    // Create connector line (vertical)
    this.connectorLine = this.scene.add.line(
      0, 0,
      actualPosition.x,
      actualPosition.y - actualSize / 2 - 5,  // Start just above actual object
      overlayX,
      overlayY + this.overlaySize / 2 + 5,    // End just below overlay
      this.connectorColor
    );
    this.connectorLine.setLineWidth(1);
    this.connectorLine.setAlpha(0);  // Start invisible

    // Create arrowhead (small triangle pointing down)
    const arrowSize = 6;
    const arrowX = overlayX;
    const arrowY = overlayY + this.overlaySize / 2 + 5;

    this.connectorArrow = this.scene.add.triangle(
      arrowX,
      arrowY + arrowSize,
      0, 0,                    // Top vertex
      -arrowSize, arrowSize,   // Bottom-left vertex
      arrowSize, arrowSize,    // Bottom-right vertex
      this.connectorColor
    );
    this.connectorArrow.setAlpha(0);  // Start invisible

    // Create label for actual size
    this.actualLabel = this.scene.add.text(
      actualPosition.x,
      actualPosition.y + actualSize / 2 + 20,
      `(${actualSize.toFixed(2)}px)`,
      {
        fontSize: '10px',
        color: '#cccccc',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    this.actualLabel.setOrigin(0.5);
    this.actualLabel.setAlpha(0);  // Start invisible

    // Create label for object name
    this.overlayLabel = this.scene.add.text(
      overlayX,
      overlayY - this.overlaySize / 2 - 15,
      objectName,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    );
    this.overlayLabel.setOrigin(0.5);
    this.overlayLabel.setAlpha(0);  // Start invisible

    // Add all elements to the container
    this.container.add([
      this.connectorLine,
      this.connectorArrow,
      this.actualSprite,
      this.overlaySprite,
      this.actualLabel,
      this.overlayLabel
    ]);
  }

  /**
   * Fade in the overlay system
   *
   * @param {number} duration - Fade duration in milliseconds
   * @param {number} delay - Delay before starting fade in milliseconds
   */
  fadeIn(duration = 1000, delay = 0) {
    if (!this.overlaySprite) return;

    const targets = [
      this.actualSprite,
      this.overlaySprite,
      this.connectorLine,
      this.connectorArrow,
      this.actualLabel,
      this.overlayLabel
    ];

    this.scene.tweens.add({
      targets: targets,
      alpha: { from: 0, to: 0.8 },
      duration: duration,
      delay: delay,
      ease: 'Linear'
    });
  }

  /**
   * Update the position of the actual object (and adjust connector accordingly)
   * Called during animation when object is moving
   *
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  updatePosition(x, y) {
    if (!this.actualSprite) return;

    // Update actual sprite position
    this.actualSprite.x = x;
    this.actualSprite.y = y;

    // Update actual label position
    const actualSize = this.actualSprite.radius * 2;
    this.actualLabel.x = x;
    this.actualLabel.y = y + actualSize / 2 + 20;

    // Update overlay position (keep it above, but follow horizontal movement)
    const overlayX = x;
    const overlayY = y - this.overlayOffsetY;

    this.overlaySprite.x = overlayX;
    this.overlaySprite.y = overlayY;

    this.overlayLabel.x = overlayX;
    this.overlayLabel.y = overlayY - this.overlaySize / 2 - 15;

    // Update connector line
    this.connectorLine.setTo(
      x,
      y - actualSize / 2 - 5,
      overlayX,
      overlayY + this.overlaySize / 2 + 5
    );

    // Update arrowhead position
    const arrowSize = 6;
    const arrowX = overlayX;
    const arrowY = overlayY + this.overlaySize / 2 + 5;

    this.connectorArrow.x = arrowX;
    this.connectorArrow.y = arrowY + arrowSize;
  }

  /**
   * Clean up and destroy all overlay elements
   */
  destroy() {
    if (this.actualSprite) {
      this.actualSprite.destroy();
      this.actualSprite = null;
    }
    if (this.overlaySprite) {
      this.overlaySprite.destroy();
      this.overlaySprite = null;
    }
    if (this.connectorLine) {
      this.connectorLine.destroy();
      this.connectorLine = null;
    }
    if (this.connectorArrow) {
      this.connectorArrow.destroy();
      this.connectorArrow = null;
    }
    if (this.actualLabel) {
      this.actualLabel.destroy();
      this.actualLabel = null;
    }
    if (this.overlayLabel) {
      this.overlayLabel.destroy();
      this.overlayLabel = null;
    }

    super.destroy();
  }
}
