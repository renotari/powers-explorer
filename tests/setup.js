/**
 * Vitest Setup File
 *
 * This file runs before all tests to set up the testing environment
 */

import { vi } from 'vitest';

// Mock console methods to reduce noise in test output
// Uncomment these if you want to suppress console output during tests
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };

// Setup DOM globals for jsdom environment
if (typeof window !== 'undefined') {
  // Phaser expects these to be available
  global.window = window;
  global.document = document;
  global.navigator = window.navigator;
}

// Mock Phaser constants if needed
global.Phaser = global.Phaser || {
  Events: {
    EventEmitter: class {
      constructor() {
        this._events = {};
      }
      on(event, fn, context) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push({ fn, context });
      }
      off(event, fn, context) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter(
          listener => listener.fn !== fn || listener.context !== context
        );
      }
      once(event, fn, context) {
        const wrappedFn = (...args) => {
          this.off(event, wrappedFn, context);
          fn.apply(context, args);
        };
        this.on(event, wrappedFn, context);
      }
      emit(event, ...args) {
        if (!this._events[event]) return;
        this._events[event].forEach(listener => {
          listener.fn.apply(listener.context, args);
        });
      }
      removeAllListeners() {
        this._events = {};
      }
    }
  }
};
