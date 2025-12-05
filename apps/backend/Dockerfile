# Backend Dockerfile for UptimeBeacon
FROM oven/bun:1.1.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

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

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/database/generated ./packages/database/generated
COPY --from=builder /app/node_modules ./node_modules

# Set correct permissions
RUN chown -R backend:backend /app

USER backend

EXPOSE 3001

ENV PORT=3001

CMD ["bun", "run", "apps/backend/dist/index.js"]
