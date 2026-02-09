/**
 * ObjectOverlay - Renders proportionally-sized objects with labels below
 *
 * This component:
 * - Renders the tiny proportional object at its actual position
 * - Creates an upward-pointing arrow below the object
 * - Displays the object name below the arrow
 *
 * This allows accurate proportional visualization while maintaining visibility.
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { PROPORTIONAL_SIZING } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class ObjectOverlay extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    // Configuration (can be overridden via config parameter)
    this.overlayOffsetY = config.overlayOffsetY || PROPORTIONAL_SIZING.OVERLAY_OFFSET_Y;
    this.connectorColor = config.connectorColor || PROPORTIONAL_SIZING.CONNECTOR_COLOR;
    this.arrowSize = config.arrowSize || PROPORTIONAL_SIZING.ARROW_SIZE;
    this.arrowGap = config.arrowGap || PROPORTIONAL_SIZING.ARROW_GAP;
    this.labelOffsetY = config.labelOffsetY || PROPORTIONAL_SIZING.LABEL_OFFSET_Y;

    // Visual elements (created by create() method)
    this.actualSprite = null;      // Tiny proportional object
    this.connectorLine1 = null;    // First line segment (object → arrow tip)
    this.connectorLine2 = null;    // Second line segment (arrow base → label)
    this.connectorArrow = null;    // Arrowhead pointing upward
    this.nameLabel = null;         // Object name text
  }

  /**
   * Create the overlay system with label below
   *
   * @param {number} actualSize - Proportional size in pixels (typically 1-4px)
   * @param {Object} actualPosition - {x, y} position of the actual object
   * @param {string} objectColor - Color as "#RRGGBB"
   * @param {string} objectName - Name for label display
   */
  create(actualSize, actualPosition, objectColor, objectName) {
    const actualRadius = actualSize / 2;
    const x = actualPosition.x;
    const y = actualPosition.y;

    // Calculate vertical positions working downward from actual object
    const objectBottomY = y + actualRadius;
    const line1EndY = objectBottomY + this.arrowGap;      // 5px gap, then arrow tip
    const arrowTipY = line1EndY;
    const arrowBaseY = arrowTipY + this.arrowSize;        // 8px arrow height
    const line2StartY = arrowBaseY;
    const line2EndY = line2StartY + 15;                   // 15px second segment
    const labelY = line2EndY + this.labelOffsetY;         // 15px to label

    // Create tiny actual-size object
    this.actualSprite = this.scene.add.circle(
      x,
      y,
      actualRadius,
      parseHexColor(objectColor)
    );
    this.actualSprite.setAlpha(0);  // Start invisible, will fade in

    // Create first line segment (object bottom → arrow tip)
    this.connectorLine1 = this.scene.add.line(
      0, 0,
      x,
      objectBottomY,     // Start at object bottom
      x,
      line1EndY,         // End at arrow tip
      this.connectorColor
    );
    this.connectorLine1.setLineWidth(2);
    this.connectorLine1.setAlpha(0);  // Start invisible

    // Create arrowhead (upward-pointing triangle with tip at arrowTipY)
    this.connectorArrow = this.scene.add.triangle(
      x,
      arrowTipY,
      0, 0,                              // Apex at top (points toward object)
      -this.arrowSize / 2, this.arrowSize,   // Bottom-left vertex
      this.arrowSize / 2, this.arrowSize,    // Bottom-right vertex
      this.connectorColor
    );
    this.connectorArrow.setOrigin(0, 0);  // Center horizontally, align to top (apex)
    this.connectorArrow.setAlpha(0);  // Start invisible

    // Create second line segment (arrow base → label area)
    this.connectorLine2 = this.scene.add.line(
      0, 0,
      x,
      line2StartY,       // Start at arrow base
      x,
      line2EndY,         // End before label
      this.connectorColor
    );
    this.connectorLine2.setLineWidth(2);
    this.connectorLine2.setAlpha(0);  // Start invisible

    // Create label for object name
    this.nameLabel = this.scene.add.text(
      x,
      labelY,
      objectName,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    );
    this.nameLabel.setOrigin(0.5);
    this.nameLabel.setAlpha(0);  // Start invisible

    // Add all elements to the container
    this.container.add([
      this.connectorLine1,
      this.connectorLine2,
      this.connectorArrow,
      this.actualSprite,
      this.nameLabel
    ]);
  }

  /**
   * Fade in the overlay system
   *
   * @param {number} duration - Fade duration in milliseconds
   * @param {number} delay - Delay before starting fade in milliseconds
   */
  fadeIn(duration = 1000, delay = 0) {
    if (!this.actualSprite) return;

    const targets = [
      this.actualSprite,
      this.connectorLine1,
      this.connectorLine2,
      this.connectorArrow,
      this.nameLabel
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

    const actualRadius = this.actualSprite.radius;

    // Update actual sprite position
    this.actualSprite.x = x;
    this.actualSprite.y = y;

    // Calculate vertical positions working downward from actual object
    const objectBottomY = y + actualRadius;
    const line1EndY = objectBottomY + this.arrowGap;      // 5px gap, then arrow tip
    const arrowTipY = line1EndY;
    const arrowBaseY = arrowTipY + this.arrowSize;        // 8px arrow height
    const line2StartY = arrowBaseY;
    const line2EndY = line2StartY + 15;                   // 15px second segment
    const labelY = line2EndY + this.labelOffsetY;         // 15px to label

    // Update first line segment (object bottom → arrow tip)
    this.connectorLine1.setTo(
      x,
      objectBottomY,     // Start at object bottom
      x,
      line1EndY          // End at arrow tip
    );

    // Update arrowhead position
    this.connectorArrow.x = x;
    this.connectorArrow.y = arrowTipY;

    // Update second line segment (arrow base → label area)
    this.connectorLine2.setTo(
      x,
      line2StartY,       // Start at arrow base
      x,
      line2EndY          // End before label
    );

    // Update label position
    this.nameLabel.x = x;
    this.nameLabel.y = labelY;
  }

  /**
   * Clean up and destroy all overlay elements
   */
  destroy() {
    if (this.actualSprite) {
      this.actualSprite.destroy();
      this.actualSprite = null;
    }
    if (this.connectorLine1) {
      this.connectorLine1.destroy();
      this.connectorLine1 = null;
    }
    if (this.connectorLine2) {
      this.connectorLine2.destroy();
      this.connectorLine2 = null;
    }
    if (this.connectorArrow) {
      this.connectorArrow.destroy();
      this.connectorArrow = null;
    }
    if (this.nameLabel) {
      this.nameLabel.destroy();
      this.nameLabel = null;
    }

    super.destroy();
  }
}
