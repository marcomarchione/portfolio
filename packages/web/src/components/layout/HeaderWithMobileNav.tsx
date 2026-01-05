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
import { useState } from 'react';
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
  currentPath,
  navItems,
  translations,
}: HeaderWithMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

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
