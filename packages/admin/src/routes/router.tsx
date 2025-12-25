/**
 * Router Configuration
 *
 * Defines application routes with lazy loading and protection.
 */
import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ROUTES } from './index';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component for lazy loaded routes.
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        <p className="text-neutral-400 text-sm">Loading page...</p>
      </div>
    </div>
  );
}

/**
 * Lazy wrapper for route components.
 */
function LazyRoute({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/**
 * Root component that provides AuthProvider.
 */
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

// Content pages
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'));
const ProjectFormPage = lazy(() => import('@/pages/projects/ProjectFormPage'));
const MaterialsPage = lazy(() => import('@/pages/materials/MaterialsPage'));
const MaterialFormPage = lazy(() => import('@/pages/materials/MaterialFormPage'));
const NewsPage = lazy(() => import('@/pages/news/NewsPage'));
const NewsFormPage = lazy(() => import('@/pages/news/NewsFormPage'));

// Other pages
const MediaPage = lazy(() => import('@/pages/media/MediaPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

// Layout
const Layout = lazy(() => import('@/components/layout/Layout'));

/**
 * Application routes configuration.
 */
const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: ROUTES.LOGIN,
        element: <LazyRoute component={LoginPage} />,
      },

      // Protected routes with layout
      {
        element: (
          <ProtectedRoute>
            <LazyRoute component={Layout} />
          </ProtectedRoute>
        ),
        children: [
          // Dashboard
          {
            path: ROUTES.DASHBOARD,
            element: <LazyRoute component={DashboardPage} />,
          },

          // Projects
          {
            path: ROUTES.PROJECTS,
            element: <LazyRoute component={ProjectsPage} />,
          },
          {
            path: ROUTES.PROJECTS_NEW,
            element: <LazyRoute component={ProjectFormPage} />,
          },
          {
            path: ROUTES.PROJECTS_EDIT,
            element: <LazyRoute component={ProjectFormPage} />,
          },

          // Materials
          {
            path: ROUTES.MATERIALS,
            element: <LazyRoute component={MaterialsPage} />,
          },
          {
            path: ROUTES.MATERIALS_NEW,
            element: <LazyRoute component={MaterialFormPage} />,
          },
          {
            path: ROUTES.MATERIALS_EDIT,
            element: <LazyRoute component={MaterialFormPage} />,
          },

          // News
          {
            path: ROUTES.NEWS,
            element: <LazyRoute component={NewsPage} />,
          },
          {
            path: ROUTES.NEWS_NEW,
            element: <LazyRoute component={NewsFormPage} />,
          },
          {
            path: ROUTES.NEWS_EDIT,
            element: <LazyRoute component={NewsFormPage} />,
          },

          // Media
          {
            path: ROUTES.MEDIA,
            element: <LazyRoute component={MediaPage} />,
          },

          // Settings
          {
            path: ROUTES.SETTINGS,
            element: <LazyRoute component={SettingsPage} />,
          },
        ],
      },

      // Root redirect
      {
        path: ROUTES.ROOT,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },

      // 404 catch-all
      {
        path: '*',
        element: <LazyRoute component={NotFoundPage} />,
      },
    ],
  },
];

/**
 * Application router instance.
 */
export const router = createBrowserRouter(routes);
