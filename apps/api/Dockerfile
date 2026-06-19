FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm --registry https://mirror-npm.runflare.com

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --registry https://mirror-npm.runflare.com

COPY . .
RUN pnpm run build

# ── production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm --registry https://mirror-npm.runflare.com

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --registry https://mirror-npm.runflare.com

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
