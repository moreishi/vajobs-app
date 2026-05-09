# VA Jobs Online

A full-featured virtual assistant job marketplace built with Next.js. Talents can browse jobs, apply with connects bidding, and get hired. Clients can post jobs, review applications, schedule interviews, and manage engagements.

## Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Database:** SQLite (dev) / PostgreSQL (production)
- **ORM:** Prisma 6
- **Auth:** NextAuth v5 (credentials + Google OAuth)
- **Email:** Resend
- **Testing:** Vitest (205+ tests)
- **Styling:** Tailwind CSS 4 + shadcn/ui

## Prerequisites

- Node.js 20+
- npm
- Docker (optional, for containerized deployment)

## Local Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd talent-hub
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local — at minimum set AUTH_SECRET:
#   AUTH_SECRET="openssl rand -hex 32"

# 3. Run migrations and seed
npx prisma migrate dev
# This runs the seed automatically. You can also re-run it later:
npm run seed

# 4. Start dev server
npm run dev
```

### Default Accounts (after seeding)

| Role   | Email                 | Password |
| ------ | --------------------- | -------- |
| Admin  | admin@vajobs.online   | password |
| Client | client@example.com    | password |
| Talent | talent@example.com    | password |

### Optional: Email (Resend)

Get a free API key at [resend.com](https://resend.com) and add to `.env.local`:

```
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
```

## Deploy to Production

### Option 1: Docker

The project includes a `Dockerfile`, `.dockerignore`, and `docker-compose.yml` (Docker Engine v25+) for containerized deployment with PostgreSQL.

**Quick start:**

```bash
# Build and start (Postgres + app)
docker compose up -d

# Run migrations (runs automatically on first start — this is a manual fallback)
docker compose exec app npx prisma migrate deploy

# Seed the database (optional)
docker compose exec app npx prisma db seed

# View logs
docker compose logs -f
```

The compose file spins up two services:
- **`db`** — PostgreSQL 16 with a named volume (`pg_data`) for data persistence
- **`app`** — The Next.js app, waits for Postgres health check before starting

All credentials are pulled from your `.env` file using `${VAR:-default}` syntax — edit `.env` to customize:

```bash
# Edit .env to set your Postgres credentials (or keep the defaults)
POSTGRES_USER=talent_hub
POSTGRES_PASSWORD=talent_hub
POSTGRES_DB=talent_hub

# Generate a secure auth secret
openssl rand -hex 32
# Then paste it into .env as AUTH_SECRET
```

**Build and run manually (without compose):**

```bash
docker build -t talent-hub .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/talent-hub?schema=public" \
  -e AUTH_SECRET="your-secret" \
  -e AUTH_URL="http://localhost:3000" \
  talent-hub
```

### Option 2: Coolify

Deploy as a Docker Compose stack on your own server.

**Steps:**

1. Connect your git repository to Coolify
2. Create a new **Docker Compose** resource
3. Point it at the repository — Coolify reads `docker-compose.yml` automatically
4. Set environment variables in Coolify's dashboard (do **not** rely on `.env` — Coolify injects them directly):
   - `AUTH_SECRET` — `openssl rand -hex 32`
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — or keep defaults
   - `AUTH_URL` — your Coolify domain, e.g. `https://app.example.com`
   - `RESEND_API_KEY`, `EMAIL_FROM` — optional, for email
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — optional
5. Deploy — Coolify builds the Docker image, starts Postgres, runs migrations, and serves the app

The compose file uses `${VAR:-default}` syntax throughout, so Coolify's env injection works seamlessly. The `pg_data` volume persists your database across restarts.

**Using Coolify's managed PostgreSQL instead:**

If you prefer Coolify's built-in PostgreSQL service:
1. Create a PostgreSQL service in Coolify and note the internal URL
2. In the app service, remove the `db` dependency and set `DATABASE_URL` in Coolify's env vars to point at your managed Postgres instance

### Option 3: Vercel (Recommended for Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Required environment variables (set in Vercel dashboard):**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Run `openssl rand -hex 32` |
| `AUTH_URL` | Your production URL, e.g. `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Resend API key (optional, for emails) |
| `EMAIL_FROM` | Verified sender email (optional) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID (optional) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret (optional) |

**Database:** You'll need a Postgres provider. [Neon](https://neon.tech) (serverless Postgres with connection pooling via PgBouncer) works well with Vercel:

```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/talent-hub?pgbouncer=true&connection_limit=1"
```

Run migrations after deploying the database:

```bash
npx prisma migrate deploy
npm run seed
```

### Option 3: Traditional VPS

```bash
# Build
npm ci
npm run build

# Run migrations
npx prisma migrate deploy
npm run seed

# Start
npm start -- -p 3000
```

Put behind a reverse proxy (nginx, Caddy) and add a process manager (PM2, systemd).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite (dev) or PostgreSQL (prod) |
| `AUTH_SECRET` | Yes | — | NextAuth secret (`openssl rand -hex 32`) |
| `AUTH_URL` | No | `http://localhost:3000` | App URL for email links and callbacks |
| `AUTH_GOOGLE_ID` | No | — | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | — | Google OAuth client secret |
| `RESEND_API_KEY` | No | — | Resend API key (email) |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Sender email address |

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run test suite (Vitest) |
| `npm run seed` | Seed database with sample data |
| `npx prisma migrate dev` | Run dev migrations |
| `npx prisma migrate deploy` | Run production migrations |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |
