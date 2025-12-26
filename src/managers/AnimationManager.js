/**
 * AnimationManager - Coordinates animations and prevents conflicts
 *
 * Extends Phaser.Events.EventEmitter to emit animation lifecycle events
 *
 * Key features:
 * - Track active animations by ID
 * - Auto-cancel conflicting animations
 * - Promise-based animation completion
 * - Pause/resume capabilities
 */

import Phaser from 'phaser';

export class AnimationManager extends Phaser.Events.EventEmitter {
  static instance = null;

  static getInstance() {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  constructor() {
    if (AnimationManager.instance) {
      throw new Error('AnimationManager already instantiated. Use getInstance()');
    }

    super(); // Initialize EventEmitter

    // Map of animation ID → tween object
    this.activeAnimations = new Map();

    console.log('[AnimationManager] Initialized');
  }

  /**
   * Register and start a managed animation
   *
   * Auto-cancels any existing animation with the same ID
   * Returns a Promise that resolves when animation completes
   *
   * @param {string} id - Unique animation identifier
   * @param {Phaser.Tweens.Tween} tween - The tween to manage
   * @returns {Promise} Resolves when animation completes, rejects if stopped
   */
  startAnimation(id, tween) {
    // Cancel any existing animation with same ID
    this.cancelAnimation(id);

    console.log(`[AnimationManager] Starting animation: ${id}`);

    return new Promise((resolve, reject) => {
      // Handle successful completion
      tween.on('complete', () => {
        console.log(`[AnimationManager] Animation complete: ${id}`);
        this.activeAnimations.delete(id);
        this.emit('animationComplete', id);
        resolve();
      });

      // Handle early termination
      tween.on('stop', () => {
        console.log(`[AnimationManager] Animation stopped: ${id}`);
        this.activeAnimations.delete(id);
        this.emit('animationStopped', id);
        reject(new Error(`Animation ${id} was stopped`));
      });

      // Register and play
      this.activeAnimations.set(id, tween);
      tween.play();
      this.emit('animationStarted', id);
    });
  }

  /**
   * Cancel a specific animation by ID
   *
   * @param {string} id - Animation identifier
   * @returns {boolean} True if animation was cancelled, false if not found
   */
  cancelAnimation(id) {
    const tween = this.activeAnimations.get(id);
    if (tween) {
      console.log(`[AnimationManager] Cancelling animation: ${id}`);
      tween.stop();
      this.activeAnimations.delete(id);
      this.emit('animationCancelled', id);
      return true;
    }
    return false;
  }

  /**
   * Cancel all running animations
   *
   * @returns {number} Number of animations cancelled
   */
  cancelAll() {
    const count = this.activeAnimations.size;
    console.log(`[AnimationManager] Cancelling all animations (${count})`);

    this.activeAnimations.forEach((tween, id) => {
      tween.stop();
      this.emit('animationCancelled', id);
    });

    this.activeAnimations.clear();
    return count;
  }

  /**
   * Check if a specific animation is currently running
   *
   * @param {string} id - Animation identifier
   * @returns {boolean} True if animation is running
   */
  isAnimationRunning(id) {
    return this.activeAnimations.has(id);
  }

  /**
   * Check if any animations are running
   *
   * @returns {boolean} True if any animation is running
   */
  isAnimating() {
    return this.activeAnimations.size > 0;
  }

  /**
   * Get count of active animations
   *
   * @returns {number} Number of active animations
   */
  getActiveCount() {
    return this.activeAnimations.size;
  }

  /**
   * Pause a specific animation
   *
   * @param {string} id - Animation identifier
   * @returns {boolean} True if animation was paused, false if not found
   */
  pauseAnimation(id) {
    const tween = this.activeAnimations.get(id);
    if (tween && !tween.isPaused()) {
      console.log(`[AnimationManager] Pausing animation: ${id}`);
      tween.pause();
      this.emit('animationPaused', id);
      return true;
    }
    return false;
  }

  /**
   * Resume a paused animation
   *
   * @param {string} id - Animation identifier
   * @returns {boolean} True if animation was resumed, false if not found
   */
  resumeAnimation(id) {
    const tween = this.activeAnimations.get(id);
    if (tween && tween.isPaused()) {
      console.log(`[AnimationManager] Resuming animation: ${id}`);
      tween.resume();
      this.emit('animationResumed', id);
      return true;
    }
    return false;
  }

  /**
   * Pause all active animations
   *
   * @returns {number} Number of animations paused
   */
  pauseAll() {
    let count = 0;
    this.activeAnimations.forEach((tween, id) => {
      if (!tween.isPaused()) {
        tween.pause();
        this.emit('animationPaused', id);
        count++;
      }
    });
    console.log(`[AnimationManager] Paused ${count} animations`);
    return count;
  }

  /**
   * Resume all paused animations
   *
   * @returns {number} Number of animations resumed
   */
  resumeAll() {
    let count = 0;
    this.activeAnimations.forEach((tween, id) => {
      if (tween.isPaused()) {
        tween.resume();
        this.emit('animationResumed', id);
        count++;
      }
    });
    console.log(`[AnimationManager] Resumed ${count} animations`);
    return count;
  }

  /**
   * Get list of active animation IDs
   *
   * @returns {Array<string>} Array of animation IDs
   */
  getActiveAnimationIds() {
    return Array.from(this.activeAnimations.keys());
  }

  /**
   * Clear all animations without emitting events
   * Used for cleanup during scene shutdown
   */
  clear() {
    this.activeAnimations.clear();
  }
}
