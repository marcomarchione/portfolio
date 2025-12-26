# Product Roadmap

## Completed

1. [x] **Database Schema & Migrations** — Design and implement SQLite database with Drizzle ORM including all core entities: content_base, content_translations, projects, materials, news, technologies, tags, and media tables with proper relationships and indexes `M`

2. [x] **Backend API Foundation** — Set up Elysia server with TypeBox validation, error handling middleware, CORS configuration, and OpenAPI/Swagger documentation generation for all endpoints `S`

3. [x] **Authentication System** — Implement JWT-based authentication with login endpoint, token refresh, protected route middleware, and secure password handling for admin access `S`

4. [x] **Content CRUD APIs** — Build complete REST endpoints for content management: create, read, update, delete operations for projects, materials, and news with translation support and status management `M`

5. [x] **Media Upload & Local Storage** — Implement file upload endpoints with local VPS filesystem storage for images, documents, and assets with proper validation, size limits, and URL generation `M`

6. [x] **Admin Panel Foundation** — Create React + Vite admin application with routing, authentication flow, protected routes, and base layout with navigation sidebar `M`

7. [x] **Content Editor Forms** — Build rich editing interfaces for projects, materials, and news including multilingual input fields, markdown/rich text editor, and media selection `L`

## Upcoming

8. [ ] **Media Manager UI** — Implement admin media library with upload interface, file browser, image preview, and integration with content editor forms for media selection `M`

9. [ ] **Admin Dashboard** — Create dashboard view showing content statistics, recent items, quick actions, and system status overview `S`

10. [ ] **Astro Frontend Structure** — Set up Astro 5 project with i18n configuration for 4 languages, base layouts, routing structure, and design token system (colors, typography, spacing) `M`

11. [ ] **Component Library** — Build reusable UI components: navigation header, footer, cards, buttons, typography components, and glass morphism card variants with dark/light mode support `M`

12. [ ] **Landing Page** — Implement hero section with gradient mesh background, about section, featured projects grid, skills/technologies showcase, and contact call-to-action `L`

13. [ ] **Projects Section** — Build projects listing page with filtering by technology, and individual project detail pages with GitHub/demo links, image galleries, and full descriptions `M`

14. [ ] **Materials Section** — Create materials listing with category filtering, search functionality, and download tracking with proper file delivery from local storage `M`

15. [ ] **News Section** — Implement blog listing with pagination, individual article pages with cover images, reading time, and social sharing metadata `M`

16. [ ] **SEO & Metadata** — Add comprehensive SEO implementation: meta tags, Open Graph, Twitter cards, JSON-LD structured data, sitemap generation, and hreflang tags for all languages `M`

17. [ ] **Language Switcher** — Implement language switching with proper URL handling, language detection, preference persistence, and smooth transitions between language versions `S`

18. [ ] **Dark/Light Mode Toggle** — Add theme switching with system preference detection, user preference persistence, and smooth CSS transitions between modes `S`

19. [ ] **GDPR Compliance** — Integrate vanilla-cookieconsent for cookie management, create privacy policy and cookie policy pages in all languages, configure privacy-focused analytics `M`

20. [ ] **Performance Optimization** — Optimize images with proper formats and lazy loading, implement critical CSS, add resource hints, and verify Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1) `M`

21. [ ] **Accessibility Audit** — Conduct WCAG 2.1 Level AA compliance review, fix any issues with keyboard navigation, screen reader support, color contrast, and focus management `M`

22. [ ] **Security Hardening** — Implement rate limiting on API endpoints, security headers (CSP, HSTS, X-Frame-Options), input sanitization review, and HTTPS enforcement `S`

23. [ ] **Cross-Browser Testing** — Test and fix issues across Chrome, Firefox, Safari, and Edge on desktop and mobile, ensuring consistent experience `S`

24. [ ] **VPS Deployment & CI/CD** — Configure nginx reverse proxy, set up automated deployment scripts, GitHub Actions for testing, and VPS deployment for both frontend and backend `M`

> Notes
> - Order follows technical dependencies: database -> API -> admin -> public frontend -> polish -> deploy
> - Each item represents a complete, testable feature spanning necessary frontend and backend work
> - Early items establish foundation; later items add user-facing value incrementally
> - Multilingual support is integrated throughout rather than added as a separate phase
> - All hosting is on Hetzner VPS (no Cloudflare Pages or R2 dependencies)
> - Effort scale: XS (1 day), S (2-3 days), M (1 week), L (2 weeks), XL (3+ weeks)
