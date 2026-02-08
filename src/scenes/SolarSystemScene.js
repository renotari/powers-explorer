/**
 * SolarSystemScene - Solar system visualization with three modes
 *
 * Modes:
 * 1. Size Comparison - Planets side-by-side with proportional sizes
 * 2. Distance View - Planets at orbital distances (logarithmic)
 * 3. Orbital View - Planets on elliptical orbits
 *
 * State Machine: sizeComparison → distanceView → orbitalView → (cycle)
 */

import Phaser from 'phaser';
import { StateManager } from '@/managers/StateManager.js';
import { SizeComparisonView } from '@/components/solarsystem/SizeComparisonView.js';
import { DistanceView } from '@/components/solarsystem/DistanceView.js';
import { OrbitalView } from '@/components/solarsystem/OrbitalView.js';
import { PlanetInfoPanel } from '@/components/solarsystem/PlanetInfoPanel.js';
import { ModeCycleButton } from '@/components/solarsystem/ModeCycleButton.js';
import { PlanetaryPositionService } from '@/services/PlanetaryPositionService.js';

export class SolarSystemScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SolarSystemScene' });
  }

  create() {
    console.log('[SolarSystemScene] Creating solar system visualization...');

    // Register cleanup on shutdown
    this.events.on('shutdown', this.cleanup, this);

    // Get state manager
    this.stateManager = StateManager.getInstance();

    // Initialize components
    this.currentView = null;
    this.planetInfoPanel = null;
    this.modeCycleButton = null;

    // Initialize view
    this.initializeComponents();

    // Start with size comparison mode
    this.enterMode('sizeComparison');

    // Attempt to fetch real-time orbital data (for orbital view)
    this.fetchOrbitalData();
  }

  /**
   * Initialize components
   */
  initializeComponents() {
    // Create info panel (hidden initially)
    this.planetInfoPanel = new PlanetInfoPanel(this);

    // Create mode cycle button
    this.modeCycleButton = new ModeCycleButton(this);
    this.modeCycleButton.on('modeCycleRequested', this.cycleMode, this);
  }

  /**
   * Fetch real-time orbital data using Astronomy Engine
   */
  async fetchOrbitalData() {
    try {
      const service = PlanetaryPositionService.getInstance();
      const positions = await service.fetchPlanetaryPositions();

      // Check if scene is still active after async operation
      if (!this.scene.isActive()) {
        console.log('[SolarSystemScene] Scene destroyed during orbital data fetch, aborting');
        return;
      }

      if (positions) {
        this.stateManager.setOrbitalPositions(positions);
        console.log('[SolarSystemScene] Real-time orbital data loaded');
      } else {
        console.log('[SolarSystemScene] Using default orbital positions');
      }
    } catch (error) {
      console.warn('[SolarSystemScene] Failed to fetch orbital data:', error);
      // Only update state if scene is still active
      if (this.scene.isActive()) {
        this.stateManager.setOrbitalPositions(null);
      }
    }
  }

  /**
   * Cycle to next mode
   */
  async cycleMode() {
    if (this.stateManager.isSolarSystemAnimating()) {
      return; // Prevent cycling during animation
    }

    const modes = ['sizeComparison', 'distanceView', 'orbitalView'];
    const currentMode = this.stateManager.getSolarSystemMode();
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    await this.transitionToMode(nextMode);
  }

  /**
   * Transition to a specific mode
   * @param {string} mode - Mode name
   */
  async transitionToMode(mode) {
    this.stateManager.setSolarSystemAnimating(true);

    try {
      // Hide info panel if open
      if (this.planetInfoPanel && this.planetInfoPanel.currentPlanetId) {
        await this.planetInfoPanel.hide();
        // Check if scene is still active after await
        if (!this.scene.isActive()) {
          console.log('[SolarSystemScene] Scene destroyed during transition, aborting');
          return;
        }
      }

      // Fade out current view
      if (this.currentView) {
        await this.fadeOut(this.currentView);
        // Check if scene is still active after await
        if (!this.scene.isActive()) {
          console.log('[SolarSystemScene] Scene destroyed during transition, aborting');
          return;
        }
        this.currentView.destroy();
        this.currentView = null;
      }

      // Enter new mode
      await this.enterMode(mode);
      // Check if scene is still active after await
      if (!this.scene.isActive()) {
        console.log('[SolarSystemScene] Scene destroyed during transition, aborting');
        return;
      }

      // Update state - add null checks for components
      this.stateManager.setSolarSystemMode(mode);
      if (this.modeCycleButton) {
        this.modeCycleButton.setMode(mode);
      }
    } catch (error) {
      console.error(`[SolarSystemScene] Mode transition to '${mode}' failed:`, error);
    } finally {
      this.stateManager.setSolarSystemAnimating(false);
    }
  }

  /**
   * Enter a specific mode
   * @param {string} mode - Mode name
   */
  async enterMode(mode) {
    console.log(`[SolarSystemScene] Entering mode: ${mode}`);

    switch (mode) {
      case 'sizeComparison':
        this.currentView = new SizeComparisonView(this);
        break;
      case 'distanceView':
        this.currentView = new DistanceView(this);
        break;
      case 'orbitalView':
        this.currentView = new OrbitalView(this);
        break;
      default:
        console.error(`[SolarSystemScene] Unknown mode: ${mode}`);
        return;
    }

    // Set up planet click listener
    this.currentView.on('planetClicked', this.onPlanetClicked, this);

    // Fade in new view
    await this.fadeIn(this.currentView);
  }

  /**
   * Handle planet click
   * @param {Object} data - Planet click data
   */
  onPlanetClicked(data) {
    console.log(`[SolarSystemScene] Planet clicked: ${data.planetId}`);
    this.stateManager.setSelectedPlanet(data.planetId);
    this.planetInfoPanel.show(data.planetId);
  }

  /**
   * Fade out a view
   * @param {Object} view - View component
   * @returns {Promise}
   */
  fadeOut(view) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: view.container,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => resolve()
      });
    });
  }

  /**
   * Fade in a view
   * @param {Object} view - View component
   * @returns {Promise}
   */
  fadeIn(view) {
    view.container.setAlpha(0);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: view.container,
        alpha: 1,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => resolve()
      });
    });
  }

  /**
   * Clean up scene resources
   */
  cleanup() {
    console.log('[SolarSystemScene] Cleaning up...');

    // Destroy current view
    if (this.currentView) {
      this.currentView.off('planetClicked', this.onPlanetClicked, this);
      this.currentView.destroy();
      this.currentView = null;
    }

    // Destroy info panel
    if (this.planetInfoPanel) {
      this.planetInfoPanel.destroy();
      this.planetInfoPanel = null;
    }

    // Destroy mode cycle button
    if (this.modeCycleButton) {
      this.modeCycleButton.off('modeCycleRequested', this.cycleMode, this);
      this.modeCycleButton.destroy();
      this.modeCycleButton = null;
    }

    // Clear selected planet
    this.stateManager.setSelectedPlanet(null);
  }
}
