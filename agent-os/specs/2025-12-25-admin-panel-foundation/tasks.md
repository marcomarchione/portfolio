# Task Breakdown: Admin Panel Foundation

## Overview
Total Tasks: 45
Estimated Effort: M (1 week)

This feature creates the React + Vite admin application with authentication, protected routes, and responsive navigation that integrates with the existing Elysia JWT-based backend API.

## Task List

### Project Setup

#### Task Group 1: Vite + React Project Initialization
**Dependencies:** None

- [x] 1.0 Complete Vite + React project setup
  - [x] 1.1 Create new Vite project with React + TypeScript template
    - Initialize in `admin/` directory at project root
    - Use `bun create vite admin --template react-ts`
    - Verify TypeScript strict mode is enabled in tsconfig.json
  - [x] 1.2 Configure path aliases
    - Add `@/*` alias mapping to `./src/*` in tsconfig.json
    - Configure Vite resolve.alias in vite.config.ts
    - Match backend path alias pattern for consistency
  - [x] 1.3 Install core dependencies
    - React Router: `react-router-dom`
    - TanStack Query: `@tanstack/react-query`, `@tanstack/react-query-devtools`
    - Radix UI primitives: `@radix-ui/react-form`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`
    - Icons: `lucide-react`
  - [x] 1.4 Configure Tailwind CSS
    - Install tailwindcss, postcss, autoprefixer
    - Create tailwind.config.ts with brand colors:
      - primary: #3d7eff (Agent Blue)
      - accent: #8b5cf6 (Neural Violet)
      - neutral dark: #0c0c0d (background)
    - Configure fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code)
    - Set up custom glass morphism utilities
  - [x] 1.5 Configure Vite development proxy
    - Add proxy configuration for `/api` to `http://localhost:3000`
    - Enable CORS for development
  - [x] 1.6 Set up ESLint configuration
    - Extend from Vite React TypeScript defaults
    - Enable strict TypeScript rules
    - Add React Hooks linting rules
  - [x] 1.7 Create environment configuration
    - Create `.env.example` with `VITE_API_URL`
    - Create `.env.development` with localhost API URL
    - Add `admin/.env*` to root .gitignore

**Acceptance Criteria:**
- `bun run dev` starts development server without errors
- Path aliases resolve correctly in imports
- Tailwind classes apply with brand colors
- API proxy forwards requests to backend

---

### API Integration Layer

#### Task Group 2: API Client and Types
**Dependencies:** Task Group 1

- [x] 2.0 Complete API client configuration
  - [x] 2.1 Create API response type definitions
    - Create `src/types/api.ts`
    - Define `ApiResponse<T>` matching backend pattern
    - Define `ApiErrorResponse` with error, message, details, timestamp, path
    - Define `PaginatedResponse<T>` with data and pagination metadata
    - Reference: `/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/types/responses.ts`
  - [x] 2.2 Create authentication type definitions
    - Create `src/types/auth.ts`
    - Define `LoginRequest` with username, password fields
    - Define `LoginResponse` with accessToken, refreshToken, expiresIn
    - Define `RefreshRequest` with refreshToken
    - Define `RefreshResponse` with accessToken, expiresIn
    - Define `AuthUser` with subject identifier
  - [x] 2.3 Create base API client module
    - Create `src/lib/api/client.ts`
    - Initialize with base URL from `VITE_API_URL` environment variable
    - Export typed fetch wrapper with JSON handling
    - Implement request/response error transformation
  - [x] 2.4 Implement request interceptor for auth tokens
    - Create `src/lib/api/interceptors.ts`
    - Attach `Authorization: Bearer <token>` header to requests
    - Read token from localStorage
    - Skip auth header for public endpoints (/auth/login)
  - [x] 2.5 Implement response interceptor for 401 handling
    - Detect 401 Unauthorized responses
    - Clear stored tokens on 401
    - Dispatch custom event for auth context to handle redirect
    - Handle network errors gracefully
  - [x] 2.6 Create typed auth API functions
    - Create `src/lib/api/auth.ts`
    - Export `login(username, password)` -> LoginResponse
    - Export `refresh(refreshToken)` -> RefreshResponse
    - Export `logout()` -> void
    - All functions use typed API client

**Acceptance Criteria:**
- API types match backend response structures exactly
- API client properly handles JSON requests/responses
- Auth token automatically attached to protected requests
- 401 responses trigger token cleanup

---

### Authentication System

#### Task Group 3: Auth Context and Token Management
**Dependencies:** Task Group 2

- [x] 3.0 Complete authentication context
  - [x] 3.1 Create token storage utilities
    - Create `src/lib/auth/storage.ts`
    - Define storage keys: `accessToken`, `refreshToken`, `expiresAt`
    - Implement `saveTokens(tokens)` - stores tokens and calculates expiresAt
    - Implement `getTokens()` - retrieves stored tokens
    - Implement `clearTokens()` - removes all auth data
    - Implement `isTokenExpired()` - checks expiresAt against current time
  - [x] 3.2 Create AuthContext with provider
    - Create `src/contexts/AuthContext.tsx`
    - Define state: `isAuthenticated`, `isLoading`, `user` (admin subject)
    - Initialize auth state from localStorage on mount
    - Export `useAuth()` hook for consuming context
  - [x] 3.3 Implement login flow in context
    - Add `login(username, password)` function to context
    - Call auth API login endpoint
    - On success: save tokens, set authenticated state, extract user from token
    - On failure: throw error for form handling
  - [x] 3.4 Implement logout flow in context
    - Add `logout()` function to context
    - Call auth API logout endpoint
    - Clear all stored tokens
    - Reset auth state to unauthenticated
    - Navigate to /login
  - [x] 3.5 Implement automatic token refresh
    - Create `src/lib/auth/refresh.ts`
    - Check token expiry on app focus and periodically (every minute)
    - Refresh token 1 minute before expiry
    - On refresh failure: trigger logout
    - Use refresh token to get new access token
  - [x] 3.6 Implement cross-tab auth sync
    - Listen to `storage` event for token changes
    - Sync auth state when tokens change in another tab
    - Handle logout in one tab affecting all tabs
  - [x] 3.7 Set up global 401 handler
    - Listen for custom 401 event from API interceptor
    - Trigger logout and redirect to /login
    - Preserve return URL for post-login redirect

**Acceptance Criteria:**
- Login stores tokens and updates auth state
- Logout clears tokens and redirects to login
- Token refresh happens automatically before expiry
- Auth state syncs across browser tabs
- 401 responses trigger automatic logout

---

### Routing System

#### Task Group 4: React Router Configuration
**Dependencies:** Task Group 3

- [x] 4.0 Complete routing configuration
  - [x] 4.1 Create route constants and configuration
    - Create `src/routes/index.ts`
    - Define route paths as constants
    - Public routes: `/login`
    - Protected routes: `/dashboard`, `/projects`, `/projects/new`, `/projects/:id/edit`
    - Same pattern for `/materials` and `/news`
    - `/media` for media library
    - `/settings` for technologies and tags
  - [x] 4.2 Create ProtectedRoute wrapper component
    - Create `src/components/auth/ProtectedRoute.tsx`
    - Check `useAuth().isAuthenticated` on render
    - Show loading spinner while `isLoading` is true
    - Redirect to `/login` with return URL if not authenticated
    - Render children when authenticated
  - [x] 4.3 Create router configuration with lazy loading
    - Create `src/routes/router.tsx`
    - Use `createBrowserRouter` from react-router-dom
    - Configure public routes without protection
    - Wrap protected routes with ProtectedRoute
    - Implement lazy loading with `React.lazy` for code splitting
  - [x] 4.4 Configure root redirect and 404 handling
    - Redirect `/` to `/dashboard`
    - Create NotFoundPage component for unmatched routes
    - Apply consistent styling to 404 page
  - [x] 4.5 Integrate router with App component
    - Create `src/App.tsx` with RouterProvider
    - Wrap with QueryClientProvider
    - Wrap with AuthProvider
    - Set up proper provider nesting order

**Acceptance Criteria:**
- Public routes accessible without authentication
- Protected routes redirect to login when unauthenticated
- Return URL preserved after login redirect
- Root path redirects to dashboard
- 404 page displays for unknown routes

---

### Layout Components

#### Task Group 5: Base Layout and Navigation
**Dependencies:** Task Group 4

- [x] 5.0 Complete layout component system
  - [x] 5.1 Create UI context for sidebar state
    - Create `src/contexts/UIContext.tsx`
    - Define state: `isSidebarOpen`, `isMobile`
    - Implement `toggleSidebar()`, `closeSidebar()`, `openSidebar()`
    - Detect mobile viewport on mount and resize
    - Export `useUI()` hook
  - [x] 5.2 Create base layout wrapper component
    - Create `src/components/layout/Layout.tsx`
    - Structure: sidebar + main content area
    - Fixed sidebar on desktop (256px width)
    - Main content with scroll and padding
    - Apply dark background (#0c0c0d)
  - [x] 5.3 Create sidebar navigation component
    - Create `src/components/layout/Sidebar.tsx`
    - Navigation sections with icons (lucide-react):
      - Dashboard (LayoutDashboard icon)
      - Projects (FolderKanban icon)
      - Materials (FileText icon)
      - News (Newspaper icon)
      - Media (Image icon)
      - Settings (Settings icon)
    - Active link highlighting based on current route
    - Glass morphism styling (bg-white/5, backdrop-blur-xl, border-white/10)
  - [x] 5.4 Create header bar component
    - Create `src/components/layout/Header.tsx`
    - Display admin user indicator
    - Logout button with icon
    - Hamburger menu button (mobile only)
    - Glass morphism styling matching sidebar
  - [x] 5.5 Create navigation link component
    - Create `src/components/layout/NavLink.tsx`
    - Accept icon, label, and href props
    - Apply active state styling based on current path
    - Hover states with subtle transitions (duration-300)
    - Use Radix Slot for polymorphic rendering

**Acceptance Criteria:**
- Layout displays correctly with sidebar and content area
- Navigation links highlight when active
- Header shows admin info and logout
- All components follow glass morphism design

---

#### Task Group 6: Mobile Responsive Navigation
**Dependencies:** Task Group 5

- [x] 6.0 Complete mobile navigation behavior
  - [x] 6.1 Implement responsive sidebar visibility
    - Hide sidebar on screens < 1024px (lg breakpoint)
    - Show hamburger icon in header on mobile/tablet
    - Sidebar visible by default on desktop
  - [x] 6.2 Create mobile sidebar overlay
    - Create `src/components/layout/MobileSidebar.tsx`
    - Use Radix Dialog for accessible modal behavior
    - Sidebar slides in from left as overlay
    - Dark backdrop overlay behind sidebar
  - [x] 6.3 Implement slide-in animation
    - CSS transition on transform property
    - Slide from -100% to 0 on open
    - Opacity transition for backdrop
    - Duration 300ms for smooth feel
  - [x] 6.4 Add close interactions
    - Close button inside mobile sidebar
    - Click backdrop to close
    - Close on navigation link click
    - Close on Escape key press (handled by Radix)
  - [x] 6.5 Handle viewport resize
    - Close mobile sidebar when resizing to desktop
    - Update isMobile state in UIContext
    - Prevent body scroll when mobile sidebar open

**Acceptance Criteria:**
- Sidebar collapses to hamburger on mobile/tablet
- Mobile sidebar slides in with smooth animation
- Backdrop click closes sidebar
- Navigation works correctly on all screen sizes

---

### TanStack Query Setup

#### Task Group 7: Query Client Configuration
**Dependencies:** Task Group 1

- [x] 7.0 Complete TanStack Query setup
  - [x] 7.1 Create QueryClient instance
    - Create `src/lib/query/client.ts`
    - Configure defaults:
      - staleTime: 5 minutes (300000ms)
      - retry: 1
      - refetchOnWindowFocus: true
    - Export singleton QueryClient instance
  - [x] 7.2 Create query key factory
    - Create `src/lib/query/keys.ts`
    - Define key constants for future CRUD operations:
      - `projectKeys`: all, lists, details
      - `materialKeys`: all, lists, details
      - `newsKeys`: all, lists, details
      - `mediaKeys`: all, lists, details
      - `settingsKeys`: technologies, tags
    - Use factory pattern for parameterized keys
  - [x] 7.3 Set up QueryClientProvider
    - Add QueryClientProvider to App.tsx
    - Configure ReactQueryDevtools for development only
    - Position devtools in bottom-right corner

**Acceptance Criteria:**
- QueryClient configured with sensible defaults
- Query keys ready for future API integration
- Devtools available in development mode

---

### Login Page

#### Task Group 8: Login Page UI and Flow
**Dependencies:** Task Groups 3, 5

- [x] 8.0 Complete login page implementation
  - [x] 8.1 Create login page layout
    - Create `src/pages/LoginPage.tsx`
    - Full-screen centered card layout
    - Gradient mesh background with floating orbs
    - Glass morphism card (bg-white/5, backdrop-blur-xl, border-white/10)
  - [x] 8.2 Add brand identity header
    - Display logo or brand name at top of form
    - Use gradient text effect (primary to accent)
    - Typography: Space Grotesk heading
  - [x] 8.3 Create login form with Radix Form
    - Username field (text input)
    - Password field (password input with visibility toggle)
    - "Remember me" checkbox
    - Submit button with loading state
    - Use Radix Form primitives for validation
  - [x] 8.4 Implement form validation
    - Required field validation
    - Inline error messages below fields
    - Error styling (red border, error text)
    - Clear errors on input change
  - [x] 8.5 Connect form to auth context
    - Call `login()` on form submit
    - Show loading spinner during API call
    - Display API error message on failure
    - Redirect to dashboard (or return URL) on success
  - [x] 8.6 Style form components
    - Input fields with dark theme styling
    - Focus states with primary color ring
    - Button with gradient background
    - Hover states with scale/color transitions

**Acceptance Criteria:**
- Login page matches brand styling
- Form validates inputs before submit
- API errors display clearly
- Successful login redirects to dashboard

---

### Placeholder Pages

#### Task Group 9: Placeholder Page Components
**Dependencies:** Task Groups 4, 5

- [x] 9.0 Complete placeholder page components
  - [x] 9.1 Create shared Page wrapper component
    - Create `src/components/common/Page.tsx`
    - Accept title, actions (optional), children props
    - Consistent header with page title
    - Action buttons area (top-right)
    - Content area with proper padding
  - [x] 9.2 Create DashboardPage placeholder
    - Create `src/pages/DashboardPage.tsx`
    - Display "Dashboard" title
    - "Coming soon" message with analytics preview text
    - Will be implemented in Feature #9
  - [x] 9.3 Create content list page placeholders
    - Create `src/pages/projects/ProjectsPage.tsx`
    - Create `src/pages/materials/MaterialsPage.tsx`
    - Create `src/pages/news/NewsPage.tsx`
    - Each displays title and "Coming soon" message
    - Prepare "New [Type]" button placeholder
  - [x] 9.4 Create content form page placeholders
    - Create `src/pages/projects/ProjectFormPage.tsx`
    - Create `src/pages/materials/MaterialFormPage.tsx`
    - Create `src/pages/news/NewsFormPage.tsx`
    - Accept `id` param for edit mode via useParams
    - Display "New [Type]" or "Edit [Type]" based on id
    - Will be implemented in Feature #7
  - [x] 9.5 Create MediaPage placeholder
    - Create `src/pages/media/MediaPage.tsx`
    - Display "Media Library" title
    - "Coming soon" message
    - Will be implemented in Feature #8
  - [x] 9.6 Create SettingsPage placeholder
    - Create `src/pages/settings/SettingsPage.tsx`
    - Display "Settings" title
    - Tabs placeholder for Technologies and Tags
    - Will be implemented in Feature #7

**Acceptance Criteria:**
- All placeholder pages render without errors
- Pages use consistent Page wrapper
- Edit pages correctly read id parameter
- Layout displays correctly with sidebar

---

### Final Integration

#### Task Group 10: Integration and Polish
**Dependencies:** Task Groups 1-9

- [x] 10.0 Complete integration and verification
  - [x] 10.1 Verify complete auth flow
    - Test login with valid credentials
    - Verify token storage in localStorage
    - Test automatic token refresh
    - Verify logout clears tokens and redirects
    - Test 401 handling triggers logout
  - [x] 10.2 Verify routing protection
    - Unauthenticated access to protected routes redirects to login
    - Return URL preserved and restored after login
    - All navigation links work correctly
  - [x] 10.3 Verify responsive behavior
    - Test desktop layout (sidebar visible)
    - Test tablet layout (hamburger menu)
    - Test mobile layout (hamburger menu, proper sizing)
    - Verify sidebar close on navigation
  - [x] 10.4 Add loading states
    - App initialization loading spinner
    - Login form submission loading
    - Page transition loading indicators
  - [x] 10.5 Verify cross-tab behavior
    - Login in one tab updates all tabs
    - Logout in one tab logs out all tabs
    - Token refresh syncs across tabs
  - [x] 10.6 Update root project documentation
    - Add admin panel section to README
    - Document development setup steps
    - Document environment variables

**Acceptance Criteria:**
- Complete authentication flow works end-to-end
- All routes protected and accessible correctly
- Responsive design works on all viewports
- Cross-tab auth sync functions correctly
- Development setup documented

---

## Execution Order

Recommended implementation sequence:

```
Phase 1: Foundation (Days 1-2)
  1. Task Group 1: Vite + React Project Initialization
  2. Task Group 7: Query Client Configuration (parallel with 1)
  3. Task Group 2: API Client and Types

Phase 2: Authentication (Days 2-3)
  4. Task Group 3: Auth Context and Token Management
  5. Task Group 4: React Router Configuration

Phase 3: Layout & Navigation (Days 3-4)
  6. Task Group 5: Base Layout and Navigation
  7. Task Group 6: Mobile Responsive Navigation

Phase 4: Pages (Days 4-5)
  8. Task Group 8: Login Page UI and Flow
  9. Task Group 9: Placeholder Page Components

Phase 5: Integration (Day 5)
  10. Task Group 10: Integration and Polish
```

## Key Files to Create

```
admin/
  src/
    App.tsx
    main.tsx
    index.css
    components/
      auth/
        ProtectedRoute.tsx
      common/
        Page.tsx
      layout/
        Layout.tsx
        Sidebar.tsx
        Header.tsx
        NavLink.tsx
        MobileSidebar.tsx
    contexts/
      AuthContext.tsx
      UIContext.tsx
    lib/
      api/
        client.ts
        interceptors.ts
        auth.ts
      auth/
        storage.ts
        refresh.ts
      query/
        client.ts
        keys.ts
    pages/
      LoginPage.tsx
      DashboardPage.tsx
      NotFoundPage.tsx
      projects/
        ProjectsPage.tsx
        ProjectFormPage.tsx
      materials/
        MaterialsPage.tsx
        MaterialFormPage.tsx
      news/
        NewsPage.tsx
        NewsFormPage.tsx
      media/
        MediaPage.tsx
      settings/
        SettingsPage.tsx
    routes/
      index.ts
      router.tsx
    types/
      api.ts
      auth.ts
  tailwind.config.ts
  vite.config.ts
  tsconfig.json
  .env.example
  .env.development
```

## Notes

- **No automated tests required** for this feature (per spec: "Automated tests for admin panel will be added in future iteration")
- **No visual mockups provided** - follow brand styling guidelines throughout
- **Backend integration points** are well-defined in existing auth routes
- **Future features** (7, 8, 9) will build on this foundation
