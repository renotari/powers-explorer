import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataManager } from '../../src/managers/DataManager.js';

describe('DataManager - Critical Bug Fixes', () => {
  let dataManager;
  let mockScene;

  beforeEach(() => {
    // Create a minimal mock scene for loading
    mockScene = {
      load: {
        json: vi.fn(),
        start: vi.fn(),
        once: vi.fn((event, callback) => {
          // Simulate immediate load completion with mock data
          if (event === 'complete') {
            setTimeout(() => {
              callback();
            }, 0);
          }
        }),
        on: vi.fn()
      },
      cache: {
        json: {
          get: vi.fn((key) => {
            // Return mock data based on key
            if (key === 'cosmic-objects') {
              return {
                objects: [
                  { id: 'earth', name: 'Earth', diameter: 12742000 },
                  { id: 'jupiter', name: 'Jupiter', diameter: 139820000 }
                ],
                distances: [
                  { from: 'earth', to: 'moon', meters: 384400000 }
                ]
              };
            }
            if (key === 'physical-constants') {
              return {
                speedOfLight: { value: 299792458, unit: 'm/s' },
                astronomicalUnit: { value: 149597870700, unit: 'm' }
              };
            }
            if (key === 'orbital-parameters') {
              return {
                planets: [
                  {
                    id: 'earth',
                    semiMajorAxis: 149598023000,
                    eccentricity: 0.0167086,
                    defaultAngularPosition: 90
                  }
                ]
              };
            }
            return null;
          })
        }
      }
    };

    dataManager = DataManager.getInstance();
  });

  afterEach(() => {
    DataManager.resetInstance();
  });

  describe('resetInstance - Property Name Fix', () => {
    it('should not throw when resetting instance', async () => {
      // Initialize the manager
      await dataManager.init(mockScene);

      // Verify data is loaded
      expect(dataManager.cosmicObjects).toBeDefined();
      expect(dataManager.constants).toBeDefined();
      expect(dataManager.objectsById).toBeDefined();

      // CRITICAL: This was throwing "Cannot read property 'clear' of undefined"
      // because it was trying to access wrong property names
      expect(() => {
        DataManager.resetInstance();
      }).not.toThrow();
    });

    it('should clear correct properties: cosmicObjects, constants, objectsById', async () => {
      await dataManager.init(mockScene);

      // Populate data
      expect(dataManager.cosmicObjects).not.toBeNull();
      expect(dataManager.constants).not.toBeNull();
      expect(dataManager.objectsById.size).toBeGreaterThan(0);
      expect(dataManager.distanceCache.size).toBeGreaterThan(0);

      // Reset
      DataManager.resetInstance();

      // After reset, instance should be null
      const newInstance = DataManager.getInstance();
      expect(newInstance).toBeDefined();
      expect(newInstance.cosmicObjects).toBeNull();
      expect(newInstance.constants).toBeNull();
      expect(newInstance.objectsById.size).toBe(0);
      expect(newInstance.distanceCache.size).toBe(0);
    });

    it('should clear all Map objects correctly', async () => {
      await dataManager.init(mockScene);

      // Verify maps have data
      expect(dataManager.objectsById.size).toBeGreaterThan(0);
      expect(dataManager.distanceCache.size).toBeGreaterThan(0);
      expect(dataManager.orbitalParamsById.size).toBeGreaterThan(0);

      // Store the original maps to verify they're cleared
      const originalObjectsById = dataManager.objectsById;
      const originalDistanceCache = dataManager.distanceCache;
      const originalOrbitalParamsById = dataManager.orbitalParamsById;

      DataManager.resetInstance();

      // Get new instance
      const newInstance = DataManager.getInstance();

      // New instance should have fresh, empty maps
      expect(newInstance.objectsById).not.toBe(originalObjectsById);
      expect(newInstance.objectsById.size).toBe(0);
      expect(newInstance.distanceCache.size).toBe(0);
      expect(newInstance.orbitalParamsById.size).toBe(0);
    });

    it('should be idempotent - multiple resets should not throw', () => {
      expect(() => {
        DataManager.resetInstance();
        DataManager.resetInstance();
        DataManager.resetInstance();
      }).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getInstance calls', () => {
      const instance1 = DataManager.getInstance();
      const instance2 = DataManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return new instance after reset', () => {
      const instance1 = DataManager.getInstance();
      DataManager.resetInstance();
      const instance2 = DataManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should throw when trying to instantiate directly', () => {
      expect(() => {
        new DataManager();
      }).toThrow('DataManager already instantiated');
    });
  });

  describe('Data Access After Reset', () => {
    it('should be able to initialize again after reset', async () => {
      // First initialization
      await dataManager.init(mockScene);
      expect(dataManager.cosmicObjects).not.toBeNull();

      // Reset
      DataManager.resetInstance();

      // Get new instance and initialize again
      const newManager = DataManager.getInstance();
      await newManager.init(mockScene);

      expect(newManager.cosmicObjects).not.toBeNull();
      expect(newManager.constants).not.toBeNull();
    });

    it('should return empty results when accessing data before init', () => {
      const freshManager = DataManager.getInstance();

      expect(freshManager.cosmicObjects).toBeNull();
      expect(freshManager.constants).toBeNull();
      expect(freshManager.objectsById.size).toBe(0);
    });
  });
});
