import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager } from '../../src/managers/StateManager.js';

describe('StateManager - Critical Bug Fixes', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = StateManager.getInstance();
  });

  afterEach(() => {
    StateManager.resetInstance();
  });

  describe('resetInstance - Event Listener Order Fix', () => {
    it('should remove listeners BEFORE reinitializing to prevent spurious events', () => {
      const eventsSpy = [];

      // Register a listener for 'stateManagerReady'
      const readyListener = vi.fn((state) => {
        eventsSpy.push({ event: 'stateManagerReady', state });
      });

      stateManager.on('stateManagerReady', readyListener);

      // Trigger init to see that event fires
      stateManager.init();
      expect(readyListener).toHaveBeenCalledTimes(1);
      eventsSpy.length = 0; // Clear

      // CRITICAL: Reset should remove listeners BEFORE calling init()
      // Otherwise, the 'stateManagerReady' event would fire during reset
      StateManager.resetInstance();

      // The listener from the old instance should NOT have fired during reset
      // because listeners were removed BEFORE init() was called
      expect(readyListener).toHaveBeenCalledTimes(1); // Still just 1 from before reset

      // Get new instance
      const newManager = StateManager.getInstance();
      expect(newManager).toBeDefined();

      // Old listener should not be attached to new instance
      newManager.init();
      expect(readyListener).toHaveBeenCalledTimes(1); // Still just 1, not 2
    });

    it('should clear all event listeners during reset', () => {
      const modeChangedSpy = vi.fn();
      const animationStateChangedSpy = vi.fn();

      stateManager.on('modeChanged', modeChangedSpy);
      stateManager.on('animationStateChanged', animationStateChangedSpy);

      // Trigger events
      stateManager.setMode('solarSystem');
      stateManager.setAnimating(true);

      expect(modeChangedSpy).toHaveBeenCalledTimes(1);
      expect(animationStateChangedSpy).toHaveBeenCalledTimes(1);

      // Reset
      StateManager.resetInstance();

      // Get new instance
      const newManager = StateManager.getInstance();

      // Trigger events on new instance
      newManager.setMode('cosmicComparison');
      newManager.setAnimating(false);

      // Old listeners should NOT fire
      expect(modeChangedSpy).toHaveBeenCalledTimes(1); // Still just 1
      expect(animationStateChangedSpy).toHaveBeenCalledTimes(1); // Still just 1
    });

    it('should not throw when resetting instance', () => {
      expect(() => {
        StateManager.resetInstance();
      }).not.toThrow();
    });

    it('should be idempotent - multiple resets should work', () => {
      expect(() => {
        StateManager.resetInstance();
        StateManager.resetInstance();
        StateManager.resetInstance();
      }).not.toThrow();
    });
  });

  describe('Event Listener Memory Leaks', () => {
    it('should not leak listeners when components forget to remove them', () => {
      const listeners = [];

      // Simulate 10 components each adding a listener
      for (let i = 0; i < 10; i++) {
        const listener = vi.fn();
        listeners.push(listener);
        stateManager.on('modeChanged', listener);
      }

      // Trigger event - all 10 should fire
      stateManager.setMode('solarSystem');
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(1);
      });

      // Reset should clear ALL listeners
      StateManager.resetInstance();

      // Get new instance
      const newManager = StateManager.getInstance();
      newManager.setMode('cosmicComparison');

      // Old listeners should NOT fire
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(1); // Still just 1, not 2
      });
    });
  });

  describe('State Initialization After Reset', () => {
    it('should have fresh state after reset', () => {
      // Modify state
      stateManager.selectObject('earth');
      stateManager.selectObject('moon');
      stateManager.setMode('solarSystem');
      stateManager.setAnimating(true);

      expect(stateManager.getSelectedObjects()).toHaveLength(2);
      expect(stateManager.getCurrentMode()).toBe('solarSystem');
      expect(stateManager.isAnimating()).toBe(true);

      // Reset
      StateManager.resetInstance();

      // Get new instance
      const newManager = StateManager.getInstance();

      // Should have default state
      expect(newManager.getSelectedObjects()).toHaveLength(0);
      expect(newManager.getCurrentMode()).toBe('menu');
      expect(newManager.isAnimating()).toBe(false);
    });

    it('should emit stateManagerReady on new instance init', () => {
      StateManager.resetInstance();

      const newManager = StateManager.getInstance();
      const readySpy = vi.fn();

      newManager.on('stateManagerReady', readySpy);
      newManager.init();

      expect(readySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getInstance calls', () => {
      const instance1 = StateManager.getInstance();
      const instance2 = StateManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return new instance after reset', () => {
      const instance1 = StateManager.getInstance();
      StateManager.resetInstance();
      const instance2 = StateManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should throw when trying to instantiate directly', () => {
      expect(() => {
        new StateManager();
      }).toThrow('StateManager already instantiated');
    });
  });
});
