/**
 * Reading Time Calculation Utility
 *
 * Calculates estimated reading time for text content.
 * Uses standard reading speed of 250 words per minute.
 */

/**
 * Calculates reading time in minutes for given text.
 *
 * @param text - The text content to analyze (can be markdown)
 * @returns Estimated reading time in minutes (minimum 1)
 *
 * @example
 * ```ts
 * const time = calculateReadingTime('Lorem ipsum...'); // Returns 3
 * ```
 */
export function calculateReadingTime(text: string | null | undefined): number {
  // Handle edge cases
  if (!text || typeof text !== 'string') {
    return 1; // Minimum 1 minute for empty/invalid content
  }

  // Count words by splitting on whitespace
  const words = text.trim().split(/\s+/);
  const wordCount = words.filter(word => word.length > 0).length;

  // Calculate reading time (250 words per minute)
  const minutes = wordCount / 250;

  // Round up to nearest minute, minimum 1 minute
  return Math.max(1, Math.ceil(minutes));
}
