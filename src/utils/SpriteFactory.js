/**
 * SpriteFactory - Creates unified visual representations for cosmic objects
 *
 * Returns a wrapper object with a consistent API regardless of whether
 * the underlying Phaser game object is a Circle (Arc) or Image.
 *
 * Key: The wrapper exposes .radius / .setRadius() so existing code
 * that reads sprite.radius continues to work with both types.
 */

import { parseHexColor } from '@/utils/ColorUtils.js';

/** Size in pixels of the planet body within standard images */
const STANDARD_BODY_SIZE = 512;

/**
 * Build a wrapper around a Phaser game object with unified API
 *
 * @param {Phaser.GameObjects.Arc|Phaser.GameObjects.Image} gameObj
 * @param {number} initialRadius
 * @param {string} type - 'circle' or 'image'
 * @param {Object} [imageConfig] - Image config for oversized handling
 * @returns {Object} Wrapper with .radius, .gameObject, etc.
 */
function buildWrapper(gameObj, initialRadius, type, imageConfig) {
  const wrapper = {
    gameObject: gameObj,
    _radius: initialRadius,
    _type: type,
    _imageConfig: imageConfig || null,

    setRadius(r) {
      this._radius = r;
      if (this._type === 'image') {
        const diameter = r * 2;
        if (this._imageConfig && this._imageConfig.width > STANDARD_BODY_SIZE) {
          const bodyFraction = STANDARD_BODY_SIZE / this._imageConfig.width;
          const fullDiameter = diameter / bodyFraction;
          this.gameObject.setDisplaySize(fullDiameter, fullDiameter);
        } else {
          this.gameObject.setDisplaySize(diameter, diameter);
        }
      } else {
        this.gameObject.setRadius(r);
      }
    },

    setPosition(x, y) { this.gameObject.setPosition(x, y); },
    setAlpha(a) { this.gameObject.setAlpha(a); },
    setInteractive(cfg) { this.gameObject.setInteractive(cfg); },
    on(event, fn) { this.gameObject.on(event, fn); return this; },
    off(event, fn) { this.gameObject.off(event, fn); return this; },
    disableInteractive() { this.gameObject.disableInteractive(); },
    destroy() { this.gameObject.destroy(); }
  };

  Object.defineProperty(wrapper, 'radius', {
    get() { return this._radius; },
    set(r) { this.setRadius(r); },
    enumerable: true
  });

  Object.defineProperty(wrapper, 'x', {
    get() { return this.gameObject.x; },
    set(v) { this.gameObject.x = v; },
    enumerable: true
  });

  Object.defineProperty(wrapper, 'y', {
    get() { return this.gameObject.y; },
    set(v) { this.gameObject.y = v; },
    enumerable: true
  });

  Object.defineProperty(wrapper, 'scale', {
    get() { return this.gameObject.scale; },
    set(v) { this.gameObject.setScale(v); },
    enumerable: true
  });

  return wrapper;
}

export class SpriteFactory {
  /**
   * Create a visual representation for a cosmic object.
   * Returns an Image-based sprite if the object has an image configured
   * and the texture is loaded, otherwise falls back to a colored circle.
   *
   * @param {Phaser.Scene} scene
   * @param {Object} objectData - Object data from DataManager (must have .id, .color, optionally .image)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Desired radius in pixels (for the planet body)
   * @returns {Object} Wrapper with unified .radius/.gameObject API
   */
  static create(scene, objectData, x, y, radius) {
    const imageConfig = objectData?.image;
    const textureKey = objectData?.id;

    // Try image-based rendering
    if (imageConfig && textureKey && scene.textures.exists(textureKey)) {
      const img = scene.add.image(x, y, textureKey);
      const diameter = radius * 2;

      if (imageConfig.width && imageConfig.width > STANDARD_BODY_SIZE) {
        // Oversized image (e.g. Saturn with rings):
        // Scale so the inner 512px body matches the desired diameter
        const bodyFraction = STANDARD_BODY_SIZE / imageConfig.width;
        const fullDiameter = diameter / bodyFraction;
        img.setDisplaySize(fullDiameter, fullDiameter);
      } else {
        img.setDisplaySize(diameter, diameter);
      }

      return buildWrapper(img, radius, 'image', imageConfig);
    }

    // Fallback: colored circle
    const color = objectData?.color
      ? parseHexColor(objectData.color)
      : 0xFFFFFF;
    const circle = scene.add.circle(x, y, radius, color);

    return buildWrapper(circle, radius, 'circle');
  }
}
