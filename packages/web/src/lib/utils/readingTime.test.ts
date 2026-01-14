/**
 * Reading Time Calculation Tests
 *
 * Tests for calculateReadingTime utility function.
 */
import { describe, test, expect } from 'bun:test';
import { calculateReadingTime } from './readingTime';

describe('calculateReadingTime', () => {
  test('calculates reading time for normal text (250 words)', () => {
    const text = 'word '.repeat(250); // 250 words
    const readingTime = calculateReadingTime(text);
    expect(readingTime).toBe(1); // 250 / 250 = 1 minute
  });

  test('calculates reading time for longer text (500 words)', () => {
    const text = 'word '.repeat(500); // 500 words
    const readingTime = calculateReadingTime(text);
    expect(readingTime).toBe(2); // 500 / 250 = 2 minutes
  });

  test('rounds up using Math.ceil for partial minutes', () => {
    const text = 'word '.repeat(260); // 260 words
    const readingTime = calculateReadingTime(text);
    expect(readingTime).toBe(2); // Math.ceil(260 / 250) = 2 minutes
  });

  test('handles empty string', () => {
    const readingTime = calculateReadingTime('');
    expect(readingTime).toBe(1); // Minimum 1 minute
  });

  test('handles very short text', () => {
    const text = 'Hello world';
    const readingTime = calculateReadingTime(text);
    expect(readingTime).toBe(1); // Minimum 1 minute
  });

  test('counts words correctly with various whitespace', () => {
    const text = 'word1  word2\nword3\tword4   word5';
    const readingTime = calculateReadingTime(text);
    expect(readingTime).toBe(1); // 5 words / 250 = 0.02, rounded up to 1
  });

  test('handles markdown text with formatting', () => {
    const markdown = `# Heading\n\nThis is **bold** and *italic* text.\n\n- List item 1\n- List item 2`;
    const words = markdown.split(/\s+/).length;
    const readingTime = calculateReadingTime(markdown);
    expect(readingTime).toBeGreaterThanOrEqual(1);
  });

  test('handles null or undefined inputs gracefully', () => {
    expect(calculateReadingTime(null as any)).toBe(1);
    expect(calculateReadingTime(undefined as any)).toBe(1);
  });
});
