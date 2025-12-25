/**
 * Auth Context
 *
 * Provides authentication state and methods throughout the application.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AuthUser } from '@/types/auth';
import { login as apiLogin, logout as apiLogout } from '@/lib/api/auth';
import {
  saveTokens,
  clearTokens,
  getTokens,
  hasStoredTokens,
} from '@/lib/auth/storage';
import { startTokenRefresh, stopTokenRefresh } from '@/lib/auth/refresh';
import { UNAUTHORIZED_EVENT } from '@/lib/api/client';
import { ROUTES } from '@/routes';

/**
 * Auth context state interface.
 */
interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is being initialized */
  isLoading: boolean;
  /** Authenticated user info */
  user: AuthUser | null;
}

/**
 * Auth context value interface.
 */
interface AuthContextValue extends AuthState {
  /** Login with credentials */
  login: (username: string, password: string) => Promise<void>;
  /** Logout and clear tokens */
  logout: () => Promise<void>;
}

/** Auth context */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth context provider component.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Handle logout - clears tokens and resets state.
   */
  const handleLogout = useCallback(async () => {
    stopTokenRefresh();

    try {
      await apiLogout();
    } catch {
      // Ignore logout API errors
    }

    clearTokens();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate]);

  /**
   * Handle login - authenticates and stores tokens.
   */
  const handleLogin = useCallback(
    async (username: string, password: string) => {
      const response = await apiLogin(username, password);

      // Save tokens
      saveTokens(response.accessToken, response.refreshToken, response.expiresIn);

      // Update state
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: { subject: 'admin' },
      });

      // Start token refresh
      startTokenRefresh(handleLogout);

      // Navigate to return URL or dashboard
      const returnUrl =
        (location.state as { from?: string })?.from || ROUTES.DASHBOARD;
      navigate(returnUrl, { replace: true });
    },
    [navigate, location.state, handleLogout]
  );

  /**
   * Initialize auth state from stored tokens.
   */
  useEffect(() => {
    const initAuth = () => {
      if (hasStoredTokens()) {
        const tokens = getTokens();
        if (tokens && tokens.expiresAt > Date.now()) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: { subject: 'admin' },
          });

          // Start token refresh
          startTokenRefresh(handleLogout);
          return;
        }
      }

      // No valid tokens
      clearTokens();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    };

    initAuth();

    return () => {
      stopTokenRefresh();
    };
  }, [handleLogout]);

  /**
   * Listen for 401 unauthorized events from API client.
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [handleLogout]);

  /**
   * Sync auth state across browser tabs using storage events.
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Token was cleared in another tab
      if (event.key === 'accessToken' && event.newValue === null) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
        stopTokenRefresh();
        navigate(ROUTES.LOGIN, { replace: true });
      }

      // Token was added in another tab
      if (event.key === 'accessToken' && event.newValue && !state.isAuthenticated) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: { subject: 'admin' },
        });
        startTokenRefresh(handleLogout);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, state.isAuthenticated, handleLogout]);

  const value: AuthContextValue = {
    ...state,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
