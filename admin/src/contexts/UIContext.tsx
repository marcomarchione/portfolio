/**
 * UI Context
 *
 * Provides UI state management for sidebar and responsive behavior.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/** Mobile breakpoint in pixels (lg: 1024px) */
const MOBILE_BREAKPOINT = 1024;

/**
 * UI context state interface.
 */
interface UIState {
  /** Whether sidebar is open */
  isSidebarOpen: boolean;
  /** Whether viewport is mobile/tablet size */
  isMobile: boolean;
}

/**
 * UI context value interface.
 */
interface UIContextValue extends UIState {
  /** Toggle sidebar open/closed */
  toggleSidebar: () => void;
  /** Open sidebar */
  openSidebar: () => void;
  /** Close sidebar */
  closeSidebar: () => void;
}

/** UI context */
const UIContext = createContext<UIContextValue | null>(null);

/**
 * UI context provider component.
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /**
   * Check if viewport is mobile size.
   */
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);

    // Close mobile sidebar when resizing to desktop
    if (!mobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);

  /**
   * Initialize and handle resize events.
   */
  useEffect(() => {
    // Initial check
    checkMobile();

    // Debounced resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [checkMobile]);

  /**
   * Toggle sidebar state.
   */
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  /**
   * Open sidebar.
   */
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  /**
   * Close sidebar.
   */
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  /**
   * Prevent body scroll when mobile sidebar is open.
   */
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isSidebarOpen]);

  const value: UIContextValue = {
    isSidebarOpen,
    isMobile,
    toggleSidebar,
    openSidebar,
    closeSidebar,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

/**
 * Hook to access UI context.
 *
 * @throws Error if used outside UIProvider
 */
export function useUI(): UIContextValue {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }

  return context;
}
