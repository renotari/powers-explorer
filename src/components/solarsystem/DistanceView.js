/**
 * DistanceView - Display planets at their orbital distances from the Sun
 *
 * Responsibilities:
 * - Position Sun at left edge
 * - Use logarithmic scaling for distances (enhanced mode)
 * - Optionally show real proportions with linear scaling (all bodies become 1px dots)
 * - Scale planet sizes proportionally
 * - Show AU distance markers
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { PlanetRenderer } from './PlanetRenderer.js';
import { DataManager } from '@/managers/DataManager.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { GAME_WIDTH, GAME_HEIGHT, SOLAR_SYSTEM, COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class DistanceView extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.dataManager = DataManager.getInstance();
    this.planetRenderers = [];
    this.sunRenderer = null;
    this.distanceMarkers = [];
    this.realProportions = false;
    this.realProportionsButton = null;
    this.realProportionsButtonText = null;

    this.create();
  }

  /**
   * Create the distance view
   */
  create() {
    this.buildVisualization();
    this.createRealProportionsButton();
  }

  /**
   * Build the Sun, planets, and distance markers
   */
  buildVisualization() {
    const sunX = SOLAR_SYSTEM.DISTANCE_SUN_X;
    const centerY = GAME_HEIGHT / 2;
    const isReal = this.realProportions;

    // Create Sun
    const sunData = this.dataManager.getPlanetById(SOLAR_SYSTEM.SUN_ID);
    if (sunData) {
      let sunRadius;
      if (isReal) {
        // In real proportions, Sun gets same linear scale as everything else
        const orbitalParams = this.dataManager.getOrbitalParameters();
        const constants = this.dataManager.getConstants();
        const AU = constants?.astronomicalUnit?.value || 149597870700;
        const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));
        const availableWidth = GAME_WIDTH - sunX - SOLAR_SYSTEM.DISTANCE_MARGIN;
        const scaleFactor = availableWidth / maxDistance;
        sunRadius = Math.max((sunData.diameter / 2) * scaleFactor, SOLAR_SYSTEM.DISTANCE_REAL_MIN_RADIUS);
      } else {
        sunRadius = SOLAR_SYSTEM.DISTANCE_SUN_RADIUS;
      }

      this.sunRenderer = new PlanetRenderer(
        this.scene,
        sunData,
        sunX,
        centerY,
        sunRadius,
        { interactive: true }
      );
      this.sunRenderer.setLabelVisible(true);

      this.sunRenderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });
    }

    // Calculate layout based on mode
    const layout = isReal
      ? this.calculateRealLayout(sunX, centerY)
      : this.calculateLayout(sunX, centerY);

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

      renderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });

      return renderer;
    });

    // Draw distance markers based on mode
    if (isReal) {
      this.drawRealDistanceMarkers(sunX, centerY);
    } else {
      this.drawDistanceMarkers(sunX, centerY);
    }
  }

  /**
   * Calculate layout for planets (enhanced/logarithmic mode)
   * @param {number} sunX - Sun X position
   * @param {number} centerY - Center Y position
   * @returns {Array} Layout array
   */
  calculateLayout(sunX, centerY) {
    const planetIds = SOLAR_SYSTEM.PLANET_IDS;
    const availableWidth = GAME_WIDTH - sunX - SOLAR_SYSTEM.DISTANCE_MARGIN;

    // Find maximum distance (Neptune)
    const orbitalParams = this.dataManager.getOrbitalParameters();
    if (!orbitalParams || orbitalParams.length === 0) {
      console.warn('[DistanceView] No orbital parameters available');
      return [];
    }

    // Get AU from physical constants for normalization
    const constants = this.dataManager.getConstants();
    const AU = constants?.astronomicalUnit?.value || 149597870700;

    const maxDistanceAU = Math.max(...orbitalParams.map(p => p.semiMajorAxis / AU));

    // Guard against invalid data
    if (maxDistanceAU <= 0) {
      console.error('[DistanceView] Invalid orbital data: maxDistance <= 0');
      return [];
    }

    // Find maximum planet diameter for sizing
    const planets = planetIds.map(id => this.dataManager.getPlanetById(id)).filter(Boolean);

    // Guard against empty planets array
    if (planets.length === 0) {
      console.warn('[DistanceView] No valid planets found');
      return [];
    }

    const maxPlanetDiameter = Math.max(...planets.map(p => p.diameter));

    // Guard against invalid diameter data
    if (maxPlanetDiameter <= 0) {
      console.error('[DistanceView] Invalid planet data: maxPlanetDiameter <= 0');
      return [];
    }

    // Size scale factor - largest planet gets DISTANCE_MAX_PLANET_RADIUS
    const planetSizeScale = SOLAR_SYSTEM.DISTANCE_MAX_PLANET_RADIUS / maxPlanetDiameter;

    return planets.map(planet => {
      const orbitalData = this.dataManager.getOrbitalParametersById(planet.id);
      if (!orbitalData) return null;

      // Calculate screen position using logarithmic scaling
      const screenX = sunX + ScaleCalculator.realToScreen(
        orbitalData.semiMajorAxis / AU,
        maxDistanceAU,
        availableWidth
      );

      // Calculate proportional planet size
      const radius = Math.max(
        planet.diameter * planetSizeScale,
        SOLAR_SYSTEM.MIN_PLANET_RADIUS
      );

      return {
        data: planet,
        x: screenX,
        y: centerY,
        radius
      };
    }).filter(Boolean);
  }

  /**
   * Calculate layout for planets (real proportions / linear mode)
   * Single linear scale for both positions and sizes.
   * @param {number} sunX - Sun X position
   * @param {number} centerY - Center Y position
   * @returns {Array} Layout array
   */
  calculateRealLayout(sunX, centerY) {
    const planetIds = SOLAR_SYSTEM.PLANET_IDS;
    const availableWidth = GAME_WIDTH - sunX - SOLAR_SYSTEM.DISTANCE_MARGIN;

    const orbitalParams = this.dataManager.getOrbitalParameters();
    if (!orbitalParams || orbitalParams.length === 0) {
      console.warn('[DistanceView] No orbital parameters available');
      return [];
    }

    // Max distance in meters (Neptune's semi-major axis)
    const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));
    if (maxDistance <= 0) {
      console.error('[DistanceView] Invalid orbital data: maxDistance <= 0');
      return [];
    }

    // Single linear scale factor: pixels per meter
    const scaleFactor = availableWidth / maxDistance;

    const planets = planetIds.map(id => this.dataManager.getPlanetById(id)).filter(Boolean);
    if (planets.length === 0) return [];

    return planets.map(planet => {
      const orbitalData = this.dataManager.getOrbitalParametersById(planet.id);
      if (!orbitalData) return null;

      // Linear position
      const screenX = sunX + orbitalData.semiMajorAxis * scaleFactor;

      // Same linear scale for size, with 1px minimum
      const radius = Math.max(
        (planet.diameter / 2) * scaleFactor,
        SOLAR_SYSTEM.DISTANCE_REAL_MIN_RADIUS
      );

      return {
        data: planet,
        x: screenX,
        y: centerY,
        radius
      };
    }).filter(Boolean);
  }

  /**
   * Draw AU distance markers (enhanced/logarithmic mode)
   * @param {number} sunX - Sun X position
   * @param {number} centerY - Center Y position
   */
  drawDistanceMarkers(sunX, centerY) {
    const availableWidth = GAME_WIDTH - sunX - SOLAR_SYSTEM.DISTANCE_MARGIN;
    const orbitalParams = this.dataManager.getOrbitalParameters();
    if (!orbitalParams || orbitalParams.length === 0) return;

    // Get AU from physical constants for normalization
    const constants = this.dataManager.getConstants();
    const AU = constants?.astronomicalUnit?.value || 149597870700;

    const maxDistanceAU = Math.max(...orbitalParams.map(p => p.semiMajorAxis / AU));

    // Guard against invalid data
    if (maxDistanceAU <= 0) {
      console.error('[DistanceView] Invalid orbital data for AU markers');
      return;
    }

    // Draw markers at 1, 5, 10, 20, 30 AU
    const auMarkers = [1, 5, 10, 20, 30];

    auMarkers.forEach(au => {
      if (au > maxDistanceAU) return;

      const screenX = sunX + ScaleCalculator.realToScreen(
        au,
        maxDistanceAU,
        availableWidth
      );

      // Vertical line
      const line = this.scene.add.line(
        0, 0,
        screenX, centerY - 23,
        screenX, centerY + 23,
        SOLAR_SYSTEM.DISTANCE_MARKER_COLOR
      ).setOrigin(0, 0).setAlpha(0.5);
      this.container.add(line);
      this.distanceMarkers.push(line);

      // AU label
      const label = this.scene.add.text(
        screenX,
        centerY + 38,
        `${au} AU`,
        {
          fontSize: '17px',
          color: COLORS.SECONDARY,
          fontFamily: 'Arial'
        }
      ).setOrigin(0.5);
      this.container.add(label);
      this.distanceMarkers.push(label);
    });
  }

  /**
   * Draw AU distance markers (real proportions / linear mode)
   * @param {number} sunX - Sun X position
   * @param {number} centerY - Center Y position
   */
  drawRealDistanceMarkers(sunX, centerY) {
    const availableWidth = GAME_WIDTH - sunX - SOLAR_SYSTEM.DISTANCE_MARGIN;
    const orbitalParams = this.dataManager.getOrbitalParameters();
    if (!orbitalParams || orbitalParams.length === 0) return;

    const constants = this.dataManager.getConstants();
    const AU = constants?.astronomicalUnit?.value || 149597870700;

    const maxDistanceAU = Math.max(...orbitalParams.map(p => p.semiMajorAxis / AU));
    if (maxDistanceAU <= 0) return;

    const auMarkers = [1, 5, 10, 20, 30];

    auMarkers.forEach(au => {
      if (au > maxDistanceAU) return;

      // Linear positioning
      const screenX = sunX + (au / maxDistanceAU) * availableWidth;

      // Vertical line
      const line = this.scene.add.line(
        0, 0,
        screenX, centerY - 23,
        screenX, centerY + 23,
        SOLAR_SYSTEM.DISTANCE_MARKER_COLOR
      ).setOrigin(0, 0).setAlpha(0.5);
      this.container.add(line);
      this.distanceMarkers.push(line);

      // AU label
      const label = this.scene.add.text(
        screenX,
        centerY + 38,
        `${au} AU`,
        {
          fontSize: '17px',
          color: COLORS.SECONDARY,
          fontFamily: 'Arial'
        }
      ).setOrigin(0.5);
      this.container.add(label);
      this.distanceMarkers.push(label);
    });
  }

  /**
   * Create the Real Proportions toggle button
   */
  createRealProportionsButton() {
    const buttonX = GAME_WIDTH - 225;
    const buttonY = 60;

    // Button background
    this.realProportionsButton = this.scene.add.rectangle(
      buttonX,
      buttonY,
      225,
      53,
      parseHexColor(COLORS.PRIMARY)
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.realProportionsButton);

    // Button text
    this.realProportionsButtonText = this.scene.add.text(
      buttonX,
      buttonY,
      'Real Proportions',
      {
        fontSize: '21px',
        color: COLORS.TEXT,
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);
    this.container.add(this.realProportionsButtonText);

    // Click handler
    this.realProportionsButton.on('pointerdown', () => {
      this.toggleRealProportions();
    });

    // Hover effects
    this.realProportionsButton.on('pointerover', () => {
      this.realProportionsButton.setAlpha(0.8);
      this.realProportionsButtonText.setScale(1.05);
    });

    this.realProportionsButton.on('pointerout', () => {
      this.realProportionsButton.setAlpha(1);
      this.realProportionsButtonText.setScale(1);
    });
  }

  /**
   * Toggle between real proportions and enhanced view
   */
  toggleRealProportions() {
    this.realProportions = !this.realProportions;
    this.realProportionsButtonText.setText(
      this.realProportions ? 'Enhanced View' : 'Real Proportions'
    );

    // Clear and rebuild
    this.clearRenderers();
    this.buildVisualization();
  }

  /**
   * Clear Sun, planet renderers, and distance markers (but not the button)
   */
  clearRenderers() {
    if (this.sunRenderer) {
      this.sunRenderer.off('planetClicked');
      this.sunRenderer.destroy();
      this.sunRenderer = null;
    }

    this.planetRenderers.forEach(renderer => {
      renderer.off('planetClicked');
      renderer.destroy();
    });
    this.planetRenderers = [];

    this.distanceMarkers.forEach(marker => marker.destroy());
    this.distanceMarkers = [];
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearRenderers();

    // Remove button listeners and destroy
    if (this.realProportionsButton) {
      this.realProportionsButton.off('pointerdown');
      this.realProportionsButton.off('pointerover');
      this.realProportionsButton.off('pointerout');
      this.realProportionsButton.destroy();
      this.realProportionsButton = null;
    }
    if (this.realProportionsButtonText) {
      this.realProportionsButtonText.destroy();
      this.realProportionsButtonText = null;
    }

    super.destroy();
  }
}
