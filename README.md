[![CI](https://github.com/jakebronstein-alt/urgent-care/actions/workflows/ci.yml/badge.svg)](https://github.com/jakebronstein-alt/urgent-care/actions/workflows/ci.yml)

# Urgent Care

NYC urgent care clinic directory with real-time wait times, reviews, and clinic claiming.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth (Google OAuth + credentials)
- **UI**: Tailwind CSS v4
- **Monorepo**: pnpm workspaces

## Getting Started

```bash
pnpm install
pnpm --filter @workspace/urgent-care run dev
```

See [replit.md](./replit.md) for required secrets and full setup details.
