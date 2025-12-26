/**
 * Bun Test Setup
 *
 * Sets up jsdom environment for component testing with Bun's test runner.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register happy-dom globals (document, window, etc.)
GlobalRegistrator.register();

// Import jest-dom matchers after DOM is available
import '@testing-library/jest-dom';
