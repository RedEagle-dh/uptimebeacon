# Backend Dockerfile for UptimeBeacon
# Using Bun with Prisma 7 (no Rust engine)

FROM oven/bun:1.3.3-alpine AS base
WORKDIR /app

# Prune stage - generate pruned monorepo
FROM base AS pruner
COPY . .
RUN bun install --frozen-lockfile
RUN bunx turbo prune @uptimebeacon/backend --docker

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma
COPY --from=pruner /app/out/full/packages/database/prisma.config.ts ./packages/database/prisma.config.ts
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json

# Generate Prisma Client (Prisma 7 - no Rust engine)
RUN bun run db:generate

# Build backend (bundles most dependencies)
RUN bun run --filter @uptimebeacon/backend build

# Production image
FROM base AS runner
WORKDIR /app

ARG APP_VERSION="0.1.0"
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production

# Create non-root user
RUN adduser --system --uid 1001 backend

# Copy built application (bundled)
COPY --from=builder --chown=backend:bun /app/apps/backend/dist ./apps/backend/dist

# Copy Prisma generated client (Prisma 7 - lightweight, no binary engines)
COPY --from=builder --chown=backend:bun /app/packages/database/generated ./packages/database/generated

# Copy prisma schema, migrations, and config for runtime migrations
COPY --from=builder --chown=backend:bun /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=backend:bun /app/packages/database/prisma.config.ts ./packages/database/prisma.config.ts
# Copy entrypoint script for migrations
COPY --chown=backend:bun apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER backend

EXPOSE 3001
ENV PORT=3001

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "run", "apps/backend/dist/index.js"]
