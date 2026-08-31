# ── Stage 1: build (monorepo aware) ────────────────────────────────────────────
FROM docker.arvancloud.ir/node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9 --registry https://mirror-npm.runflare.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --filter web... --frozen-lockfile --registry https://mirror-npm.runflare.com

COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1

# BACKEND_URL at build time lets Next.js reach the API during `next build`
# (pre-rendering sitemap, generateStaticParams, etc.). Passed via --build-arg
# in docker compose; falls back to localhost so the build never hard-fails
# when the API is unreachable — ISR will regenerate at runtime instead.
ARG BACKEND_URL=http://localhost:3000
ENV BACKEND_URL=${BACKEND_URL}

RUN pnpm --filter web run build


# ── Stage 2: production runner ─────────────────────────────────────────────────
FROM docker.arvancloud.ir/node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public                                ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "apps/web/server.js"]
