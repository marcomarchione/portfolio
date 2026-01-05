/**
 * Component Library Index
 *
 * Central export point for all reusable components.
 * Organized by category: UI, Layout, Cards.
 */

// =============================================================================
// UI Components
// =============================================================================

// Typography
export { default as DisplayHeading } from './ui/DisplayHeading.astro';
export { default as SectionHeading } from './ui/SectionHeading.astro';
export { default as BodyText } from './ui/BodyText.astro';
export { default as GradientText } from './ui/GradientText.astro';
export { default as CodeBlock } from './ui/CodeBlock.astro';
export { default as InlineCode } from './ui/InlineCode.astro';

// Interactive
export { default as Button } from './ui/Button.astro';
export { default as Logo } from './ui/Logo.astro';

// React Islands
export { ThemeToggle } from './ui/ThemeToggle';
export { LanguageSwitcher } from './ui/LanguageSwitcher';

// =============================================================================
// Layout Components
// =============================================================================

export { default as Header } from './layout/Header.astro';
export { default as Footer } from './layout/Footer.astro';

// React Islands for Layout
export { HeaderWithMobileNav } from './layout/HeaderWithMobileNav';
export { MobileNav } from './layout/MobileNav';

// =============================================================================
// Card Components
// =============================================================================

export { default as GlassCard } from './cards/GlassCard.astro';
export { default as ProjectCard } from './cards/ProjectCard.astro';
export { default as MaterialCard } from './cards/MaterialCard.astro';
export { default as NewsCard } from './cards/NewsCard.astro';
