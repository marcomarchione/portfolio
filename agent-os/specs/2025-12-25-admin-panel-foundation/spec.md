# Specification: Admin Panel Foundation

## Goal
Create a React + Vite admin application with authentication, protected routes, and responsive navigation that integrates with the existing Elysia JWT-based backend API.

## User Stories
- As an admin, I want to log in with my credentials so that I can access the content management system
- As an admin, I want a persistent sidebar navigation so that I can quickly access different content sections

## Specific Requirements

**React + Vite Project Setup**
- Create new Vite project with React and TypeScript template in `admin/` directory
- Configure path aliases matching backend: `@/*` for `./src/*`
- Install dependencies: react-router-dom, @tanstack/react-query, radix-ui primitives, tailwindcss
- Configure Tailwind CSS with brand colors: primary (#3d7eff), accent (#8b5cf6), neutral dark (#0c0c0d)
- Set up Vite proxy to API server (localhost:3000) for development
- Configure ESLint and TypeScript strict mode

**Authentication Context and Token Management**
- Create AuthContext with state: isAuthenticated, isLoading, user (admin subject)
- Store tokens in localStorage: `accessToken`, `refreshToken`, `expiresAt`
- Implement automatic token refresh when accessToken expires (check expiresAt timestamp)
- Set up axios/fetch interceptor to attach Bearer token to all API requests
- Handle 401 responses globally: clear tokens and redirect to /login
- Persist auth state across browser tabs using storage event listener

**Login Page UI and Flow**
- Centered card layout with gradient mesh background and glass morphism effect (bg-white/5, backdrop-blur-xl)
- Display brand logo/identity at top of login form
- Form fields: username (text), password (password type), "Remember me" checkbox
- Form validation with inline error messages using Radix Form primitives
- Submit to POST /api/v1/auth/login with {username, password}
- On success: store tokens, redirect to /dashboard
- On failure: display error message from API response

**Protected Route Wrapper**
- Create ProtectedRoute component that wraps authenticated pages
- Check AuthContext.isAuthenticated on mount and route changes
- If not authenticated and not loading: redirect to /login with return URL
- Show loading spinner while auth state initializes
- Render children only when authenticated

**Layout Component with Responsive Sidebar**
- Fixed sidebar on desktop (left side, 256px width) with navigation links
- Header bar with admin user indicator and logout button
- Main content area with scroll and proper padding
- Navigation sections with icons: Dashboard, Projects, Materials, News, Media, Settings
- Active link highlighting based on current route
- Sidebar collapses to hamburger menu on screens < 1024px (lg breakpoint)

**Mobile Navigation Behavior**
- Hamburger icon in header on mobile/tablet viewports
- Sidebar slides in as overlay from left when hamburger clicked
- Backdrop overlay behind sidebar that closes on click
- Close button inside mobile sidebar
- Animate open/close with CSS transitions (transform, opacity)

**React Router Configuration**
- BrowserRouter with routes defined in single routes config file
- Public routes: /login
- Protected routes: /dashboard, /projects, /projects/new, /projects/:id/edit
- Same pattern for /materials and /news routes
- /media route for media library
- /settings route for technologies and tags management
- Redirect root (/) to /dashboard

**TanStack Query Setup**
- Configure QueryClient with sensible defaults: staleTime 5 minutes, retry 1
- Create QueryClientProvider wrapper at app root
- Set up devtools for development environment
- Prepare query key constants for future CRUD operations

**API Client Configuration**
- Create api client module with base URL from environment variable (VITE_API_URL)
- Implement request/response interceptors for auth token handling
- Type API responses matching backend: ApiResponse<T>, ApiErrorResponse, PaginatedResponse<T>
- Export typed fetch functions for auth endpoints: login, refresh, logout

**Placeholder Page Components**
- Create placeholder components for all routes: DashboardPage, ProjectsPage, ProjectFormPage, etc.
- Each placeholder shows page title and "Coming soon" message
- Consistent layout using shared Page component wrapper
- Prepare props interface for future data fetching (id param for edit routes)

## Visual Design
No visual mockups provided. Follow brand styling guidelines:

**Brand Design System**
- Dark mode default with background #0c0c0d
- Glass morphism cards: bg-white/5, backdrop-blur-xl, border border-white/10
- Gradient accents using primary (#3d7eff) to accent (#8b5cf6)
- Typography: Space Grotesk for headings, Inter for body text
- Hover states with subtle scale/color transitions (duration-300)

## Existing Code to Leverage

**Backend Authentication API (`/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/routes/auth.ts`)**
- POST /api/v1/auth/login accepts {username, password}, returns {accessToken, refreshToken, expiresIn}
- POST /api/v1/auth/refresh accepts {refreshToken}, returns {accessToken, expiresIn}
- POST /api/v1/auth/logout returns {message}
- Token expiry: access 15 minutes, refresh 7 days
- Single admin user with username "admin"

**JWT Token Structure (`/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/auth/jwt.ts`)**
- TokenPayload: {sub, type: 'access'|'refresh', iat, exp}
- Access token expiry returned in login response as expiresIn (seconds)
- Frontend should calculate expiresAt timestamp for refresh scheduling

**API Response Patterns (`/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/types/responses.ts`)**
- Success responses wrapped in {data: T} structure
- Error responses: {error, message, details, timestamp, path}
- Paginated responses: {data: T[], pagination: {total, offset, limit, hasMore}}

**Authorization Header Format (`/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/middleware/auth.ts`)**
- Protected endpoints require: Authorization: Bearer <accessToken>
- 401 UnauthorizedError returned for missing/invalid/expired tokens

**Content Types for Navigation**
- Content entities from database: projects, materials, news
- Lookup entities: technologies, tags
- Media library for file management
- These inform the sidebar navigation structure

## Out of Scope
- Actual content editor forms with CRUD operations (Feature #7)
- Media manager UI with upload functionality (Feature #8)
- Dashboard with analytics and statistics (Feature #9)
- API calls for content data fetching (pages are placeholders only)
- User management or multiple admin accounts
- Password reset or forgot password flow
- Two-factor authentication
- Dark/light theme toggle (dark mode only for now)
- Internationalization of admin UI
- Automated tests for admin panel (will be added in future iteration)
