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
import { ANIMATION_DURATION, COLORS } from '@/utils/Constants.js';

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
  }

  /**
   * Animate separation of two objects
   *
   * CRITICAL: Uses logarithmic scaling via ScaleCalculator.realToScreen()
   *
   * @param {Phaser.GameObjects.Sprite} obj1Sprite - First object sprite
   * @param {Phaser.GameObjects.Sprite} obj2Sprite - Second object sprite
   * @param {number} realDistance - Real distance in meters
   */
  animateSeparation(obj1Sprite, obj2Sprite, realDistance) {
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

    // Animate objects moving apart
    this.scene.tweens.add({
      targets: obj1Sprite,
      x: targetX1,
      duration: ANIMATION_DURATION.DISTANCE,
      ease: 'Quad.easeInOut'
    });

    this.scene.tweens.add({
      targets: obj2Sprite,
      x: targetX2,
      duration: ANIMATION_DURATION.DISTANCE,
      ease: 'Quad.easeInOut',
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
    // Clear references
    this.connectionLine = null;
    this.distanceText = null;

    // Call parent destroy
    super.destroy();
  }
}
