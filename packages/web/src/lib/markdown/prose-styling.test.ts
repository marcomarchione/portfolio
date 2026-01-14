/**
 * Tests for Prose Styling Configuration
 *
 * These tests verify that the prose styling classes and CSS configuration
 * will render correctly for both dark and light modes.
 *
 * Note: These tests check the structure and configuration. Visual verification
 * should be done through manual testing or Playwright E2E tests.
 */

import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

// Read the global.css file
const globalCssPath = path.join(__dirname, '../../styles/global.css');
const globalCss = fs.readFileSync(globalCssPath, 'utf-8');

// Read the project slug page
const slugPagePath = path.join(
  __dirname,
  '../../pages/[lang]/projects/[slug].astro'
);
const slugPage = fs.readFileSync(slugPagePath, 'utf-8');

describe('Prose Styling Configuration', () => {
  describe('Test 1: prose-invert for dark mode', () => {
    test('project page has prose-invert class for dark mode', () => {
      // Check that the prose container has prose-invert class
      expect(slugPage).toContain('prose-invert');
    });

    test('prose class is present in the markdown container', () => {
      expect(slugPage).toContain('prose');
      expect(slugPage).toContain('prose-lg');
    });
  });

  describe('Test 2: prose-neutral for light mode', () => {
    test('project page has light mode override with prose-neutral', () => {
      // Check for the light mode variant selector pattern
      expect(slugPage).toContain('[.light_&]:prose-neutral');
    });
  });

  describe('Test 3: Headings use font-heading (Space Grotesk)', () => {
    test('prose-headings modifiers are present', () => {
      expect(slugPage).toContain('prose-headings:font-heading');
      expect(slugPage).toContain('prose-headings:font-bold');
    });

    test('global.css defines font-heading as Space Grotesk', () => {
      expect(globalCss).toContain("--font-heading: 'Space Grotesk'");
    });

    test('global.css applies font-heading to headings', () => {
      expect(globalCss).toContain('h1, h2, h3, h4, h5, h6');
      expect(globalCss).toContain('font-family: var(--font-heading)');
    });
  });

  describe('Test 4: Links use primary-400 color with hover underline', () => {
    test('prose-a modifiers are configured for link styling', () => {
      expect(slugPage).toContain('prose-a:text-primary-400');
      expect(slugPage).toContain('prose-a:no-underline');
      expect(slugPage).toContain('hover:prose-a:underline');
    });
  });

  describe('Additional Prose Styling', () => {
    test('paragraph text colors are configured', () => {
      expect(slugPage).toContain('prose-p:text-neutral-300');
      expect(slugPage).toContain('[.light_&]:prose-p:text-neutral-600');
    });

    test('strong text colors are configured', () => {
      expect(slugPage).toContain('prose-strong:text-white');
      expect(slugPage).toContain('[.light_&]:prose-strong:text-neutral-900');
    });

    test('inline code styling is configured', () => {
      expect(slugPage).toContain('prose-code:bg-neutral-800/50');
      expect(slugPage).toContain('prose-code:px-1.5');
      expect(slugPage).toContain('prose-code:py-0.5');
      expect(slugPage).toContain('prose-code:rounded');
      expect(slugPage).toContain('[.light_&]:prose-code:bg-neutral-100');
    });
  });

  describe('Code Block Styling in global.css', () => {
    test('code blocks have rounded corners', () => {
      expect(globalCss).toContain('.prose pre');
      expect(globalCss).toContain('border-radius: 0.75rem');
    });

    test('code blocks have padding', () => {
      expect(globalCss).toContain('padding: 1rem');
    });

    test('code blocks have horizontal scrollbar', () => {
      expect(globalCss).toContain('overflow-x: auto');
    });

    test('code blocks have dark mode background', () => {
      expect(globalCss).toContain(
        'background-color: var(--color-neutral-900)'
      );
    });

    test('code blocks have light mode background', () => {
      expect(globalCss).toContain('.light .prose pre');
      expect(globalCss).toContain(
        'background-color: var(--color-neutral-100)'
      );
    });

    test('custom scrollbar styling for code blocks', () => {
      expect(globalCss).toContain('.prose pre::-webkit-scrollbar');
      expect(globalCss).toContain('.prose pre::-webkit-scrollbar-thumb');
    });
  });

  describe('Typography Plugin Configuration', () => {
    test('typography plugin is imported in global.css', () => {
      expect(globalCss).toContain('@plugin "@tailwindcss/typography"');
    });

    test('plugin import comes after tailwindcss import', () => {
      const tailwindIndex = globalCss.indexOf("@import 'tailwindcss'");
      const pluginIndex = globalCss.indexOf(
        '@plugin "@tailwindcss/typography"'
      );

      expect(tailwindIndex).toBeGreaterThan(-1);
      expect(pluginIndex).toBeGreaterThan(-1);
      expect(pluginIndex).toBeGreaterThan(tailwindIndex);
    });
  });

  describe('Font Configuration', () => {
    test('JetBrains Mono is configured for code', () => {
      expect(globalCss).toContain("--font-mono: 'JetBrains Mono'");
    });

    test('code elements use font-mono', () => {
      expect(globalCss).toContain('code, pre, kbd, samp');
      expect(globalCss).toContain('font-family: var(--font-mono)');
    });
  });
});
