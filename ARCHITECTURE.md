# Powers Explorer - System Architecture

**Last Updated:** 2025-12-27
**Version:** 1.1.0-dev
**Status:** Phase 1 Complete, Solar System Added

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Layers](#system-layers)
4. [Scene Architecture](#scene-architecture)
5. [Component Architecture](#component-architecture)
6. [Manager Layer](#manager-layer)
7. [Data Layer](#data-layer)
8. [Memory Management](#memory-management)
9. [State Machine Patterns](#state-machine-patterns)

---

## Overview

Powers Explorer is a Phaser 3-based web application for exploring cosmic scales. The architecture follows a layered approach with clear separation of concerns:

- **Presentation Layer:** Phaser scenes and UI components
- **Business Logic:** Singleton managers for state and data
- **Utilities:** Mathematical calculators and constants
- **Data:** JSON-based cosmic object library

**Current Features:**
- Cosmic Comparison Mode (Phase 1)
- Solar System Visualization (Phase 2)

---

## Architecture Principles

### 1. Singleton Pattern for Managers

All managers use the singleton pattern to ensure a single source of truth:

```javascript
class Manager {
  static instance = null;
  static getInstance() {
    if (!Manager.instance) {
      Manager.instance = new Manager();
    }
    return Manager.instance;
  }
}
```

**Critical:** Managers must NOT store scene references after initialization to prevent memory leaks.

### 2. Event-Driven Communication

Components extend `Phaser.Events.EventEmitter` for loose coupling:

```javascript
// Component emits event
this.emit('selectionComplete', selectedIds);

// Scene listens for event
component.on('selectionComplete', this.onSelectionComplete, this);

// Scene cleans up in shutdown
component.off('selectionComplete', this.onSelectionComplete, this);
```

### 3. Memory Leak Prevention

**Critical patterns:**
- Scenes register `shutdown` event: `this.events.on('shutdown', this.cleanup, this)`
- All event listeners removed in cleanup
- Components destroyed explicitly
- No persistent scene references in managers

### 4. Container-Based Components

All visual components use Phaser containers for grouping:

```javascript
class Component extends ComponentBase {
  constructor(scene, config) {
    super(scene, config);
    this.container = scene.add.container(); // All visuals added here
  }
}
```

---

## System Layers

### Layer 1: Entry Point

**File:** `src/main.js`

- Imports Phaser configuration
- Imports all scenes
- Registers scenes in execution order
- Creates Phaser game instance
- Exposes `window.game` for debugging

**Scene Registration Order:**
1. BootScene (runs first)
2. MenuScene
3. CosmicComparisonScene
4. SolarSystemScene
5. UIOverlayScene (parallel)

### Layer 2: Configuration

**File:** `src/config/phaserConfig.js`

Phaser game configuration:
- Canvas size: 1280x720 (16:9 aspect ratio)
- WebGL renderer with fallback to Canvas
- Physics: None (pure visualization)
- Input: Mouse and touch

### Layer 3: Scenes

**Scene Flow:**
```
BootScene
   ↓ (load assets, init managers)
MenuScene
   ↓ (user selection)
CosmicComparisonScene + UIOverlayScene
   OR
SolarSystemScene + UIOverlayScene
```

### Layer 4: Components

Reusable UI/visual components extending `ComponentBase`:
- Event-driven communication
- Container-based rendering
- Lifecycle management (create, update, destroy)

### Layer 5: Managers

Singleton managers for global state and data:
- `StateManager` - Application state
- `DataManager` - Cosmic object data
- `AnimationManager` - Animation coordination

### Layer 6: Utilities

Pure functions for calculations:
- `ScaleCalculator` - Size and distance calculations
- `Constants` - Configuration constants

### Layer 7: Data

JSON files loaded via Phaser loader:
- `cosmic-objects.json` - Object library
- `physical-constants.json` - Scientific constants
- `orbital-parameters.json` - Planet orbital data

---

## Scene Architecture

### BootScene

**Responsibilities:**
- Display loading progress
- Load all data files (JSON, images)
- Initialize managers
- Transition to MenuScene

**Critical:** This is the ONLY scene that should initialize managers.

**Lifecycle:**
```
preload() → create() → (transition to MenuScene)
```

### MenuScene

**Responsibilities:**
- Display application title
- Mode selection buttons
- Navigation to feature scenes

**Current Modes:**
1. Cosmic Comparison
2. Solar System (NEW)
3. Powers of Ten (future)

### CosmicComparisonScene

**Responsibilities:**
- Object selection (2 objects)
- Scale display
- Distance animation
- Light travel simulation

**State Machine:**
```
OBJECT_SELECTION → SCALE_DISPLAY → DISTANCE_ANIMATION → LIGHT_TRAVEL → (reset)
```

**Components:**
- ObjectSelector
- ScaleDisplay
- DistanceAnimator
- LightSpeedTraveler

### SolarSystemScene (NEW)

**Responsibilities:**
- Three visualization modes
- Mode cycling
- Planet interaction
- Real-time orbital data

**State Machine:**
```
SIZE_COMPARISON → DISTANCE_VIEW → ORBITAL_VIEW → (cycle)
```

**Components:**
- SizeComparisonView
- DistanceView
- OrbitalView
- PlanetInfoPanel
- ModeCycleButton

**Visualization Modes:**

1. **Size Comparison:**
   - Planets side-by-side
   - Proportional sizes
   - Sun toggle (on/off)

2. **Distance View:**
   - Sun at left edge
   - Logarithmic distance scaling
   - AU markers

3. **Orbital View:**
   - Sun at center (ellipse focus)
   - Elliptical orbit paths
   - Real-time positions (NASA API) or defaults

### UIOverlayScene

**Responsibilities:**
- Back to menu button
- Mode indicator
- Runs in parallel with main scenes

---

## Component Architecture

### ComponentBase

Base class for all components:

```javascript
export class ComponentBase extends Phaser.Events.EventEmitter {
  constructor(scene, config) {
    super();
    this.scene = scene;
    this.container = scene.add.container();
  }

  destroy() {
    this.removeAllListeners();
    this.container.destroy();
    this.scene = null;
  }
}
```

### Component Lifecycle

1. **Constructor:** Initialize properties
2. **create():** Build UI elements
3. **update(delta):** Per-frame updates (optional)
4. **show/hide():** Visibility control
5. **destroy():** Cleanup resources

### Solar System Components

#### PlanetRenderer

Creates individual planet visuals:
- Circle with cosmic object color
- Label (name)
- Click interaction
- Smooth position/size transitions

**Events:**
- `planetClicked` → {planetId, planetData, x, y}

#### SizeComparisonView

Horizontal planet layout:
- Proportional sizing algorithm
- Sun toggle button
- Dynamic recalculation

**Sizing Algorithm:**
```javascript
const maxDiameter = Math.max(...bodies.map(b => b.diameter));
const scaleFactor = availableWidth / (bodies.length * maxDiameter);
radius = max(diameter * scaleFactor, MIN_PLANET_RADIUS);
```

#### DistanceView

Logarithmic distance visualization:
- Sun at left edge (x=60)
- Planets positioned via `ScaleCalculator.realToScreen()`
- AU distance markers at 1, 5, 10, 20, 30 AU

#### OrbitalView

Elliptical orbit visualization:
- Draws ellipse paths
- Sun at focus (not center)
- Positions planets using polar equation

**Ellipse Math:**
```javascript
// Semi-minor axis: b = a × √(1 - e²)
// Focal distance: c = a × e
// Planet position: r = a(1-e²) / (1 + e·cos(θ))
```

#### PlanetInfoPanel

Slide-in info panel:
- Planet name, diameter, distance, orbital period
- Educational facts
- Slide animations (300ms)

#### ModeCycleButton

Mode switching control:
- Bottom-center position
- Displays current mode
- Cycles on click

---

## Manager Layer

### StateManager

Centralized application state using event-driven updates.

**State Structure:**
```javascript
{
  app: { currentMode, isAnimating, isPaused },
  comparison: { selectedObjects, animationPhase },
  powersOfTen: { currentExponent, visibleObjects },
  solarSystem: {  // NEW
    currentMode,
    sunVisible,
    selectedPlanet,
    isAnimating,
    orbitalPositions,
    useRealTimeData
  },
  ui: { infoPanelOpen, selectedInfoObject }
}
```

**Key Methods:**
- `setMode(mode)` → emits `modeChanged`
- `setSolarSystemMode(mode)` → emits `solarSystemModeChanged`
- `setOrbitalPositions(data)` → caches NASA API data

### DataManager

Loads and indexes cosmic data.

**Data Sources:**
- `cosmic-objects.json` - 14 objects
- `physical-constants.json` - Speed of light, Planck length
- `orbital-parameters.json` - Planetary orbits (NEW)

**Indexes:**
- `objectsById` - Map<id, object>
- `distanceCache` - Map<from-to, distance> (bidirectional)
- `orbitalParamsById` - Map<id, orbital data> (NEW)

**Key Methods:**
- `getObjectById(id)`
- `getDistance(fromId, toId)` - Bidirectional lookup
- `getPlanetById(id)` - Combines cosmic + orbital data (NEW)

### AnimationManager

Coordinates global animations:
- Prevents animation conflicts
- Provides animation state
- Future: Timeline sequencing

---

## Data Layer

### cosmic-objects.json

**Schema:**
```json
{
  "objects": [
    {
      "id": "earth",
      "name": "Earth",
      "category": "terrestrial",
      "diameter": 12742000,
      "mass": 5.972e24,
      "scaleLevel": 7,
      "color": "#4A90E2",
      "description": "...",
      "educationalFacts": [...],
      "sources": [...]
    }
  ],
  "distances": [
    {
      "from": "earth",
      "to": "moon",
      "distance": 384400000,
      "lightTravelTime": 1.282,
      "description": "..."
    }
  ]
}
```

### orbital-parameters.json (NEW)

**Schema:**
```json
{
  "planets": [
    {
      "id": "earth",
      "semiMajorAxis": 149598023000,
      "semiMajorAxisAU": 1.000001018,
      "eccentricity": 0.0167086,
      "orbitalPeriod": 365.256,
      "inclination": 0.00005,
      "argumentOfPerihelion": 114.20783,
      "defaultAngularPosition": 90
    }
  ]
}
```

---

## Memory Management

### Critical Patterns

**1. Scene Cleanup Registration:**
```javascript
create() {
  this.events.on('shutdown', this.cleanup, this);
}
```

**2. Event Listener Removal:**
```javascript
cleanup() {
  this.component.off('eventName', this.handler, this);
  this.component.destroy();
}
```

**3. Component Destruction:**
```javascript
destroy() {
  this.removeAllListeners();  // Clear event emitter
  this.container.destroy();    // Destroy Phaser objects
  this.scene = null;           // Clear references
}
```

**4. Manager Pattern:**
- Managers NEVER store scene references
- Scene passed to `init()` temporarily, then discarded
- Data accessed via cache/getters only

---

## State Machine Patterns

### Cosmic Comparison State Machine

```
┌─────────────────┐
│ OBJECT_SELECTION│
└────────┬────────┘
         │ (2 objects selected)
         ↓
┌────────┴────────┐
│  SCALE_DISPLAY  │
└────────┬────────┘
         │ (button click)
         ↓
┌────────┴────────────┐
│ DISTANCE_ANIMATION  │
└────────┬────────────┘
         │ (animation complete)
         ↓
┌────────┴────────┐
│  LIGHT_TRAVEL   │
└────────┬────────┘
         │ (reset)
         ↓
    (back to OBJECT_SELECTION)
```

### Solar System State Machine

```
┌────────────────┐
│SIZE_COMPARISON │◄──┐
└────────┬───────┘   │
         │ (cycle)   │
         ↓           │
┌────────┴───────┐   │
│ DISTANCE_VIEW  │   │
└────────┬───────┘   │
         │ (cycle)   │
         ↓           │
┌────────┴──────┐    │
│ ORBITAL_VIEW  │    │
└────────┬──────┘    │
         │ (cycle)   │
         └───────────┘
```

---

## Services Layer (NEW)

### NASAHorizonsService

Fetches real-time planetary positions:

**Features:**
- Singleton pattern
- 1-hour cache
- Timeout protection (5s)
- Fallback to default positions

**Production Setup:**
Due to CORS restrictions, production requires a proxy:
1. Serverless function (Vercel/Netlify)
2. Backend endpoint
3. Or pre-computed daily positions

**Current Implementation:**
Returns default positions from `orbital-parameters.json`

---

## Mathematical Foundations

### Logarithmic Distance Scaling

**Problem:** Linear scaling fails for astronomical distances.
Earth-Sun distance (150 million km) would require a 150-million-pixel screen!

**Solution:** Logarithmic scaling
```javascript
screenX = (log(1 + realDistance) / log(1 + maxDistance)) × screenWidth
```

### Elliptical Orbit Mathematics

**Polar Equation:**
```
r = a(1 - e²) / (1 + e·cos(θ))
```

Where:
- `a` = semi-major axis
- `e` = eccentricity (0 = circle, 0-1 = ellipse)
- `θ` = true anomaly (angle from perihelion)

**Key Relationships:**
- Semi-minor axis: `b = a × √(1 - e²)`
- Focal distance: `c = a × e`
- Sun position: At focus, not center

---

## Extension Points

### Adding a New Mode

1. Create scene in `src/scenes/`
2. Extend `Phaser.Scene`
3. Implement state machine
4. Register cleanup: `this.events.on('shutdown', this.cleanup, this)`
5. Add to `main.js` scene array
6. Add button in `MenuScene`

### Adding a New Component

1. Create in `src/components/`
2. Extend `ComponentBase`
3. Use `this.container.add()` for visuals
4. Emit events for communication
5. Implement `destroy()` method

### Adding New Data

1. Create JSON file in `public/assets/data/`
2. Load in `DataManager.loadAllData()`
3. Add indexing in `buildIndexes()`
4. Add getter methods

---

## Performance Considerations

1. **Rendering:** Use Phaser containers for efficient batching
2. **Data Access:** O(1) lookups via Map indexes
3. **Animations:** Limit concurrent tweens
4. **Memory:** Proper cleanup prevents leaks
5. **API Calls:** 1-hour cache for NASA data

---

## Testing Strategy (Future)

Framework: Vitest

**Test Categories:**
1. Unit tests for ScaleCalculator
2. Manager state tests
3. Component lifecycle tests
4. Integration tests for scenes
5. E2E tests for workflows

---

## Version History

- **v1.0.0-dev** - Phase 1 (CosmicComparison) complete
- **v1.1.0-dev** - Solar System visualization added
