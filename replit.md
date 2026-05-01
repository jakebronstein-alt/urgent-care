# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
The primary application is the **Urgent Care** Next.js app — an NYC urgent care clinic directory with wait times, reviews, and clinic claiming.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9

### Urgent Care App (`artifacts/urgent-care`)
- **Framework**: Next.js 15.3.1 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth (Google OAuth + credentials)
- **UI**: Tailwind CSS v4
- **Maps**: Google Maps / Google Places API
- **SMS**: Twilio (wait-time notifications)
- **Port**: 25563 (dev), served at `/`

### Shared Backend (`artifacts/api-server`)
- **Framework**: Express 5 (REST API for clinics, wait-times, reviews)
- **Port**: 8080, served at `/api`
- **Database access**: Drizzle ORM via `@workspace/db` — typed queries for `Clinic`, `User`, `Review`, `WaitingRoomReport`
- **Routes**: `GET /api/clinics`, `GET /api/clinics/:id`, `POST /api/wait-times`, `POST /api/reviews`

### Shared DB library (`lib/db`)
- **ORM**: Drizzle ORM (node-postgres driver)
- **Schema**: `lib/db/src/schema/` — tables for `clinics` (Clinic), `users` (User), `reviews` (Review), `waiting-room-reports` (WaitingRoomReport), `follow-up-requests` (FollowUpRequest)
- **Table names**: match Prisma model names (PascalCase) as created by `prisma db push`
- **Build**: `cd lib/db && npx tsc -p tsconfig.json` — must be rebuilt after schema changes

## Key Commands

- `pnpm --filter @workspace/urgent-care run dev` — run the Next.js app locally
- `pnpm --filter @workspace/urgent-care exec prisma db push` — push DB schema changes
- `pnpm --filter @workspace/urgent-care exec prisma generate` — regenerate Prisma client
- `pnpm --filter @workspace/urgent-care run build` — build for production

## Required Secrets

These must be set in the Secrets tab for the app to work:

| Secret | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | Session security (required for login) |
| `GOOGLE_CLIENT_ID` | Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth login |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps display |
| `GOOGLE_PLACES_API_KEY` | Google Places API |
| `TWILIO_ACCOUNT_SID` | SMS notifications (optional) |
| `TWILIO_AUTH_TOKEN` | SMS notifications (optional) |
| `TWILIO_PHONE_NUMBER` | SMS notifications (optional) |

`NEXTAUTH_URL` is set automatically to the Replit dev domain.
`DATABASE_URL` is provided by Replit's built-in PostgreSQL.

## GitHub Sync

The `scripts/post-merge.sh` post-merge script automatically pushes every merged change to
`github.com/jakebronstein-alt/urgent-care` using a GitHub personal access token.

**Required secret for sync to work:**

| Secret | Purpose |
|---|---|
| `GITHUB_TOKEN` | GitHub PAT with `contents: write` access to `jakebronstein-alt/urgent-care` |

If `GITHUB_TOKEN` is absent the push step is silently skipped — the rest of the post-merge
script (dependency install, DB push) still runs normally.

The push uses `--force` so GitHub always mirrors the Replit workspace state exactly.

## Admin Dashboard

Private dashboard at `/urgent-care/admin` — requires `ADMIN` role.

- **Route**: `src/app/urgent-care/admin/page.tsx` (client component, session-gated)
- **API**: `src/app/api/admin/stats/route.ts` — returns page views (24h/7d/30d), clinic counts, pending claim requests, wait report counts, top clinics by views, user stats
- **PageView model**: tracks every clinic detail page load (fire-and-forget insert); `@@index([clinicId, createdAt])`
- **Admin user**: `jake.bronstein@dr-ubie.com` promoted to `ADMIN` via idempotent upsert in `scripts/seed-clinics.ts`

## Source

Original source: https://github.com/jakebronstein-alt/urgent-care.git
