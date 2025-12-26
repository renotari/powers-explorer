/**
 * LightSpeedTraveler - Animate light traveling between objects
 *
 * CRITICAL: Caps animation at 10s for UX, shows time-lapse for long distances
 * Real light travel can be years - we time-lapse it for viewing
 *
 * Features:
 * - Animates light particle from object 1 to object 2
 * - Displays real-time travel timer
 * - Shows time-lapse indicator if animation is sped up
 * - Uses actual speed of light for calculations
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { DataManager } from '@/managers/DataManager.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { ANIMATION_DURATION, COLORS } from '@/utils/Constants.js';

export class LightSpeedTraveler extends ComponentBase {
  /**
   * Constructor
   *
   * @param {Phaser.Scene} scene - Parent scene
   * @param {Object} startPoint - Start position {x, y}
   * @param {Object} endPoint - End position {x, y}
   * @param {number} realDistance - Real distance in meters
   */
  constructor(scene, startPoint, endPoint, realDistance) {
    super(scene);

    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.realDistance = realDistance;

    // Get speed of light from constants
    const constants = DataManager.getInstance().getConstants();
    this.speedOfLight = constants.speedOfLight.value;  // 299,792,458 m/s

    // Calculate real travel time
    this.travelTime = realDistance / this.speedOfLight;  // seconds

    console.log(`[LightSpeedTraveler] Real light travel time: ${this.travelTime.toFixed(3)} seconds`);

    // Calculate animation duration with time-lapse
    this.calculateAnimationDuration();

    // References to visual elements
    this.traveler = null;
    this.timeText = null;
    this.timeLapseIndicator = null;
  }

  /**
   * Calculate animation duration with UX optimization
   *
   * CRITICAL: Cap at 10s for optimal user experience
   * Real travel time for distant objects can be years!
   */
  calculateAnimationDuration() {
    const realTimeMs = this.travelTime * 1000;

    // Cap animation duration at 10 seconds for UX
    this.animationDuration = Math.min(realTimeMs, ANIMATION_DURATION.LIGHT_MAX);

    if (realTimeMs > ANIMATION_DURATION.LIGHT_MAX) {
      // Animation is time-lapsed
      this.isTimeLapsed = true;
      this.speedMultiplier = realTimeMs / ANIMATION_DURATION.LIGHT_MAX;

      console.log(`[LightSpeedTraveler] Time-lapsed ${this.speedMultiplier.toFixed(1)}× for UX`);
    } else {
      // Animation plays at real speed
      this.isTimeLapsed = false;
      this.speedMultiplier = 1;

      console.log('[LightSpeedTraveler] Playing at real speed');
    }
  }

  /**
   * Start light travel animation
   */
  animate() {
    console.log('[LightSpeedTraveler] Starting animation...');

    // Create light traveler sprite (bright white circle)
    this.traveler = this.scene.add.circle(
      this.startPoint.x,
      this.startPoint.y,
      6,  // radius
      0xFFFFFF  // white
    );

    // Add glow effect
    this.traveler.setBlendMode(Phaser.BlendModes.ADD);

    this.container.add(this.traveler);

    // Create timer display
    this.createTimerDisplay();

    // Create time-lapse indicator if needed
    if (this.isTimeLapsed) {
      this.createTimeLapseIndicator();
    }

    // Animate light particle moving from start to end
    this.scene.tweens.add({
      targets: this.traveler,
      x: this.endPoint.x,
      y: this.endPoint.y,
      duration: this.animationDuration,
      ease: 'Linear',
      onUpdate: (tween) => {
        // Update timer based on real travel time (not animation time)
        const progress = tween.progress;
        const elapsedRealTime = this.travelTime * progress;
        this.updateTimeDisplay(elapsedRealTime);
      },
      onComplete: () => {
        this.onTravelComplete();
      }
    });
  }

  /**
   * Create timer display
   */
  createTimerDisplay() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // Timer label
    const label = this.scene.add.text(
      screenWidth / 2,
      screenHeight - 100,
      'Light Travel Time:',
      {
        fontSize: '16px',
        color: '#cccccc',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Timer value (starts at 0)
    this.timeText = this.scene.add.text(
      screenWidth / 2,
      screenHeight - 70,
      '0.000 seconds',
      {
        fontSize: '24px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 15, y: 8 }
      }
    ).setOrigin(0.5);

    this.container.add([label, this.timeText]);
  }

  /**
   * Create time-lapse indicator
   */
  createTimeLapseIndicator() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    this.timeLapseIndicator = this.scene.add.text(
      screenWidth / 2,
      screenHeight - 40,
      `(Time-lapsed ${this.speedMultiplier.toFixed(1)}× for viewing)`,
      {
        fontSize: '12px',
        color: '#ffaa00',
        fontFamily: 'Arial',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5);

    this.container.add(this.timeLapseIndicator);
  }

  /**
   * Update timer display
   *
   * @param {number} seconds - Elapsed time in seconds
   */
  updateTimeDisplay(seconds) {
    const formatted = ScaleCalculator.formatTime(seconds);
    this.timeText.setText(formatted);
  }

  /**
   * Called when travel animation completes
   */
  onTravelComplete() {
    console.log('[LightSpeedTraveler] Travel complete');

    // Make light traveler pulse
    this.scene.tweens.add({
      targets: this.traveler,
      scale: 1.5,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: 2
    });

    // Emit completion event
    this.emit('travelComplete');
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Clear references
    this.traveler = null;
    this.timeText = null;
    this.timeLapseIndicator = null;

    // Call parent destroy
    super.destroy();
  }
}
