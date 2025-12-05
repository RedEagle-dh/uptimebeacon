# UptimeBeacon

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**UptimeBeacon** is a self-hosted uptime monitoring application that tracks the availability and performance of your websites, APIs, and services. Get instant alerts when things go down and share beautiful status pages with your users.

## Features

- **Multi-Protocol Monitoring** - HTTP/HTTPS, TCP, Ping, DNS, and more
- **Real-time Alerts** - Email, Slack, Discord, Telegram, and webhook notifications
- **Public Status Pages** - Customizable pages to communicate service status to users
- **Incident Management** - Track and document outages with status updates
- **Response Time Tracking** - Monitor performance trends over time
- **SSL Certificate Monitoring** - Get alerts before certificates expire
- **Self-Hosted** - Full control over your data and infrastructure

## Screenshot

<!-- TODO: Add screenshot -->
![UptimeBeacon Dashboard](docs/images/dashboard.png)

## Tech Stack

- **Frontend**: Next.js 15, React, tRPC, Tailwind CSS, shadcn/ui
- **Backend**: Bun, Elysia
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Build System**: Turborepo

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.3.0+
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/uptimebeacon.git
   cd uptimebeacon
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env
   cp apps/backend/.env.example apps/backend/.env
   ```

4. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

5. Set up the database:
   ```bash
   bun db:generate
   bun db:push
   ```

6. Start the development servers:
   ```bash
   bun dev
   ```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`.

## Deployment

### Docker Deployment

1. Build the Docker images:
   ```bash
   docker build -t uptimebeacon-frontend -f apps/frontend/Dockerfile .
   docker build -t uptimebeacon-backend -f apps/backend/Dockerfile .
   ```

2. Run with Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### Manual Deployment

1. Build all packages:
   ```bash
   bun run build
   ```

2. Set production environment variables:
   ```bash
   # Frontend
   DATABASE_URL=postgresql://user:password@host:5432/uptimebeacon
   AUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-domain.com

   # Backend
   DATABASE_URL=postgresql://user:password@host:5432/uptimebeacon
   PORT=3001
   FRONTEND_URL=https://your-domain.com
   ```

3. Start the applications:
   ```bash
   # Frontend (Next.js)
   cd apps/frontend && bun start

   # Backend (Elysia)
   cd apps/backend && bun start
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Secret for NextAuth.js sessions | Yes |
| `NEXTAUTH_URL` | Public URL of the frontend | Yes |
| `PORT` | Backend server port (default: 3001) | No |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

## Project Structure

```
uptimebeacon/
├── apps/
│   ├── frontend/          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/# React components
│   │   │   └── server/    # tRPC API & auth
│   │   └── ...
│   └── backend/           # Elysia monitoring service
│       ├── src/
│       │   ├── routes/    # API endpoints
│       │   ├── services/  # Scheduler & checkers
│       │   └── websocket/ # Real-time updates
│       └── ...
├── packages/
│   └── database/          # Prisma schema & client
└── ...
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

### Development Commands

```bash
bun dev              # Start all apps in development mode
bun build            # Build all packages
bun check            # Run linting
bun check:write      # Run linting with auto-fix
bun typecheck        # Run TypeScript type checking
bun db:studio        # Open Prisma Studio
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
