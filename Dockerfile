FROM node:lts-alpine AS base
RUN corepack enable && corepack prepare npm@latest --activate

# ── Install deps ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build app ──
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ── Runner ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone bundle
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Copy Prisma schema & migrations so we can run them at startup
COPY --from=build /app/prisma ./prisma
# Use production migrations (PostgreSQL) instead of dev (SQLite)
RUN rm -rf prisma/migrations && mv prisma/migrations_prod prisma/migrations
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Apply migrations via PrismaClient (avoids WASM validator that rejects url in schema), then start server
CMD ["node", "prisma/sync.cjs"]
