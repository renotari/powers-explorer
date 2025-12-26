/**
 * ObjectSelector - Object library selection UI
 *
 * CRITICAL: Implements FIFO selection logic
 * - User can select max 2 objects
 * - When 3rd object selected, FIRST is removed (not second!)
 *
 * Displays scrollable list of cosmic objects
 * Emits events when objects are selected
 */

import { ComponentBase } from '@/components/ComponentBase.js';
import { DataManager } from '@/managers/DataManager.js';
import { MAX_SELECTIONS, COLORS } from '@/utils/Constants.js';

export class ObjectSelector extends ComponentBase {
  /**
   * Constructor
   *
   * @param {Phaser.Scene} scene - Parent scene
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Configuration
   */
  constructor(scene, x, y, config = {}) {
    super(scene, config);

    this.x = x;
    this.y = y;
    this.maxSelections = MAX_SELECTIONS;
    this.selectedIds = [];  // Array of selected object IDs
    this.objectCards = new Map();  // Map of object ID → card graphics

    // Get objects from DataManager
    this.objects = DataManager.getInstance().getAllObjects();

    console.log(`[ObjectSelector] Loaded ${this.objects.length} objects`);

    // Create UI
    this.create();
  }

  /**
   * Build object selection UI
   */
  create() {
    // Title
    const title = this.scene.add.text(this.x, this.y - 30, 'Select Two Objects:', {
      fontSize: '24px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(title);

    // Instruction text
    const instruction = this.scene.add.text(this.x, this.y, 'Click to select objects for comparison', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.container.add(instruction);

    // Create object cards
    let yOffset = 40;
    this.objects.forEach((obj, index) => {
      const card = this.createObjectCard(obj, this.x, this.y + yOffset);
      yOffset += 70;
    });

    console.log(`[ObjectSelector] Created ${this.objectCards.size} object cards`);
  }

  /**
   * Create an object card
   *
   * @param {Object} obj - Object data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Object} Card components
   */
  createObjectCard(obj, x, y) {
    // Card background
    const card = this.scene.add.rectangle(
      x,
      y,
      220,
      60,
      parseInt(obj.color.replace('#', '0x')),
      0.3
    ).setInteractive();

    // Card border
    const border = this.scene.add.rectangle(
      x,
      y,
      220,
      60
    );
    border.setStrokeStyle(2, parseInt(obj.color.replace('#', '0x')), 0.8);

    // Object name
    const nameText = this.scene.add.text(x, y - 10, obj.name, {
      fontSize: '18px',
      color: COLORS.TEXT,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Object category
    const categoryText = this.scene.add.text(x, y + 12, obj.category, {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Add to container
    this.container.add([card, border, nameText, categoryText]);

    // Store card components
    const cardData = {
      background: card,
      border,
      nameText,
      categoryText,
      objectId: obj.id,
      isSelected: false
    };

    this.objectCards.set(obj.id, cardData);

    // Hover effects
    card.on('pointerover', () => {
      if (!cardData.isSelected) {
        card.setFillStyle(parseInt(obj.color.replace('#', '0x')), 0.5);
        nameText.setScale(1.05);
      }
    });

    card.on('pointerout', () => {
      if (!cardData.isSelected) {
        card.setFillStyle(parseInt(obj.color.replace('#', '0x')), 0.3);
        nameText.setScale(1);
      }
    });

    // Click handler
    card.on('pointerdown', () => {
      this.selectObject(obj.id);
    });

    return cardData;
  }

  /**
   * Select an object
   *
   * CRITICAL: FIFO logic - removes FIRST element when adding 3rd
   *
   * @param {string} objectId - Object ID to select
   */
  selectObject(objectId) {
    console.log(`[ObjectSelector] Selecting object: ${objectId}`);

    // CRITICAL: FIFO selection logic
    if (this.selectedIds.length >= this.maxSelections) {
      const removedId = this.selectedIds.shift();  // Remove FIRST, not last!
      console.log(`[ObjectSelector] Max selections reached. Removed: ${removedId}`);

      // Deselect the removed object visually
      this.deselectCard(removedId);
    }

    // Add new selection
    this.selectedIds.push(objectId);

    // Update visual state
    this.selectCard(objectId);

    console.log(`[ObjectSelector] Current selection:`, this.selectedIds);

    // Emit event
    this.emit('objectSelected', objectId);

    // If we have 2 selections, emit completion event
    if (this.selectedIds.length === this.maxSelections) {
      console.log(`[ObjectSelector] Selection complete:`, this.selectedIds);
      this.emit('selectionComplete', [...this.selectedIds]);  // Pass copy
    }
  }

  /**
   * Visually select a card
   *
   * @param {string} objectId - Object ID
   */
  selectCard(objectId) {
    const card = this.objectCards.get(objectId);
    if (!card) return;

    const obj = this.objects.find(o => o.id === objectId);
    if (!obj) return;

    // Update visual state
    card.background.setFillStyle(parseInt(obj.color.replace('#', '0x')), 0.9);
    card.border.setStrokeStyle(3, parseInt(obj.color.replace('#', '0x')), 1);
    card.nameText.setScale(1.1);
    card.isSelected = true;
  }

  /**
   * Visually deselect a card
   *
   * @param {string} objectId - Object ID
   */
  deselectCard(objectId) {
    const card = this.objectCards.get(objectId);
    if (!card) return;

    const obj = this.objects.find(o => o.id === objectId);
    if (!obj) return;

    // Reset visual state
    card.background.setFillStyle(parseInt(obj.color.replace('#', '0x')), 0.3);
    card.border.setStrokeStyle(2, parseInt(obj.color.replace('#', '0x')), 0.8);
    card.nameText.setScale(1);
    card.isSelected = false;
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    console.log('[ObjectSelector] Clearing selection');

    // Deselect all cards visually
    this.selectedIds.forEach(id => this.deselectCard(id));

    // Clear selection array
    this.selectedIds = [];

    this.emit('selectionCleared');
  }

  /**
   * Get currently selected object IDs
   *
   * @returns {Array<string>} Selected object IDs
   */
  getSelectedIds() {
    return [...this.selectedIds];  // Return copy
  }
}
