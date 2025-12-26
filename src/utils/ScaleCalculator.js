/**
 * ScaleCalculator - All scale-related mathematical calculations
 *
 * This is a CRITICAL utility class that handles:
 * - Screen size calculations for cosmic objects
 * - Logarithmic distance scaling for astronomical distances
 * - Scientific notation formatting
 */

import { SCALE_DISPLAY } from './Constants.js';

export class ScaleCalculator {
  /**
   * Calculate screen diameter for an object relative to a reference size
   *
   * CRITICAL: Uses 10px minimum for visibility and 40% screen maximum
   *
   * @param {number} realDiameter - Real diameter in meters
   * @param {number} screenWidth - Available screen width in pixels
   * @param {number} referenceSize - Reference object size in meters
   * @returns {number} Screen diameter in pixels
   */
  static calculateScreenDiameter(realDiameter, screenWidth, referenceSize) {
    const maxScreenSize = screenWidth * SCALE_DISPLAY.MAX_SCREEN_RATIO;
    const minScreenSize = SCALE_DISPLAY.MIN_SIZE;

    // Calculate size relative to reference, preserving relative sizes
    const ratio = realDiameter / referenceSize;
    const screenSize = maxScreenSize * ratio;

    // Clamp to visible range while preserving ratios
    return Math.max(minScreenSize, Math.min(screenSize, maxScreenSize));
  }

  /**
   * Convert real-world distance to screen distance using logarithmic scaling
   *
   * CRITICAL: Linear scaling won't work for astronomical distances!
   * Earth-Sun distance (150 million km) would need a 150-million-pixel-wide screen.
   *
   * Uses Math.log1p() for better precision near zero.
   *
   * @param {number} realDistance - Real distance in meters
   * @param {number} maxRealDistance - Maximum distance to scale against
   * @param {number} screenWidth - Available screen width in pixels
   * @returns {number} Screen distance in pixels
   */
  static realToScreen(realDistance, maxRealDistance, screenWidth) {
    // Guard against invalid inputs
    if (realDistance <= 0) return 0;
    if (maxRealDistance <= 0) return 0;

    // Use logarithmic scaling for consistent visualization across all cosmic scales
    // log1p(x) = log(1 + x) provides better precision near zero
    const logReal = Math.log1p(realDistance);
    const logMax = Math.log1p(maxRealDistance);

    return (logReal / logMax) * screenWidth;
  }

  /**
   * Calculate object size proportional to displayed distance
   *
   * CRITICAL: Distance uses logarithmic scaling, but object size relative to
   * that scaled distance uses LINEAR proportion to maintain dimensional accuracy
   *
   * Example: Earth-Sun distance at 896px screen width (70% of 1280px)
   * - Sun diameter: 1.39B meters → 1.39B/150B × 896 = ~8.3px
   * - Earth diameter: 12.7M meters → 12.7M/150B × 896 = ~0.076px (floor to 1px)
   *
   * @param {number} realDiameter - Object diameter in meters
   * @param {number} realDistance - Distance being displayed in meters
   * @param {number} screenWidth - Available screen width in pixels
   * @returns {number} Screen diameter in pixels (minimum 1px)
   */
  static calculateProportionalSize(realDiameter, realDistance, screenWidth) {
    // Guard against invalid inputs
    if (realDistance <= 0 || realDiameter <= 0) return 1;

    // Calculate screen distance using logarithmic scaling
    const screenDistance = ScaleCalculator.realToScreen(
      realDistance,
      realDistance,
      screenWidth * 0.7
    );

    // Object size is LINEAR proportion of screen distance
    // This preserves true dimensional relationships
    const linearRatio = realDiameter / realDistance;
    const screenSize = linearRatio * screenDistance;

    // Floor at 1px minimum (no upper clamp for proportional accuracy)
    return Math.max(1, screenSize);
  }

  /**
   * Calculate zoom factor between two scale exponents
   *
   * @param {number} fromExponent - Starting exponent
   * @param {number} toExponent - Target exponent
   * @returns {number} Zoom factor (multiplicative)
   */
  static getZoomFactor(fromExponent, toExponent) {
    return Math.pow(10, toExponent - fromExponent);
  }

  /**
   * Format scale measurement for display
   *
   * Returns format: "1.50 × 10^8 m"
   *
   * Handles edge cases:
   * - Zero → "0 m"
   * - Very small values (< 1e-100) → "~0 m"
   * - Negative values → includes sign
   *
   * @param {number} meters - Distance/size in meters
   * @returns {string} Formatted string in scientific notation
   */
  static formatScale(meters) {
    // Handle zero
    if (meters === 0) {
      return '0 m';
    }

    // Handle very small values (below practical precision)
    if (Math.abs(meters) < 1e-100) {
      return '~0 m';
    }

    // Handle negative values
    const sign = meters < 0 ? '-' : '';
    const absMeters = Math.abs(meters);

    // Calculate exponent and mantissa
    const exponent = Math.floor(Math.log10(absMeters));
    const mantissa = absMeters / Math.pow(10, exponent);

    return `${sign}${mantissa.toFixed(2)} × 10^${exponent} m`;
  }

  /**
   * Calculate size ratio between two objects
   *
   * @param {number} diameter1 - First object diameter in meters
   * @param {number} diameter2 - Second object diameter in meters
   * @returns {number} Ratio (larger / smaller)
   */
  static calculateSizeRatio(diameter1, diameter2) {
    const larger = Math.max(diameter1, diameter2);
    const smaller = Math.min(diameter1, diameter2);

    if (smaller === 0) return Infinity;

    return larger / smaller;
  }

  /**
   * Format time duration into human-readable string
   *
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration (e.g., "1.28 seconds", "8.30 minutes")
   */
  static formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds.toFixed(3)} seconds`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(2)} minutes`;
    } else if (seconds < 86400) {
      return `${(seconds / 3600).toFixed(2)} hours`;
    } else if (seconds < 31536000) {
      return `${(seconds / 86400).toFixed(2)} days`;
    } else {
      return `${(seconds / 31536000).toFixed(2)} years`;
    }
  }
}
