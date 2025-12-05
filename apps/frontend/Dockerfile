# Frontend Dockerfile for UptimeBeacon
FROM oven/bun:1.3.3-alpine AS base

# Prune stage - generate pruned monorepo
FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @uptimebeacon/frontend --docker

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy pruned package files
COPY --from=pruner /app/out/json/ .

# Copy Prisma schema for postinstall generate
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

# Copy root tsconfig (frontend extends it)
COPY --from=pruner /app/tsconfig.json ./tsconfig.json

# Generate Prisma Client
RUN bun run db:generate

# Build frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run --filter @uptimebeacon/frontend build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/packages/database/generated ./packages/database/generated

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "apps/frontend/server.js"]
