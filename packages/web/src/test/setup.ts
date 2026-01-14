/**
 * Test Setup for Web Package
 *
 * Configures happy-dom for React component testing with bun:test.
 */
import { Window } from 'happy-dom';
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Create and set up a window for DOM testing
const window = new Window({
  url: 'http://localhost',
  settings: {
    disableJavaScriptFileLoading: true,
    disableJavaScriptEvaluation: false,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    disableComputedStyleRendering: true,
  },
});

const document = window.document;

// Set up global DOM APIs
global.window = window as any;
global.document = document as any;
global.navigator = window.navigator as any;
global.location = window.location as any;
global.HTMLElement = window.HTMLElement as any;
global.Element = window.Element as any;
global.Node = window.Node as any;
global.MouseEvent = window.MouseEvent as any;
global.Event = window.Event as any;
global.KeyboardEvent = window.KeyboardEvent as any;
global.FocusEvent = window.FocusEvent as any;
global.InputEvent = window.InputEvent as any;
global.CustomEvent = window.CustomEvent as any;

// Ensure document.body exists
if (!document.body) {
  document.body = document.createElement('body');
  document.documentElement.appendChild(document.body);
}

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup();
});
