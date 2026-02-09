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
    const targetWidth = GAME_WIDTH * SOLAR_SYSTEM.SIZE_WIDTH_FACTOR;
    const minSlot = SOLAR_SYSTEM.SIZE_MIN_SLOT_WIDTH;
    const spacing = 23;

    if (bodies.length === 0) {
      console.warn('[SizeComparisonView] No bodies to display');
      return [];
    }

    const maxDiameter = Math.max(...bodies.map(b => b.diameter));
    if (maxDiameter <= 0) {
      console.error('[SizeComparisonView] Invalid body data: all diameters <= 0');
      return [];
    }

    const totalSpacing = spacing * (bodies.length - 1);

    // Height constraint: largest planet shouldn't exceed SIZE_HEIGHT_FACTOR of screen height
    const maxAllowedHeight = GAME_HEIGHT * SOLAR_SYSTEM.SIZE_HEIGHT_FACTOR;

    // Step 1: Compute radii from a height-constrained scale, then assign slots
    const sizeScale = Math.min(
      (targetWidth - totalSpacing) / bodies.reduce((sum, b) => sum + b.diameter / maxDiameter, 0),
      maxAllowedHeight
    );

    // Step 2: Compute each body's visual diameter and slot width
    const items = bodies.map(body => {
      const visualDiameter = (body.diameter / maxDiameter) * sizeScale;
      const radius = Math.max(visualDiameter / 2, SOLAR_SYSTEM.MIN_PLANET_RADIUS);
      const slotWidth = Math.max(visualDiameter, minSlot);
      return { data: body, radius, slotWidth, visualDiameter };
    });

    // Step 3: If total exceeds targetWidth, scale down only the oversized slots
    const totalSlotWidth = items.reduce((sum, item) => sum + item.slotWidth, 0) + totalSpacing;
    if (totalSlotWidth > targetWidth) {
      const excess = totalSlotWidth - targetWidth;
      // Only shrink slots that are larger than minSlot
      const shrinkableTotal = items.reduce(
        (sum, item) => sum + Math.max(0, item.slotWidth - minSlot), 0
      );
      if (shrinkableTotal > 0) {
        const shrinkRatio = Math.min(1, excess / shrinkableTotal);
        items.forEach(item => {
          const shrinkable = Math.max(0, item.slotWidth - minSlot);
          item.slotWidth -= shrinkable * shrinkRatio;
          // Also constrain the visual radius to fit within the slot
          item.radius = Math.max(
            Math.min(item.radius, item.slotWidth / 2),
            SOLAR_SYSTEM.MIN_PLANET_RADIUS
          );
        });
      }
    }

    // Step 4: Center horizontally and position each body in the center of its slot
    const finalTotalWidth = items.reduce((sum, item) => sum + item.slotWidth, 0) + totalSpacing;
    let currentX = (GAME_WIDTH - finalTotalWidth) / 2;

    return items.map(item => {
      const x = currentX + item.slotWidth / 2;
      currentX += item.slotWidth + spacing;
      return {
        data: item.data,
        x,
        y: centerY,
        radius: item.radius
      };
    });
  }

  /**
   * Create Sun toggle button
   */
  createSunToggleButton() {
    const buttonX = GAME_WIDTH - 180;
    const buttonY = 60;

    // Button background
    this.sunToggleButton = this.scene.add.rectangle(
      buttonX,
      buttonY,
      150,
      53,
      parseHexColor(COLORS.PRIMARY)
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.sunToggleButton);

    // Button text
    const includeSun = this.stateManager.isSunVisible();
    const buttonText = this.scene.add.text(
      buttonX,
      buttonY,
      includeSun ? 'Hide Sun' : 'Show Sun',
      {
        fontSize: '21px',
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
