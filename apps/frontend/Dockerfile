# Frontend Dockerfile for UptimeBeacon
# Based on official Next.js with Bun example, adapted for Turborepo

FROM oven/bun:1.3.3-alpine AS base
WORKDIR /app

# Prune stage - generate pruned monorepo
FROM base AS pruner

RUN bun add -g turbo

COPY . .

RUN turbo prune @uptimebeacon/frontend --docker

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

RUN bun run db:generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

RUN bun run --filter @uptimebeacon/frontend build

# Production image
FROM base AS runner

WORKDIR /app

ARG APP_VERSION="0.1.0"
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Set correct permission for prerender cache
RUN mkdir -p .next && chown nextjs:bun .next

COPY --from=builder --chown=nextjs:bun /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:bun /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:bun /app/packages/database/generated ./packages/database/generated

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --chown=nextjs:bun apps/frontend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["bun", "apps/frontend/server.js"]
