/**
 * Protected Route Component
 *
 * Wrapper component that protects routes requiring authentication.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  /** Child components to render when authenticated */
  children: React.ReactNode;
}

/**
 * Loading spinner component.
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        <p className="text-neutral-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Protected route wrapper.
 *
 * - Shows loading spinner while auth state initializes
 * - Redirects to login if not authenticated
 * - Preserves return URL for post-login redirect
 * - Renders children when authenticated
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while auth initializes
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Render protected content
  return <>{children}</>;
}
