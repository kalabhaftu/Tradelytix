# Tradelytix

Tradelytix is a trading analytics and journaling platform built to help traders find consistency through the charts. It combines trade tracking, account analytics, journaling, reports, prop-firm workflows, and data-management tools in one dashboard.

## What Tradelytix helps with

- Track trading performance across master, phase, live, and linked accounts.
- Review PnL, equity curves, win rate, profit factor, risk/reward, drawdown, and consistency metrics.
- Journal trades with screenshots, tags, setups, emotions, notes, and execution details.
- Build and refine playbooks with entry, target, confirmation, confluence, risk, and exit rules.
- Analyze daily and weekly behavior through calendar views, daily notes, and weekly reviews.
- Manage prop-firm challenges, objectives, phase transitions, payouts, and reference values.
- Import, export, back up, and clean trading data with user-controlled data tools.
- Share read-only reports with public links when needed.

## Tech stack

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **State/data**: Zustand and TanStack Query
- **Reports/exports**: PDF, image, CSV, Excel, and JSON export utilities
- **Testing**: Vitest, ESLint, TypeScript checks, Playwright support

## Getting started

### Prerequisites

- Node.js LTS
- npm
- PostgreSQL/Supabase project credentials

### Installation

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### Environment

Create `.env` and `.env.local` with the required app, database, Supabase, auth, payment, and admin values for your environment. At minimum, local development usually needs:

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Tradelytix
```

Then generate the Prisma client:

```bash
npx prisma generate
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful scripts

```bash
npm run type-check   # TypeScript validation
npm run lint         # ESLint checks
npm test -- --run    # Vitest suite
npm run build        # Production build
npx prisma studio    # Inspect local database data
```

## Project notes

- Keep production-facing branding as **Tradelytix**.
- Use `https://www.tradelytix.eu.cc` for production URLs.
- Do not commit real secrets. Keep credentials in local environment files or deployment secrets.
- Review Supabase storage and database policies before production changes.

## License

Copyright (c) 2026-present Tradelytix.
All rights reserved unless a separate written license says otherwise.
