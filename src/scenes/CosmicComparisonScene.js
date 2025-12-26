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
import { COLORS } from '@/utils/Constants.js';

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
    this.objectSelector = new ObjectSelector(this, 150, 150);

    // Scale display (hidden initially)
    this.scaleDisplay = new ScaleDisplay(this);
    this.scaleDisplay.hide();

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

    this.lightTraveler.on('travelComplete', this.onLightTravelComplete, this);

    // Start animation
    this.lightTraveler.animate();
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

    // Transition to scale display phase
    this.enterScaleDisplayPhase();
  }

  /**
   * Handle distance animation completion
   */
  onDistanceComplete() {
    console.log('[CosmicComparisonScene] Distance animation complete');

    // Transition to light travel phase
    this.enterLightTravelPhase();
  }

  /**
   * Handle light travel completion
   */
  onLightTravelComplete() {
    console.log('[CosmicComparisonScene] Light travel complete');

    // Show "New Comparison" button
    this.createNewComparisonButton();
  }

  // ========================================
  // UI Creation Methods
  // ========================================

  /**
   * Create "Show Distance" button
   */
  createDistanceButton() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const buttonY = height - 80;

    // Button background
    const button = this.add.rectangle(
      width / 2,
      buttonY,
      200,
      50,
      parseInt(COLORS.PRIMARY.replace('#', '0x'))
    ).setInteractive();

    // Button text
    const buttonText = this.add.text(width / 2, buttonY, 'Show Distance', {
      fontSize: '20px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover effects
    button.on('pointerover', () => {
      button.setFillStyle(parseInt(COLORS.PRIMARY.replace('#', '0x')), 0.8);
      buttonText.setScale(1.1);
    });

    button.on('pointerout', () => {
      button.setFillStyle(parseInt(COLORS.PRIMARY.replace('#', '0x')), 1);
      buttonText.setScale(1);
    });

    // Click handler
    button.on('pointerdown', () => {
      // Destroy button
      button.destroy();
      buttonText.destroy();

      // Enter distance animation phase
      this.enterDistanceAnimationPhase();
    });

    // Store references for potential cleanup
    this.distanceButton = button;
    this.distanceButtonText = buttonText;
  }

  /**
   * Create "New Comparison" button
   */
  createNewComparisonButton() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const buttonY = height - 150;

    // Button background
    const button = this.add.rectangle(
      width / 2,
      buttonY,
      200,
      50,
      parseInt(COLORS.PRIMARY.replace('#', '0x'))
    ).setInteractive();

    // Button text
    const buttonText = this.add.text(width / 2, buttonY, 'New Comparison', {
      fontSize: '20px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover effects
    button.on('pointerover', () => {
      button.setFillStyle(parseInt(COLORS.PRIMARY.replace('#', '0x')), 0.8);
      buttonText.setScale(1.1);
    });

    button.on('pointerout', () => {
      button.setFillStyle(parseInt(COLORS.PRIMARY.replace('#', '0x')), 1);
      buttonText.setScale(1);
    });

    // Click handler
    button.on('pointerdown', () => {
      // Destroy button
      button.destroy();
      buttonText.destroy();

      // Reset and start over
      this.reset();
    });
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
      'Distance data not available for these objects',
      {
        fontSize: '20px',
        color: '#ffaa00',
        fontFamily: 'Arial',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
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

    // Destroy components
    this.objectSelector?.destroy();
    this.scaleDisplay?.destroy();
    this.distanceAnimator?.destroy();
    this.lightTraveler?.destroy();

    console.log('[CosmicComparisonScene] Cleanup complete');
  }
}
