/**
 * Navigation Link Component
 *
 * Styled navigation link with active state highlighting.
 */
import { NavLink as RouterNavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  /** Link destination */
  to: string;
  /** Link label text */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional click handler (for closing mobile sidebar) */
  onClick?: () => void;
}

/**
 * Navigation link with icon and active state styling.
 */
export function NavLink({ to, label, icon: Icon, onClick }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 border ${
          isActive
            ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border-primary-500/30'
            : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'
        }`
      }
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </RouterNavLink>
  );
}
