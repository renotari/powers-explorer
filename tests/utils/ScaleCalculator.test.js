import { describe, it, expect, beforeEach } from 'vitest';
import { ScaleCalculator } from '../../src/utils/ScaleCalculator.js';

describe('ScaleCalculator - Critical Bug Fixes', () => {
  describe('calculateScreenDiameter - Division by Zero', () => {
    it('should return minimum size when referenceSize is zero', () => {
      const result = ScaleCalculator.calculateScreenDiameter(
        1000000, // realDiameter
        1280,    // screenWidth
        0        // referenceSize = 0 (DIVISION BY ZERO)
      );

      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
      // Should return minimum size (from SCALE_DISPLAY.MIN_SIZE)
      expect(result).toBeGreaterThanOrEqual(5);
    });

    it('should return minimum size when referenceSize is negative', () => {
      const result = ScaleCalculator.calculateScreenDiameter(
        1000000,
        1280,
        -100 // negative reference
      );

      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it('should return minimum size when realDiameter is zero', () => {
      const result = ScaleCalculator.calculateScreenDiameter(
        0,      // realDiameter = 0
        1280,
        1000000
      );

      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it('should return minimum size when realDiameter is negative', () => {
      const result = ScaleCalculator.calculateScreenDiameter(
        -5000,  // negative diameter
        1280,
        1000000
      );

      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it('should work correctly with valid positive values', () => {
      const result = ScaleCalculator.calculateScreenDiameter(
        12742000,   // Earth diameter in meters
        1280,
        139820000   // Reference: Jupiter diameter
      );

      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(5); // MIN_SIZE
    });
  });

  describe('getPositionOnEllipse - Division by Zero & Eccentricity', () => {
    it('should handle eccentricity >= 1 (invalid for ellipses)', () => {
      // Eccentricity >= 1 would cause sqrt of negative in semi-minor axis
      const result = ScaleCalculator.getPositionOnEllipse(
        149598023000, // semi-major axis (Earth orbit)
        1.5,          // eccentricity >= 1 (INVALID!)
        Math.PI / 4,  // theta
        640,          // centerX
        360,          // centerY
        0.000001      // scaleFactor
      );

      expect(result).toBeDefined();
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
    });

    it('should handle negative eccentricity', () => {
      const result = ScaleCalculator.getPositionOnEllipse(
        149598023000,
        -0.5,         // negative eccentricity
        Math.PI / 4,
        640,
        360,
        0.000001
      );

      expect(result).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
    });

    it('should handle near-singularity (e=1, theta=PI)', () => {
      // When e=1 and theta=PI, denominator = 1 + e*cos(PI) = 1 + 1*(-1) = 0
      const result = ScaleCalculator.getPositionOnEllipse(
        149598023000,
        0.99,     // Very high eccentricity (will be clamped to 0.99)
        Math.PI,  // theta = PI (worst case for denominator)
        640,
        360,
        0.000001
      );

      expect(result).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
      // Should not return center when properly handled
      expect(result.x).not.toBe(640);
    });

    it('should work correctly with valid Earth orbital parameters', () => {
      const result = ScaleCalculator.getPositionOnEllipse(
        149598023000, // Earth semi-major axis
        0.0167086,    // Earth eccentricity (valid)
        Math.PI / 2,  // 90 degrees
        640,
        360,
        0.000001
      );

      expect(result).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
      expect(result.x).toBeGreaterThan(0);
      expect(result.y).toBeGreaterThan(0);
    });
  });

  describe('calculateSemiMinorAxis - Eccentricity Validation', () => {
    it('should handle eccentricity >= 1', () => {
      const result = ScaleCalculator.calculateSemiMinorAxis(
        149598023000,
        1.5 // eccentricity >= 1 (would cause sqrt of negative)
      );

      expect(result).toBeDefined();
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
      // Should clamp eccentricity and return valid result
    });

    it('should handle negative eccentricity', () => {
      const result = ScaleCalculator.calculateSemiMinorAxis(
        149598023000,
        -0.3 // negative eccentricity
      );

      expect(result).toBeDefined();
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('should work correctly with valid eccentricity', () => {
      const result = ScaleCalculator.calculateSemiMinorAxis(
        149598023000,
        0.0167086 // Earth's eccentricity
      );

      expect(result).toBeDefined();
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
      // Semi-minor should be slightly less than semi-major for low eccentricity
      expect(result).toBeLessThan(149598023000);
      expect(result).toBeGreaterThan(149598023000 * 0.99);
    });

    it('should return semi-major axis when eccentricity is 0 (perfect circle)', () => {
      const semiMajor = 149598023000;
      const result = ScaleCalculator.calculateSemiMinorAxis(semiMajor, 0);

      expect(result).toBe(semiMajor);
    });
  });

  describe('realToScreen - Logarithmic Scaling Edge Cases', () => {
    it('should return 0 for zero distance', () => {
      const result = ScaleCalculator.realToScreen(0, 1000000, 1280);
      expect(result).toBe(0);
    });

    it('should return 0 for negative distance', () => {
      const result = ScaleCalculator.realToScreen(-1000, 1000000, 1280);
      expect(result).toBe(0);
    });

    it('should return 0 when maxRealDistance is zero', () => {
      const result = ScaleCalculator.realToScreen(500000, 0, 1280);
      expect(result).toBe(0);
    });

    it('should return 0 when maxRealDistance is negative', () => {
      const result = ScaleCalculator.realToScreen(500000, -1000, 1280);
      expect(result).toBe(0);
    });

    it('should work correctly with valid astronomical distances', () => {
      const result = ScaleCalculator.realToScreen(
        149598023000,  // Earth-Sun distance
        4498252900000, // Neptune-Sun distance
        1280
      );

      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1280);
      expect(isFinite(result)).toBe(true);
    });
  });
});
