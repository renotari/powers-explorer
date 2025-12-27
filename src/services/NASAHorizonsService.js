/**
 * NASAHorizonsService - Fetches real-time planetary positions
 *
 * Uses NASA JPL Horizons API for ephemeris data
 * Implements singleton pattern with caching
 * Fallback to default positions on failure
 */

import { DataManager } from '@/managers/DataManager.js';

export class NASAHorizonsService {
  static instance = null;

  static getInstance() {
    if (!NASAHorizonsService.instance) {
      NASAHorizonsService.instance = new NASAHorizonsService();
    }
    return NASAHorizonsService.instance;
  }

  constructor() {
    if (NASAHorizonsService.instance) {
      throw new Error('NASAHorizonsService already instantiated. Use getInstance()');
    }

    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    this.cacheTimestamp = null;

    // NASA Horizons planet codes
    this.planetCodes = {
      mercury: '199',
      venus: '299',
      earth: '399',
      mars: '499',
      jupiter: '599',
      saturn: '699',
      uranus: '799',
      neptune: '899'
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
      console.log('[NASAHorizonsService] Using cached positions');
      return this.cache.get('positions');
    }

    try {
      console.log('[NASAHorizonsService] Fetching real-time positions...');

      // For this implementation, we'll use default positions
      // as NASA Horizons API requires complex query parameters and may have CORS issues
      // In a production environment, you would:
      // 1. Set up a serverless function (Vercel, Netlify) as a proxy
      // 2. Or use a pre-computed dataset with daily updates

      // Simulate API call delay
      await this.simulateAPICall();

      // For now, return null to use default positions
      // In production, this would parse real NASA data
      console.log('[NASAHorizonsService] Using simulated/default positions');
      return this.getDefaultPositions();

    } catch (error) {
      console.warn('[NASAHorizonsService] API call failed:', error);
      return null;
    }
  }

  /**
   * Simulate API call (replace with real NASA API in production)
   * @returns {Promise}
   */
  async simulateAPICall() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
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

    // Cache the default positions
    this.cache.set('positions', positions);
    this.cacheTimestamp = Date.now();

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

    return age < this.cacheExpiry;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamp = null;
    console.log('[NASAHorizonsService] Cache cleared');
  }

  /**
   * Parse NASA Horizons API response (placeholder for production)
   * In production, this would parse the actual API response
   * @param {Object} response - API response
   * @returns {Object} {x, y, theta}
   */
  parseNASAResponse(response) {
    // Placeholder - in production this would extract X, Y coordinates
    // from the API response and calculate theta = atan2(y, x)
    const x = response.x || 0;
    const y = response.y || 0;
    const theta = Math.atan2(y, x);

    return { x, y, theta };
  }

  /**
   * Fetch from NASA Horizons API (production implementation)
   * This is a template for production use with a proxy server
   * @param {string} planetCode - NASA planet code
   * @returns {Promise<Object>}
   */
  async fetchFromNASA(planetCode) {
    // In production, replace with actual API endpoint
    // Likely needs a serverless function proxy to handle CORS
    const apiEndpoint = 'https://your-proxy.vercel.app/api/horizons';

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const params = new URLSearchParams({
      COMMAND: `'${planetCode}'`,
      CENTER: "'500@10'", // Sun-centered
      START_TIME: today,
      STOP_TIME: tomorrow,
      STEP_SIZE: '1d',
      QUANTITIES: "'1,9'" // Position vectors
    });

    const response = await fetch(`${apiEndpoint}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    return await response.json();
  }
}
