FROM oven/bun:1.2.19-alpine AS base

WORKDIR /app

#----------------------------------------------------#
# Stage 2: Pruner                                    #
#----------------------------------------------------#

FROM base AS pruner

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

RUN bun turbo prune --scope=docs --docker

#----------------------------------------------------#
# Stage 3: Builder                                   #
#----------------------------------------------------#

FROM base AS builder

WORKDIR /app

# Install nodejs for Next.js build
RUN apk add --no-cache nodejs

ENV NEXT_TELEMETRY_DISABLED=1

# Copy the pruned output
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/bun.lock ./bun.lock

# Install dependencies (without frozen-lockfile for pruned workspace)
RUN bun install

COPY --from=pruner /app/out/full/ .

# Git warnings from Nextra are not critical and can be ignored

# Build docs and run pagefind
RUN bun turbo build --filter=docs && \
    cd apps/docs && \
    bun x pagefind --site .next/server/app --output-path public/_pagefind

#----------------------------------------------------#
# Stage 4: Runner                                    #
#----------------------------------------------------#

FROM pruner AS runner

WORKDIR /app

ENV NODE_ENV="production"

ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/docs/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/apps/docs/.next/static ./apps/docs/.next/static

COPY --from=builder --chown=nextjs:nodejs /app/apps/docs/public ./apps/docs/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "apps/docs/server.js"]