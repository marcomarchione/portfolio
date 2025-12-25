# Portfolio CMS

A modern, performant backend CMS for managing portfolio content, built with cutting-edge technologies.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **API Framework**: [Elysia](https://elysiajs.com/) - TypeScript-first web framework
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) - High-performance image manipulation
- **Authentication**: JWT-based authentication
- **Admin Panel**: React + Vite + TanStack Query + Tailwind CSS

## Features

- RESTful API with OpenAPI/Swagger documentation
- Content management for projects, materials, news, and technologies
- Multi-language support (i18n)
- Media upload with automatic image optimization
- Tag and technology relationship management
- Admin and public API separation
- Comprehensive test coverage
- Modern admin panel with responsive design

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher
- Node.js 20.19+ (for admin panel build)

### Installation

```bash
# Clone the repository
git clone https://github.com/marcomarchione/portfolio.git
cd portfolio

# Install dependencies
bun install

# Set up database
bun run db:push

# Install admin panel dependencies
cd admin && bun install && cd ..
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your-secret-key
ADMIN_PASSWORD_HASH=your-bcrypt-hash
NODE_ENV=development
```

For the admin panel, create `admin/.env.development`:

```env
VITE_API_URL=http://localhost:3000
```

### Running the Application

```bash
# Development mode with hot reload
bun run api:dev

# Production mode
bun run api:start
```

### Running the Admin Panel

```bash
# Navigate to admin directory
cd admin

# Start development server
bun run dev
```

The admin panel will be available at `http://localhost:5173`.

### API Documentation

When running in development mode, Swagger UI is available at:
```
http://localhost:3000/api/docs
```

Health check endpoint:
```
http://localhost:3000/api/v1/health
```

## Project Structure

```
.
├── src/
│   ├── api/
│   │   ├── auth/          # JWT authentication
│   │   ├── middleware/    # CORS, error handling, auth middleware
│   │   ├── plugins/       # Elysia plugins (database, swagger)
│   │   ├── routes/
│   │   │   ├── admin/     # Protected admin endpoints
│   │   │   └── public/    # Public read-only endpoints
│   │   └── types/         # API schemas and types
│   ├── db/
│   │   ├── queries/       # Database query functions
│   │   └── schema/        # Drizzle table definitions
│   ├── services/
│   │   └── media/         # Image processing and storage
│   └── scripts/           # Utility scripts
└── admin/                 # Admin panel (React + Vite)
    └── src/
        ├── components/    # React components
        │   ├── auth/      # Authentication components
        │   ├── common/    # Shared components
        │   └── layout/    # Layout components
        ├── contexts/      # React contexts (Auth, UI)
        ├── lib/           # Utilities
        │   ├── api/       # API client
        │   ├── auth/      # Token management
        │   └── query/     # TanStack Query config
        ├── pages/         # Page components
        ├── routes/        # Router configuration
        └── types/         # TypeScript types
```

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `bun run api:dev` | Start API server in development mode |
| `bun run api:start` | Start API server in production mode |
| `bun run test` | Run all tests |
| `bun run test:db` | Run database tests |
| `bun run test:api` | Run API tests |
| `bun run db:generate` | Generate database migrations |
| `bun run db:migrate` | Run database migrations |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run media:cleanup` | Clean up orphaned media files |

### Admin Panel

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run lint` | Run ESLint |

## API Endpoints

### Public Endpoints

- `GET /api/v1/projects` - List all projects
- `GET /api/v1/materials` - List all materials
- `GET /api/v1/news` - List all news
- `GET /api/v1/technologies` - List all technologies

### Authentication Endpoints

- `POST /api/v1/auth/login` - Authenticate and get JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (client-side)

### Admin Endpoints (Protected)

- `POST /api/v1/admin/projects` - Create project
- `PUT /api/v1/admin/projects/:id` - Update project
- `DELETE /api/v1/admin/projects/:id` - Delete project
- `POST /api/v1/admin/media/upload` - Upload media file
- *(Similar CRUD operations for materials, news, technologies, tags)*

## Admin Panel Features

- **Authentication**: JWT-based login with automatic token refresh
- **Protected Routes**: All content management routes require authentication
- **Responsive Design**: Desktop sidebar, mobile hamburger menu
- **Dark Mode**: Modern dark theme with glass morphism effects
- **Cross-tab Sync**: Authentication state syncs across browser tabs

## Testing

```bash
# Run all tests
bun run test

# Run specific test suites
bun run test:db
bun run test:api
```

## License

MIT
