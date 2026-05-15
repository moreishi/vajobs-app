@AGENTS.md

# Project conventions

- **Dev DB**: SQLite (`prisma/schema.dev.prisma`). Run `prisma generate --schema=prisma/schema.dev.prisma` before dev work.
- **Prod DB**: PostgreSQL (`prisma/schema.prisma`). Prod migrations live in `prisma/migrations_prod/`.
- **Custom migration runner**: `prisma/sync.cjs` applies prod migrations at Docker startup with tracking (`_schema_migrations` table).
- **FORCE_SEED=true**: Run seed against production PostgreSQL (Coolify). Requires `VaSubscription*` tables via prod migration.
- **Seed script**: `npm run seed` auto-generates dev Prisma client first.
- **Docker**: `npm run build` handles `prisma generate` — no separate step needed.
- **Tests**: Vitest (`npm test`) + Playwright (`npm run test:e2e`). Write tests first (TDD).
- **Sitemap**: `src/app/sitemap.ts` — public pages only. Base URL from `NEXT_PUBLIC_URL`.
