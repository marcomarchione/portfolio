# Product Mission

## Pitch

**marcomarchione.it** is a personal portfolio and content platform that helps recruiters, employers, clients, and tech professionals discover and evaluate Marco Marchione's expertise as an Agent Software Developer by providing a visually striking, multilingual showcase of projects, technical resources, and industry insights — embodying the philosophy of "Intelligent Automation, Human Craftsmanship."

The platform is entirely self-hosted on a single VPS, reflecting the core values of autonomy, control, and independence from proprietary cloud services.

## Users

### Primary Customers

- **Recruiters & Hiring Managers:** Professionals evaluating Marco's technical skills and project history for potential employment or contract opportunities
- **Potential Clients:** Businesses and individuals seeking an agent software developer for automation and AI-related projects
- **Developer Community:** Tech professionals looking for resources, guides, and materials on modern development practices

### User Personas

**Technical Recruiter** (30-45)
- **Role:** Senior Technical Recruiter at a tech company
- **Context:** Screening candidates for senior developer or AI/automation specialist roles
- **Pain Points:** Difficulty assessing real technical depth from resumes alone; needs quick access to concrete project examples and code quality
- **Goals:** Quickly evaluate technical competence, see real-world project outcomes, and understand specialization areas

**Startup Founder** (28-40)
- **Role:** CTO or Technical Co-founder at an early-stage startup
- **Context:** Looking for a developer who can build intelligent automation systems
- **Pain Points:** Hard to find developers who understand both AI/agents and solid software engineering practices
- **Goals:** Find a reliable developer with proven experience in automation and modern tech stack

**Fellow Developer** (25-40)
- **Role:** Software developer interested in agent development and automation
- **Context:** Learning about AI agents, automation patterns, and modern development practices
- **Pain Points:** Scattered resources, outdated tutorials, lack of practical guides
- **Goals:** Access high-quality materials, guides, and downloadable resources to improve skills

## The Problem

### Fragmented Professional Presence

Developers often have their work scattered across GitHub, LinkedIn, personal blogs, and various platforms. This fragmentation makes it difficult for potential employers and clients to get a cohesive view of expertise, project quality, and professional identity.

**Our Solution:** A unified, professionally designed platform that consolidates projects, materials, and news into a single branded destination with full multilingual support (Italian, English, Spanish, German), ensuring accessibility to an international audience.

### Generic Developer Portfolios

Most developer portfolios look identical — dark themes with code snippets and GitHub links. They fail to communicate unique positioning or create memorable brand impressions.

**Our Solution:** A distinctive visual identity built around the "Agent Software Developer" positioning, featuring custom design tokens (Agent Blue, Neural Violet), terminal aesthetics, glass morphism, and micro-interactions that reinforce the intelligent automation brand message.

### Vendor Lock-in and Loss of Control

Many developers rely on third-party platforms (Vercel, Netlify, managed CMS) that can change pricing, terms, or features at any time. This creates dependency and limits customization.

**Our Solution:** A fully self-hosted architecture on a single Hetzner VPS, giving complete control over infrastructure, data, and costs. No vendor lock-in for critical hosting services.

## Differentiators

### Intelligent Automation Positioning

Unlike generic developer portfolios, marcomarchione.it positions Marco specifically as an "Agent Software Developer" — emphasizing expertise in AI agents, automation, and autonomous systems. This clear niche positioning helps attract the right opportunities.

This results in higher-quality leads from companies specifically looking for automation and AI expertise.

### Native Multilingual Architecture

Unlike portfolios using translation plugins or machine translation, this platform is built from the ground up with independent translations for Italian, English, Spanish, and German. Each language has its own content management, allowing culturally appropriate messaging.

This results in authentic engagement with international audiences and improved SEO in multiple language markets.

### Proprietary CMS for Agility

Unlike platforms dependent on third-party CMS solutions (WordPress, Contentful), marcomarchione.it uses a custom-built admin panel. This provides complete control over content structure, publishing workflows, and feature development.

This results in faster publishing cycles, lower costs, and the ability to adapt the system to specific needs without vendor limitations.

### Performance-First Architecture

Unlike heavy JavaScript frameworks, the Astro + island architecture delivers exceptional Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1). Static generation with selective hydration means lightning-fast page loads.

This results in better user experience, higher search rankings, and demonstrated technical excellence to site visitors.

### Fully Self-Hosted Infrastructure

Unlike platforms relying on Vercel, Netlify, or AWS for hosting, marcomarchione.it runs entirely on a single Hetzner VPS. Frontend, backend, database, and media storage are all self-contained on controlled infrastructure.

This results in complete data ownership, predictable costs, GDPR compliance by design, and zero dependency on proprietary hosting services.

## Key Features

### Core Features

- **Multilingual Content System:** Full support for 4 languages (IT, EN, ES, DE) with independent translations and proper hreflang implementation for SEO
- **Project Showcase:** Technical portfolio with GitHub integration, live demos, technology tags, and detailed project narratives
- **Materials Library:** Downloadable resources including guides, templates, and technical documents with category organization
- **News & Blog:** Publishing platform for articles, updates, and industry insights with cover images and reading time estimates

### Content Management Features

- **Custom Admin Panel:** Proprietary CMS for creating, editing, and publishing content across all sections
- **Media Manager:** Centralized media library with local VPS storage for images, files, and assets
- **Translation Workflow:** Independent editing of each language version without affecting others
- **Publishing Controls:** Draft/published status, featured content flagging, and scheduling capabilities

### Technical Excellence Features

- **Dark Mode Default:** Sophisticated dark theme with optional light mode toggle
- **Responsive Design:** Mobile-first approach ensuring perfect experience across all devices
- **Accessibility Compliance:** WCAG 2.1 Level AA standards for inclusive access
- **GDPR Compliance:** Cookie consent, privacy policy, and privacy-focused analytics

### Brand & Visual Features

- **Distinctive Visual Identity:** Agent Blue (#3d7eff) and Neural Violet (#8b5cf6) color system with gradient mesh backgrounds
- **Typography System:** Space Grotesk for display, Inter for body, JetBrains Mono for code
- **Glass Morphism Cards:** Modern card components with blur and transparency effects
- **Micro-interactions:** Spring physics animations for engaging user feedback
- **Terminal Aesthetics:** Design elements that reinforce the developer/automation identity

### Infrastructure Features

- **Self-Hosted Architecture:** Complete control with frontend, backend, and storage on a single VPS
- **Local Media Storage:** Files stored on VPS filesystem or self-hosted MinIO, no external cloud dependencies
- **Automated Backups:** Regular SQLite and media backups for data protection
- **CDN Integration:** Cloudflare for DNS, SSL, and static asset caching (hosting remains on VPS)
