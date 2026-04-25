#!/bin/bash
# Production startup script for urgent-care.
# Runs AFTER the container launches so that the Neon DATABASE_URL secret
# is available. Keeps the build phase DB-free.
set -e

echo "[startup] Pushing Prisma schema to production database..."
pnpm --filter @workspace/urgent-care exec prisma db push --skip-generate --accept-data-loss || \
  echo "[startup] Warning: prisma db push failed — continuing anyway"

echo "[startup] Seeding clinic data (idempotent)..."
pnpm --filter @workspace/urgent-care exec tsx scripts/seed-clinics.ts || \
  echo "[startup] Warning: seed script failed — continuing anyway"

echo "[startup] Starting Next.js server..."
exec node artifacts/urgent-care/.next/standalone/artifacts/urgent-care/server.js
