/**
 * Sidebar Component
 *
 * Main navigation sidebar with links to all sections.
 */
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Newspaper,
  Image,
  Settings,
} from 'lucide-react';
import { NavLink } from './NavLink';
import { ROUTES } from '@/routes';

interface SidebarProps {
  /** Optional click handler for nav links (for closing mobile sidebar) */
  onNavClick?: () => void;
}

/** Navigation items configuration */
const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.PROJECTS, label: 'Projects', icon: FolderKanban },
  { to: ROUTES.MATERIALS, label: 'Materials', icon: FileText },
  { to: ROUTES.NEWS, label: 'News', icon: Newspaper },
  { to: ROUTES.MEDIA, label: 'Media', icon: Image },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
] as const;

/**
 * Sidebar navigation component.
 */
export function Sidebar({ onNavClick }: SidebarProps) {
  return (
    <aside className="flex flex-col h-full w-64 glass-card rounded-2xl">
      {/* Brand header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-display font-bold gradient-text">
          Marco Marchione
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-neutral-600 text-center">
          Version 1.0.0
        </p>
      </div>
    </aside>
  );
}
