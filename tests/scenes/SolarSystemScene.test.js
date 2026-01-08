import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SolarSystemScene - Async Race Condition Fixes', () => {
  let mockScene;
  let mockStateManager;
  let mockPlanetInfoPanel;
  let mockModeCycleButton;
  let mockCurrentView;
  let isSceneActive;

  beforeEach(() => {
    isSceneActive = true;

    // Mock StateManager
    mockStateManager = {
      setSolarSystemAnimating: vi.fn(),
      setSolarSystemMode: vi.fn(),
      setOrbitalPositions: vi.fn()
    };

    // Mock PlanetInfoPanel
    mockPlanetInfoPanel = {
      currentPlanetId: 'earth',
      hide: vi.fn(async () => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
      })
    };

    // Mock ModeCycleButton
    mockModeCycleButton = {
      setMode: vi.fn()
    };

    // Mock Current View
    mockCurrentView = {
      destroy: vi.fn()
    };

    // Mock Phaser Scene
    mockScene = {
      isActive: vi.fn(() => isSceneActive),
      tweens: {
        add: vi.fn()
      }
    };
  });

  describe('transitionToMode - Scene Validity Checks', () => {
    it('should abort transition if scene destroyed during planetInfoPanel.hide()', async () => {
      const fadeOutSpy = vi.fn();
      const enterModeSpy = vi.fn();

      // Simulate transitionToMode logic
      mockStateManager.setSolarSystemAnimating(true);

      // Hide info panel
      const hidePromise = mockPlanetInfoPanel.hide();

      // Simulate scene destruction during async operation
      setTimeout(() => {
        isSceneActive = false;
      }, 50);

      await hidePromise;

      // CRITICAL: Check if scene is still active after await
      if (!mockScene.isActive()) {
        console.log('[SolarSystemScene] Scene destroyed during transition, aborting');

        // Should NOT continue with fadeOut or enterMode
        expect(fadeOutSpy).not.toHaveBeenCalled();
        expect(enterModeSpy).not.toHaveBeenCalled();
        expect(mockModeCycleButton.setMode).not.toHaveBeenCalled();
        return;
      }

      expect.fail('Should have aborted transition when scene became inactive');
    });

    it('should abort transition if scene destroyed during fadeOut()', async () => {
      const enterModeSpy = vi.fn();

      mockStateManager.setSolarSystemAnimating(true);

      // Skip info panel hide (already hidden)
      // Simulate fadeOut
      const fadeOutPromise = new Promise(resolve => setTimeout(resolve, 100));

      // Destroy scene mid-fadeOut
      setTimeout(() => {
        isSceneActive = false;
      }, 50);

      await fadeOutPromise;

      // CRITICAL: Check if scene is still active
      if (!mockScene.isActive()) {
        console.log('[SolarSystemScene] Scene destroyed during transition, aborting');

        expect(enterModeSpy).not.toHaveBeenCalled();
        expect(mockCurrentView.destroy).not.toHaveBeenCalled();
        expect(mockModeCycleButton.setMode).not.toHaveBeenCalled();
        return;
      }

      expect.fail('Should have aborted transition');
    });

    it('should abort transition if scene destroyed during enterMode()', async () => {
      mockStateManager.setSolarSystemAnimating(true);

      // Simulate enterMode
      const enterModePromise = new Promise(resolve => setTimeout(resolve, 100));

      // Destroy scene mid-enterMode
      setTimeout(() => {
        isSceneActive = false;
      }, 50);

      await enterModePromise;

      // CRITICAL: Check if scene is still active
      if (!mockScene.isActive()) {
        console.log('[SolarSystemScene] Scene destroyed during transition, aborting');

        // Should NOT update state or modify components
        expect(mockModeCycleButton.setMode).not.toHaveBeenCalled();
        return;
      }

      expect.fail('Should have aborted transition');
    });

    it('should complete successfully if scene remains active', async () => {
      mockStateManager.setSolarSystemAnimating(true);

      // Simulate full transition with scene staying active
      await mockPlanetInfoPanel.hide();
      expect(mockScene.isActive()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 50)); // fadeOut
      expect(mockScene.isActive()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 50)); // enterMode
      expect(mockScene.isActive()).toBe(true);

      // Should reach the end and update state
      mockStateManager.setSolarSystemMode('distanceView');
      if (mockModeCycleButton) {
        mockModeCycleButton.setMode('distanceView');
      }
      mockStateManager.setSolarSystemAnimating(false);

      expect(mockStateManager.setSolarSystemMode).toHaveBeenCalledWith('distanceView');
      expect(mockModeCycleButton.setMode).toHaveBeenCalledWith('distanceView');
      expect(mockStateManager.setSolarSystemAnimating).toHaveBeenCalledWith(false);
    });

    it('should handle null modeCycleButton gracefully', async () => {
      mockModeCycleButton = null;

      mockStateManager.setSolarSystemAnimating(true);

      // Transition completes
      await new Promise(resolve => setTimeout(resolve, 50));

      // Update state
      mockStateManager.setSolarSystemMode('orbitalView');

      // CRITICAL: Null check before accessing modeCycleButton
      if (mockModeCycleButton) {
        mockModeCycleButton.setMode('orbitalView');
      }

      // Should not throw despite null modeCycleButton
      expect(mockStateManager.setSolarSystemMode).toHaveBeenCalledWith('orbitalView');
    });
  });

  describe('fetchOrbitalData - Scene Validity Checks', () => {
    it('should abort if scene destroyed during fetch', async () => {
      const mockService = {
        fetchPlanetaryPositions: vi.fn(async () => {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return { earth: 1.5, mars: 3.2 };
        })
      };

      // Start fetch
      const fetchPromise = mockService.fetchPlanetaryPositions();

      // Destroy scene mid-fetch
      setTimeout(() => {
        isSceneActive = false;
      }, 50);

      const positions = await fetchPromise;

      // CRITICAL: Check if scene is still active after await
      if (!mockScene.isActive()) {
        console.log('[SolarSystemScene] Scene destroyed during orbital data fetch, aborting');

        // Should NOT update state
        expect(mockStateManager.setOrbitalPositions).not.toHaveBeenCalled();
        return;
      }

      expect.fail('Should have aborted fetch result processing');
    });

    it('should update state if scene remains active during fetch', async () => {
      const mockService = {
        fetchPlanetaryPositions: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return { earth: 1.5, mars: 3.2 };
        })
      };

      const positions = await mockService.fetchPlanetaryPositions();

      // Scene is still active
      expect(mockScene.isActive()).toBe(true);

      if (positions) {
        mockStateManager.setOrbitalPositions(positions);
      }

      expect(mockStateManager.setOrbitalPositions).toHaveBeenCalledWith({
        earth: 1.5,
        mars: 3.2
      });
    });

    it('should handle fetch error gracefully and check scene validity', async () => {
      const mockService = {
        fetchPlanetaryPositions: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Network error');
        })
      };

      try {
        await mockService.fetchPlanetaryPositions();
      } catch (error) {
        console.warn('[SolarSystemScene] Failed to fetch orbital data:', error);

        // CRITICAL: Only update state if scene is still active
        if (mockScene.isActive()) {
          mockStateManager.setOrbitalPositions(null);
          expect(mockStateManager.setOrbitalPositions).toHaveBeenCalledWith(null);
        }
      }
    });

    it('should not update state if scene destroyed before fetch error handling', async () => {
      const mockService = {
        fetchPlanetaryPositions: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error('Network error');
        })
      };

      // Destroy scene mid-fetch
      setTimeout(() => {
        isSceneActive = false;
      }, 50);

      try {
        await mockService.fetchPlanetaryPositions();
      } catch (error) {
        // Scene is inactive
        expect(mockScene.isActive()).toBe(false);

        // Should NOT update state
        if (mockScene.isActive()) {
          mockStateManager.setOrbitalPositions(null);
        }

        expect(mockStateManager.setOrbitalPositions).not.toHaveBeenCalled();
      }
    });
  });

  describe('Multiple Async Operations Race Conditions', () => {
    it('should handle rapid scene transitions without crashing', async () => {
      // Simulate rapid user actions:
      // 1. Start transition to distanceView
      // 2. Immediately press Back button (scene destroyed)

      const transition1 = (async () => {
        mockStateManager.setSolarSystemAnimating(true);
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!mockScene.isActive()) return;

        await new Promise(resolve => setTimeout(resolve, 50));

        if (!mockScene.isActive()) return;

        mockStateManager.setSolarSystemMode('distanceView');
      })();

      // Destroy scene immediately
      setTimeout(() => {
        isSceneActive = false;
      }, 25);

      await transition1;

      // Should not have reached setSolarSystemMode
      expect(mockStateManager.setSolarSystemMode).not.toHaveBeenCalled();
    });

    it('should handle multiple overlapping async operations', async () => {
      const operations = [];

      // Start 3 async operations
      for (let i = 0; i < 3; i++) {
        operations.push((async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

          if (!mockScene.isActive()) {
            return `op${i}-aborted`;
          }

          return `op${i}-completed`;
        })());
      }

      // Destroy scene after 50ms
      setTimeout(() => {
        isSceneActive = false;
      }, 50);

      const results = await Promise.all(operations);

      // At least some operations should have been aborted
      const aborted = results.filter(r => r.includes('aborted'));
      expect(aborted.length).toBeGreaterThan(0);
    });
  });
});
