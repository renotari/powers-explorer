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
      parseInt(COLORS.BACKGROUND.replace('#', '0x')),
      0.95
    ).setStrokeStyle(2, parseInt(COLORS.PRIMARY.replace('#', '0x')));
    this.container.add(this.panelBackground);

    // Close button
    this.createCloseButton();
  }

  /**
   * Create close button
   */
  createCloseButton() {
    const buttonSize = 30;
    const margin = 15;

    this.closeButton = this.scene.add.rectangle(
      SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2 - margin - buttonSize / 2,
      margin + buttonSize / 2,
      buttonSize,
      buttonSize,
      parseInt(COLORS.SECONDARY.replace('#', '0x'))
    ).setInteractive({ useHandCursor: true });
    this.container.add(this.closeButton);

    const closeText = this.scene.add.text(
      SOLAR_SYSTEM.INFO_PANEL_WIDTH / 2 - margin - buttonSize / 2,
      margin + buttonSize / 2,
      'X',
      {
        fontSize: '18px',
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
    let yOffset = 80;
    const margin = 20;
    const lineHeight = 25;

    // Planet name
    const nameText = this.scene.add.text(
      margin,
      yOffset,
      planetData.name,
      {
        fontSize: '28px',
        color: COLORS.PRIMARY,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    );
    this.container.add(nameText);
    this.contentElements.push(nameText);
    yOffset += 50;

    // Diameter
    const diameterText = this.scene.add.text(
      margin,
      yOffset,
      `Diameter: ${ScaleCalculator.formatScale(planetData.diameter)}`,
      {
        fontSize: '14px',
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
          `Distance: ${auDistance} AU`,
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
          `Orbital Period: ${orbitalData.orbitalPeriod.toFixed(1)} days`,
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

    // Educational facts
    if (planetData.educationalFacts && planetData.educationalFacts.length > 0) {
      const factsTitle = this.scene.add.text(
        margin,
        yOffset,
        'Facts:',
        {
          fontSize: '16px',
          color: COLORS.PRIMARY,
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      );
      this.container.add(factsTitle);
      this.contentElements.push(factsTitle);
      yOffset += lineHeight;

      planetData.educationalFacts.slice(0, 5).forEach(fact => {
        const factText = this.scene.add.text(
          margin,
          yOffset,
          `• ${fact}`,
          {
            fontSize: '13px',
            color: COLORS.TEXT,
            fontFamily: 'Arial',
            wordWrap: { width: SOLAR_SYSTEM.INFO_PANEL_WIDTH - margin * 2 }
          }
        );
        this.container.add(factText);
        this.contentElements.push(factText);
        yOffset += factText.height + 10;
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
    this.clearContent();
    super.destroy();
  }
}
