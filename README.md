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

### For Talents
| Feature | Description |
|---------|-------------|
| **Browse Jobs** | Search, filter by skills/type/location, sort by date/relevance |
| **AI Job Generator** | Generate job descriptions from a prompt using AI providers (OpenAI, Anthropic, Google, Grok) |
| **Apply with Proposal** | Submit cover letter, bid amount (fixed or hourly), timeline, and approach |
| **Edit Proposal** | Revise bid, timeline, and approach after discussing with the client |
| **Connects Bidding** | Bid 1-10 connects per application to prioritize your proposal |
| **Real-time Messaging** | Chat with clients via SSE — messages arrive instantly, polls as fallback |
| **Interview Scheduling** | Accept interview invites with calendar scheduling and meeting links |
| **Skill Assessments** | Take client-created assessments with timed questions and scoring |
| **Portfolio** | Showcase work samples on your public talent profile |
| **Talent Profile** | Public page with skills, bio, experience, hourly rate, availability, resume download |
| **Reviews & Ratings** | Receive star ratings and reviews from clients after engagements |

### For Clients
| Feature | Description |
|---------|-------------|
| **Post Jobs** | Create job listings with skills, type, salary range, and detailed description |
| **AI Job Generator** | Auto-generate full job descriptions from a short prompt |
| **Proposals Board** | Review all applications ranked by bid amount and connects |
| **Status Management** | Move applications through pending → reviewed → interview → accepted/rejected |
| **Interview Scheduling** | Schedule interviews with meeting links and duration |
| **Skill Assessments** | Create custom assessments with questions, pass scores, and time limits |
| **Contract Management** | Create contracts from accepted proposals — draft → sign → active → terminated |
| **Milestone Tracking** | Break work into milestones: pending → completed (by talent) → approved/rejected (by you) |
| **Invoicing** | Send invoices linked to contracts and milestones |
| **Pay Invoices** | Pay via Stripe, PayPal, or Wise (bank transfer) with one click |
| **AI Talent Matching** | Rank talents by skill match against your job, with optional AI enrichment |
| **Saved Searches** | Save talent search filters and get notified when new matches appear |

### For Both
| Feature | Description |
|---------|-------------|
| **Real-time Chat** | Live messaging on every application with connection indicator |
| **Engagements** | Dedicated workspace per accepted proposal with contract, milestones, invoices |
| **Notifications** | In-app notifications for all events with per-type preferences |
| **Talent Directory** | Browse/search talents by skills, availability, rate range, experience |

### For Admins
| Feature | Description |
|---------|-------------|
| **User Management** | View, search, and manage all users; toggle talent verification |
| **Job Moderation** | Review and manage all job listings |
| **Payment Logs** | View all payment orders and connect transactions |
| **Email Logs** | Monitor sent emails with search and filtering |
| **Subscription Management** | Create/edit plans, view subscriber history |
| **Connects Grants** | Manually add connects to any user |
| **Monthly Reset** | Trigger monthly connects grant for all talents |

### Platform Infrastructure
| Area | Details |
|------|---------|
| **Auth** | Credentials + Google OAuth via NextAuth v5, role-based access (guest/talent/client/admin) |
| **Payment Providers** | Stripe, PayPal, Wise, HitPay, Xendit, Maya — strategy pattern, auto-detection |
| **Connects Economy** | Purchase packs of 10/25/50/100 connects, earn via subscriptions, spend on applications |
| **Subscriptions** | Tiered plans (Starter $49/Growth $149/Scale $349) with connects per period, auto-renewal |
| **Email** | Background worker queue via Resend for all notification types |
| **Real-time** | Server-Sent Events for live chat with automatic polling fallback and reconnection |
| **Testing** | 327+ Vitest tests covering actions, auth guards, and business logic |

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
