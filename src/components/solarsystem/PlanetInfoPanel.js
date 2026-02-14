/**
 * PlanetInfoPanel - Slide-in panel showing planet details
 *
 * Responsibilities:
 * - Display planet name, diameter, distance, facts
 * - Slide in/out animations
 * - Close button
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { DataManager } from '@/managers/DataManager.js';
import { I18nManager } from '@/managers/I18nManager.js';
import { ScaleCalculator } from '@/utils/ScaleCalculator.js';
import { GAME_WIDTH, GAME_HEIGHT, SOLAR_SYSTEM, COLORS } from '@/utils/Constants.js';
import { parseHexColor } from '@/utils/ColorUtils.js';

export class PlanetInfoPanel extends ComponentBase {
  constructor(scene, config = {}) {
    super(scene, config);

    this.dataManager = DataManager.getInstance();
    this.panelBackground = null;
    this.contentElements = [];
    this.closeButton = null;
    this.currentPlanetId = null;

    // Panel starts off-screen
    this.panelX = GAME_WIDTH + SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2;
    this.panelY = GAME_HEIGHT / 2;

    this.container.setPosition(this.panelX, 0);
  }

  /**
   * Show panel with planet info
   * @param {string} planetId - Planet ID
   */
  async show(planetId) {
    this.currentPlanetId = planetId;

    // Clear previous content
    this.clearContent();

    // Create panel
    this.createPanel();

    // Build content
    const planetData = this.dataManager.getPlanetById(planetId);
    if (planetData) {
      this.buildContent(planetData);
    }

    // Slide in
    await this.slideIn();

    this.emit('shown', planetId);
  }

  /**
   * Hide panel
   */
  async hide() {
    await this.slideOut();
    this.clearContent();
    this.currentPlanetId = null;
    this.emit('hidden');
  }

  /**
   * Create panel background
   */
  createPanel() {
    const width = SOLAR_SYSTEM.INFO_PANEL_WIDTH;
    const height = GAME_HEIGHT;

    // Background
    this.panelBackground = this.scene.add.rectangle(
      0,
      this.panelY,
      width,
      height,
      parseHexColor(COLORS.BACKGROUND),
      0.95
    ).setStrokeStyle(2, parseHexColor(COLORS.PRIMARY));
    this.container.add(this.panelBackground);

    // Close button
    this.createCloseButton();
  }

  /**
   * Create close button
   */
  createCloseButton() {
    const buttonSize = 45;
    const margin = 23;

    this.closeButton = this.scene.add.rectangle(
      SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2 - margin - buttonSize / 2,
      margin + buttonSize / 2,
      buttonSize,
      buttonSize,
      parseHexColor(COLORS.SECONDARY)
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.closeButton);

    const closeText = this.scene.add.text(
      SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2 - margin - buttonSize / 2,
      margin + buttonSize / 2,
      'X',
      {
        fontSize: '27px',
        color: COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.container.add(closeText);
    this.contentElements.push(closeText);

    this.closeButton.on('pointerdown', () => {
      this.hide();
    });

    this.closeButton.on('pointerover', () => {
      this.closeButton.setAlpha(0.8);
    });

    this.closeButton.on('pointerout', () => {
      this.closeButton.setAlpha(1);
    });
  }

  /**
   * Build panel content
   * @param {Object} planetData - Planet data
   */
  buildContent(planetData) {
    const i18n = I18nManager.getInstance();
    const t = (key, params) => i18n.t(key, params);
    const tr = i18n.getObjectTranslation(planetData.id);

    let yOffset = 120;
    const margin = 30;
    const lineHeight = 38;

    // Planet name (translated)
    const displayName = tr?.name ?? planetData.name;
    const nameText = this.scene.add.text(
      margin,
      yOffset,
      displayName,
      {
        fontSize: '42px',
        color: COLORS.PRIMARY,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    );
    this.container.add(nameText);
    this.contentElements.push(nameText);
    yOffset += 75;

    // Diameter
    const diameterText = this.scene.add.text(
      margin,
      yOffset,
      t('solar.diameter', { value: ScaleCalculator.formatScale(planetData.diameter) }),
      {
        fontSize: '21px',
        color: COLORS.TEXT,
        fontFamily: 'Arial'
      }
    );
    this.container.add(diameterText);
    this.contentElements.push(diameterText);
    yOffset += lineHeight;

    // Distance from Sun (if available)
    if (planetData.id !== 'sun') {
      const orbitalData = this.dataManager.getOrbitalParametersById(planetData.id);
      if (orbitalData) {
        // Get AU from physical constants
        const constants = this.dataManager.getConstants();
        const AU = constants?.astronomicalUnit?.value || 149597870700;
        const auDistance = (orbitalData.semiMajorAxis / AU).toFixed(2);
        const distanceText = this.scene.add.text(
          margin,
          yOffset,
          t('solar.distance', { value: auDistance }),
          {
            fontSize: '14px',
            color: COLORS.TEXT,
            fontFamily: 'Arial'
          }
        );
        this.container.add(distanceText);
        this.contentElements.push(distanceText);
        yOffset += lineHeight;

        const periodText = this.scene.add.text(
          margin,
          yOffset,
          t('solar.orbitalPeriod', { value: orbitalData.orbitalPeriod.toFixed(1) }),
          {
            fontSize: '14px',
            color: COLORS.TEXT,
            fontFamily: 'Arial'
          }
        );
        this.container.add(periodText);
        this.contentElements.push(periodText);
        yOffset += lineHeight * 1.5;
      }
    }

    // Educational facts (use translated facts if available)
    const facts = tr?.educationalFacts ?? planetData.educationalFacts;
    if (facts && facts.length > 0) {
      const factsTitle = this.scene.add.text(
        margin,
        yOffset,
        t('solar.facts'),
        {
          fontSize: '24px',
          color: COLORS.PRIMARY,
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      );
      this.container.add(factsTitle);
      this.contentElements.push(factsTitle);
      yOffset += lineHeight;

      facts.slice(0, 5).forEach(fact => {
        const factText = this.scene.add.text(
          margin,
          yOffset,
          `• ${fact}`,
          {
            fontSize: '20px',
            color: COLORS.TEXT,
            fontFamily: 'Arial',
            wordWrap: { width: SOLAR_SYSTEM.INFO_PANEL_WIDTH - margin * 2 }
          }
        );
        this.container.add(factText);
        this.contentElements.push(factText);
        yOffset += factText.height + 15;
      });
    }
  }

  /**
   * Slide in animation
   * @returns {Promise}
   */
  slideIn() {
    return new Promise((resolve) => {
      const targetX = GAME_WIDTH - SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2;
      this.scene.tweens.add({
        targets: this.container,
        x: targetX,
        duration: SOLAR_SYSTEM.INFO_PANEL_SLIDE_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => resolve()
      });
    });
  }

  /**
   * Slide out animation
   * @returns {Promise}
   */
  slideOut() {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        x: GAME_WIDTH + SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2,
        duration: SOLAR_SYSTEM.INFO_PANEL_SLIDE_DURATION,
        ease: 'Quad.easeIn',
        onComplete: () => resolve()
      });
    });
  }

  /**
   * Clear panel content
   */
  clearContent() {
    this.contentElements.forEach(el => el.destroy());
    this.contentElements = [];

    if (this.panelBackground) {
      this.panelBackground.destroy();
      this.panelBackground = null;
    }
    if (this.closeButton) {
      // Remove event listeners before destroying
      this.closeButton.off('pointerdown');
      this.closeButton.off('pointerover');
      this.closeButton.off('pointerout');
      this.closeButton.destroy();
      this.closeButton = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Kill any active tweens on the container
    if (this.container && this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this.container);
    }

    this.clearContent();
    super.destroy();
  }
}
