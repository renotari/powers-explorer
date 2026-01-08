/**
 * SizeComparisonView - Display planets side-by-side with proportional sizes
 *
 * Responsibilities:
 * - Calculate proportional sizes to fit screen
 * - Arrange planets horizontally
 * - Sun toggle functionality
 * - Labels for each body
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { PlanetRenderer } from './PlanetRenderer.js';
import { StateManager } from '@/managers/StateManager.js';
import { DataManager } from '@/managers/DataManager.js';
import { GAME_WIDTH, GAME_HEIGHT, SOLAR_SYSTEM, COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class SizeComparisonView extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.stateManager = StateManager.getInstance();
    this.dataManager = DataManager.getInstance();
    this.planetRenderers = [];
    this.sunToggleButton = null;

    this.create();
  }

  /**
   * Create the size comparison view
   */
  create() {
    const includeSun = this.stateManager.isSunVisible();
    this.buildVisualization(includeSun);
    this.createSunToggleButton();
  }

  /**
   * Build the planet visualization
   * @param {boolean} includeSun - Whether to include the Sun
   */
  buildVisualization(includeSun) {
    // Get planet data
    const planetIds = SOLAR_SYSTEM.PLANET_IDS;
    const planets = planetIds.map(id => this.dataManager.getPlanetById(id)).filter(Boolean);

    // Get sun data if needed
    const sunData = this.dataManager.getPlanetById(SOLAR_SYSTEM.SUN_ID);
    const bodies = includeSun && sunData ? [sunData, ...planets] : planets;

    // Calculate sizes and positions
    const layout = this.calculateLayout(bodies);

    // Create planet renderers
    this.planetRenderers = layout.map(item => {
      const renderer = new PlanetRenderer(
        this.scene,
        item.data,
        item.x,
        item.y,
        item.radius,
        { interactive: true }
      );
      renderer.setLabelVisible(true);

      // Forward click events
      renderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });

      return renderer;
    });
  }

  /**
   * Calculate layout for bodies
   * @param {Array} bodies - Array of body data objects
   * @returns {Array} Layout array with {data, x, y, radius}
   */
  calculateLayout(bodies) {
    const centerY = GAME_HEIGHT / 2;

    // Target: use 90% of width, centered
    const targetWidthRatio = 0.9;
    const targetWidth = GAME_WIDTH * targetWidthRatio;  // 1152px

    // Guard against empty array or invalid data
    if (bodies.length === 0) {
      console.warn('[SizeComparisonView] No bodies to display');
      return [];
    }

    // Find largest diameter for proportional sizing
    const maxDiameter = Math.max(...bodies.map(b => b.diameter));

    // Guard against invalid data (all diameters zero or negative)
    if (maxDiameter <= 0) {
      console.error('[SizeComparisonView] Invalid body data: all diameters <= 0');
      return [];
    }

    // Calculate total proportional width needed
    // Sum of (each diameter / max diameter) - e.g., Jupiter=1, Earth=0.089, Mercury=0.034
    const totalProportionalSize = bodies.reduce(
      (sum, b) => sum + b.diameter / maxDiameter, 0
    );

    // Guard against division by zero
    if (totalProportionalSize <= 0) {
      console.error('[SizeComparisonView] Invalid proportional size calculation');
      return [];
    }

    // Spacing between planets
    const spacing = 15;
    const totalSpacing = spacing * (bodies.length - 1);

    // Scale: how many pixels per "unit" (where largest planet = 1 unit)?
    // targetWidth = totalProportionalSize * scale + totalSpacing
    const scale = (targetWidth - totalSpacing) / totalProportionalSize;

    // Height constraint: largest planet shouldn't exceed 70% of screen height
    const maxAllowedSize = GAME_HEIGHT * 0.7;  // 504px
    const finalScale = Math.min(scale, maxAllowedSize);

    // Calculate actual total width and center horizontally
    const actualTotalWidth = totalProportionalSize * finalScale + totalSpacing;
    const startX = (GAME_WIDTH - actualTotalWidth) / 2;

    // Calculate positions
    let currentX = startX;
    return bodies.map(body => {
      const size = (body.diameter / maxDiameter) * finalScale;
      const radius = Math.max(size / 2, SOLAR_SYSTEM.MIN_PLANET_RADIUS);

      const x = currentX + radius;
      currentX += size + spacing;

      return {
        data: body,
        x,
        y: centerY,
        radius
      };
    });
  }

  /**
   * Create Sun toggle button
   */
  createSunToggleButton() {
    const buttonX = GAME_WIDTH - 120;
    const buttonY = 40;

    // Button background
    this.sunToggleButton = this.scene.add.rectangle(
      buttonX,
      buttonY,
      100,
      35,
      parseInt(COLORS.PRIMARY.replace('#', '0x'))
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.sunToggleButton);

    // Button text
    const includeSun = this.stateManager.isSunVisible();
    const buttonText = this.scene.add.text(
      buttonX,
      buttonY,
      includeSun ? 'Hide Sun' : 'Show Sun',
      {
        fontSize: '14px',
        color: COLORS.TEXT,
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);
    this.container.add(buttonText);

    // Store reference to text for updates
    this.sunToggleButtonText = buttonText;

    // Click handler
    this.sunToggleButton.on('pointerdown', () => {
      const currentlyVisible = this.stateManager.isSunVisible();
      this.stateManager.setSunVisible(!currentlyVisible);
      this.toggleSun();
    });

    // Hover effects
    this.sunToggleButton.on('pointerover', () => {
      this.sunToggleButton.setAlpha(0.8);
      buttonText.setScale(1.05);
    });

    this.sunToggleButton.on('pointerout', () => {
      this.sunToggleButton.setAlpha(1);
      buttonText.setScale(1);
    });
  }

  /**
   * Toggle Sun visibility
   */
  toggleSun() {
    const includeSun = this.stateManager.isSunVisible();
    this.sunToggleButtonText.setText(includeSun ? 'Hide Sun' : 'Show Sun');

    // Clear existing renderers
    this.clearRenderers();

    // Rebuild visualization
    this.buildVisualization(includeSun);

    this.emit('sunToggled', includeSun);
  }

  /**
   * Clear all planet renderers
   */
  clearRenderers() {
    // Remove forward listeners before destroying
    this.planetRenderers.forEach(renderer => {
      renderer.off('planetClicked');
      renderer.destroy();
    });
    this.planetRenderers = [];
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearRenderers();

    // Remove sun toggle button listeners
    if (this.sunToggleButton) {
      this.sunToggleButton.off('pointerdown');
      this.sunToggleButton.off('pointerover');
      this.sunToggleButton.off('pointerout');
      this.sunToggleButton.destroy();
      this.sunToggleButton = null;
    }
    if (this.sunToggleButtonText) {
      this.sunToggleButtonText.destroy();
      this.sunToggleButtonText = null;
    }

    super.destroy();
  }
}
