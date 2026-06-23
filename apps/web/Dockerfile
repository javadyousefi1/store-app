# ── Stage 1: build (monorepo aware) ────────────────────────────────────────────
FROM docker.arvancloud.ir/node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9 --registry https://mirror-npm.runflare.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --filter web... --frozen-lockfile --registry https://mirror-npm.runflare.com

COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1

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
