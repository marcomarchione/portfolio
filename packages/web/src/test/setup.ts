/**
 * Test Setup for Web Package
 *
 * Configures happy-dom for React component testing with bun:test.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Register happy-dom globally for DOM APIs
GlobalRegistrator.register();

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup();
});
