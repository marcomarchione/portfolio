/**
 * MobileNav Component
 *
 * Slide-out drawer for mobile navigation using Radix Dialog.
 * Contains navigation links, theme toggle, and language switcher.
 *
 * @example
 * <MobileNav
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   lang="it"
 *   currentPath="/it/projects/"
 *   navItems={[{ label: 'Home', href: '/it/', isActive: true }]}
 *   translations={{ closeMenu: 'Close menu', ... }}
 * />
 */
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { Language } from '@marcomarchione/shared';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export interface NavItem {
  label: string;
  href: string;
  isActive: boolean;
}

export interface MobileNavTranslations {
  closeMenu: string;
  switchToLight: string;
  switchToDark: string;
  switchLanguage: string;
}

export interface MobileNavProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Current language code */
  lang: Language;
  /** Current page path for language switching */
  currentPath: string;
  /** Navigation items */
  navItems: NavItem[];
  /** Translated strings */
  translations: MobileNavTranslations;
}

export function MobileNav({
  isOpen,
  onClose,
  lang,
  currentPath,
  navItems,
  translations,
}: MobileNavProps) {
  const handleNavClick = () => {
    // Close drawer after a short delay to allow navigation
    setTimeout(onClose, 150);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Drawer panel */}
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 w-64 bg-bg-primary border-r border-white/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300 [.light_&]:bg-white [.light_&]:border-neutral-200"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Navigation Menu</Dialog.Title>

          {/* Close button */}
          <Dialog.Close
            className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors [.light_&]:hover:bg-neutral-100 [.light_&]:hover:text-neutral-900"
            aria-label={translations.closeMenu}
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          {/* Drawer content */}
          <div className="flex flex-col h-full pt-16 pb-6 px-4">
            {/* Navigation links */}
            <nav className="flex-1">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={handleNavClick}
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        item.isActive
                          ? 'bg-primary-500/20 text-primary-300 [.light_&]:bg-primary-100 [.light_&]:text-primary-700'
                          : 'text-neutral-300 hover:bg-white/5 hover:text-white [.light_&]:text-neutral-700 [.light_&]:hover:bg-neutral-100 [.light_&]:hover:text-neutral-900'
                      }`}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer actions: Theme Toggle + Language Switcher */}
            <div className="border-t border-white/10 pt-4 mt-4 [.light_&]:border-neutral-200">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm text-neutral-500">Theme</span>
                <ThemeToggle
                  ariaLabelLight={translations.switchToLight}
                  ariaLabelDark={translations.switchToDark}
                />
              </div>
              <div className="flex items-center justify-between px-4 mt-4">
                <span className="text-sm text-neutral-500">Language</span>
                <LanguageSwitcher
                  currentLang={lang}
                  currentPath={currentPath}
                  ariaLabel={translations.switchLanguage}
                />
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default MobileNav;
