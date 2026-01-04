/**
 * Simple Icons Utility
 *
 * Provides helpers for working with the simple-icons library.
 */
import * as simpleIcons from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';

/**
 * Icon metadata for the picker
 */
export interface IconMeta {
  slug: string;
  title: string;
  hex: string;
  path: string;
}

/**
 * Cache for all icons
 */
let cachedIcons: IconMeta[] | null = null;

/**
 * Gets all available icons from simple-icons.
 * Results are cached for performance.
 *
 * @returns Array of icon metadata
 */
export function getAllIcons(): IconMeta[] {
  if (cachedIcons) {
    return cachedIcons;
  }

  const icons: IconMeta[] = [];

  for (const key in simpleIcons) {
    if (key.startsWith('si')) {
      const icon = (simpleIcons as Record<string, SimpleIcon>)[key];
      if (icon && icon.slug && icon.title && icon.path) {
        icons.push({
          slug: icon.slug,
          title: icon.title,
          hex: icon.hex,
          path: icon.path,
        });
      }
    }
  }

  // Sort by title
  icons.sort((a, b) => a.title.localeCompare(b.title));
  cachedIcons = icons;

  return icons;
}

/**
 * Gets an icon by its slug.
 *
 * @param slug - Icon slug (e.g., "react", "typescript")
 * @returns Icon metadata or null if not found
 */
export function getIconBySlug(slug: string): IconMeta | null {
  const icons = getAllIcons();
  return icons.find((icon) => icon.slug === slug) ?? null;
}

/**
 * Searches icons by title or slug.
 *
 * @param query - Search query
 * @param limit - Maximum number of results (default: 100)
 * @returns Filtered icons
 */
export function searchIcons(query: string, limit = 100): IconMeta[] {
  const icons = getAllIcons();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return icons.slice(0, limit);
  }

  const filtered = icons.filter(
    (icon) =>
      icon.title.toLowerCase().includes(lowerQuery) ||
      icon.slug.toLowerCase().includes(lowerQuery)
  );

  return filtered.slice(0, limit);
}

/**
 * Renders an icon SVG string.
 *
 * @param icon - Icon metadata
 * @param size - Icon size in pixels (default: 24)
 * @param color - Fill color (default: currentColor)
 * @returns SVG string
 */
export function renderIconSvg(icon: IconMeta, size = 24, color = 'currentColor'): string {
  return `<svg role="img" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="${icon.path}"/></svg>`;
}
