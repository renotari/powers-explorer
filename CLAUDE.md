# CLAUDE.md - AI Assistant Context & Guidelines

This document provides essential context and guidelines for AI assistants working on the Powers Explorer project.

## Developer Preferences

### DO NOT Run Dev Server
**IMPORTANT:** Do NOT run `npm run dev` commands. The developer maintains their own dev server.
- Never start/stop/restart the development server
- Assume the dev server is always running when needed
- Focus on code changes and file operations only

### Development Environment
- **Platform:** Windows (win32)
- **Node Version:** v22.21.1
- **Package Manager:** npm
- **Build Tool:** Vite 5.x
- **Framework:** Phaser 3.70+

## Project Overview

**Powers Explorer** is an interactive educational web application for exploring cosmic scales through visualization.

### Current Implementation Status
- **Phase 1: CosmicComparison Mode** ✅ COMPLETE
- **Phase 2: SolarSystem Mode** ✅ COMPLETE
- **Phase 3: Powers of Ten Mode** ⏳ NOT YET IMPLEMENTED

### Technology Stack
- **Frontend Framework:** Phaser 3 (game/graphics engine)
- **Build Tool:** Vite with ES modules
- **Language:** JavaScript ES6+
- **Testing:** Vitest (configured but not yet used)

## Architecture Highlights

### Critical Patterns

#### 1. Singleton Managers
All managers use the singleton pattern:
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

**CRITICAL:** Managers must NOT store scene references after initialization to prevent memory leaks.

#### 2. Memory Leak Prevention
- Always register `shutdown` event in scenes
- Remove event listeners in cleanup methods
- Destroy components when switching scenes
- Do not persist scene references in managers

#### 3. Event-Driven Components
Components extend `Phaser.Events.EventEmitter` for loose coupling:
- Use `.on()` to register listeners
- Use `.off()` to remove listeners (critical in cleanup!)
- Use `.emit()` to trigger events

### Key Files

#### Core Infrastructure
- **`src/main.js`** - Application entry point, registers all scenes
- **`src/config/phaserConfig.js`** - Phaser game configuration
- **`src/utils/Constants.js`** - Canvas size, animation durations, scale bounds, solar system constants
- **`src/utils/ScaleCalculator.js`** - All mathematical calculations including ellipse positioning (CRITICAL)
- **`src/utils/ColorUtils.js`** - Color parsing and validation utilities (parseHexColor, isValidHexColor)

#### Data Layer
- **`src/managers/DataManager.js`** - Loads and indexes JSON data (CRITICAL)
- **`public/assets/data/cosmic-objects.json`** - Object library
- **`public/assets/data/physical-constants.json`** - Physical constants

#### State Management
- **`src/managers/StateManager.js`** - Centralized state, FIFO selection logic, solar system state
- **`src/managers/AnimationManager.js`** - Animation coordination

#### Services
- **`src/services/PlanetaryPositionService.js`** - Real-time planetary positions using Astronomy Engine (NEW)

#### Scenes
- **`src/scenes/BootScene.js`** - Asset loading, initialization (CRITICAL)
- **`src/scenes/MenuScene.js`** - Mode selection UI (3 modes)
- **`src/scenes/UIOverlayScene.js`** - Persistent UI layer
- **`src/scenes/CosmicComparisonScene.js`** - Comparison orchestration (CRITICAL)
- **`src/scenes/SolarSystemScene.js`** - Solar system visualization (CRITICAL, NEW)

#### Components - Comparison
- **`src/components/ComponentBase.js`** - Base class for all components
- **`src/components/comparison/ObjectSelector.js`** - Object library UI (CRITICAL)
- **`src/components/comparison/ScaleDisplay.js`** - Relative scale visualization (CRITICAL)
- **`src/components/comparison/DistanceAnimator.js`** - Separation animation
- **`src/components/comparison/ObjectOverlay.js`** - Overlay rendering for sub-pixel objects
- **`src/components/comparison/LightSpeedTraveler.js`** - Light travel with timer

#### Components - Solar System (NEW)
- **`src/components/solarsystem/PlanetRenderer.js`** - Individual planet visual
- **`src/components/solarsystem/SizeComparisonView.js`** - Side-by-side planet sizes
- **`src/components/solarsystem/DistanceView.js`** - Logarithmic distance layout
- **`src/components/solarsystem/OrbitalView.js`** - Elliptical orbits (CRITICAL)
- **`src/components/solarsystem/PlanetInfoPanel.js`** - Planet information panel
- **`src/components/solarsystem/ModeCycleButton.js`** - Mode switching control

## Critical Implementation Details

### 1. Logarithmic Distance Scaling
**Why:** Astronomical distances won't fit on screen with linear scaling.

Earth-Sun distance (150 million km) at linear scale would require a screen 150 million pixels wide!

**Implementation:** Use `Math.log1p()` in `ScaleCalculator.realToScreen()`:
```javascript
static realToScreen(realDistance, maxRealDistance, screenWidth) {
  if (realDistance <= 0) return 0;
  const logReal = Math.log1p(realDistance);  // log(1 + x) for precision
  const logMax = Math.log1p(maxRealDistance);
  return (logReal / logMax) * screenWidth;
}
```

### 2. Bidirectional Distance Lookup
**Why:** Distance stored once as `earth-moon`, but query can be `moon-earth`.

**Implementation:** Check BOTH directions in `DataManager.getDistance()`:
```javascript
getDistance(fromId, toId) {
  const key1 = `${fromId}-${toId}`;
  const key2 = `${toId}-${fromId}`;
  return this.distanceCache.get(key1) || this.distanceCache.get(key2);
}
```

### 3. FIFO Selection Logic
**Why:** User selects 3rd object; should remove oldest (1st), not newest (2nd).

**Implementation:** Use `array.shift()` (remove first) not `array.pop()` (remove last):
```javascript
selectObject(objectId) {
  if (this.selectedIds.length >= this.maxSelections) {
    this.selectedIds.shift(); // Remove FIRST, not last!
  }
  this.selectedIds.push(objectId);
}
```

### 4. Light Travel Time-Lapse
**Why:** Real light travel can be years; cap animation at 10s for UX.

**Implementation:** Calculate speed multiplier if real time > 10s:
```javascript
const realTimeMs = this.travelTime * 1000;
this.animationDuration = Math.min(realTimeMs, ANIMATION_DURATION.LIGHT_MAX);
if (realTimeMs > ANIMATION_DURATION.LIGHT_MAX) {
  this.isTimeLapsed = true;
  this.speedMultiplier = realTimeMs / ANIMATION_DURATION.LIGHT_MAX;
}
```

## Common Tasks

### Adding a New Cosmic Object
1. Edit `public/assets/data/cosmic-objects.json`
2. Add object to `objects` array:
   ```json
   {
     "id": "mars",
     "name": "Mars",
     "category": "terrestrial",
     "diameter": 6779000,
     "scaleLevel": 7,
     "color": "#CD5C5C",
     "description": "The Red Planet"
   }
   ```
3. Add distance relationships to `distances` array if applicable

### Adding a New Scene
1. Create scene file in `src/scenes/`
2. Extend `Phaser.Scene`
3. Register cleanup: `this.events.on('shutdown', this.cleanup, this)`
4. Import and register in `src/main.js` `phaserConfig.scene` array

### Adding a New Component
1. Create component file in `src/components/`
2. Extend `ComponentBase`
3. Use `this.container.add()` for visual elements
4. Implement `destroy()` method with proper cleanup

## Development Workflow

### File Structure
```
powersExplorer/
├── public/
│   ├── assets/data/           # JSON data files
│   └── index.html             # Entry HTML
├── src/
│   ├── components/            # Reusable components
│   │   └── comparison/        # Comparison mode components
│   ├── config/                # Configuration files
│   ├── managers/              # Singleton managers
│   ├── scenes/                # Phaser scenes
│   ├── utils/                 # Utility functions
│   └── main.js                # Application entry point
├── node_modules/              # Dependencies (gitignored)
├── package.json               # Project configuration
├── vite.config.js             # Vite build configuration
└── CLAUDE.md                  # This file
```

### Path Aliases
The `@` alias points to `src/`:
```javascript
import { DataManager } from '@/managers/DataManager.js';
```

## SolarSystemScene Documentation (NEW)

### Overview

SolarSystemScene provides three interactive visualization modes for exploring the solar system:

1. **Size Comparison** - Planets side-by-side with proportional sizes + Sun toggle
2. **Distance View** - Planets at logarithmically-scaled orbital distances
3. **Orbital View** - Planets on accurate elliptical orbits with real-time positions

### State Machine

Single cycle button rotates through modes:
```
SIZE_COMPARISON → DISTANCE_VIEW → ORBITAL_VIEW → (cycles back)
```

### Key Features

**Mode 1: Size Comparison**
- All 8 planets displayed horizontally
- Proportional sizing (largest planet fills available space)
- Sun toggle button - when enabled, recalculates all sizes to include Sun
- Labels below each planet
- Click on any planet shows info panel

**Mode 2: Distance View**
- Sun positioned at left edge (x=60px)
- Planets positioned using logarithmic distance scaling
- AU markers at 1, 5, 10, 20, 30 AU
- Planet sizes scaled proportionally to fit visualization
- Click on any planet/Sun shows info panel

**Mode 3: Orbital View**
- Sun at center (acts as ellipse focus)
- Elliptical orbit paths drawn for all planets
- Planets positioned using orbital mechanics
- Real-time positions calculated using Astronomy Engine (client-side, no API)
- Fallback to default positions from `orbital-parameters.json` on calculation failure
- Data source indicator shows "Real-time data" or "Simulated positions"
- Click on any planet/Sun shows info panel

### Critical Implementation Details

#### Elliptical Orbit Mathematics

**CRITICAL:** Sun is at the FOCUS of the ellipse, not the center!

```javascript
// Polar equation of ellipse
r = a(1 - e²) / (1 + e·cos(θ))

// Where:
// a = semi-major axis (meters)
// e = eccentricity (0-1, where 0 is circle)
// θ = true anomaly (angle from perihelion in radians)

// Key relationships:
// Semi-minor axis: b = a × √(1 - e²)
// Focal distance: c = a × e (offset from center to Sun)
```

Implementation in `ScaleCalculator.getPositionOnEllipse()`:
```javascript
static getPositionOnEllipse(a, e, theta, centerX, centerY, scaleFactor) {
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
  const screenR = r * scaleFactor;
  const x = centerX + screenR * Math.cos(theta);
  const y = centerY + screenR * Math.sin(theta);
  return { x, y };
}
```

#### Planetary Position Calculation

**Current Status:** Uses Astronomy Engine for real-time position calculations

**Implementation:**
- Astronomy Engine library runs client-side (no CORS issues)
- Zero dependencies, scientifically validated against NASA data
- `PlanetaryPositionService` calculates positions using heliocentric vectors
- 1-hour cache for calculated positions
- Automatic fallback to defaults from `orbital-parameters.json` on failure

**Technical Details:**
- Uses `HelioVector()` to get heliocentric x, y, z coordinates
- Converts to ecliptic coordinates with `Ecliptic()`
- Ecliptic longitude (elon) represents angular position in orbital plane
- Returns theta (radians) for each planet

#### Planet Info Panel

Slide-in panel from right side showing:
- Planet name (large, colored header)
- Diameter (scientific notation)
- Distance from Sun (in AU)
- Orbital period (in Earth days)
- Educational facts (up to 5)

**Animation:** 300ms slide with Quad easing

#### Component Hierarchy

```
SolarSystemScene
├── SizeComparisonView
│   ├── PlanetRenderer[] (8 planets)
│   ├── PlanetRenderer (Sun, optional)
│   └── Sun Toggle Button
├── DistanceView
│   ├── PlanetRenderer (Sun)
│   ├── PlanetRenderer[] (8 planets)
│   └── AU Markers[]
├── OrbitalView
│   ├── PlanetRenderer (Sun)
│   ├── PlanetRenderer[] (8 planets)
│   ├── Orbit Graphics[] (ellipses)
│   └── Data Source Indicator
├── PlanetInfoPanel (shared)
└── ModeCycleButton (shared)
```

### Data Requirements

**New Data File:** `orbital-parameters.json`
```json
{
  "planets": [
    {
      "id": "earth",
      "semiMajorAxis": 149598023000,      // meters
      "semiMajorAxisAU": 1.000001018,
      "eccentricity": 0.0167086,
      "orbitalPeriod": 365.256,            // days
      "inclination": 0.00005,              // degrees
      "argumentOfPerihelion": 114.20783,
      "defaultAngularPosition": 90         // degrees
    }
  ]
}
```

**Existing Data:** All 8 planets already in `cosmic-objects.json` with diameters, colors, facts

### Memory Management

Following same patterns as CosmicComparisonScene:

```javascript
create() {
  this.events.on('shutdown', this.cleanup, this);
  // ... initialization
}

cleanup() {
  // Destroy current view
  if (this.currentView) {
    this.currentView.off('planetClicked', this.onPlanetClicked, this);
    this.currentView.destroy();
  }

  // Destroy info panel
  this.planetInfoPanel?.destroy();

  // Destroy mode cycle button
  this.modeCycleButton.off('modeCycleRequested', this.cycleMode, this);
  this.modeCycleButton.destroy();
}
```

### Size Comparison Algorithm

```javascript
// Calculate scale factor to fit all bodies horizontally
const maxDiameter = Math.max(...bodies.map(b => b.diameter));
const availableWidth = GAME_WIDTH - (margin * 2) - (spacing * (bodies.length - 1));
const maxWidthPerBody = availableWidth / bodies.length;
const scaleFactor = Math.min(
  maxWidthPerBody / maxDiameter,
  (GAME_HEIGHT * 0.5) / maxDiameter  // Height constraint
);

// Apply with minimum radius for visibility
radius = Math.max(
  (diameter / 2) * scaleFactor,
  SOLAR_SYSTEM.MIN_PLANET_RADIUS  // 3 pixels
);
```

### Sun Toggle Challenge

Sun diameter is 109× Earth's diameter. When Sun is enabled:
- All planets become tiny (Earth ~3-4 pixels)
- Must enforce minimum visibility (MIN_PLANET_RADIUS = 3px)
- Recalculate ALL sizes when toggling

### Navigation Flow

```
MenuScene (3 mode buttons)
   │
   ├─ (Cosmic Comparison button)
   │  ↓
   │  CosmicComparisonScene + UIOverlayScene
   │  ↓ (Back button)
   │  MenuScene
   │
   ├─ (Solar System button)
   │  ↓
   │  SolarSystemScene (starts in Size Comparison mode) + UIOverlayScene
   │  ↓ (Back button)
   │  MenuScene
   │
   └─ (Powers of Ten button - NOT YET IMPLEMENTED)
      ↓
      [Future: PowersOfTenScene]
```

### Testing (Not Yet Implemented)
- Framework: Vitest
- Commands: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Config: `vitest.config.js` exists but no tests written yet

## Known Issues

### Windows Rollup Dependency
On Windows, npm has a bug with optional dependencies. Fix:
- Add `"@rollup/rollup-win32-x64-msvc": "^4.54.0"` to `devDependencies` in package.json
- This is already configured in the current package.json

## Next Steps

### Phase 3: Powers of Ten Mode (Not Yet Started)
- Smooth zooming visualization
- Scale slider from Planck length to observable universe

### Phase 4: Testing Suite
- Write unit tests with Vitest
- Component tests
- Integration tests

### Phase 5: Visual Polish
- Improved graphics
- Better animations
- Accessibility features

## Documentation References

See these files for detailed documentation:
- **ARCHITECTURE.md** - System architecture and design patterns
- **IMPLEMENTATION_PLAN.md** - Phase 1 implementation plan (completed)
- **README.md** - Project overview and setup instructions

## Version History

- **v1.0.0-dev** (2024-12-26) - Phase 1 (CosmicComparison Mode) complete
  - All 22 files implemented
  - Full workflow: selection → scale → distance → light → reset
  - Development server ready for testing

- **v1.1.0-dev** (2024-12-27) - Phase 2 (SolarSystem Mode) complete
  - 17 new files added
  - Three visualization modes: Size, Distance, Orbital
  - Elliptical orbit rendering with real orbital parameters
  - Astronomy Engine integration for real-time planetary positions (client-side calculations)
  - Planet info panel with educational facts
  - Sun toggle in size comparison mode

---

**Last Updated:** 2024-12-27
**Phase:** Phase 2 Complete (Solar System)
**Status:** Ready for Testing
