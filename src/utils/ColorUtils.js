/**
 * ColorUtils.js
 *
 * Utility functions for color parsing and manipulation.
 */

/**
 * Converts a hex color string to a Phaser-compatible integer color.
 *
 * @param {string} hexString - Hex color string (e.g., '#FF5733')
 * @returns {number} Integer color value for Phaser
 *
 * @example
 * parseHexColor('#FF5733') // Returns 0xFF5733
 * parseHexColor('#00FF00') // Returns 0x00FF00
 */
export function parseHexColor(hexString) {
  if (!hexString || typeof hexString !== 'string') {
    console.warn('[ColorUtils] Invalid hex color string:', hexString);
    return 0xFFFFFF; // Default to white
  }

  return parseInt(hexString.replace('#', '0x'));
}

/**
 * Validates if a string is a valid hex color.
 *
 * @param {string} hexString - Hex color string to validate
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(hexString) {
  return /^#[0-9A-F]{6}$/i.test(hexString);
}
