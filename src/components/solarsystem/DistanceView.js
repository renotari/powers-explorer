/**
 * DistanceView - Display planets at their orbital distances from the Sun
 *
 * Responsibilities:
 * - Position Sun at left edge
 * - Use logarithmic scaling for distances
 * - Scale planet sizes proportionally
 * - Show AU distance markers
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { PlanetRenderer } from './PlanetRenderer.js';
import { DataManager } from '@/managers/DataManager.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { GAME_WIDTH, GAME_HEIGHT, SOLAR_SYSTEM, COLORS } from '@/utils/Constants.js';

export class DistanceView extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.dataManager = DataManager.getInstance();
    this.planetRenderers = [];
    this.sunRenderer = null;
    this.distanceMarkers = [];

    this.create();
  }

  /**
   * Create the distance view
   */
  create() {
    const sunX = 60;
    const centerY = GAME_HEIGHT / 2;

    // Create Sun
    const sunData = this.dataManager.getPlanetById(SOLAR_SYSTEM.SUN_ID);
    if (sunData) {
      this.sunRenderer = new PlanetRenderer(
        this.scene,
        sunData,
        sunX,
        centerY,
        25, // Fixed prominent size for Sun
        { interactive: true }
      );
      this.sunRenderer.setLabelVisible(true);

      this.sunRenderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });
    }

    // Get planet data with orbital distances
    const layout = this.calculateLayout(sunX, centerY);

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

    // Draw distance markers
    this.drawDistanceMarkers(sunX, centerY);
  }

  /**
   * Calculate layout for planets
   * @param {number} sunX - Sun X position
   * @param {number} centerY - Center Y position
   * @returns {Array} Layout array
   */
  calculateLayout(sunX, centerY) {
    const planetIds = SOLAR_SYSTEM.PLANET_IDS;
    const availableWidth = GAME_WIDTH - sunX - 60;

    // Find maximum distance (Neptune)
    const orbitalParams = this.dataManager.getOrbitalParameters();
    const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));

    // Find maximum planet diameter for sizing
    const planets = planetIds.map(id => this.dataManager.getPlanetById(id)).filter(Boolean);
    const maxPlanetDiameter = Math.max(...planets.map(p => p.diameter));

    // Size scale factor - largest planet gets 15px radius
    const planetSizeScale = 15 / maxPlanetDiameter;

    return planets.map(planet => {
      const orbitalData = this.dataManager.getOrbitalParametersById(planet.id);
      if (!orbitalData) return null;

      // Calculate screen position using logarithmic scaling
      const screenX = sunX + ScaleCalculator.realToScreen(
        orbitalData.semiMajorAxis,
        maxDistance,
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
   * Draw AU distance markers
   * @param {number} sunX - Sun X position
   * @param {number} centerY - Center Y position
   */
  drawDistanceMarkers(sunX, centerY) {
    const availableWidth = GAME_WIDTH - sunX - 60;
    const orbitalParams = this.dataManager.getOrbitalParameters();
    const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));

    // AU in meters
    const AU = 149597870700;

    // Draw markers at 1, 5, 10, 20, 30 AU
    const auMarkers = [1, 5, 10, 20, 30];

    auMarkers.forEach(au => {
      const distanceMeters = au * AU;
      if (distanceMeters > maxDistance) return;

      const screenX = sunX + ScaleCalculator.realToScreen(
        distanceMeters,
        maxDistance,
        availableWidth
      );

      // Vertical line
      const line = this.scene.add.line(
        0, 0,
        screenX, centerY - 15,
        screenX, centerY + 15,
        SOLAR_SYSTEM.DISTANCE_MARKER_COLOR
      ).setOrigin(0, 0).setAlpha(0.5);
      this.container.add(line);
      this.distanceMarkers.push(line);

      // AU label
      const label = this.scene.add.text(
        screenX,
        centerY + 25,
        `${au} AU`,
        {
          fontSize: '11px',
          color: COLORS.SECONDARY,
          fontFamily: 'Arial'
        }
      ).setOrigin(0.5);
      this.container.add(label);
      this.distanceMarkers.push(label);
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.sunRenderer) {
      this.sunRenderer.destroy();
      this.sunRenderer = null;
    }

    this.planetRenderers.forEach(renderer => renderer.destroy());
    this.planetRenderers = [];

    this.distanceMarkers.forEach(marker => marker.destroy());
    this.distanceMarkers = [];

    super.destroy();
  }
}
