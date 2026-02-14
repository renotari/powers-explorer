/**
 * CosmicComparisonScene - Orchestrates cosmic object comparison workflow
 *
 * CRITICAL: Implements state machine for comparison workflow:
 * OBJECT_SELECTION → SCALE_DISPLAY → DISTANCE_ANIMATION → LIGHT_TRAVEL → Reset
 *
 * Components used:
 * - ObjectSelector: Choose 2 objects
 * - ScaleDisplay: Show relative sizes
 * - DistanceAnimator: Separate objects to show distance
 * - LightSpeedTraveler: Animate light traveling between objects
 */

import Phaser from 'phaser';
import { StateManager } from '@/managers/StateManager.js';
import { DataManager } from '@/managers/DataManager.js';
import { ObjectSelector } from '@/components/comparison/ObjectSelector.js';
import { ScaleDisplay } from '@/components/comparison/ScaleDisplay.js';
import { DistanceAnimator } from '@/components/comparison/DistanceAnimator.js';
import { LightSpeedTraveler } from '@/components/comparison/LightSpeedTraveler.js';
import { SpeedupControl } from '@/components/comparison/SpeedupControl.js';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/utils/Constants.js';
import { I18nManager } from '@/managers/I18nManager.js';
import { Button } from '@/components/ui/Button.js';

export class CosmicComparisonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CosmicComparisonScene' });
  }

  create() {
    console.log('[CosmicComparisonScene] Creating scene...');

    // Get manager references
    this.stateManager = StateManager.getInstance();
    this.dataManager = DataManager.getInstance();

    // CRITICAL: Register cleanup on shutdown to prevent memory leaks
    this.events.on('shutdown', this.cleanup, this);

    // Initialize components
    this.initializeComponents();

    // Register event listeners
    this.registerEventListeners();

    // Start in object selection phase
    this.enterObjectSelectionPhase();

    console.log('[CosmicComparisonScene] Scene created successfully');
  }

  /**
   * Initialize all components
   */
  initializeComponents() {
    // Object selector (shown at start)
    this.objectSelector = new ObjectSelector(this, GAME_WIDTH / 2, 225);

    // Scale display (hidden initially)
    this.scaleDisplay = new ScaleDisplay(this);
    this.scaleDisplay.hide();

    // Speedup control
    this.speedupControl = new SpeedupControl(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 4 * 3 // Position at bottom center 
    );
    this.speedupControl.on('speedupChanged', this.onSpeedupChanged, this);
    this.speedupControl.hide();

    // Distance animator and light traveler will be created on-demand
    this.distanceAnimator = null;
    this.lightTraveler = null;

    // Track selected object IDs
    this.selectedIds = null;
  }

  /**
   * Register event listeners for components
   */
  registerEventListeners() {
    // Listen for object selection completion
    this.objectSelector.on('selectionComplete', this.onSelectionComplete, this);

    console.log('[CosmicComparisonScene] Event listeners registered');
  }

  // ========================================
  // State Machine: Phase Methods
  // ========================================

  /**
   * Phase 1: Object Selection
   * User selects 2 objects from library
   */
  enterObjectSelectionPhase() {
    console.log('[CosmicComparisonScene] Entering OBJECT_SELECTION phase');

    this.stateManager.setComparisonPhase('selection');

    // Show object selector
    this.objectSelector.show();

    // Hide other components
    this.scaleDisplay.hide();

    // Clean up previous distance animator and light traveler if they exist
    if (this.distanceAnimator) {
      this.distanceAnimator.destroy();
      this.distanceAnimator = null;
    }
    if (this.lightTraveler) {
      this.lightTraveler.destroy();
      this.lightTraveler = null;
    }
  }

  /**
   * Phase 2: Scale Display
   * Show objects at accurate relative scale
   */
  enterScaleDisplayPhase() {
    console.log('[CosmicComparisonScene] Entering SCALE_DISPLAY phase');

    this.stateManager.setComparisonPhase('scaleDisplay');

    // Hide object selector
    this.objectSelector.hide();

    // Display objects at relative scale
    this.scaleDisplay.show();
    this.scaleDisplay.displayObjects(this.selectedIds[0], this.selectedIds[1]);

    // Create "Show Distance" button
    this.createDistanceButton();
  }

  /**
   * Phase 3: Distance Animation
   * Animate objects separating to show real distance
   */
  enterDistanceAnimationPhase() {
    console.log('[CosmicComparisonScene] Entering DISTANCE_ANIMATION phase');

    this.stateManager.setComparisonPhase('distanceAnimation');

    // Get distance data
    const distanceData = this.dataManager.getDistance(
      this.selectedIds[0],
      this.selectedIds[1]
    );

    if (!distanceData) {
      console.warn('[CosmicComparisonScene] No distance data found for these objects');
      this.showNoDistanceMessage();
      return;
    }

    console.log(`[CosmicComparisonScene] Distance: ${distanceData.distance} ${distanceData.unit}`);

    // Get object sprites from scale display
    const sprites = this.scaleDisplay.getSprites();

    // Null guard: ensure sprites are available
    if (!sprites || !sprites.obj1Sprite || !sprites.obj2Sprite) {
      console.error('[CosmicComparisonScene] Scale display sprites not available');
      this.showNoDistanceMessage();
      return;
    }

    // Create distance animator
    this.distanceAnimator = new DistanceAnimator(this);
    this.distanceAnimator.on('separationComplete', this.onDistanceComplete, this);

    // Animate separation with proportional sizing
    // Pass object data for size calculation and overlay creation
    this.distanceAnimator.animateSeparation(
      sprites.obj1Sprite,
      sprites.obj2Sprite,
      distanceData.distance,
      this.scaleDisplay.obj1Data,  // Object 1 data (diameter, color, name)
      this.scaleDisplay.obj2Data   // Object 2 data (diameter, color, name)
    );
  }

  /**
   * Phase 4: Light Travel
   * Animate light traveling between objects with timer
   */
  enterLightTravelPhase() {
    console.log('[CosmicComparisonScene] Entering LIGHT_TRAVEL phase');

    this.stateManager.setComparisonPhase('lightTravel');

    // Get distance data
    const distanceData = this.dataManager.getDistance(
      this.selectedIds[0],
      this.selectedIds[1]
    );

    // Get object sprite positions
    const sprites = this.scaleDisplay.getSprites();

    const startPoint = {
      x: sprites.obj1Sprite.x,
      y: sprites.obj1Sprite.y
    };

    const endPoint = {
      x: sprites.obj2Sprite.x,
      y: sprites.obj2Sprite.y
    };

    // Create light speed traveler
    this.lightTraveler = new LightSpeedTraveler(
      this,
      startPoint,
      endPoint,
      distanceData.distance
    );

    // Calculate animation duration with current speedup
    this.lightTraveler.calculateAnimationDuration(this.speedupControl.getExponent());

    this.lightTraveler.on('travelComplete', this.onLightTravelComplete, this);

    // Create Start button instead of auto-starting
    this.createStartRestartButton(true);
  }

  // ========================================
  // Event Handlers
  // ========================================

  /**
   * Handle object selection completion
   * @param {Array<string>} selectedIds - Array of selected object IDs
   */
  onSelectionComplete(selectedIds) {
    console.log('[CosmicComparisonScene] Selection complete:', selectedIds);

    this.selectedIds = selectedIds;

    try {
      // Transition to scale display phase
      this.enterScaleDisplayPhase();
    } catch (error) {
      console.error('[CosmicComparisonScene] Failed to enter scale display phase:', error);
    }
  }

  /**
   * Handle distance animation completion
   */
  onDistanceComplete() {
    console.log('[CosmicComparisonScene] Distance animation complete');

    try {
      // Transition to light travel phase
      this.enterLightTravelPhase();
    } catch (error) {
      console.error('[CosmicComparisonScene] Failed to enter light travel phase:', error);
    }
  }

  /**
   * Handle light travel completion
   */
  onLightTravelComplete() {
    console.log('[CosmicComparisonScene] Light travel complete');

    this.speedupControl.hide();

    // Show "Restart" button
    this.createStartRestartButton(false);

    // Show "New Comparison" button
    // this.createNewComparisonButton();
  }

  /**
   * Handle speedup change from control
   * @param {number} exponent - New speedup exponent
   */
  onSpeedupChanged(exponent) {
    // If animation is active, adjust it dynamically
    if (this.lightTraveler && this.lightTraveler.currentTween) {
      this.lightTraveler.adjustSpeed(exponent);
    }

    console.log(`[CosmicComparisonScene] Speedup changed to 10^${exponent}×`);
  }

  // ========================================
  // UI Creation Methods
  // ========================================

  /**
   * Create "Show Distance" button
   */
  createDistanceButton() {
    const t = (key, params) => I18nManager.getInstance().t(key, params);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const buttonY = height - 120;

    // Create Show Distance button
    this.distanceButton = new Button(this, width / 2, buttonY, {
      text: t('comparison.showDistance'),
      width: 300,
      height: 75,
      fontSize: '30px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT,
      hoverScale: 1.1
    });

    this.distanceButton.on('clicked', () => {
      // Destroy button
      this.distanceButton.off('clicked');
      this.distanceButton.destroy();
      this.distanceButton = null;

      // Enter distance animation phase
      this.enterDistanceAnimationPhase();
    });
  }

  /**
   * Create "New Comparison" button
   */
  createNewComparisonButton() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const buttonY = height - 225;

    // Create New Comparison button
    this.newComparisonButton = new Button(this, width / 2, buttonY, {
      text: I18nManager.getInstance().t('comparison.newComparison'),
      width: 300,
      height: 75,
      fontSize: '30px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT,
      hoverScale: 1.1
    });

    this.newComparisonButton.on('clicked', () => {
      // Destroy button
      this.newComparisonButton.off('clicked');
      this.newComparisonButton.destroy();
      this.newComparisonButton = null;

      // Reset and start over
      this.reset();
    });
  }

  /**
   * Create Start/Restart button for light travel animation
   * @param {boolean} isStart - true for Start, false for Restart
   */
  createStartRestartButton(isStart) {
    const t = (key, params) => I18nManager.getInstance().t(key, params);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Position above speedup control (which is at height - 150)
    const buttonY = height - 300;

    const label = isStart ? t('comparison.startLightTravel') : t('comparison.restart');

    // Create Start/Restart button
    this.startRestartButton = new Button(this, width / 2, buttonY, {
      text: label,
      width: 300,
      height: 75,
      fontSize: '30px',
      backgroundColor: COLORS.PRIMARY,
      textColor: COLORS.TEXT,
      hoverScale: 1.1
    });

    this.startRestartButton.on('clicked', () => {
      if (isStart) {
        // Hide button and start animation
        this.hideStartRestartButton();
        this.lightTraveler.animate();
      } else {
        // Restart: reset speedup and replay animation
        this.restartLightAnimation();
      }
      this.speedupControl.show();
    });
  }

  /**
   * Hide Start/Restart button
   */
  hideStartRestartButton() {
    if (this.startRestartButton) {
      this.startRestartButton.container.setVisible(false);
    }
  }

  /**
   * Restart light animation from beginning with speedup reset to 1×
   */
  restartLightAnimation() {
    console.log('[CosmicComparisonScene] Restarting light animation...');

    // Hide button during animation
    this.hideStartRestartButton();

    // Reset speedup control to 10^0 (1× Real Time)
    this.speedupControl.setExponent(0);

    // Destroy existing light traveler
    if (this.lightTraveler) {
      this.lightTraveler.off('travelComplete', this.onLightTravelComplete, this);
      this.lightTraveler.destroy();
    }

    // Get distance data
    const distanceData = this.dataManager.getDistance(
      this.selectedIds[0],
      this.selectedIds[1]
    );

    // Get object sprite positions
    const sprites = this.scaleDisplay.getSprites();
    const startPoint = {
      x: sprites.obj1Sprite.x,
      y: sprites.obj1Sprite.y
    };
    const endPoint = {
      x: sprites.obj2Sprite.x,
      y: sprites.obj2Sprite.y
    };

    // Recreate light traveler
    this.lightTraveler = new LightSpeedTraveler(
      this,
      startPoint,
      endPoint,
      distanceData.distance
    );

    // Calculate duration with reset speedup (0)
    this.lightTraveler.calculateAnimationDuration(0);

    // Register event listener
    this.lightTraveler.on('travelComplete', this.onLightTravelComplete, this);

    // Start animation
    this.lightTraveler.animate();
  }

  /**
   * Show message when no distance data is available
   */
  showNoDistanceMessage() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const message = this.add.text(
      width / 2,
      height / 2,
      I18nManager.getInstance().t('comparison.noDistanceData'),
      {
        fontSize: '30px',
        color: '#ffaa00',
        fontFamily: 'Arial',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 30, y: 15 }
      }
    ).setOrigin(0.5);

    // Fade out after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: message,
        alpha: 0,
        duration: 500,
        onComplete: () => message.destroy()
      });
    });

    // Show new comparison button
    this.createNewComparisonButton();
  }

  /**
   * Reset scene to initial state
   */
  reset() {
    console.log('[CosmicComparisonScene] Resetting scene...');

    // Destroy components
    this.scaleDisplay.destroy();
    if (this.distanceAnimator) {
      this.distanceAnimator.destroy();
      this.distanceAnimator = null;
    }
    if (this.lightTraveler) {
      this.lightTraveler.destroy();
      this.lightTraveler = null;
    }

    // Recreate scale display
    this.scaleDisplay = new ScaleDisplay(this);
    this.scaleDisplay.hide();

    // Reset speedup control to default (1× real time)
    this.speedupControl.setExponent(0);
    this.speedupControl.setEnabled(true);

    // Destroy start/restart button
    if (this.startRestartButton) {
      this.startRestartButton.off('clicked');
      this.startRestartButton.destroy();
      this.startRestartButton = null;
    }

    // Clear selection
    this.selectedIds = null;
    this.objectSelector.clearSelection();

    // Return to object selection phase
    this.enterObjectSelectionPhase();

    console.log('[CosmicComparisonScene] Reset complete');
  }

  /**
   * Cleanup event listeners and components
   *
   * CRITICAL: Called on scene shutdown to prevent memory leaks
   */
  cleanup() {
    console.log('[CosmicComparisonScene] Cleaning up...');

    // Remove event listeners
    this.objectSelector.off('selectionComplete', this.onSelectionComplete, this);

    if (this.distanceAnimator) {
      this.distanceAnimator.off('separationComplete', this.onDistanceComplete, this);
    }

    if (this.lightTraveler) {
      this.lightTraveler.off('travelComplete', this.onLightTravelComplete, this);
    }

    if (this.speedupControl) {
      this.speedupControl.off('speedupChanged', this.onSpeedupChanged, this);
    }

    // Destroy buttons
    if (this.distanceButton) {
      this.distanceButton.off('clicked');
      this.distanceButton.destroy();
      this.distanceButton = null;
    }
    if (this.newComparisonButton) {
      this.newComparisonButton.off('clicked');
      this.newComparisonButton.destroy();
      this.newComparisonButton = null;
    }
    if (this.startRestartButton) {
      this.startRestartButton.off('clicked');
      this.startRestartButton.destroy();
      this.startRestartButton = null;
    }

    // Destroy components
    this.objectSelector?.destroy();
    this.scaleDisplay?.destroy();
    this.distanceAnimator?.destroy();
    this.lightTraveler?.destroy();
    this.speedupControl?.destroy();

    console.log('[CosmicComparisonScene] Cleanup complete');
  }
}
