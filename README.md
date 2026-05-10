# VA Jobs Online

A full-featured virtual assistant job marketplace built with Next.js. Talents can browse jobs, apply with connects bidding, and get hired. Clients can post jobs, review proposals, schedule interviews, manage contracts/milestones/invoices, and pay via Stripe, PayPal, or Wise.

## Stack

- **Framework:** Next.js 16 (App Router, React 19, Turbopack)
- **Database:** SQLite (dev) / PostgreSQL (production)
- **ORM:** Prisma 6 (dual schema: dev SQLite + prod PostgreSQL)
- **Auth:** NextAuth v5 (credentials + Google OAuth)
- **Payments:** Stripe, PayPal, Wise (+ HitPay, Xendit, Maya) via strategy pattern
- **Real-time:** Server-Sent Events (SSE) for live chat, polls as fallback
- **Email:** Resend via background worker queue
- **Testing:** Vitest (327+ tests)
- **Styling:** Tailwind CSS 4 + shadcn/ui

## Features

- Job posting & browsing with skill-based search and filtering
- Proposal system: bidding, timelines, approach
- Interview scheduling with meeting links
- Real-time messaging (SSE with polling fallback)
- Contract management (draft → sign → active → terminated)
- Milestone tracking (pending → completed → approved/rejected)
- Invoice generation with Stripe/PayPal/Wise payment buttons
- Talent directory with search, filters, portfolio, and reviews
- AI-powered talent matching for job posts
- Connects system (purchase, bid, monthly grants)
- Subscription plans (Starter, Growth, Scale)
- Admin dashboard (users, jobs, payments, email logs)
- Notification system with preferences
- Saved searches and alerts

## Prerequisites

- Node.js 20+
- npm

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

# 3. Generate Prisma client and run migrations (SQLite dev)
npx prisma generate --schema=prisma/schema.dev.prisma
npx prisma migrate dev --schema=prisma/schema.dev.prisma
# This seeds the database automatically. Re-run anytime:
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

### Seeded subscription plans

| Plan   | Price | Connects/mo | Badge |
| ------ | ----- | ----------- | ----- |
| Starter | $49/mo | 30 | — |
| Growth  | $149/mo | 100 | Most Popular |
| Scale   | $349/mo | 350 | — |

### Optional: Email (Resend)

Get a free API key at [resend.com](https://resend.com) and add to `.env.local`:

```
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
```

Email sending runs through a background worker queue — the response returns immediately and the worker processes the email asynchronously.

### Optional: Payment Providers

Configure at least one payment provider for connects purchases, subscriptions, and invoice payments:

```
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...

# Wise (bank transfer - for invoice payments only)
WISE_API_TOKEN=...
WISE_PROFILE_ID=...
WISE_SANDBOX=true

# HitPay
HITPAY_API_KEY=...
HITPAY_SALT=...

# Xendit
XENDIT_SECRET_API_KEY=xnd_...

# Maya (PayMaya)
MAYA_SECRET_KEY=sk-...
MAYA_PUBLIC_KEY=pk-...
```

The app auto-detects the first configured provider and uses it for checkout flows.

### Optional: Subscription Auto-Renewal

For scheduled subscription renewal, a cron job hits:

```bash
curl -X POST https://your-domain.com/api/subscriptions/renew \
  -H "Authorization: Bearer $CRON_SECRET"
```

Add `CRON_SECRET` to `.env.local` for local testing.

## Database: Dev vs Production

The project uses **two Prisma schemas**:

| Environment | Schema file | Database | Provider |
|---|---|---|---|
| Development | `prisma/schema.dev.prisma` | SQLite (`dev.db`) | `sqlite` |
| Production | `prisma/schema.prisma` | PostgreSQL | `postgresql` |

**Why two schemas?** SQLite for zero-dependency local development, PostgreSQL for production. Both schemas are kept in sync manually.

### Dev commands

```bash
# Generate Prisma client for dev
npx prisma generate --schema=prisma/schema.dev.prisma

# Run dev migrations
npx prisma migrate dev --schema=prisma/schema.dev.prisma

# Open Prisma Studio with dev DB
npx prisma studio --schema=prisma/schema.dev.prisma
```

### Prod commands

```bash
# Generate Prisma client for prod
npx prisma generate

# Run production migrations
npx prisma migrate deploy
```

## Deploy to Production

### Option 1: Docker

```bash
# Build and start (app only — provide DATABASE_URL via env)
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed the database
docker compose exec app npm run seed

# View logs
docker compose logs -f
```

`DATABASE_URL` is required — the compose file uses `${DATABASE_URL:?}` which errors at startup if not set:

```
DATABASE_URL="postgresql://user:password@host:5432/talent-hub?schema=public"
AUTH_SECRET="your-secret"
AUTH_URL="https://your-domain.com"
```

### Option 2: Coolify

Deploy as a Docker Compose stack on your own server.

1. Add a **PostgreSQL** service in Coolify and note the internal connection string
2. Connect your git repository to Coolify as a new **Docker Compose** resource
3. Set environment variables in Coolify's dashboard:
   - `DATABASE_URL` — the Postgres connection string
   - `AUTH_SECRET` — `openssl rand -hex 32`
   - `AUTH_URL` — your Coolify domain
   - `RESEND_API_KEY`, `EMAIL_FROM` — optional, for email
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — optional
   - Payment provider credential sets — optional
4. Deploy — Coolify builds the Docker image and serves the app

### Option 3: Vercel (Serverless)

```bash
npm i -g vercel
vercel
```

**Required environment variables (set in Vercel dashboard):**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `AUTH_URL` | Production URL |

**Database:** Use [Neon](https://neon.tech) for serverless Postgres with PgBouncer:

```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/talent-hub?pgbouncer=true&connection_limit=1"
```

Run migrations after deploying the database:

```bash
npx prisma migrate deploy
npm run seed
```

### Option 4: Traditional VPS

```bash
npm ci
npm run build
npx prisma migrate deploy
npm run seed
npm start -- -p 3000
```

Put behind a reverse proxy (nginx, Caddy) with a process manager (PM2, systemd).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite (dev) or PostgreSQL (prod) |
| `AUTH_SECRET` | Yes | — | NextAuth secret (`openssl rand -hex 32`) |
| `AUTH_URL` | No | `http://localhost:3000` | App URL for email links and callbacks |
| `CRON_SECRET` | No | — | Secret for subscription renewal cron endpoint |
| `AUTH_GOOGLE_ID` | No | — | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | — | Google OAuth client secret |
| `RESEND_API_KEY` | No | — | Resend API key (email) |
| `EMAIL_FROM` | No | `noreply@vajobs.online` | Sender email address |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | No | — | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | No | — | PayPal secret |
| `PAYPAL_WEBHOOK_ID` | No | — | PayPal webhook ID |
| `WISE_API_TOKEN` | No | — | Wise API bearer token |
| `WISE_PROFILE_ID` | No | — | Wise profile ID |
| `WISE_SANDBOX` | No | — | Set to `true` for sandbox mode |
| `HITPAY_API_KEY` | No | — | HitPay API key |
| `HITPAY_SALT` | No | — | HitPay salt |
| `XENDIT_SECRET_API_KEY` | No | — | Xendit secret key |
| `MAYA_SECRET_KEY` | No | — | Maya (PayMaya) secret key |
| `MAYA_PUBLIC_KEY` | No | — | Maya public key |

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run test suite (Vitest, 327+ tests) |
| `npm run seed` | Seed database with sample data |
| `npx prisma migrate dev --schema=prisma/schema.dev.prisma` | Run dev migration |
| `npx prisma migrate deploy` | Run production migration |
| `npx prisma generate --schema=prisma/schema.dev.prisma` | Generate dev Prisma client |
| `npx prisma studio --schema=prisma/schema.dev.prisma` | Open Prisma Studio (DB GUI) |
| `npx prisma studio` | Open Prisma Studio for production schema |
