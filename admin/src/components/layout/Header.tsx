/**
 * Header Component
 *
 * Top header bar with user info, logout, and mobile menu toggle.
 */
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';

/**
 * Header bar component.
 */
export function Header() {
  const { user, logout } = useAuth();
  const { isMobile, toggleSidebar } = useUI();

  return (
    <header className="h-16 glass-card rounded-2xl flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Mobile menu button */}
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors focus-ring"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Page breadcrumb placeholder */}
        <div className="hidden sm:block">
          <h2 className="text-lg font-display font-semibold text-neutral-200">
            Admin Panel
          </h2>
        </div>
      </div>

      {/* Right side - User info and logout */}
      <div className="flex items-center gap-4">
        {/* User indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
          <User className="h-4 w-4 text-neutral-400" />
          <span className="text-sm text-neutral-300 hidden sm:inline">
            {user?.subject || 'Admin'}
          </span>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors focus-ring"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
