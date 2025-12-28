# marcomarchione.it

Personal portfolio website with CMS backend, admin panel, and public frontend.

## Tech Stack

| Package | Technology |
|---------|------------|
| **api** | [Bun](https://bun.sh/) + [Elysia](https://elysiajs.com/) + [Drizzle ORM](https://orm.drizzle.team/) + SQLite |
| **admin** | React + Vite + TanStack Query + Tailwind CSS |
| **web** | [Astro](https://astro.build/) + React + Tailwind CSS |
| **shared** | TypeScript types and constants |

## Project Structure

```
packages/
├── api/          # Backend REST API
├── admin/        # Admin panel (React)
├── web/          # Public website (Astro)
└── shared/       # Shared types and constants
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://www.docker.com/) (optional)

### Installation

```bash
# Install all dependencies
bun install

# Setup database
bun run db:push

# Copy environment file
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env with your values
```

### Development

```bash
# Run all packages
bun run dev

# Or run individually
bun run dev:api    # API on http://localhost:3000
bun run dev:admin  # Admin on http://localhost:5173
bun run dev:web    # Web on http://localhost:4321
```

### Docker Compose

#### Development (hot reload)

```bash
# Start all services with hot reload
docker compose -f docker-compose.dev.yml up

# Start in background (detached)
docker compose -f docker-compose.dev.yml up -d

# Start specific service
docker compose -f docker-compose.dev.yml up api
docker compose -f docker-compose.dev.yml up admin
docker compose -f docker-compose.dev.yml up web

# Rebuild and start (after Dockerfile changes)
docker compose -f docker-compose.dev.yml up --build

# View logs
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml logs -f api    # Single service

# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (reset data)
docker compose -f docker-compose.dev.yml down -v
```

#### Production

```bash
# Start all services
docker compose up -d

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

#### Useful Commands

```bash
# Check running containers
docker compose ps
docker compose -f docker-compose.dev.yml ps

# Restart a specific service
docker compose restart api
docker compose -f docker-compose.dev.yml restart admin

# Execute command in running container
docker compose exec api sh
docker compose -f docker-compose.dev.yml exec api bun run db:studio

# View resource usage
docker compose stats
```

#### Services & Ports

| Service | Dev Port | Prod Port | Description |
|---------|----------|-----------|-------------|
| api | 3000 | 3000 | Backend REST API |
| admin | 5173 | 5173 | Admin Panel |
| web | 4321 | 4321 | Public Website |

#### npm Scripts (shortcuts)

```bash
# These scripts are aliases for docker compose commands
bun run docker:dev    # docker compose -f docker-compose.dev.yml up
bun run docker:up     # docker compose up -d
```

## Environment Variables

### API (`packages/api/.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data.db
CORS_ORIGINS=http://localhost:5173,http://localhost:4321
JWT_SECRET=your-secret-at-least-32-characters-long
ADMIN_PASSWORD_HASH=$2b$10$your-bcrypt-hash
```

Generate password hash:
```bash
bun -e "console.log(await Bun.password.hash('your-password', { algorithm: 'bcrypt', cost: 10 }))"
```

### Admin (`packages/admin/.env.development`)

```env
VITE_API_URL=http://localhost:3000
```

### Web (`packages/web/.env`)

```env
PUBLIC_API_URL=http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all packages in dev mode |
| `bun run build` | Build all packages |
| `bun run test` | Run API tests |
| `bun run typecheck` | TypeScript check all packages |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run docker:dev` | Run with Docker (dev mode) |
| `bun run docker:up` | Run with Docker (production) |

## API Endpoints

### Public

- `GET /api/v1/projects` - List projects
- `GET /api/v1/materials` - List materials
- `GET /api/v1/news` - List news
- `GET /api/v1/technologies` - List technologies
- `GET /api/v1/health` - Health check

### Auth

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Admin (Protected)

- `POST/PUT/DELETE /api/v1/admin/projects/:id`
- `POST/PUT/DELETE /api/v1/admin/materials/:id`
- `POST/PUT/DELETE /api/v1/admin/news/:id`
- `POST/PUT/DELETE /api/v1/admin/technologies/:id`
- `POST /api/v1/admin/media/upload`

API documentation available at `http://localhost:3000/api/docs` (dev mode).

## Testing

```bash
# Run all tests
bun run test

# Run with watch
bun run test:api --watch
```

## Versioning

This project uses automatic versioning based on [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Minor version bump (0.x.0)
- `fix:` - Patch version bump (0.0.x)
- `BREAKING CHANGE:` - Major version bump (x.0.0)

Versions are managed independently per package.

## License

MIT
