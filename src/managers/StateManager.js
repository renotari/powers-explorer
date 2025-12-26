/**
 * StateManager - Centralized application state management
 *
 * Extends Phaser.Events.EventEmitter to emit state change events
 * Components listen for these events to update reactively
 *
 * CRITICAL: FIFO selection logic - when adding 3rd object,
 * remove FIRST element, not second!
 */

import Phaser from 'phaser';
import { MAX_SELECTIONS } from '@/utils/Constants.js';

export class StateManager extends Phaser.Events.EventEmitter {
  static instance = null;

  static getInstance() {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  constructor() {
    if (StateManager.instance) {
      throw new Error('StateManager already instantiated. Use getInstance()');
    }

    super(); // Initialize EventEmitter

    // Application state structure
    this.state = {
      app: {
        currentMode: null,       // 'comparison' | 'powersOfTen' | null
        isAnimating: false,      // Global animation state
        isPaused: false          // Global pause state
      },
      comparison: {
        selectedObjects: [],     // Array of selected object IDs (max 2)
        animationPhase: 'selection'  // 'selection' | 'scaleDisplay' | 'distanceAnimation' | 'lightTravel'
      },
      powersOfTen: {
        currentExponent: 0,      // Current scale exponent
        currentLevel: null,      // Current scale level object
        zoomVelocity: 0,        // Zoom animation velocity
        visibleObjects: []       // Objects visible at current scale
      },
      ui: {
        infoPanelOpen: false,    // Info panel visibility
        selectedInfoObject: null, // Object selected for info display
        helpVisible: false       // Help overlay visibility
      }
    };

    console.log('[StateManager] Initialized');
  }

  /**
   * Initialize state to defaults
   * Called once during app boot
   */
  init() {
    this.state.app.currentMode = null;
    this.state.app.isAnimating = false;
    this.state.app.isPaused = false;

    this.state.comparison.selectedObjects = [];
    this.state.comparison.animationPhase = 'selection';

    console.log('[StateManager] State initialized');
    this.emit('stateManagerReady');
  }

  // ========================================
  // App State Methods
  // ========================================

  /**
   * Set current mode
   * @param {string} mode - Mode name ('comparison' | 'powersOfTen')
   */
  setMode(mode) {
    console.log(`[StateManager] Mode changed: ${this.state.app.currentMode} → ${mode}`);
    this.state.app.currentMode = mode;
    this.emit('modeChanged', mode);
  }

  /**
   * Get current mode
   * @returns {string|null} Current mode
   */
  getCurrentMode() {
    return this.state.app.currentMode;
  }

  /**
   * Set global animation state
   * @param {boolean} isAnimating - Animation state
   */
  setAnimating(isAnimating) {
    if (this.state.app.isAnimating !== isAnimating) {
      this.state.app.isAnimating = isAnimating;
      this.emit('animationStateChanged', isAnimating);
    }
  }

  /**
   * Check if any animation is running
   * @returns {boolean} True if animating
   */
  isAnimating() {
    return this.state.app.isAnimating;
  }

  // ========================================
  // Comparison State Methods
  // ========================================

  /**
   * Select an object for comparison
   *
   * CRITICAL: FIFO logic - removes FIRST element when adding 3rd
   * User selects Earth, Moon, Sun → removes Earth (not Moon)
   *
   * @param {string} objectId - Object ID to select
   */
  selectObject(objectId) {
    // CRITICAL: Use shift() to remove FIRST element, not pop()!
    if (this.state.comparison.selectedObjects.length >= MAX_SELECTIONS) {
      const removed = this.state.comparison.selectedObjects.shift();
      console.log(`[StateManager] Max selections reached. Removed: ${removed}`);
    }

    this.state.comparison.selectedObjects.push(objectId);
    console.log(`[StateManager] Object selected: ${objectId}`);
    console.log(`[StateManager] Selected objects:`, this.state.comparison.selectedObjects);

    this.emit('objectSelected', objectId);

    // Emit selection complete if we have 2 objects
    if (this.state.comparison.selectedObjects.length === MAX_SELECTIONS) {
      this.emit('selectionComplete', this.state.comparison.selectedObjects);
    }
  }

  /**
   * Clear selected objects
   */
  clearSelection() {
    this.state.comparison.selectedObjects = [];
    console.log('[StateManager] Selection cleared');
    this.emit('selectionCleared');
  }

  /**
   * Get selected objects
   * @returns {Array<string>} Array of selected object IDs
   */
  getSelectedObjects() {
    return [...this.state.comparison.selectedObjects]; // Return copy
  }

  /**
   * Set comparison animation phase
   * @param {string} phase - Phase name
   */
  setComparisonPhase(phase) {
    const oldPhase = this.state.comparison.animationPhase;
    this.state.comparison.animationPhase = phase;
    console.log(`[StateManager] Comparison phase: ${oldPhase} → ${phase}`);
    this.emit('comparisonPhaseChanged', phase);
  }

  /**
   * Get current comparison phase
   * @returns {string} Current phase
   */
  getComparisonPhase() {
    return this.state.comparison.animationPhase;
  }

  // ========================================
  // Powers of Ten State Methods
  // ========================================

  /**
   * Set current scale exponent
   * @param {number} exponent - Scale exponent
   */
  setScale(exponent) {
    const oldExponent = this.state.powersOfTen.currentExponent;
    this.state.powersOfTen.currentExponent = exponent;
    console.log(`[StateManager] Scale changed: 10^${oldExponent} → 10^${exponent}`);
    this.emit('scaleChanged', exponent);
  }

  /**
   * Get current scale exponent
   * @returns {number} Current exponent
   */
  getCurrentScale() {
    return this.state.powersOfTen.currentExponent;
  }

  // ========================================
  // UI State Methods
  // ========================================

  /**
   * Set info panel visibility
   * @param {boolean} isOpen - Panel open state
   */
  setInfoPanelOpen(isOpen) {
    this.state.ui.infoPanelOpen = isOpen;
    this.emit('infoPanelChanged', isOpen);
  }

  /**
   * Set selected object for info display
   * @param {string|null} objectId - Object ID or null
   */
  setSelectedInfoObject(objectId) {
    this.state.ui.selectedInfoObject = objectId;
    this.emit('selectedInfoObjectChanged', objectId);
  }

  /**
   * Toggle help visibility
   */
  toggleHelp() {
    this.state.ui.helpVisible = !this.state.ui.helpVisible;
    this.emit('helpVisibilityChanged', this.state.ui.helpVisible);
  }

  // ========================================
  // Debug Methods
  // ========================================

  /**
   * Get full state for debugging
   * @returns {Object} Complete state object
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state)); // Deep copy
  }

  /**
   * Log current state to console
   */
  logState() {
    console.log('[StateManager] Current State:', this.getState());
  }
}
