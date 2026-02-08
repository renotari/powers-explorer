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
    if (!constants || !constants.speedOfLight) {
      console.error('[LightSpeedTraveler] Speed of light constant not found');
      this.speedOfLight = 299792458; // Fallback to standard value
    } else {
      this.speedOfLight = constants.speedOfLight.value;  // 299,792,458 m/s
    }

    // Calculate real travel time
    this.travelTime = realDistance / this.speedOfLight;  // seconds

    console.log(`[LightSpeedTraveler] Real light travel time: ${this.travelTime.toFixed(3)} seconds`);

    // References to visual elements
    this.traveler = null;
    this.timeText = null;
    this.timeLapseIndicator = null;

    // CRITICAL: Track overall progress across speed changes
    // When speed changes, we restart the tween but need to remember overall progress
    this.overallProgress = 0.0;
  }

  /**
   * Draw arrow from start point to current position
   * 
   * @param {number} startX - Arrow start X
   * @param {number} startY - Arrow start Y
   * @param {number} endX - Arrow tip X
   * @param {number} endY - Arrow tip Y
   */
  drawArrow(startX, startY, endX, endY) {
    if (!this.traveler) return;

    // Clear previous drawing
    this.traveler.clear();

    // Calculate arrow angle and length
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Don't draw if length is too short
    if (length < 1) return;

    const angle = Math.atan2(dy, dx);

    // Arrow styling
    const arrowColor = 0xFFFF00;  // Yellow
    const lineWidth = 3;
    const headLength = 12;
    const headWidth = 8;

    // Draw arrow line
    this.traveler.lineStyle(lineWidth, arrowColor, 1);
    this.traveler.beginPath();
    this.traveler.moveTo(startX, startY);
    this.traveler.lineTo(endX, endY);
    this.traveler.strokePath();

    // Draw arrowhead (triangle at tip)
    if (length >= headLength) {
      this.traveler.fillStyle(arrowColor, 1);
      this.traveler.beginPath();
      
      // Arrowhead tip is at (endX, endY)
      this.traveler.moveTo(endX, endY);
      
      // Left point of arrowhead
      const leftX = endX - headLength * Math.cos(angle) - headWidth * Math.sin(angle);
      const leftY = endY - headLength * Math.sin(angle) + headWidth * Math.cos(angle);
      this.traveler.lineTo(leftX, leftY);
      
      // Right point of arrowhead
      const rightX = endX - headLength * Math.cos(angle) + headWidth * Math.sin(angle);
      const rightY = endY - headLength * Math.sin(angle) - headWidth * Math.cos(angle);
      this.traveler.lineTo(rightX, rightY);
      
      this.traveler.closePath();
      this.traveler.fillPath();
    }
  }

  /**
   * Calculate animation duration with manual speedup
   *
   * @param {number} speedupExponent - Speedup exponent (0-20) for 10^exponent multiplier
   */
  calculateAnimationDuration(speedupExponent) {
    console.log('[LightSpeedTraveler] calculateAnimationDuration called with exponent:', speedupExponent);

    const speedupMultiplier = Math.pow(10, speedupExponent);
    const realTimeMs = this.travelTime * 1000;

    // Calculate animation duration with speedup applied
    // Enforce minimum duration of 100ms for visibility
    this.animationDuration = Math.max(
      realTimeMs / speedupMultiplier,
      ANIMATION_DURATION.LIGHT_MIN
    );

    console.log('[LightSpeedTraveler] Calculated values:', {
      speedupExponent,
      speedupMultiplier,
      realTimeMs,
      animationDuration: this.animationDuration
    });

    // Track whether animation is sped up
    this.isTimeLapsed = (speedupMultiplier > 1);
    this.speedMultiplier = speedupMultiplier;

    console.log(`[LightSpeedTraveler] Animation: ${this.animationDuration.toFixed(0)}ms at 10^${speedupExponent}× speedup`);
  }

  /**
   * Start light travel animation
   */
  animate() {
    console.log('[LightSpeedTraveler] animate() called');
    console.log('[LightSpeedTraveler] Using animationDuration:', this.animationDuration);

    // Record start time for measurement
    this.animationStartTime = performance.now();
    console.log('[LightSpeedTraveler] Animation START timestamp:', this.animationStartTime.toFixed(2));

    // Initialize overall progress tracking
    this.overallProgress = 0.0;

    // Create light traveler as a yellow arrow (Graphics object)
    this.traveler = this.scene.add.graphics();
    
    // Initial arrow at start point (zero length)
    this.drawArrow(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);

    this.container.add(this.traveler);

    // Create timer display
    this.createTimerDisplay();

    // Create time-lapse indicator if needed
    if (this.isTimeLapsed) {
      this.createTimeLapseIndicator();
    }

    // Create a dummy object to tween (for arrow tip position)
    this.arrowTipPosition = { x: this.startPoint.x, y: this.startPoint.y };

    // Animate arrow tip moving from start to end
    this.currentTween = this.scene.tweens.add({
      targets: this.arrowTipPosition,
      x: this.endPoint.x,
      y: this.endPoint.y,
      duration: this.animationDuration,
      ease: 'Linear',
      onUpdate: (tween) => {
        // Redraw arrow from start to current tip position
        this.drawArrow(
          this.startPoint.x,
          this.startPoint.y,
          this.arrowTipPosition.x,
          this.arrowTipPosition.y
        );

        // Update timer based on real travel time (not animation time)
        const progress = tween.progress;
        this.overallProgress = progress;  // Track overall progress
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

    // Extract exponent from speed multiplier
    const exponent = Math.round(Math.log10(this.speedMultiplier));

    this.timeLapseIndicator = this.scene.add.text(
      screenWidth / 2,
      screenHeight - 40,
      `(Sped up 10^${exponent}× for viewing)`,
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
   * Adjust animation speed dynamically
   * Stops current tween and restarts from current position with new speed
   *
   * @param {number} speedupExponent - New speedup exponent (0-20)
   */
  adjustSpeed(speedupExponent) {
    if (!this.currentTween || !this.traveler) {
      console.warn('[LightSpeedTraveler] No active animation to adjust');
      return;
    }

    // Get current progress (0.0 to 1.0)
    // CRITICAL: Use overall progress since animation start, not just current tween progress
    const tweenProgress = this.currentTween.progress;
    const currentProgress = this.overallProgress;

    // Stop current tween
    this.currentTween.stop();

    // Calculate new animation parameters
    const speedupMultiplier = Math.pow(10, speedupExponent);
    const realTimeMs = this.travelTime * 1000;

    // Calculate remaining animation time
    const remainingProgress = 1.0 - currentProgress;
    const remainingRealTimeMs = realTimeMs * remainingProgress;
    const remainingAnimationDuration = Math.max(
      remainingRealTimeMs / speedupMultiplier,
      ANIMATION_DURATION.LIGHT_MIN
    );

    // Update stored multiplier
    this.isTimeLapsed = (speedupMultiplier > 1);
    this.speedMultiplier = speedupMultiplier;

    // Update time-lapse indicator if needed
    if (this.timeLapseIndicator) {
      const exponent = Math.round(Math.log10(speedupMultiplier));
      if (speedupMultiplier > 1) {
        this.timeLapseIndicator.setText(`(Sped up 10^${exponent}× for viewing)`);
        this.timeLapseIndicator.setVisible(true);
      } else {
        this.timeLapseIndicator.setVisible(false);
      }
    }

    console.log(`[LightSpeedTraveler] Speed adjusted to 10^${speedupExponent}×, remaining: ${remainingAnimationDuration.toFixed(0)}ms`);

    // Calculate and store the progress at the moment of speed change
    const progressAtSpeedChange = currentProgress;

    // Start new tween from current position
    this.currentTween = this.scene.tweens.add({
      targets: this.arrowTipPosition,
      x: this.endPoint.x,
      y: this.endPoint.y,
      duration: remainingAnimationDuration,
      ease: 'Linear',
      onUpdate: (tween) => {
        // Redraw arrow from start to current tip position
        this.drawArrow(
          this.startPoint.x,
          this.startPoint.y,
          this.arrowTipPosition.x,
          this.arrowTipPosition.y
        );

        // Calculate overall progress including progress before speed change
        const newProgress = progressAtSpeedChange + (remainingProgress * tween.progress);
        this.overallProgress = newProgress;  // Store for next speed change
        const elapsedRealTime = this.travelTime * newProgress;
        this.updateTimeDisplay(elapsedRealTime);
      },
      onComplete: () => {
        this.onTravelComplete();
      }
    });
  }

  /**
   * Called when travel animation completes
   */
  onTravelComplete() {
    // Measure actual elapsed time
    const animationEndTime = performance.now();
    const actualDuration = animationEndTime - this.animationStartTime;

    console.log('[LightSpeedTraveler] Animation END timestamp:', animationEndTime.toFixed(2));
    console.log('[LightSpeedTraveler] ACTUAL animation duration:', actualDuration.toFixed(2), 'ms');
    console.log('[LightSpeedTraveler] EXPECTED animation duration:', this.animationDuration, 'ms');
    console.log('[LightSpeedTraveler] DIFFERENCE:', (actualDuration - this.animationDuration).toFixed(2), 'ms');

    this.currentTween = null;  // Clear reference

    console.log('[LightSpeedTraveler] Travel complete');

    // Make arrow flash/pulse by redrawing with alpha changes
    let flashCount = 0;
    const flashInterval = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        if (this.traveler) {
          // Alternate between full opacity and reduced opacity
          const alpha = (flashCount % 2 === 0) ? 0.3 : 1.0;
          this.traveler.clear();
          
          // Redraw arrow with current alpha
          this.traveler.lineStyle(3, 0xFFFF00, alpha);
          this.traveler.beginPath();
          this.traveler.moveTo(this.startPoint.x, this.startPoint.y);
          this.traveler.lineTo(this.endPoint.x, this.endPoint.y);
          this.traveler.strokePath();
          
          // Redraw arrowhead
          const dx = this.endPoint.x - this.startPoint.x;
          const dy = this.endPoint.y - this.startPoint.y;
          const angle = Math.atan2(dy, dx);
          const headLength = 12;
          const headWidth = 8;
          
          this.traveler.fillStyle(0xFFFF00, alpha);
          this.traveler.beginPath();
          this.traveler.moveTo(this.endPoint.x, this.endPoint.y);
          const leftX = this.endPoint.x - headLength * Math.cos(angle) - headWidth * Math.sin(angle);
          const leftY = this.endPoint.y - headLength * Math.sin(angle) + headWidth * Math.cos(angle);
          this.traveler.lineTo(leftX, leftY);
          const rightX = this.endPoint.x - headLength * Math.cos(angle) + headWidth * Math.sin(angle);
          const rightY = this.endPoint.y - headLength * Math.sin(angle) - headWidth * Math.cos(angle);
          this.traveler.lineTo(rightX, rightY);
          this.traveler.closePath();
          this.traveler.fillPath();
        }
        
        flashCount++;
        if (flashCount >= 6) {
          flashInterval.remove();
        }
      },
      repeat: 5
    });

    // Emit completion event
    this.emit('travelComplete');
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Stop current tween if active
    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }

    // Kill any active tweens
    if (this.scene && this.scene.tweens) {
      if (this.arrowTipPosition) {
        this.scene.tweens.killTweensOf(this.arrowTipPosition);
      }
      if (this.timeLapseIndicator) {
        this.scene.tweens.killTweensOf(this.timeLapseIndicator);
      }
    }

    // Clear references
    this.traveler = null;
    this.arrowTipPosition = null;
    this.timeText = null;
    this.timeLapseIndicator = null;

    // Call parent destroy
    super.destroy();
  }
}
