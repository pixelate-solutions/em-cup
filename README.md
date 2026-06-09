# EM Cup

Electro-Matic Golf Tournament official live bracket site built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style UI components, Neon Postgres, Drizzle ORM, Zod, and Server Actions.

## Stack

- Next.js `16.2.7`
- React `19.2.7`
- TypeScript
- Tailwind CSS `4`
- shadcn/ui-compatible local components in `components/ui`
- Neon Postgres
- Drizzle ORM and Drizzle Kit
- Zod validation
- Server Actions for admin mutations

## Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/emcup?sslmode=require"
ADMIN_PASSWORD="emcup-2026"
```

## Neon Database

1. Create a Neon project at https://neon.tech.
2. Create or select a database for the tournament.
3. Copy the pooled or direct Postgres connection string.
4. Paste it into `.env.local` as `DATABASE_URL`.

## Migrations

Generate migrations after schema changes:

```bash
npm run db:generate
```

Apply migrations to Neon:

```bash
npm run db:migrate
```

The initial migration is already included in `drizzle/`.

## Seed Data

Seed the complete EM Cup bracket, players, previous winners, prizes, deadlines, and tournament settings:

```bash
npm run db:seed
```

The seed script resets tournament tables before inserting the official bracket.

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

Admin login:

- URL: `/admin/login`
- Default password: `emcup-2026`

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Add environment variables:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
4. Deploy.
5. Run migrations against the production Neon database:

```bash
npm run db:migrate
```

6. Seed the production database once, if needed:

```bash
npm run db:seed
```

## Routes

- `/` Home dashboard
- `/bracket` Public live bracket
- `/players` Public player list
- `/rules` Rules, payouts, deadlines, and Blue Jacket details
- `/admin/login` Admin login
- `/admin` Admin overview and settings
- `/admin/matches` Match editing and winner propagation
- `/admin/players` Player handicap, payment, notes, and status tools
- `/admin/payments` Payment tracking for all 25 players
- `/admin/prizes` Prize assignment

## Admin Behavior

When an admin sets a winner:

1. The match winner and loser are stored.
2. The match is marked completed.
3. The winner is placed into the configured next match slot.
4. If an earlier winner changes, dependent downstream results are cleared to prevent impossible bracket states.
5. Public and admin pages are revalidated.

The admin session is stored in a secure httpOnly cookie. The password is read from `ADMIN_PASSWORD` and is not editable in the UI.
