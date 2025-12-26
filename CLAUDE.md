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
- **Phase 2:** Not yet implemented
- **Phase 3:** Not yet implemented

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
- **`src/utils/Constants.js`** - Canvas size, animation durations, scale bounds
- **`src/utils/ScaleCalculator.js`** - All mathematical calculations (CRITICAL)

#### Data Layer
- **`src/managers/DataManager.js`** - Loads and indexes JSON data (CRITICAL)
- **`public/assets/data/cosmic-objects.json`** - Object library
- **`public/assets/data/physical-constants.json`** - Physical constants

#### State Management
- **`src/managers/StateManager.js`** - Centralized state, FIFO selection logic
- **`src/managers/AnimationManager.js`** - Animation coordination

#### Scenes
- **`src/scenes/BootScene.js`** - Asset loading, initialization (CRITICAL)
- **`src/scenes/MenuScene.js`** - Mode selection UI
- **`src/scenes/UIOverlayScene.js`** - Persistent UI layer
- **`src/scenes/CosmicComparisonScene.js`** - Main comparison orchestration (CRITICAL)

#### Components
- **`src/components/ComponentBase.js`** - Base class for all components
- **`src/components/comparison/ObjectSelector.js`** - Object library UI (CRITICAL)
- **`src/components/comparison/ScaleDisplay.js`** - Relative scale visualization (CRITICAL)
- **`src/components/comparison/DistanceAnimator.js`** - Separation animation
- **`src/components/comparison/LightSpeedTraveler.js`** - Light travel with timer

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

### Testing (Not Yet Implemented)
- Framework: Vitest
- Commands: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Config: `vitest.config.js` exists but no tests written yet

## Known Issues

### Windows Rollup Dependency
On Windows, npm has a bug with optional dependencies. Fix:
- Add `"@rollup/rollup-win32-x64-msvc": "^4.54.0"` to `devDependencies` in package.json
- This is already configured in the current package.json

## Next Steps (Not Yet Started)

### Phase 2: Expand Object Library
- Add 15-30 cosmic objects
- More planets, moons, stars, galaxies
- Extended distance relationships

### Phase 3: Powers of Ten Mode
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

- **v1.0.0-dev** - Phase 1 (CosmicComparison Mode) complete
  - All 22 files implemented
  - Full workflow: selection → scale → distance → light → reset
  - Development server ready for testing

---

**Last Updated:** 2025-12-26
**Phase:** Phase 1 Complete
**Status:** Ready for Testing
