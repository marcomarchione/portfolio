/**
 * Layout Component
 *
 * Main application layout with sidebar, header, and content area.
 */
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { UIProvider, useUI } from '@/contexts/UIContext';

/**
 * Inner layout component that uses UI context.
 */
function LayoutContent() {
  const { isMobile } = useUI();

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="fixed inset-y-0 left-0 z-30 p-4 lg:p-6">
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && <MobileSidebar />}

      {/* Main content area - account for sidebar width + its padding */}
      <div className={`flex-1 flex flex-col ${isMobile ? '' : 'lg:ml-[280px]'}`}>
        {/* Content wrapper with consistent padding */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6">
          {/* Header */}
          <div className="sticky top-4 lg:top-6 z-20">
            <Header />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Main layout component with UIProvider wrapper.
 */
export default function Layout() {
  return (
    <UIProvider>
      <LayoutContent />
    </UIProvider>
  );
}
