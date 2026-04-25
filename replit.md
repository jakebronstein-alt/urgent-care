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
- **Framework**: Express 5 (boilerplate, not used by urgent-care)
- **Port**: 8080, path disabled (no proxy routing)

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

## Source

Original source: https://github.com/jakebronstein-alt/urgent-care.git
