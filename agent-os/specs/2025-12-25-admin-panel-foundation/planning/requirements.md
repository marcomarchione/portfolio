# Spec Requirements: Admin Panel Foundation

## Initial Description

**Feature #6 from Product Roadmap**

Create React + Vite admin application with routing, authentication flow, protected routes, and base layout with navigation sidebar.

**Effort Estimate:** M (1 week)

**Dependencies:**
- Requires features 1-5 to be completed (Database, Backend API, Authentication System, Content CRUD APIs, Media Upload)

**Technical Context:**
- This is the foundation for the admin panel that will allow content management
- Needs to integrate with the existing JWT-based authentication system
- Will be the base for subsequent admin features (Content Editor Forms, Media Manager UI, Admin Dashboard)

## Requirements Discussion

### First Round Questions

**Q1:** UI Component Library approach?
**Answer:** Radix UI for accessible headless primitives + Tailwind CSS custom styling

**Q2:** Login page design and features?
**Answer:** Minimal centered form with brand styling (gradient background, glass morphism), includes "remember me", shows logo/brand identity

**Q3:** Sidebar navigation structure?
**Answer:** Confirmed structure - Dashboard, Projects, Materials, News, Media, Technologies, Tags

**Q4:** Token storage and session management approach?
**Answer:** localStorage approach, with automatic refresh before expiry, 401 redirect to login, persist across tabs

**Q5:** Routing structure?
**Answer:** Confirmed - /login (public), /dashboard (protected), /projects, /projects/new, /projects/:id/edit, same pattern for materials/news, /media, /settings for technologies/tags

**Q6:** State management approach?
**Answer:** React Query (TanStack Query) for server state + React Context for client state (auth, UI)

**Q7:** Responsive behavior?
**Answer:** Sidebar collapses to hamburger menu on mobile/tablet

**Q8:** Any exclusions or features to defer?
**Answer:** None specified - full foundation as proposed

### Existing Code to Reference

No similar existing features identified for reference. This is the first React/admin application in the codebase.

However, the following backend systems exist and should be integrated with:
- JWT-based authentication system (features 1-5 already completed)
- Content CRUD APIs for Projects, Materials, News
- Media Upload API

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - Design to follow brand styling guidelines:
- Gradient background with glass morphism effects
- Brand identity (logo) on login page
- Modern, minimal aesthetic consistent with portfolio site

## Requirements Summary

### Functional Requirements

**Authentication Flow:**
- Login page with email/password form
- "Remember me" checkbox functionality
- JWT token storage in localStorage
- Automatic token refresh before expiry
- 401 response handling with redirect to login
- Session persistence across browser tabs
- Logout functionality

**Navigation & Layout:**
- Persistent sidebar navigation on desktop
- Collapsible hamburger menu on mobile/tablet
- Navigation sections:
  - Dashboard (main overview)
  - Projects (content management)
  - Materials (content management)
  - News (content management)
  - Media (file management)
  - Technologies (settings/taxonomy)
  - Tags (settings/taxonomy)

**Routing:**
- Public routes:
  - `/login` - Authentication page
- Protected routes (require authentication):
  - `/dashboard` - Main dashboard view
  - `/projects` - Projects list
  - `/projects/new` - Create new project
  - `/projects/:id/edit` - Edit existing project
  - `/materials` - Materials list
  - `/materials/new` - Create new material
  - `/materials/:id/edit` - Edit existing material
  - `/news` - News list
  - `/news/new` - Create new news item
  - `/news/:id/edit` - Edit existing news item
  - `/media` - Media library
  - `/settings` - Technologies and Tags management

### Technical Stack

- **Framework:** React + Vite
- **UI Components:** Radix UI (headless primitives)
- **Styling:** Tailwind CSS with custom styling
- **Server State:** TanStack Query (React Query)
- **Client State:** React Context (auth state, UI state)
- **Routing:** React Router (implied by route structure)

### Reusability Opportunities

- Radix UI primitives can be wrapped in styled components for consistent design system
- Auth context can be reused across all protected routes
- Layout components (sidebar, header) reusable across all pages
- Form patterns established here will be reused in Content Editor Forms (future feature)

### Scope Boundaries

**In Scope:**
- React + Vite project setup and configuration
- Complete authentication flow (login, logout, token management)
- Protected route wrapper/guard component
- Base layout with responsive sidebar navigation
- All route definitions with placeholder page components
- React Query setup and configuration
- Auth context provider
- UI state context (sidebar open/closed, etc.)
- Login page with brand styling
- Basic responsive behavior (mobile hamburger menu)

**Out of Scope:**
- Actual content editor forms (Feature #7)
- Media manager UI with upload (Feature #8)
- Dashboard with analytics/stats (Feature #9)
- Actual API integration for content CRUD (pages will be placeholders)
- User management / multiple admin users
- Password reset flow
- Two-factor authentication

### Technical Considerations

**Integration Points:**
- Must integrate with existing JWT authentication API
- Token format and refresh endpoint already defined by backend
- API base URL configuration needed

**Design System:**
- Gradient backgrounds (brand styling)
- Glass morphism effects
- Brand logo/identity display
- Consistent with portfolio site aesthetic

**Performance:**
- React Query for efficient data fetching and caching
- Code splitting by route for optimal bundle size

**Accessibility:**
- Radix UI provides WCAG-compliant primitives
- Keyboard navigation support
- Screen reader compatibility
