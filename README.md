# JJI (Just Journal It)

JJI is a trading analytics and journaling platform. Built for data-driven traders, it helps you track setups and analyze your performance.

**Note: JJI is a closed-source, paid platform ($10/month). While it may be open-sourced in the future, it is currently proprietary software.**

## Core Capabilities

- **Analytics**: View equity curves, drawdowns, win rates, and profit factors across your accounts.
- **Calendar**: Review daily PnL, setups, and trade execution through a calendar interface.
- **Journaling**: Log setups, rules, notes, and chart screenshots.
- **Prop Firm Tracking**: Workflows for tracking prop-firm challenges, phase transitions, drawdown limits, and payout objectives.
- **Data Portability**: Full control over your data with CSV/JSON import and export capabilities.

## Tech Stack

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth
- **State & Data Fetching**: Zustand, TanStack Query
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js LTS
- npm
- Supabase project credentials

### Local Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   npm install
   ```

2. Environment Configuration
   Create `.env` and `.env.local` based on `.env.example`. You will need Supabase, database, auth, and payment webhook keys. Minimum local variables:

   ```bash
   DATABASE_URL=
   DIRECT_URL=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=JJI
   ```

3. Database Setup
   Generate the Drizzle client and push the schema:

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Run the Development Server

   ```bash
   npm run dev
   ```

   Access the app at `http://localhost:3000`.

## Useful Commands

```bash
npm run type-check   # Validate TypeScript compilation
npm run lint         # Run ESLint
npm test -- --run    # Execute Vitest test suite
npm run build        # Create an optimized production build
npm run db:studio    # Launch Drizzle Studio to inspect the database
```

## Project Standards

- **Branding**: The production brand is **JJI**.
- **Production URL**: `https://justjournalit.vercel.app`.
- **Security**: Never commit real secrets. Use `.env.local` for local development. Ensure Supabase RLS (Row Level Security) and storage policies are rigorously audited before deploying production changes.

## License

Copyright (c) 2026-present JJI.
All rights reserved. This software is proprietary and closed-source unless explicitly stated otherwise.
