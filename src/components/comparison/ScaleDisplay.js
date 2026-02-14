/**
 * ScaleDisplay - Display objects at accurate relative scale
 *
 * CRITICAL: Uses ScaleCalculator for proper sizing
 * - Larger object shown at visible size (up to 40% of screen)
 * - Smaller object scaled proportionally (minimum 10px)
 * - Displays size ratio
 *
 * Position side-by-side for visual comparison
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { DataManager } from '@/managers/DataManager.js';
import { I18nManager } from '@/managers/I18nManager.js';
import { COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class ScaleDisplay extends ComponentBase {
  /**
   * Constructor
   *
   * @param {Phaser.Scene} scene - Parent scene
   * @param {Object} config - Configuration
   */
  constructor(scene, config = {}) {
    super(scene, config);

    this.dataManager = DataManager.getInstance();

    // Store references to object sprites for animation
    this.obj1Sprite = null;
    this.obj2Sprite = null;
    this.obj1Data = null;
    this.obj2Data = null;
    this.ratioText = null;
  }

  /**
   * Display two objects at relative scale
   *
   * @param {string} obj1Id - First object ID
   * @param {string} obj2Id - Second object ID
   */
  displayObjects(obj1Id, obj2Id) {
    console.log(`[ScaleDisplay] Displaying objects: ${obj1Id} and ${obj2Id}`);

    // Get object data
    const obj1 = this.dataManager.getObjectById(obj1Id);
    const obj2 = this.dataManager.getObjectById(obj2Id);

    if (!obj1 || !obj2) {
      console.error('[ScaleDisplay] Object(s) not found');
      return;
    }

    // Determine which is larger
    const larger = obj1.diameter > obj2.diameter ? obj1 : obj2;
    const smaller = obj1.diameter > obj2.diameter ? obj2 : obj1;

    // Store for later reference
    this.obj1Data = larger;
    this.obj2Data = smaller;

    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // Calculate screen sizes using ScaleCalculator
    const largerSize = ScaleCalculator.calculateScreenDiameter(
      larger.diameter,
      screenWidth,
      larger.diameter  // Reference is itself (will be at max size)
    );

    const smallerSize = ScaleCalculator.calculateScreenDiameter(
      smaller.diameter,
      screenWidth,
      larger.diameter  // Reference is the larger object
    );

    console.log(`[ScaleDisplay] ${larger.name} diameter: ${largerSize}px`);
    console.log(`[ScaleDisplay] ${smaller.name} diameter: ${smallerSize}px`);

    // Calculate ratio
    const ratio = ScaleCalculator.calculateSizeRatio(larger.diameter, smaller.diameter);

    // Create larger object sprite (left side)
    this.obj1Sprite = this.scene.add.circle(
      screenWidth / 3,
      screenHeight / 2,
      largerSize / 2,  // radius
      parseHexColor(larger.color)
    );

    // Create smaller object sprite (right side)
    this.obj2Sprite = this.scene.add.circle(
      2 * screenWidth / 3,
      screenHeight / 2,
      smallerSize / 2,  // radius
      parseHexColor(smaller.color)
    );

    // Add to container
    this.container.add([this.obj1Sprite, this.obj2Sprite]);

    // Display labels
    this.createLabels(larger, smaller, screenWidth, screenHeight);

    // Display ratio
    this.displayRatio(larger, smaller, ratio, screenWidth);

    console.log(`[ScaleDisplay] Display complete. Ratio: ${ratio.toFixed(2)}×`);
  }

  /**
   * Create labels for objects
   *
   * @param {Object} larger - Larger object data
   * @param {Object} smaller - Smaller object data
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   */
  createLabels(larger, smaller, screenWidth, screenHeight) {
    const i18n = I18nManager.getInstance();
    const largerTr = i18n.getObjectTranslation(larger.id);
    const smallerTr = i18n.getObjectTranslation(smaller.id);
    const largerName = largerTr?.name ?? larger.name;
    const smallerName = smallerTr?.name ?? smaller.name;

    // Larger object label
    const label1 = this.scene.add.text(
      screenWidth / 3,
      screenHeight / 2 + 300,
      largerName,
      {
        fontSize: '30px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Smaller object label
    const label2 = this.scene.add.text(
      2 * screenWidth / 3,
      screenHeight / 2 + 300,
      smallerName,
      {
        fontSize: '30px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Larger object diameter
    const diameter1 = this.scene.add.text(
      screenWidth / 3,
      screenHeight / 2 + 338,
      ScaleCalculator.formatScale(larger.diameter),
      {
        fontSize: '21px',
        color: '#cccccc',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Smaller object diameter
    const diameter2 = this.scene.add.text(
      2 * screenWidth / 3,
      screenHeight / 2 + 338,
      ScaleCalculator.formatScale(smaller.diameter),
      {
        fontSize: '21px',
        color: '#cccccc',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    this.container.add([label1, label2, diameter1, diameter2]);
  }

  /**
   * Display size ratio
   *
   * @param {Object} larger - Larger object
   * @param {Object} smaller - Smaller object
   * @param {number} ratio - Size ratio
   * @param {number} screenWidth - Screen width
   */
  displayRatio(larger, smaller, ratio, screenWidth) {
    const i18n = I18nManager.getInstance();
    const largerTr = i18n.getObjectTranslation(larger.id);
    const smallerTr = i18n.getObjectTranslation(smaller.id);
    const largerName = largerTr?.name ?? larger.name;
    const smallerName = smallerTr?.name ?? smaller.name;

    this.ratioText = this.scene.add.text(
      screenWidth / 2,
      90,
      i18n.t('comparison.ratio', { name1: largerName, ratio: `${ratio.toFixed(2)}×`, name2: smallerName }),
      {
        fontSize: '36px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5);

    this.container.add(this.ratioText);
  }

  /**
   * Get object sprite positions
   * Used for distance animation
   *
   * @returns {Object} Object positions {obj1: {x, y}, obj2: {x, y}}
   */
  getObjectPositions() {
    if (!this.obj1Sprite || !this.obj2Sprite) {
      return null;
    }

    return {
      obj1: { x: this.obj1Sprite.x, y: this.obj1Sprite.y },
      obj2: { x: this.obj2Sprite.x, y: this.obj2Sprite.y }
    };
  }

  /**
   * Get object sprite references
   * Used for distance animation
   *
   * @returns {Object} Sprite references {obj1Sprite, obj2Sprite}
   */
  getSprites() {
    return {
      obj1Sprite: this.obj1Sprite,
      obj2Sprite: this.obj2Sprite
    };
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Clear references
    this.obj1Sprite = null;
    this.obj2Sprite = null;
    this.obj1Data = null;
    this.obj2Data = null;
    this.ratioText = null;

    // Call parent destroy
    super.destroy();
  }
}
