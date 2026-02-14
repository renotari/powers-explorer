/**
 * I18nManager - Internationalization singleton manager
 *
 * Responsibilities:
 * - Load locale JSON files via Phaser loader
 * - Resolve dot-path translation keys with interpolation
 * - Provide translated cosmic object names/facts from overlay files
 * - Fallback chain: current locale → English → raw key
 *
 * CRITICAL: Must NOT store scene references after init() to prevent memory leaks.
 */

export class I18nManager {
  static instance = null;

  static SUPPORTED_LOCALES = ['en', 'it'];
  static DEFAULT_LOCALE = 'en';

  static getInstance() {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  constructor() {
    if (I18nManager.instance) {
      throw new Error('I18nManager already instantiated. Use getInstance()');
    }

    this.locale = I18nManager.DEFAULT_LOCALE;
    this.strings = {};        // { en: {...}, it: {...} }
    this.objectOverlays = {}; // { en: {...}, it: {...} }
    this.initialized = false;
  }

  /**
   * Set locale code. Can be called before or after init().
   * @param {string} code - Locale code ('en', 'it')
   */
  setLocale(code) {
    if (I18nManager.SUPPORTED_LOCALES.includes(code)) {
      this.locale = code;
      console.log(`[I18nManager] Locale set to '${code}'`);
    } else {
      console.warn(`[I18nManager] Unsupported locale '${code}', keeping '${this.locale}'`);
    }
  }

  /**
   * Get current locale code
   * @returns {string}
   */
  getLocale() {
    return this.locale;
  }

  /**
   * Initialize: load locale JSON files via Phaser loader.
   * Must be called in BootScene before DataManager.
   *
   * @param {Phaser.Scene} scene - Scene with active loader
   * @returns {Promise}
   */
  async init(scene) {
    console.log(`[I18nManager] Initializing with locale '${this.locale}'...`);

    await this.loadLocaleFiles(scene);
    this.initialized = true;

    console.log('[I18nManager] Initialization complete');
  }

  /**
   * Load locale JSON files for current locale (+ English fallback if different)
   *
   * @param {Phaser.Scene} scene
   * @returns {Promise}
   */
  async loadLocaleFiles(scene) {
    return new Promise((resolve, reject) => {
      // Always load English as fallback
      scene.load.json('locale-en', './assets/locales/en.json');
      scene.load.json('locale-objects-en', './assets/locales/cosmic-objects.en.json');

      // Load target locale if not English
      if (this.locale !== 'en') {
        scene.load.json(`locale-${this.locale}`, `./assets/locales/${this.locale}.json`);
        scene.load.json(`locale-objects-${this.locale}`, `./assets/locales/cosmic-objects.${this.locale}.json`);
      }

      scene.load.once('complete', () => {
        try {
          // Extract from cache
          this.strings.en = scene.cache.json.get('locale-en') || {};
          this.objectOverlays.en = scene.cache.json.get('locale-objects-en') || {};

          if (this.locale !== 'en') {
            this.strings[this.locale] = scene.cache.json.get(`locale-${this.locale}`) || {};
            this.objectOverlays[this.locale] = scene.cache.json.get(`locale-objects-${this.locale}`) || {};
          }

          console.log(`[I18nManager] Loaded locale files for '${this.locale}'`);
          resolve();
        } catch (error) {
          console.error('[I18nManager] Failed to process locale files:', error);
          // Don't reject - app should work with missing translations
          resolve();
        }
      });

      scene.load.once('loaderror', (file) => {
        console.warn(`[I18nManager] Failed to load locale file: ${file.key}`);
        // Don't reject - continue with available translations
        resolve();
      });

      scene.load.start();
    });
  }

  /**
   * Translate a dot-path key with optional interpolation.
   *
   * @param {string} keyPath - Dot-separated key (e.g., 'menu.title')
   * @param {Object} [params] - Interpolation params (e.g., { name1: 'Earth' })
   * @returns {string} Translated string, or English fallback, or raw key
   */
  t(keyPath, params = null) {
    // Try current locale first
    let value = this._resolve(this.strings[this.locale], keyPath);

    // Fallback to English
    if (value === undefined && this.locale !== 'en') {
      value = this._resolve(this.strings.en, keyPath);
    }

    // Fallback to raw key
    if (value === undefined) {
      return keyPath;
    }

    // Interpolate {placeholders}
    if (params) {
      value = value.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    return value;
  }

  /**
   * Get translated object data (name, category, educationalFacts) for a cosmic object.
   *
   * @param {string} objectId - Object ID (e.g., 'earth')
   * @returns {Object|null} Translated fields or null
   */
  getObjectTranslation(objectId) {
    // Try current locale
    let overlay = this.objectOverlays[this.locale]?.[objectId];

    // Fallback to English
    if (!overlay && this.locale !== 'en') {
      overlay = this.objectOverlays.en?.[objectId];
    }

    return overlay || null;
  }

  /**
   * Resolve a dot-path key against a nested object.
   *
   * @param {Object} obj - Nested object
   * @param {string} keyPath - Dot-separated path
   * @returns {string|undefined}
   * @private
   */
  _resolve(obj, keyPath) {
    if (!obj || !keyPath) return undefined;

    const parts = keyPath.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance() {
    if (I18nManager.instance) {
      I18nManager.instance.strings = {};
      I18nManager.instance.objectOverlays = {};
      I18nManager.instance.initialized = false;
      I18nManager.instance = null;
    }
  }
}
