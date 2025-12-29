/**
 * PlanetaryPositionService - Calculates real-time planetary positions
 *
 * Uses Astronomy Engine library for accurate ephemeris calculations
 * Implements singleton pattern with caching
 * Fallback to default positions on failure
 */

import * as Astronomy from 'astronomy-engine';
import { DataManager } from '@/managers/DataManager.js';

export class PlanetaryPositionService {
  static instance = null;

  static getInstance() {
    if (!PlanetaryPositionService.instance) {
      PlanetaryPositionService.instance = new PlanetaryPositionService();
    }
    return PlanetaryPositionService.instance;
  }

  constructor() {
    if (PlanetaryPositionService.instance) {
      throw new Error('PlanetaryPositionService already instantiated. Use getInstance()');
    }

    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    this.cacheTimestamp = null;

    // Map our planet IDs to Astronomy Engine body names
    this.planetBodies = {
      mercury: Astronomy.Body.Mercury,
      venus: Astronomy.Body.Venus,
      earth: Astronomy.Body.Earth,
      mars: Astronomy.Body.Mars,
      jupiter: Astronomy.Body.Jupiter,
      saturn: Astronomy.Body.Saturn,
      uranus: Astronomy.Body.Uranus,
      neptune: Astronomy.Body.Neptune
    };

    this.dataManager = DataManager.getInstance();
  }

  /**
   * Fetch planetary positions
   * Returns positions map {planetId: theta (radians)} or null on failure
   * @returns {Promise<Object|null>}
   */
  async fetchPlanetaryPositions() {
    // Check cache first
    if (this.isCacheValid()) {
      console.log('[PlanetaryPositionService] Using cached positions');
      return this.cache.get('positions');
    }

    try {
      console.log('[PlanetaryPositionService] Calculating real-time positions...');

      // Calculate positions using Astronomy Engine
      const positions = this.calculatePositions();

      // Cache the results
      this.cache.set('positions', positions);
      this.cacheTimestamp = Date.now();

      console.log('[PlanetaryPositionService] Real-time positions calculated');
      return positions;

    } catch (error) {
      console.warn('[PlanetaryPositionService] Calculation failed:', error);
      // Fall back to default positions
      return this.getDefaultPositions();
    }
  }

  /**
   * Calculate current planetary positions using Astronomy Engine
   * @returns {Object} Position map {planetId: theta (radians)}
   */
  calculatePositions() {
    const positions = {};
    const now = new Date();

    for (const [planetId, body] of Object.entries(this.planetBodies)) {
      try {
        // Get heliocentric position vector (x, y, z in AU)
        const vector = Astronomy.HelioVector(body, now);

        // Convert to ecliptic coordinates for top-down view
        const ecliptic = Astronomy.Ecliptic(vector);

        // Use ecliptic longitude as theta (elon is in degrees)
        // Convert to radians for our visualization
        positions[planetId] = ecliptic.elon * Math.PI / 180;

      } catch (error) {
        console.warn(`[PlanetaryPositionService] Failed to calculate position for ${planetId}:`, error);
        // Use default position from orbital-parameters.json
        const orbitalParams = this.dataManager.getOrbitalParameters();
        const param = orbitalParams.find(p => p.id === planetId);
        if (param) {
          positions[planetId] = param.defaultAngularPosition * Math.PI / 180;
        }
      }
    }

    return positions;
  }

  /**
   * Get default positions from orbital-parameters.json
   * @returns {Object} Position map
   */
  getDefaultPositions() {
    const orbitalParams = this.dataManager.getOrbitalParameters();
    const positions = {};

    orbitalParams.forEach(param => {
      // Convert default angle from degrees to radians
      positions[param.id] = param.defaultAngularPosition * Math.PI / 180;
    });

    // Cache the default positions with shorter expiry (5 minutes instead of 1 hour)
    // This allows retry of real calculations sooner
    this.cache.set('positions', positions);
    this.cache.set('isFallback', true);
    this.cacheTimestamp = Date.now();
    this.fallbackCacheExpiry = 5 * 60 * 1000; // 5 minutes for fallback data

    console.log('[PlanetaryPositionService] Using default positions (fallback)');
    return positions;
  }

  /**
   * Check if cache is still valid
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.cache.has('positions') || !this.cacheTimestamp) {
      return false;
    }

    const now = Date.now();
    const age = now - this.cacheTimestamp;

    // Use shorter expiry for fallback data
    const expiry = this.cache.get('isFallback') ?
      (this.fallbackCacheExpiry || 5 * 60 * 1000) :
      this.cacheExpiry;

    return age < expiry;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamp = null;
    console.log('[PlanetaryPositionService] Cache cleared');
  }

  /**
   * Reset the singleton instance (for testing)
   * @static
   */
  static resetInstance() {
    if (PlanetaryPositionService.instance) {
      PlanetaryPositionService.instance.clearCache();
      PlanetaryPositionService.instance = null;
    }
  }
}
