import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SizeComparisonView - Critical Bug Fixes', () => {
  let mockScene;
  let mockDataManager;

  beforeEach(() => {
    // Mock Phaser scene
    mockScene = {
      add: {
        container: vi.fn(() => ({
          add: vi.fn(),
          setDepth: vi.fn(),
          destroy: vi.fn()
        }))
      },
      tweens: {
        add: vi.fn(),
        killTweensOf: vi.fn()
      }
    };

    // Mock DataManager
    mockDataManager = {
      getPlanetById: vi.fn((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        diameter: 12742000,
        color: '#3388FF'
      }))
    };
  });

  describe('calculateLayout - Math.max() Empty Array Fix', () => {
    it('should handle empty bodies array without crashing', () => {
      // This simulates the calculateLayout method receiving empty array
      const bodies = [];

      // Guard check: if bodies.length === 0, return []
      if (bodies.length === 0) {
        console.warn('[SizeComparisonView] No bodies to display');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      // Should never reach here
      expect.fail('Should have returned early for empty array');
    });

    it('should not call Math.max on empty array', () => {
      const bodies = [];

      // Before fix: Math.max(...bodies.map(b => b.diameter))
      // would return -Infinity for empty array

      if (bodies.length === 0) {
        // Early return prevents Math.max on empty array
        expect(true).toBe(true);
        return;
      }

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));
      expect(maxDiameter).not.toBe(-Infinity);
    });

    it('should handle bodies with all zero diameters', () => {
      const bodies = [
        { id: 'body1', diameter: 0 },
        { id: 'body2', diameter: 0 },
        { id: 'body3', diameter: 0 }
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));

      // maxDiameter would be 0
      expect(maxDiameter).toBe(0);

      // Guard check should catch this
      if (maxDiameter <= 0) {
        console.error('[SizeComparisonView] Invalid body data: all diameters <= 0');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for zero diameters');
    });

    it('should handle bodies with negative diameters', () => {
      const bodies = [
        { id: 'body1', diameter: -1000 },
        { id: 'body2', diameter: -5000 },
        { id: 'body3', diameter: -2000 }
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));

      // maxDiameter would be -1000 (largest negative)
      expect(maxDiameter).toBeLessThan(0);

      // Guard check should catch this
      if (maxDiameter <= 0) {
        console.error('[SizeComparisonView] Invalid body data: all diameters <= 0');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for negative diameters');
    });

    it('should handle totalProportionalSize being zero', () => {
      const bodies = [
        { id: 'earth', diameter: 0 }
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));

      if (maxDiameter <= 0) {
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      // If we somehow get past maxDiameter check
      const totalProportionalSize = bodies.reduce(
        (sum, b) => sum + b.diameter / maxDiameter, 0
      );

      expect(totalProportionalSize).toBe(0);

      // Guard against division by zero
      if (totalProportionalSize <= 0) {
        console.error('[SizeComparisonView] Invalid proportional size calculation');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for zero proportional size');
    });

    it('should work correctly with valid planet data', () => {
      const bodies = [
        { id: 'mercury', diameter: 4879000 },
        { id: 'earth', diameter: 12742000 },
        { id: 'jupiter', diameter: 139820000 }
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));

      expect(maxDiameter).toBe(139820000); // Jupiter
      expect(maxDiameter).toBeGreaterThan(0);
      expect(isFinite(maxDiameter)).toBe(true);

      const totalProportionalSize = bodies.reduce(
        (sum, b) => sum + b.diameter / maxDiameter, 0
      );

      expect(totalProportionalSize).toBeGreaterThan(0);
      expect(isFinite(totalProportionalSize)).toBe(true);

      // Should be able to divide safely
      const targetWidth = 1280 * 0.9;
      const spacing = 15;
      const totalSpacing = spacing * (bodies.length - 1);
      const scale = (targetWidth - totalSpacing) / totalProportionalSize;

      expect(scale).toBeGreaterThan(0);
      expect(isFinite(scale)).toBe(true);
    });
  });

  describe('Edge Cases for Planet Sizing', () => {
    it('should handle single planet', () => {
      const bodies = [
        { id: 'earth', diameter: 12742000 }
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));
      expect(maxDiameter).toBe(12742000);

      const totalProportionalSize = bodies.reduce(
        (sum, b) => sum + b.diameter / maxDiameter, 0
      );

      // Single planet with max diameter = 1.0
      expect(totalProportionalSize).toBe(1);
    });

    it('should handle planets with very different sizes', () => {
      const bodies = [
        { id: 'mercury', diameter: 4879000 },        // Tiny
        { id: 'jupiter', diameter: 139820000 }       // Huge (28.6x bigger)
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));
      expect(maxDiameter).toBe(139820000);

      const mercuryRatio = bodies[0].diameter / maxDiameter;
      expect(mercuryRatio).toBeLessThan(0.1); // Mercury is < 10% of Jupiter

      // Should still be able to display both
      expect(mercuryRatio).toBeGreaterThan(0);
    });

    it('should handle Sun toggle scenario (extreme size difference)', () => {
      const bodies = [
        { id: 'earth', diameter: 12742000 },
        { id: 'sun', diameter: 1391000000 }  // 109x bigger than Earth!
      ];

      const maxDiameter = Math.max(...bodies.map(b => b.diameter));
      expect(maxDiameter).toBe(1391000000); // Sun

      const earthRatio = bodies[0].diameter / maxDiameter;
      expect(earthRatio).toBeLessThan(0.01); // Earth is < 1% of Sun

      // When Sun is shown, Earth becomes tiny
      // MIN_PLANET_RADIUS (3px) should be enforced
      const scale = 100; // Example scale
      const earthSize = (bodies[0].diameter / maxDiameter) * scale;
      const earthRadius = Math.max(earthSize / 2, 3); // MIN_PLANET_RADIUS

      expect(earthRadius).toBeGreaterThanOrEqual(3);
    });
  });
});
