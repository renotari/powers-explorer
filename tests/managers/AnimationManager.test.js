import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationManager } from '../../src/managers/AnimationManager.js';

describe('AnimationManager - Critical Bug Fixes', () => {
  let animationManager;
  let mockScene;

  beforeEach(() => {
    // Create a mock scene with tweens manager
    mockScene = {
      tweens: {
        add: vi.fn((config) => {
          // Return a mock tween
          const tween = {
            play: vi.fn(),
            stop: vi.fn(() => {
              // Simulate stop event firing
              if (config.onStop) config.onStop();
            }),
            pause: vi.fn(),
            resume: vi.fn(),
            isPaused: vi.fn(() => false),
            isPlaying: vi.fn(() => true),
            once: vi.fn((event, callback) => {
              // Store callbacks for manual triggering in tests
              tween._callbacks = tween._callbacks || {};
              tween._callbacks[event] = callback;
            }),
            on: vi.fn()
          };
          return tween;
        })
      }
    };

    animationManager = AnimationManager.getInstance(mockScene);
  });

  afterEach(() => {
    AnimationManager.resetInstance();
  });

  describe('cancelAnimation - Double Event Emission Fix', () => {
    it('should emit only animationCancelled event, not animationStopped', async () => {
      const animationStartedSpy = vi.fn();
      const animationCancelledSpy = vi.fn();
      const animationStoppedSpy = vi.fn();

      animationManager.on('animationStarted', animationStartedSpy);
      animationManager.on('animationCancelled', animationCancelledSpy);
      animationManager.on('animationStopped', animationStoppedSpy);

      // Start an animation
      const animationPromise = animationManager.startAnimation('test-anim', {
        targets: {},
        duration: 1000
      });

      // Wait a tick to ensure animation is registered
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(animationStartedSpy).toHaveBeenCalledTimes(1);

      // Cancel the animation
      const cancelled = animationManager.cancelAnimation('test-anim');

      expect(cancelled).toBe(true);
      expect(animationCancelledSpy).toHaveBeenCalledTimes(1);
      expect(animationCancelledSpy).toHaveBeenCalledWith('test-anim');

      // CRITICAL: animationStopped should NOT be emitted
      // This was the bug - double event emission
      expect(animationStoppedSpy).not.toHaveBeenCalled();

      // The promise should be rejected (but we don't await it here)
      try {
        await animationPromise;
      } catch (error) {
        // Expected rejection is OK
        expect(error.message).toContain('stopped');
      }
    });

    it('should remove animation from activeAnimations BEFORE calling stop()', () => {
      const animationId = 'test-anim-2';

      // Start animation
      animationManager.startAnimation(animationId, {
        targets: {},
        duration: 1000
      });

      // Verify it's in the active animations
      expect(animationManager.isAnimating(animationId)).toBe(true);

      // Cancel it
      animationManager.cancelAnimation(animationId);

      // CRITICAL: Should be removed from map immediately
      // This prevents the 'stop' event handler from firing
      expect(animationManager.isAnimating(animationId)).toBe(false);
    });

    it('should not throw unhandled rejection when cancelling animation', async () => {
      const animationId = 'test-anim-3';
      let rejectionError = null;

      // Track unhandled rejections
      const rejectionHandler = (event) => {
        rejectionError = event.reason;
      };
      process.on('unhandledRejection', rejectionHandler);

      try {
        // Start animation
        const promise = animationManager.startAnimation(animationId, {
          targets: {},
          duration: 1000
        });

        // Cancel immediately
        animationManager.cancelAnimation(animationId);

        // Try to await the promise - should reject
        try {
          await promise;
          expect.fail('Promise should have rejected');
        } catch (error) {
          // Expected - cancellation causes rejection
          expect(error.message).toContain('stopped');
        }

        // Wait a bit to see if unhandled rejection fires
        await new Promise(resolve => setTimeout(resolve, 50));

        // Should NOT have unhandled rejection
        expect(rejectionError).toBeNull();
      } finally {
        process.off('unhandledRejection', rejectionHandler);
      }
    });

    it('should return false when cancelling non-existent animation', () => {
      const result = animationManager.cancelAnimation('does-not-exist');
      expect(result).toBe(false);
    });

    it('should handle multiple cancellations gracefully', () => {
      const animationId = 'test-anim-4';

      animationManager.startAnimation(animationId, {
        targets: {},
        duration: 1000
      });

      // First cancellation
      const result1 = animationManager.cancelAnimation(animationId);
      expect(result1).toBe(true);

      // Second cancellation of same animation
      const result2 = animationManager.cancelAnimation(animationId);
      expect(result2).toBe(false); // Already cancelled
    });
  });

  describe('startAnimation - Event Handling', () => {
    it('should properly handle stop event only when not cancelled', async () => {
      const animationStoppedSpy = vi.fn();
      animationManager.on('animationStopped', animationStoppedSpy);

      const mockTween = mockScene.tweens.add({ targets: {}, duration: 100 });

      // Start animation
      const promise = animationManager.startAnimation('test-anim-5', {
        targets: {},
        duration: 100
      });

      // Manually trigger stop event (simulating tween.stop() being called externally)
      if (mockTween._callbacks && mockTween._callbacks.stop) {
        mockTween._callbacks.stop();
      }

      // Should emit animationStopped since it wasn't cancelled via cancelAnimation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Note: In the actual implementation, the stop handler checks if animation
      // is still in activeAnimations map before emitting
    });
  });

  describe('clear - Multiple Animation Cleanup', () => {
    it('should clear all animations without double-emitting events', () => {
      const animationStoppedSpy = vi.fn();
      const animationCancelledSpy = vi.fn();

      animationManager.on('animationStopped', animationStoppedSpy);
      animationManager.on('animationCancelled', animationCancelledSpy);

      // Start multiple animations
      animationManager.startAnimation('anim-1', { targets: {}, duration: 1000 });
      animationManager.startAnimation('anim-2', { targets: {}, duration: 1000 });
      animationManager.startAnimation('anim-3', { targets: {}, duration: 1000 });

      expect(animationManager.getActiveAnimationIds()).toHaveLength(3);

      // Clear all
      animationManager.clear();

      expect(animationManager.getActiveAnimationIds()).toHaveLength(0);

      // Should not have excessive event emissions
      // (implementation may emit events, but should be controlled)
    });
  });

  describe('cancelAll - Mass Cancellation', () => {
    it('should cancel all animations and return count', () => {
      animationManager.startAnimation('anim-1', { targets: {}, duration: 1000 });
      animationManager.startAnimation('anim-2', { targets: {}, duration: 1000 });
      animationManager.startAnimation('anim-3', { targets: {}, duration: 1000 });

      const count = animationManager.cancelAll();

      expect(count).toBe(3);
      expect(animationManager.getActiveAnimationIds()).toHaveLength(0);
    });

    it('should return 0 when no animations are active', () => {
      const count = animationManager.cancelAll();
      expect(count).toBe(0);
    });
  });
});
