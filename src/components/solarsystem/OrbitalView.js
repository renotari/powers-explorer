/**
 * OrbitalView - Display planets on elliptical orbits around the Sun
 *
 * Responsibilities:
 * - Draw elliptical orbit paths
 * - Position Sun at center (focus of ellipses)
 * - Position planets using real-time or default angular positions
 * - Handle Astronomy Engine data or offline fallback
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { PlanetRenderer } from './PlanetRenderer.js';
import { ZoomControl } from './ZoomControl.js';
import { DataManager } from '@/managers/DataManager.js';
import { StateManager } from '@/managers/StateManager.js';
import { I18nManager } from '@/managers/I18nManager.js';
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

    // Zoom state
    this.currentZoomIndex = 0;
    this.zoomControl = null;
    this.isZooming = false;
    this.layoutCenterX = GAME_WIDTH / 2;
    this.layoutCenterY = GAME_HEIGHT / 2;

    // Cache orbital data for reuse during zoom
    this.orbitalParams = null;
    this.positions = null;

    this.create();
  }

  /**
   * Create the orbital view
   */
  create() {
    this.layoutCenterX = GAME_WIDTH / 2;
    this.layoutCenterY = GAME_HEIGHT / 2;

    // Cache orbital params and positions
    this.orbitalParams = this.dataManager.getOrbitalParameters();
    this.positions = this.getPositions();

    // Calculate initial layout from zoom level 0
    const zoomLevels = SOLAR_SYSTEM.ORBITAL_ZOOM_LEVELS;
    const layout = this.calculateLayout(zoomLevels[0]);
    if (!layout) return;

    this.scaleFactor = layout.scaleFactor;

    // Create Sun at center
    const sunData = this.dataManager.getPlanetById(SOLAR_SYSTEM.SUN_ID);
    if (sunData) {
      this.sunRenderer = new PlanetRenderer(
        this.scene,
        sunData,
        this.layoutCenterX,
        this.layoutCenterY,
        layout.sunRadius,
        { interactive: true }
      );
      this.sunRenderer.setLabelVisible(false);

      this.sunRenderer.on('planetClicked', (data) => {
        this.emit('planetClicked', data);
      });
    }

    // Draw orbits
    this.drawOrbits(this.layoutCenterX, this.layoutCenterY);

    // Create planets
    this.createPlanets(this.layoutCenterX, this.layoutCenterY, this.positions, layout.baseSizes);

    // Show data source indicator
    this.createDataSourceIndicator();

    // Create zoom control
    this.zoomControl = new ZoomControl(this.scene);
    this.zoomControl.on('zoomChanged', this.onZoomChanged, this);

    // Register scroll wheel listener
    this.wheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
      this.onMouseWheel(deltaY);
    };
    this.scene.input.on('wheel', this.wheelHandler);
  }

  /**
   * Calculate layout parameters for a given zoom level
   * @param {Object} zoomLevel - Zoom level config from constants
   * @returns {Object|null} { scaleFactor, baseSizes, sunRadius }
   */
  calculateLayout(zoomLevel) {
    const refOrbit = this.orbitalParams?.find(p => p.id === zoomLevel.scaleBody);
    if (!refOrbit) {
      console.error(`[OrbitalView] Orbit for '${zoomLevel.scaleBody}' not found`);
      return null;
    }

    const maxOrbitRadius = Math.min(GAME_WIDTH, GAME_HEIGHT) / 2 - SOLAR_SYSTEM.ORBITAL_MARGIN;
    const scaleFactor = (maxOrbitRadius * zoomLevel.screenFraction) / refOrbit.semiMajorAxis;

    return {
      scaleFactor,
      baseSizes: zoomLevel.baseSizes,
      sunRadius: zoomLevel.sunRadius
    };
  }

  /**
   * Get planet positions (real-time or default)
   * @returns {Object} Position data mapping planet ID to theta (radians)
   */
  getPositions() {
    const orbitalPositions = this.stateManager.getOrbitalPositions();

    if (orbitalPositions) {
      return orbitalPositions;
    } else {
      const positions = {};
      this.orbitalParams.forEach(param => {
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
    this.orbitalParams.forEach(param => {
      const a = param.semiMajorAxis * this.scaleFactor;
      const e = param.eccentricity;
      const b = ScaleCalculator.calculateSemiMinorAxis(a, e);
      const c = ScaleCalculator.calculateFocalDistance(a, e);

      const graphics = this.scene.add.graphics();
      graphics.lineStyle(1, SOLAR_SYSTEM.ORBIT_LINE_COLOR, SOLAR_SYSTEM.ORBIT_LINE_ALPHA);
      graphics.strokeEllipse(centerX + c, centerY, 2 * a, 2 * b);

      this.container.add(graphics);
      this.orbitGraphics.push(graphics);
    });
  }

  /**
   * Redraw orbit graphics at current scaleFactor
   * @param {number} centerX - Center X
   * @param {number} centerY - Center Y
   * @returns {Phaser.GameObjects.Graphics[]} New graphics objects
   */
  redrawOrbits(centerX, centerY) {
    const newGraphics = [];

    this.orbitalParams.forEach(param => {
      const a = param.semiMajorAxis * this.scaleFactor;
      const e = param.eccentricity;
      const b = ScaleCalculator.calculateSemiMinorAxis(a, e);
      const c = ScaleCalculator.calculateFocalDistance(a, e);

      const graphics = this.scene.add.graphics();
      graphics.lineStyle(1, SOLAR_SYSTEM.ORBIT_LINE_COLOR, SOLAR_SYSTEM.ORBIT_LINE_ALPHA);
      graphics.strokeEllipse(centerX + c, centerY, 2 * a, 2 * b);
      graphics.setAlpha(0);

      this.container.add(graphics);
      newGraphics.push(graphics);
    });

    return newGraphics;
  }

  /**
   * Create planets on orbits
   * @param {number} centerX - Sun X position (focus)
   * @param {number} centerY - Sun Y position (focus)
   * @param {Object} positions - Position data {planetId: theta}
   * @param {Object} baseSizes - Size map {planetId: radius}
   */
  createPlanets(centerX, centerY, positions, baseSizes) {
    this.orbitalParams.forEach(param => {
      const planetData = this.dataManager.getPlanetById(param.id);
      if (!planetData) return;

      const theta = positions[param.id] || 0;

      const position = ScaleCalculator.getPositionOnEllipse(
        param.semiMajorAxis,
        param.eccentricity,
        theta,
        centerX,
        centerY,
        this.scaleFactor
      );

      const radius = baseSizes[param.id] || 8;
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
   * Handle zoom level change
   * @param {Object} data - { levelIndex, zoomLevel }
   */
  onZoomChanged({ levelIndex, zoomLevel }) {
    if (this.isZooming) return;
    this.isZooming = true;
    this.currentZoomIndex = levelIndex;

    const layout = this.calculateLayout(zoomLevel);
    if (!layout) {
      this.isZooming = false;
      return;
    }

    const transitionMs = SOLAR_SYSTEM.ORBITAL_ZOOM_TRANSITION_MS;
    const halfMs = transitionMs / 2;

    // Update scale factor for new orbits
    this.scaleFactor = layout.scaleFactor;

    // 1. Fade out old orbit graphics
    const oldGraphics = this.orbitGraphics;
    oldGraphics.forEach(g => {
      this.scene.tweens.add({
        targets: g,
        alpha: 0,
        duration: halfMs,
        ease: 'Quad.easeOut'
      });
    });

    // 2. After half-time, draw new orbits and fade them in
    this.scene.time.delayedCall(halfMs, () => {
      // Destroy old graphics
      oldGraphics.forEach(g => g.destroy());
      this.orbitGraphics = [];

      // Draw new orbits (start invisible, fade in)
      const newGraphics = this.redrawOrbits(this.layoutCenterX, this.layoutCenterY);
      this.orbitGraphics = newGraphics;

      newGraphics.forEach(g => {
        this.scene.tweens.add({
          targets: g,
          alpha: 1,
          duration: halfMs,
          ease: 'Quad.easeIn'
        });
      });
    });

    // 3. Animate Sun size
    if (this.sunRenderer) {
      this.sunRenderer.animateTo(
        this.layoutCenterX,
        this.layoutCenterY,
        layout.sunRadius,
        transitionMs
      );
    }

    // 4. Animate planets to new positions and sizes
    const promises = this.planetRenderers.map((renderer, i) => {
      const param = this.orbitalParams[i];
      if (!param) return Promise.resolve();

      const theta = this.positions[param.id] || 0;
      const newPos = ScaleCalculator.getPositionOnEllipse(
        param.semiMajorAxis,
        param.eccentricity,
        theta,
        this.layoutCenterX,
        this.layoutCenterY,
        this.scaleFactor
      );

      const newRadius = layout.baseSizes[param.id] || 8;
      return renderer.animateTo(newPos.x, newPos.y, newRadius, transitionMs);
    });

    // Mark zoom as complete after all animations finish
    Promise.all(promises).then(() => {
      this.isZooming = false;
    });
  }

  /**
   * Handle mouse wheel for zoom
   * @param {number} deltaY - Scroll delta (positive = down, negative = up)
   */
  onMouseWheel(deltaY) {
    if (this.isZooming) return;

    const zoomLevels = SOLAR_SYSTEM.ORBITAL_ZOOM_LEVELS;
    let newIndex = this.currentZoomIndex;

    if (deltaY < 0) {
      // Scroll up = zoom in (inner planets)
      newIndex = Math.min(this.currentZoomIndex + 1, zoomLevels.length - 1);
    } else if (deltaY > 0) {
      // Scroll down = zoom out (full system)
      newIndex = Math.max(this.currentZoomIndex - 1, 0);
    }

    if (newIndex !== this.currentZoomIndex) {
      this.zoomControl.setLevel(newIndex);
    }
  }

  /**
   * Create data source indicator
   */
  createDataSourceIndicator() {
    const t = (key) => I18nManager.getInstance().t(key);
    const isRealTime = this.stateManager.isUsingRealTimeData();
    const text = isRealTime ? t('solar.realTimeData') : t('solar.simulatedPositions');
    const color = isRealTime ? '#4CAF50' : '#FFA726';

    this.dataSourceIndicator = this.scene.add.text(
      GAME_WIDTH - 15,
      GAME_HEIGHT - 15,
      text,
      {
        fontSize: '18px',
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
    // Remove wheel listener
    if (this.wheelHandler && this.scene?.input) {
      this.scene.input.off('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }

    // Destroy zoom control
    if (this.zoomControl) {
      this.zoomControl.off('zoomChanged', this.onZoomChanged, this);
      this.zoomControl.destroy();
      this.zoomControl = null;
    }

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

    // Clear cached data
    this.orbitalParams = null;
    this.positions = null;

    super.destroy();
  }
}
