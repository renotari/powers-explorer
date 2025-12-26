/**
 * DistanceAnimator - Animate objects separating to show distance
 *
 * CRITICAL: Uses logarithmic scaling for astronomical distances
 * Linear scaling would require screens millions of pixels wide!
 *
 * Animates two sprites moving apart to their real scaled distance
 * Draws connection line between objects
 * Displays distance measurement
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { ANIMATION_DURATION, COLORS, PROPORTIONAL_SIZING } from '@/utils/Constants.js';
import { ObjectOverlay } from './ObjectOverlay.js';

export class DistanceAnimator extends ComponentBase {
  /**
   * Constructor
   *
   * @param {Phaser.Scene} scene - Parent scene
   * @param {Object} config - Configuration
   */
  constructor(scene, config = {}) {
    super(scene, config);

    this.connectionLine = null;
    this.distanceText = null;
    this.overlay1 = null;  // Overlay for object 1 (if needed)
    this.overlay2 = null;  // Overlay for object 2 (if needed)
    this.obj1Size = null;  // Calculated proportional size for object 1
    this.obj2Size = null;  // Calculated proportional size for object 2
  }

  /**
   * Animate separation of two objects
   *
   * CRITICAL: Uses logarithmic scaling via ScaleCalculator.realToScreen()
   * NEW: Also resizes objects proportionally to distance
   *
   * @param {Phaser.GameObjects.Sprite} obj1Sprite - First object sprite
   * @param {Phaser.GameObjects.Sprite} obj2Sprite - Second object sprite
   * @param {number} realDistance - Real distance in meters
   * @param {Object} obj1Data - First object data (diameter, color, name)
   * @param {Object} obj2Data - Second object data (diameter, color, name)
   */
  animateSeparation(obj1Sprite, obj2Sprite, realDistance, obj1Data, obj2Data) {
    console.log(`[DistanceAnimator] Animating separation: ${realDistance} meters`);

    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // CRITICAL: Use logarithmic scaling for astronomical distances
    // Linear scaling would require impossibly large screens!
    const screenDistance = ScaleCalculator.realToScreen(
      realDistance,
      realDistance,  // max = current distance for this comparison
      screenWidth * 0.7  // Use 70% of screen width
    );

    console.log(`[DistanceAnimator] Screen distance: ${screenDistance.toFixed(2)}px`);

    // Calculate proportional sizes for objects
    this.obj1Size = ScaleCalculator.calculateProportionalSize(
      obj1Data.diameter,
      realDistance,
      screenWidth
    );
    this.obj2Size = ScaleCalculator.calculateProportionalSize(
      obj2Data.diameter,
      realDistance,
      screenWidth
    );

    console.log(`[DistanceAnimator] Proportional sizes: obj1=${this.obj1Size.toFixed(2)}px, obj2=${this.obj2Size.toFixed(2)}px`);

    // Calculate target positions (center ± half distance)
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const targetX1 = centerX - screenDistance / 2;
    const targetX2 = centerX + screenDistance / 2;

    // Create connection line (initially invisible)
    this.connectionLine = this.scene.add.line(
      0, 0,
      targetX1, centerY,
      targetX2, centerY,
      parseInt(COLORS.TEXT.replace('#', '0x')),
      0.5
    );
    this.connectionLine.setLineWidth(2);
    this.connectionLine.setAlpha(0);  // Start invisible

    this.container.add(this.connectionLine);

    // Create distance text
    this.distanceText = this.scene.add.text(
      centerX,
      centerY + 80,
      `Distance: ${ScaleCalculator.formatScale(realDistance)}`,
      {
        fontSize: '18px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setAlpha(0);

    this.container.add(this.distanceText);

    // Create overlays if objects are too small (< 5px)
    if (this.obj1Size < PROPORTIONAL_SIZING.OVERLAY_THRESHOLD) {
      console.log(`[DistanceAnimator] Creating overlay for ${obj1Data.name} (${this.obj1Size.toFixed(2)}px)`);
      this.overlay1 = new ObjectOverlay(this.scene);
      this.overlay1.create(
        this.obj1Size,
        { x: targetX1, y: centerY },
        obj1Data.color,
        obj1Data.name
      );
      this.container.add(this.overlay1.container);
    }

    if (this.obj2Size < PROPORTIONAL_SIZING.OVERLAY_THRESHOLD) {
      console.log(`[DistanceAnimator] Creating overlay for ${obj2Data.name} (${this.obj2Size.toFixed(2)}px)`);
      this.overlay2 = new ObjectOverlay(this.scene);
      this.overlay2.create(
        this.obj2Size,
        { x: targetX2, y: centerY },
        obj2Data.color,
        obj2Data.name
      );
      this.container.add(this.overlay2.container);
    }

    // Animate objects moving apart AND resizing proportionally
    this.scene.tweens.add({
      targets: obj1Sprite,
      x: targetX1,
      radius: this.obj1Size / 2,  // Resize to proportional size
      duration: ANIMATION_DURATION.DISTANCE,
      ease: 'Quad.easeInOut',
      onUpdate: (tween, target) => {
        // Update overlay position during animation
        if (this.overlay1) {
          this.overlay1.updatePosition(target.x, target.y);
        }
      }
    });

    this.scene.tweens.add({
      targets: obj2Sprite,
      x: targetX2,
      radius: this.obj2Size / 2,  // Resize to proportional size
      duration: ANIMATION_DURATION.DISTANCE,
      ease: 'Quad.easeInOut',
      onUpdate: (tween, target) => {
        // Update overlay position during animation
        if (this.overlay2) {
          this.overlay2.updatePosition(target.x, target.y);
        }
      },
      onComplete: () => {
        this.onSeparationComplete();
      }
    });

    // Fade in connection line and distance text
    this.scene.tweens.add({
      targets: [this.connectionLine, this.distanceText],
      alpha: 1,
      duration: ANIMATION_DURATION.DISTANCE / 2,
      delay: ANIMATION_DURATION.DISTANCE / 2,
      ease: 'Linear'
    });

    // Fade in overlays if they exist
    if (this.overlay1) {
      this.overlay1.fadeIn(ANIMATION_DURATION.DISTANCE / 2, ANIMATION_DURATION.DISTANCE / 2);
    }
    if (this.overlay2) {
      this.overlay2.fadeIn(ANIMATION_DURATION.DISTANCE / 2, ANIMATION_DURATION.DISTANCE / 2);
    }
  }

  /**
   * Called when separation animation completes
   */
  onSeparationComplete() {
    console.log('[DistanceAnimator] Separation complete');
    this.emit('separationComplete');
  }

  /**
   * Get connection line endpoints
   * Used for light travel animation
   *
   * @returns {Object|null} Line endpoints {x1, y1, x2, y2}
   */
  getConnectionEndpoints() {
    if (!this.connectionLine) {
      return null;
    }

    return {
      x1: this.connectionLine.geom.x1,
      y1: this.connectionLine.geom.y1,
      x2: this.connectionLine.geom.x2,
      y2: this.connectionLine.geom.y2
    };
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Destroy overlays
    if (this.overlay1) {
      this.overlay1.destroy();
      this.overlay1 = null;
    }
    if (this.overlay2) {
      this.overlay2.destroy();
      this.overlay2 = null;
    }

    // Clear references
    this.connectionLine = null;
    this.distanceText = null;
    this.obj1Size = null;
    this.obj2Size = null;

    // Call parent destroy
    super.destroy();
  }
}
