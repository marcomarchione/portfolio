/**
 * Vitest Test Setup
 *
 * Configures the testing environment with DOM matchers and utilities.
 */
import { webcrypto } from 'node:crypto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Polyfill crypto for Node.js < 19
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

// Polyfill matchMedia for jsdom (used by react-hot-toast)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
