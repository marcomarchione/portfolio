/**
 * Mobile Sidebar Component
 *
 * Overlay sidebar for mobile/tablet viewports using Radix Dialog.
 */
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useUI } from '@/contexts/UIContext';

/**
 * Mobile sidebar overlay component.
 */
export function MobileSidebar() {
  const { isSidebarOpen, closeSidebar } = useUI();

  return (
    <Dialog.Root open={isSidebarOpen} onOpenChange={(open) => !open && closeSidebar()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Sidebar panel */}
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 w-64 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Navigation Menu</Dialog.Title>

          {/* Close button */}
          <Dialog.Close
            className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors focus-ring z-10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          {/* Sidebar content */}
          <Sidebar onNavClick={closeSidebar} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
