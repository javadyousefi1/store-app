FROM docker.arvancloud.ir/node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9 --registry https://mirror-npm.runflare.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --filter api... --frozen-lockfile --registry https://mirror-npm.runflare.com

COPY apps/api ./apps/api
RUN pnpm --filter api run build

# ── production image ──────────────────────────────────────────────────────────
FROM docker.arvancloud.ir/node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm@9 --registry https://mirror-npm.runflare.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --filter api... --prod --frozen-lockfile --registry https://mirror-npm.runflare.com

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/
RUN chmod +x ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
