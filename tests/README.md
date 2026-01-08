# Powers Explorer - Test Suite

This directory contains comprehensive tests for the critical bug fixes implemented in Powers Explorer.

## Test Structure

```
tests/
├── utils/
│   └── ScaleCalculator.test.js         - Division by zero guards, eccentricity validation
├── managers/
│   ├── AnimationManager.test.js        - Double event emission fix
│   ├── DataManager.test.js             - resetInstance property name fix
│   └── StateManager.test.js            - resetInstance listener order fix
├── components/
│   └── solarsystem/
│       ├── SizeComparisonView.test.js  - Empty array guards, Math.max() fixes
│       └── DistanceView.test.js        - Multiple empty array guards
└── scenes/
    └── SolarSystemScene.test.js        - Async race condition fixes
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test ScaleCalculator.test.js
```

## Critical Bugs Tested

### 1. Division by Zero Fixes
**Files:** `ScaleCalculator.test.js`

Tests that mathematical operations handle edge cases:
- Zero reference sizes in diameter calculations
- Zero denominators in ellipse polar equations
- Negative values in distance calculations
- Invalid eccentricity values (e >= 1 or e < 0)

**Why this matters:** One corrupted JSON file would crash the entire app without these guards.

### 2. Empty Array Math.max() Fixes
**Files:** `SizeComparisonView.test.js`, `DistanceView.test.js`

Tests that `Math.max(...array)` operations handle empty arrays:
- Empty bodies/planets arrays
- Arrays with all zero or negative values
- Missing or null data

**Why this matters:** `Math.max()` on empty array returns `-Infinity`, which then becomes a scale factor causing `NaN` rendering.

### 3. Async Race Condition Fixes
**Files:** `SolarSystemScene.test.js`

Tests that async operations check scene validity:
- Scene destroyed during `planetInfoPanel.hide()`
- Scene destroyed during `fadeOut()` animation
- Scene destroyed during `fetchOrbitalData()`
- Multiple overlapping async operations

**Why this matters:** User pressing Back during animation would access `null.setMode()` and crash.

### 4. Animation Manager Event Fixes
**Files:** `AnimationManager.test.js`

Tests that animation cancellation doesn't double-emit events:
- `cancelAnimation()` emits only `animationCancelled`, not `animationStopped`
- Removes from map BEFORE calling `tween.stop()`
- No unhandled promise rejections

**Why this matters:** Double events and unhandled rejections caused unpredictable behavior.

### 5. Manager Reset Fixes
**Files:** `DataManager.test.js`, `StateManager.test.js`

Tests that singleton reset methods work correctly:
- **DataManager:** Uses correct property names (`cosmicObjects`, not `objects`)
- **StateManager:** Removes listeners BEFORE reinitializing
- Both can be reset multiple times without errors

**Why this matters:** `DataManager.resetInstance()` would throw `TypeError: Cannot read property 'clear' of undefined` on first call.

## Test Coverage Goals

| Category | Target | Status |
|----------|--------|--------|
| Utils | 90%+ | ✓ |
| Managers | 85%+ | ✓ |
| Components | 80%+ | ✓ |
| Scenes | 75%+ | ✓ |

## Writing New Tests

When adding new tests, follow this pattern:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ComponentName - Critical Bug Fixes', () => {
  let component;

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName - Bug Description', () => {
    it('should handle edge case without crashing', () => {
      // Test implementation
      expect(result).toBeDefined();
      expect(isFinite(result)).toBe(true);
    });
  });
});
```

## Key Testing Principles

1. **Test edge cases first:** Zero, negative, null, undefined, empty arrays
2. **Test async timing:** Race conditions, scene destruction mid-operation
3. **Test cleanup:** Memory leaks, event listener removal, resource disposal
4. **Use descriptive names:** Test name should explain what's being tested
5. **Verify fixes, not features:** Focus on testing that bugs are actually fixed

## CI/CD Integration

These tests should run:
- On every commit (pre-commit hook)
- On every PR (GitHub Actions)
- Before production builds
- In nightly comprehensive test runs

## Debugging Failed Tests

If a test fails:

1. Check the error message - it should clearly state what went wrong
2. Run the specific test file: `npm test <filename>`
3. Add `console.log()` statements to understand the flow
4. Use `it.only()` to run just that test
5. Check if the fix was properly implemented in the source code

## Performance Tests

Currently tests focus on correctness. Future additions should include:
- Performance benchmarks for calculations
- Memory leak detection
- Animation timing validation

## Test Data

Tests use minimal mock data. If you need realistic test data:
- Use actual cosmic object values (Earth: 12742000m diameter)
- Use real orbital parameters from `orbital-parameters.json`
- Use actual AU value: 149597870700 meters

## Questions?

See `CLAUDE.md` for full project documentation or check the source files for inline comments.
