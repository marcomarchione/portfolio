/**
 * HeaderWithMobileNav Component
 *
 * React island that manages mobile navigation state.
 * Contains hamburger button and MobileNav drawer.
 *
 * @example
 * <HeaderWithMobileNav
 *   lang="it"
 *   currentPath="/it/projects/"
 *   navItems={[...]}
 *   translations={...}
 *   client:idle
 * />
 */
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import type { Language } from '@marcomarchione/shared';
import { MobileNav, type NavItem, type MobileNavTranslations } from './MobileNav';

export interface HeaderWithMobileNavProps {
  /** Current language code */
  lang: Language;
  /** Current page path for language switching */
  currentPath: string;
  /** Navigation items */
  navItems: NavItem[];
  /** Translated strings */
  translations: MobileNavTranslations & {
    openMenu: string;
  };
}

export function HeaderWithMobileNav({
  lang,
  currentPath: initialPath,
  navItems: initialNavItems,
  translations,
}: HeaderWithMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(initialPath);

  // Listen for View Transitions navigation to update current path
  useEffect(() => {
    const handlePageLoad = () => {
      setCurrentPath(window.location.pathname);
    };

    document.addEventListener('astro:page-load', handlePageLoad);
    return () => document.removeEventListener('astro:page-load', handlePageLoad);
  }, []);

  // Recalculate active state based on current path
  const navItems = initialNavItems.map((item, index) => {
    const isHome = index === 0; // First item is always home
    const isActive = currentPath.startsWith(item.href) && (isHome ? currentPath === item.href : true);
    return { ...item, isActive };
  });

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [.light_&]:text-neutral-600 [.light_&]:hover:text-neutral-900 [.light_&]:hover:bg-neutral-200"
        aria-label={translations.openMenu}
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        lang={lang}
        currentPath={currentPath}
        navItems={navItems}
        translations={translations}
      />
    </>
  );
}

export default HeaderWithMobileNav;
