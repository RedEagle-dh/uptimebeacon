# Backend Dockerfile for UptimeBeacon
FROM oven/bun:1.3.3-alpine AS base

# Prune stage - generate pruned monorepo
FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @uptimebeacon/backend --docker

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy pruned package files
COPY --from=pruner /app/out/json/ .

# Copy Prisma schema for postinstall generate
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

# Generate Prisma Client
RUN bun run db:generate

# Build backend
RUN bun run --filter @uptimebeacon/backend build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 backend
RUN adduser --system --uid 1001 backend

# Copy built application (bundled, no node_modules needed)
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/database/generated ./packages/database/generated

# Set correct permissions
RUN chown -R backend:backend /app

USER backend

EXPOSE 3001

ENV PORT=3001

CMD ["bun", "run", "apps/backend/dist/index.js"]
