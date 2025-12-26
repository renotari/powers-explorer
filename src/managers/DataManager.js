/**
 * DataManager - Singleton for loading and accessing cosmic data
 *
 * CRITICAL: This manager must NOT store scene references after init()
 * to prevent memory leaks!
 *
 * Responsibilities:
 * - Load JSON data files (cosmic-objects, physical-constants)
 * - Build indexes for O(1) lookup
 * - Provide query interface for objects and distances
 * - Handle bidirectional distance lookups
 */

export class DataManager {
  static instance = null;

  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  constructor() {
    if (DataManager.instance) {
      throw new Error('DataManager already instantiated. Use getInstance()');
    }

    this.cosmicObjects = null;
    this.constants = null;
    this.objectsById = new Map();
    this.distanceCache = new Map();
  }

  /**
   * Initialize DataManager and load all data
   *
   * CRITICAL: Do NOT store scene reference after init completes!
   * Scene is passed temporarily for loading only.
   *
   * @param {Phaser.Scene} scene - Scene with active loader
   * @returns {Promise} Resolves when all data is loaded and indexed
   */
  async init(scene) {
    console.log('[DataManager] Initializing...');
    await this.loadAllData(scene);
    console.log('[DataManager] Initialization complete');
    // scene reference goes out of scope here - NO instance variable storage!
  }

  /**
   * Load all JSON data files
   *
   * Uses Phaser's load.json() wrapped in a Promise for async/await compatibility
   *
   * @param {Phaser.Scene} scene - Scene with active loader
   * @returns {Promise} Resolves when loading completes
   */
  async loadAllData(scene) {
    return new Promise((resolve, reject) => {
      // Queue JSON files for loading
      scene.load.json('cosmic-objects', '/assets/data/cosmic-objects.json');
      scene.load.json('physical-constants', '/assets/data/physical-constants.json');

      // Handle successful load
      scene.load.once('complete', () => {
        try {
          // Extract data from cache (not from scene!)
          this.cosmicObjects = scene.cache.json.get('cosmic-objects');
          this.constants = scene.cache.json.get('physical-constants');

          // Validate data structure
          this.validateData();

          // Build lookup indexes
          this.buildIndexes();

          console.log(`[DataManager] Loaded ${this.cosmicObjects.objects.length} objects`);
          console.log(`[DataManager] Loaded ${this.cosmicObjects.distances.length} distances`);

          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // Handle load errors
      scene.load.once('loaderror', (file) => {
        const error = new Error(`Failed to load ${file.key}: ${file.src}`);
        console.error('[DataManager]', error.message);
        reject(error);
      });

      // Start loading
      scene.load.start();
    });
  }

  /**
   * Validate loaded data structure
   *
   * @throws {Error} if data structure is invalid
   */
  validateData() {
    if (!this.cosmicObjects || !this.cosmicObjects.objects) {
      throw new Error('Invalid cosmic-objects.json: missing objects array');
    }

    if (!this.cosmicObjects.distances) {
      throw new Error('Invalid cosmic-objects.json: missing distances array');
    }

    if (!this.constants || !this.constants.speedOfLight) {
      throw new Error('Invalid physical-constants.json: missing speedOfLight');
    }

    // Validate each object has required fields
    this.cosmicObjects.objects.forEach((obj, index) => {
      if (!obj.id || !obj.name || obj.diameter === undefined) {
        throw new Error(
          `Invalid object at index ${index}: missing required fields (id, name, diameter)`
        );
      }
    });
  }

  /**
   * Build lookup indexes for O(1) access
   */
  buildIndexes() {
    // Build object ID index
    this.objectsById.clear();
    this.cosmicObjects.objects.forEach(obj => {
      this.objectsById.set(obj.id, obj);
    });

    // Build distance cache for bidirectional lookup
    // CRITICAL: Distances stored once but queryable both ways
    this.distanceCache.clear();
    this.cosmicObjects.distances.forEach(dist => {
      const key = `${dist.from}-${dist.to}`;
      this.distanceCache.set(key, dist);
    });

    console.log(`[DataManager] Built ${this.objectsById.size} object indexes`);
    console.log(`[DataManager] Built ${this.distanceCache.size} distance indexes`);
  }

  /**
   * Get object by ID
   *
   * @param {string} id - Object ID
   * @returns {Object|undefined} Object data or undefined if not found
   */
  getObjectById(id) {
    return this.objectsById.get(id);
  }

  /**
   * Get distance between two objects
   *
   * CRITICAL: Checks BOTH directions (earth-moon === moon-earth)
   * Distance is stored once but queryable bidirectionally
   *
   * @param {string} fromId - First object ID
   * @param {string} toId - Second object ID
   * @returns {Object|undefined} Distance data or undefined if not found
   */
  getDistance(fromId, toId) {
    const key1 = `${fromId}-${toId}`;
    const key2 = `${toId}-${fromId}`;

    // Check both directions
    const distance = this.distanceCache.get(key1) || this.distanceCache.get(key2);

    if (!distance) {
      console.warn(`[DataManager] No distance found between ${fromId} and ${toId}`);
    }

    return distance;
  }

  /**
   * Get all objects
   *
   * @returns {Array} Array of all cosmic objects
   */
  getAllObjects() {
    return this.cosmicObjects.objects;
  }

  /**
   * Get objects by category
   *
   * @param {string} category - Category name (e.g., "terrestrial", "star")
   * @returns {Array} Array of objects in category
   */
  getObjectsByCategory(category) {
    return this.cosmicObjects.objects.filter(obj => obj.category === category);
  }

  /**
   * Get physical constants
   *
   * @returns {Object} Physical constants data
   */
  getConstants() {
    return this.constants;
  }

  /**
   * Get speed of light constant
   *
   * @returns {number} Speed of light in m/s
   */
  getSpeedOfLight() {
    return this.constants.speedOfLight.value;
  }
}
