# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UptimeBeacon is an uptime monitoring application built as a Bun monorepo with Turborepo. It monitors websites, APIs, and services, tracking their availability and response times.

## Commands

```bash
# Development
bun dev                    # Start all apps (frontend + backend)
bun run --filter @uptimebeacon/frontend dev  # Start frontend only (Next.js on port 3000)
bun run --filter @uptimebeacon/backend dev   # Start backend only (Elysia on port 3001)

# Database
bun db:generate            # Generate Prisma client after schema changes
bun db:push                # Push schema to database (dev)
bun db:migrate             # Create migration (production)
bun db:studio              # Open Prisma Studio

# Code Quality
bun check                  # Biome lint check
bun check:write            # Biome lint with auto-fix
bun typecheck              # TypeScript type checking

# Build
bun build                  # Build all packages
```

Start PostgreSQL before development:
```bash
docker compose up -d
```

## Architecture

### Monorepo Structure
- `apps/frontend` - Next.js 15 with App Router, tRPC, NextAuth, Tailwind CSS, shadcn/ui
- `apps/backend` - Elysia (Bun web framework) for monitoring scheduler and webhooks
- `packages/database` - Prisma schema and client, shared across apps

### Frontend (`apps/frontend`)
- **tRPC API**: `src/server/api/` - Type-safe API layer
  - `trpc.ts` defines procedures: `publicProcedure`, `protectedProcedure`, `adminProcedure`
  - Routers in `routers/` (monitor, incident, notification, status-page, site-settings, user)
- **Auth**: NextAuth v5 with credentials + OAuth, Prisma adapter (`src/server/auth/`)
- **Components**: `src/components/ui/` (shadcn), `src/components/layouts/`
- **Route Groups**: `(dashboard)` for authenticated pages, `(public)` for public pages

### Backend (`apps/backend`)
- **Elysia app**: `src/app.ts` with CORS and error handling
- **Scheduler**: `src/services/scheduler.ts` - Cron-based monitor checking
- **Checkers**: `src/services/checker/` - HTTP, TCP, DNS, ping implementations
- **WebSocket**: `src/websocket/` for real-time updates
- **Routes**: `src/routes/` - Health, monitors, webhooks endpoints

### Database Package (`packages/database`)
- Prisma schema at `prisma/schema.prisma`
- Generated client at `generated/prisma/`
- Import as `@uptimebeacon/database` (exports db client and all Prisma types)

### Key Data Models
- **Monitor**: HTTP/HTTPS/TCP/PING/DNS checks with configurable intervals
- **MonitorCheck**: Individual check results with response times
- **Incident**: Downtime events with status updates
- **StatusPage**: Public status pages with customizable branding
- **NotificationChannel**: Email, Slack, Discord, Telegram, Webhook notifications

## Environment Variables

Database URL format: `postgresql://postgres:password@localhost:5432/uptimebeacon`

Required for frontend: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`
Required for backend: `DATABASE_URL`, `PORT`, `FRONTEND_URL`
