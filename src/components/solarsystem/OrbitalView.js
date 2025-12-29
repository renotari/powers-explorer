/**
 * OrbitalView - Display planets on elliptical orbits around the Sun
 *
 * Responsibilities:
 * - Draw elliptical orbit paths
 * - Position Sun at center (focus of ellipses)
 * - Position planets using real-time or default angular positions
 * - Handle NASA API data or offline fallback
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { PlanetRenderer } from './PlanetRenderer.js';
import { DataManager } from '@/managers/DataManager.js';
import { StateManager } from '@/managers/StateManager.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { GAME_WIDTH, GAME_HEIGHT, SOLAR_SYSTEM, COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class OrbitalView extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.dataManager = DataManager.getInstance();
    this.stateManager = StateManager.getInstance();
    this.planetRenderers = [];
    this.sunRenderer = null;
    this.orbitGraphics = [];
    this.dataSourceIndicator = null;

    this.create();
  }

  /**
   * Create the orbital view
   */
  async create() {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Calculate scale factor to fit Neptune's orbit
    const orbitalParams = this.dataManager.getOrbitalParameters();
    const neptuneOrbit = orbitalParams?.find(p => p.id === 'neptune');
    if (!neptuneOrbit) {
      console.error('[OrbitalView] Neptune orbital parameters not found');
      return;
    }
    const maxOrbitRadius = Math.min(GAME_WIDTH, GAME_HEIGHT) / 2 - 50;
    this.scaleFactor = maxOrbitRadius / neptuneOrbit.semiMajorAxis;

    // Create Sun at center
    const sunData = this.dataManager.getPlanetById(SOLAR_SYSTEM.SUN_ID);
    if (sunData) {
      this.sunRenderer = new PlanetRenderer(
        this.scene,
        sunData,
        centerX,
        centerY,
        12, // Fixed size for Sun
        { interactive: true }
      );
      this.sunRenderer.setLabelVisible(false);

      this.sunRenderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });
    }

    // Draw orbits
    this.drawOrbits(centerX, centerY);

    // Get or use default positions
    const positions = this.getPositions();

    // Create planets
    this.createPlanets(centerX, centerY, positions);

    // Show data source indicator
    this.createDataSourceIndicator();
  }

  /**
   * Get planet positions (real-time or default)
   * @returns {Object} Position data mapping planet ID to theta (radians)
   */
  getPositions() {
    const orbitalPositions = this.stateManager.getOrbitalPositions();

    if (orbitalPositions) {
      // Use real-time data from NASA
      return orbitalPositions;
    } else {
      // Use default positions from orbital-parameters.json
      const orbitalParams = this.dataManager.getOrbitalParameters();
      const positions = {};
      orbitalParams.forEach(param => {
        // Convert default angle from degrees to radians
        positions[param.id] = param.defaultAngularPosition * Math.PI / 180;
      });
      return positions;
    }
  }

  /**
   * Draw elliptical orbits
   * @param {number} centerX - Center X
   * @param {number} centerY - Center Y
   */
  drawOrbits(centerX, centerY) {
    const orbitalParams = this.dataManager.getOrbitalParameters();

    orbitalParams.forEach(param => {
      const a = param.semiMajorAxis * this.scaleFactor;
      const e = param.eccentricity;
      const b = ScaleCalculator.calculateSemiMinorAxis(a, e);
      const c = ScaleCalculator.calculateFocalDistance(a, e);

      // Create graphics for this orbit
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(1, SOLAR_SYSTEM.ORBIT_LINE_COLOR, SOLAR_SYSTEM.ORBIT_LINE_ALPHA);

      // Draw ellipse centered at (centerX + c, centerY)
      // Sun is at focus (centerX, centerY)
      // Phaser expects full width/height, not semi-axes
      graphics.strokeEllipse(centerX + c, centerY, 2 * a, 2 * b);

      this.container.add(graphics);
      this.orbitGraphics.push(graphics);
    });
  }

  /**
   * Create planets on orbits
   * @param {number} centerX - Sun X position (focus)
   * @param {number} centerY - Sun Y position (focus)
   * @param {Object} positions - Position data {planetId: theta}
   */
  createPlanets(centerX, centerY, positions) {
    const orbitalParams = this.dataManager.getOrbitalParameters();

    // Size scale for planets in orbital view
    const baseSizes = {
      mercury: 4, venus: 6, earth: 6, mars: 5,
      jupiter: 12, saturn: 11, uranus: 8, neptune: 8
    };

    orbitalParams.forEach(param => {
      const planetData = this.dataManager.getPlanetById(param.id);
      if (!planetData) return;

      // Get angular position
      const theta = positions[param.id] || 0;

      // Calculate position on ellipse
      const position = ScaleCalculator.getPositionOnEllipse(
        param.semiMajorAxis,
        param.eccentricity,
        theta,
        centerX,
        centerY,
        this.scaleFactor
      );

      // Create planet renderer
      const radius = baseSizes[param.id] || 5;
      const renderer = new PlanetRenderer(
        this.scene,
        planetData,
        position.x,
        position.y,
        radius,
        { interactive: true }
      );
      renderer.setLabelVisible(false);

      renderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });

      this.planetRenderers.push(renderer);
    });
  }

  /**
   * Create data source indicator
   */
  createDataSourceIndicator() {
    const isRealTime = this.stateManager.isUsingRealTimeData();
    const text = isRealTime ? 'Real-time data' : 'Simulated positions';
    const color = isRealTime ? '#4CAF50' : '#FFA726';

    this.dataSourceIndicator = this.scene.add.text(
      GAME_WIDTH - 10,
      GAME_HEIGHT - 10,
      text,
      {
        fontSize: '12px',
        color: color,
        fontFamily: 'Arial'
      }
    ).setOrigin(1, 1);
    this.container.add(this.dataSourceIndicator);
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove sun renderer listeners
    if (this.sunRenderer) {
      this.sunRenderer.off('planetClicked');
      this.sunRenderer.destroy();
      this.sunRenderer = null;
    }

    // Remove planet renderer listeners
    this.planetRenderers.forEach(renderer => {
      renderer.off('planetClicked');
      renderer.destroy();
    });
    this.planetRenderers = [];

    this.orbitGraphics.forEach(graphics => graphics.destroy());
    this.orbitGraphics = [];

    if (this.dataSourceIndicator) {
      this.dataSourceIndicator.destroy();
      this.dataSourceIndicator = null;
    }

    super.destroy();
  }
}
