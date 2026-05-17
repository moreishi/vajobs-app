@AGENTS.md

# Project conventions

- **Dev DB**: SQLite (`prisma/schema.dev.prisma`). Run `prisma generate --schema=prisma/schema.dev.prisma` before dev work.
- **Prod DB**: PostgreSQL (`prisma/schema.prisma`). Prod migrations live in `prisma/migrations_prod/`.
- **Custom migration runner**: `prisma/sync.cjs` applies prod migrations at Docker startup with tracking (`_schema_migrations` table).
- **FORCE_SEED=true**: Run seed against production PostgreSQL (Coolify). Generates secure admin password, prints to logs, emails via Resend. Infrastructure only — no test users/demo jobs.
- **Seed scripts**: `npm run seed` generates dev Prisma client and seeds infrastructure (admin, plans, settings). `npm run seed:demo` adds test users + demo job posts.
- **Docker**: `npm run build` handles `prisma generate` — no separate step needed.
- **Tests**: Vitest (`npm test`) + Playwright (`npm run test:e2e`). Write tests first (TDD).
- **Sitemap**: `src/app/sitemap.ts` — public pages only. Base URL from `NEXT_PUBLIC_URL`.
- **Email worker**: transactional + notification emails queue via `EmailLog` table (status `pending`). Cron on host (`* * * * *`) hits `POST /api/email/process` with `CRON_SECRET` bearer token to process queue.
- **Cron jobs**: host crontab triggers email processing (every min) and subscription renewals (daily 3 AM) via `CRON_SECRET`-authenticated endpoints.
