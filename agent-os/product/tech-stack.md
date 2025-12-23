# Tech Stack

## Runtime & Package Management

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Bun** | JavaScript runtime & package manager | Used for both frontend and backend; faster alternative to Node.js |

## Frontend (Public Website)

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Astro 5** | Web framework | Static site generation with island architecture for optimal performance |
| **React** | UI components | Used selectively for interactive islands within Astro pages |
| **TypeScript** | Language | Type safety across all frontend code |
| **Tailwind CSS** | Styling | Utility-first CSS framework for rapid UI development |
| **MDX** | Content format | Optional for static content that benefits from component embedding |

### Frontend Libraries

| Library | Purpose |
|---------|---------|
| **Astro i18n** | Internationalization routing and language detection |
| **vanilla-cookieconsent** | GDPR-compliant cookie consent management |

## Backend (API Server)

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Bun** | Runtime | Same runtime as frontend for unified stack |
| **Elysia** | Web framework | Fast Bun-native framework with excellent TypeScript support |
| **TypeBox** | Validation | Runtime type validation integrated with Elysia |
| **JWT** | Authentication | JSON Web Tokens for admin authentication |

### Backend Features

| Feature | Implementation |
|---------|----------------|
| **API Documentation** | OpenAPI/Swagger auto-generation via Elysia |
| **Rate Limiting** | Built-in or plugin-based request throttling |
| **CORS** | Configured for frontend domain access |

## Database

| Technology | Purpose | Notes |
|------------|---------|-------|
| **SQLite** | Database | Lightweight, file-based database suitable for single-server deployment |
| **Drizzle ORM** | Database toolkit | Type-safe ORM with excellent TypeScript integration |
| **Drizzle Kit** | Migrations | Schema migrations and database management |

## Admin Panel

| Technology | Purpose | Notes |
|------------|---------|-------|
| **React** | UI framework | Full SPA for admin interface |
| **Vite** | Build tool | Fast development server and optimized builds |
| **TypeScript** | Language | Type safety for admin application |
| **Tailwind CSS** | Styling | Consistent styling with public frontend |

## Infrastructure & Hosting

| Service | Provider | Purpose | Cost |
|---------|----------|---------|------|
| Frontend | **Hetzner VPS** | Astro SSG/SSR served via nginx or Bun | Included in VPS |
| Backend | **Hetzner VPS (CX32)** | API server + SQLite database | ~7.50 EUR/month |
| Media Storage | **Hetzner VPS** | Local filesystem or self-hosted MinIO | Included in VPS |
| DNS + SSL | **Cloudflare** | Domain management, SSL certificates, CDN caching | Free |
| Domain | Existing | marcomarchione.it | ~1 EUR/month |

**Total Monthly Cost:** ~8.50 EUR/month

### VPS Specifications (CX32)

| Resource | Allocation |
|----------|------------|
| **vCPU** | 4 cores |
| **RAM** | 8 GB |
| **Storage** | 80 GB SSD |
| **Location** | Falkenstein, Germany (GDPR compliant) |

### Architecture Philosophy

The infrastructure is **fully self-hosted** on a single VPS:

- **No Cloudflare Pages** — Frontend served directly from VPS
- **No Cloudflare R2** — Media stored on local filesystem
- **Cloudflare for DNS/SSL only** — Domain management and SSL certificates
- **Complete control** — All data and services under direct management
- **Zero vendor lock-in** — No dependency on proprietary hosting services

## DevOps & Deployment

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **GitHub** | Repository hosting |
| **GitHub Actions** | CI/CD pipelines |
| **nginx** | Reverse proxy and static file serving on VPS |

### Deployment Strategy

- Frontend and backend deployed to same VPS
- nginx as reverse proxy routing to appropriate services
- Automated deployment via GitHub Actions and SSH
- Zero-downtime deployments with process management (systemd or PM2)

## Analytics & Monitoring

| Service | Purpose | Notes |
|---------|---------|-------|
| **Cloudflare Web Analytics** | Traffic analytics | Cookieless, GDPR-compliant, privacy-focused |
| **VPS Monitoring** | Server health | Disk, CPU, memory monitoring with alerting |

## Security

| Aspect | Implementation |
|--------|----------------|
| **HTTPS** | Enforced via Cloudflare SSL |
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **Input Validation** | TypeBox schemas on all API endpoints |
| **Authentication** | JWT with secure token handling |
| **Rate Limiting** | API endpoint protection |
| **Firewall** | VPS-level firewall configuration |

## Design System

### Typography

| Font | Usage | Source |
|------|-------|--------|
| **Space Grotesk** | Display/headings | Google Fonts |
| **Inter** | Body text | Google Fonts |
| **JetBrains Mono** | Code blocks | Google Fonts |

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Agent Blue** | #3d7eff | Primary brand color |
| **Neural Violet** | #8b5cf6 | Accent color |
| **Neutrals** | #fafafa to #0c0c0d | Background and text grays |
| **Success** | #10b981 | Positive feedback |
| **Warning** | #f59e0b | Caution states |
| **Error** | #ef4444 | Error states |

### Design Patterns

- Gradient mesh backgrounds (primary to accent)
- Glass morphism cards (blur + transparency)
- Micro-interactions with spring physics
- Terminal aesthetics for developer branding
- Subtle grid overlay on backgrounds
- Dark mode as default

## Internationalization

| Language | Code | Status |
|----------|------|--------|
| Italian | `it` | Primary |
| English | `en` | Supported |
| Spanish | `es` | Supported |
| German | `de` | Supported |

### i18n Implementation

- Astro native i18n routing with language prefixes
- JSON translation files per language for UI strings
- Independent content translations stored in database
- Proper hreflang tags for SEO

## Performance Targets

| Metric | Target | Standard |
|--------|--------|----------|
| **LCP** | < 2.5s | Core Web Vitals |
| **FID** | < 100ms | Core Web Vitals |
| **CLS** | < 0.1 | Core Web Vitals |
| **Lighthouse** | > 90 | All categories |
| **TTFB** | < 200ms | Server response |

## Accessibility

| Standard | Level |
|----------|-------|
| **WCAG** | 2.1 Level AA |

### Requirements

- Proper color contrast ratios
- Full keyboard navigation support
- Screen reader compatibility
- Semantic HTML structure
- Visible focus states

## Compliance

| Regulation | Implementation |
|------------|----------------|
| **GDPR** | Cookie consent (vanilla-cookieconsent), privacy policy, cookieless analytics, EU-hosted data |
| **Accessibility** | WCAG 2.1 Level AA compliance |

## Backup Strategy

| Data | Method | Frequency |
|------|--------|-----------|
| **SQLite Database** | File backup to external storage | Daily |
| **Media Files** | Rsync to backup location | Daily |
| **VPS Snapshots** | Hetzner snapshot feature | Weekly |
