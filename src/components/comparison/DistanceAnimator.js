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
import { I18nManager } from '@/managers/I18nManager.js';
import { ANIMATION_DURATION, COLORS, PROPORTIONAL_SIZING } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';
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
    this.overlayData = null;  // Stored overlay parameters for delayed creation
    this.obj1Size = null;  // Calculated proportional size for object 1
    this.obj2Size = null;  // Calculated proportional size for object 2
    this.targetX1 = null;  // Target position for object 1
    this.targetX2 = null;  // Target position for object 2
    this.targetY = null;   // Vertical center position
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

    // Store target positions for getConnectionEndpoints()
    this.targetX1 = targetX1;
    this.targetX2 = targetX2;
    this.targetY = centerY;

    // Create connection line using Graphics with absolute world coordinates
    // This uses the SAME coordinate system as the light animation (proven to work)
    this.connectionLine = this.scene.add.graphics();
    this.connectionLine.lineStyle(2, parseHexColor(COLORS.TEXT), 0.5);
    this.connectionLine.lineBetween(targetX1, centerY, targetX2, centerY);
    this.connectionLine.setAlpha(0);  // Start invisible

    this.container.add(this.connectionLine);

    // Create distance text
    this.distanceText = this.scene.add.text(
      centerX,
      centerY + 120,
      I18nManager.getInstance().t('comparison.distancePrefix', { value: ScaleCalculator.formatScale(realDistance) }),
      {
        fontSize: '27px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        backgroundColor: '#000000',
        padding: { x: 15, y: 8 }
      }
    ).setOrigin(0.5).setAlpha(0);

    this.container.add(this.distanceText);

    // Store overlay creation data for after animation completes
    // Overlays will be created AFTER sprites finish animating
    this.overlayData = {
      obj1: { size: this.obj1Size, position: { x: targetX1, y: centerY }, color: obj1Data.color, name: obj1Data.name },
      obj2: { size: this.obj2Size, position: { x: targetX2, y: centerY }, color: obj2Data.color, name: obj2Data.name }
    };

    console.log(`[DistanceAnimator] Animating visible sprites, overlays will appear after animation`);

    // Animate objects moving apart AND resizing proportionally
    // CRITICAL: Sprites remain VISIBLE during animation so users see the resize
    // Calculate scale factors for smooth resize (radius is read-only, must use scale)
    const obj1CurrentRadius = obj1Sprite.radius;
    const obj1TargetRadius = this.obj1Size / 2;
    const obj1ScaleFactor = obj1TargetRadius / obj1CurrentRadius;

    this.scene.tweens.add({
      targets: obj1Sprite,
      x: targetX1,
      scale: obj1ScaleFactor,  // Animate resize on VISIBLE sprite
      duration: ANIMATION_DURATION.DISTANCE,
      ease: 'Quad.easeInOut'
    });

    const obj2CurrentRadius = obj2Sprite.radius;
    const obj2TargetRadius = this.obj2Size / 2;
    const obj2ScaleFactor = obj2TargetRadius / obj2CurrentRadius;

    this.scene.tweens.add({
      targets: obj2Sprite,
      x: targetX2,
      scale: obj2ScaleFactor,  // Animate resize on VISIBLE sprite
      duration: ANIMATION_DURATION.DISTANCE,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // After animation completes, swap to overlay system
        this.swapToOverlays(obj1Sprite, obj2Sprite);
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
   * Swap from animated sprites to overlay system
   * Called after distance animation completes
   *
   * @param {Phaser.GameObjects.Arc} obj1Sprite - First object sprite
   * @param {Phaser.GameObjects.Arc} obj2Sprite - Second object sprite
   */
  swapToOverlays(obj1Sprite, obj2Sprite) {
    console.log('[DistanceAnimator] Swapping to overlay system');

    // Hide the original sprites
    obj1Sprite.setAlpha(0);
    obj2Sprite.setAlpha(0);

    // Create overlays at final positions/sizes
    console.log(`[DistanceAnimator] Creating overlay for ${this.overlayData.obj1.name} (${this.overlayData.obj1.size.toFixed(2)}px)`);
    this.overlay1 = new ObjectOverlay(this.scene);
    this.overlay1.create(
      this.overlayData.obj1.size,
      this.overlayData.obj1.position,
      this.overlayData.obj1.color,
      this.overlayData.obj1.name
    );
    this.container.add(this.overlay1.container);

    console.log(`[DistanceAnimator] Creating overlay for ${this.overlayData.obj2.name} (${this.overlayData.obj2.size.toFixed(2)}px)`);
    this.overlay2 = new ObjectOverlay(this.scene);
    this.overlay2.create(
      this.overlayData.obj2.size,
      this.overlayData.obj2.position,
      this.overlayData.obj2.color,
      this.overlayData.obj2.name
    );
    this.container.add(this.overlay2.container);

    // Fade in overlays immediately (300ms fade, no delay)
    this.overlay1.fadeIn(300, 0);
    this.overlay2.fadeIn(300, 0);
  }

  /**
   * Get connection line endpoints
   * Used for light travel animation
   *
   * @returns {Object|null} Line endpoints {x1, y1, x2, y2}
   */
  getConnectionEndpoints() {
    if (!this.connectionLine || this.targetX1 === undefined) {
      return null;
    }

    // Return stored target positions (world coordinates)
    return {
      x1: this.targetX1,
      y1: this.targetY,
      x2: this.targetX2,
      y2: this.targetY
    };
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Kill any active tweens on overlays
    if (this.scene && this.scene.tweens) {
      if (this.overlay1) {
        this.scene.tweens.killTweensOf(this.overlay1);
      }
      if (this.overlay2) {
        this.scene.tweens.killTweensOf(this.overlay2);
      }
    }

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
    this.overlayData = null;
    this.obj1Size = null;
    this.obj2Size = null;
    this.targetX1 = null;
    this.targetX2 = null;
    this.targetY = null;

    // Call parent destroy
    super.destroy();
  }
}
