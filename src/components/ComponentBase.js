/**
 * ComponentBase - Base class for all UI components
 *
 * Extends Phaser.Events.EventEmitter to enable event-driven communication
 * between components and scenes
 *
 * All components should extend this class for consistency
 *
 * Standard lifecycle:
 * - constructor() - Initialize component
 * - create() - Build UI elements (called by subclass)
 * - show() - Make component visible
 * - hide() - Make component invisible
 * - destroy() - Clean up resources
 */

import Phaser from 'phaser';

export class ComponentBase extends Phaser.Events.EventEmitter {
  /**
   * Base component constructor
   *
   * @param {Phaser.Scene} scene - Parent scene
   * @param {Object} config - Configuration object
   *
   * Note: Subclasses may add positional parameters (x, y, etc.) before config
   * Example: ObjectSelector(scene, x, y, config)
   */
  constructor(scene, config = {}) {
    super(); // Initialize EventEmitter

    this.scene = scene;
    this.config = config;

    // Create container to hold all visual elements
    // Container allows moving/scaling entire component as one unit
    this.container = scene.add.container();

    this.isVisible = true;

    console.log(`[${this.constructor.name}] Component created`);
  }

  /**
   * Build UI elements
   * Override in subclasses to create visual content
   */
  create() {
    // Subclasses override this method
  }

  /**
   * Update component state
   * Called each frame if implemented
   *
   * @param {number} delta - Time since last update (ms)
   */
  update(delta) {
    // Subclasses can override this method
  }

  /**
   * Show component
   */
  show() {
    this.container.setVisible(true);
    this.isVisible = true;
    this.emit('shown');
  }

  /**
   * Hide component
   */
  hide() {
    this.container.setVisible(false);
    this.isVisible = false;
    this.emit('hidden');
  }

  /**
   * Set component position
   *
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.container.setPosition(x, y);
  }

  /**
   * Get component position
   *
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return {
      x: this.container.x,
      y: this.container.y
    };
  }

  /**
   * Set component alpha (transparency)
   *
   * @param {number} alpha - Alpha value (0-1)
   */
  setAlpha(alpha) {
    this.container.setAlpha(alpha);
  }

  /**
   * Destroy component and clean up resources
   *
   * CRITICAL: Always call this when component is no longer needed
   * to prevent memory leaks
   */
  destroy() {
    console.log(`[${this.constructor.name}] Destroying component...`);

    // Remove all event listeners
    this.removeAllListeners();

    // Destroy container (and all children)
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }

    // Clear scene reference
    this.scene = null;
  }
}
