#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Sync the urgent-care Prisma schema to the database.
# Skipped gracefully if DATABASE_URL is not set or the DB is unreachable.
if [ -n "$DATABASE_URL" ]; then
  pnpm --filter @workspace/urgent-care exec prisma db push --skip-generate || {
    echo "Warning: prisma db push failed (DB may be unreachable) — skipping"
  }
else
  echo "DATABASE_URL not set — skipping prisma db push"
fi

# Push to GitHub
# Requires: GITHUB_TOKEN secret (a GitHub personal access token or fine-grained token
# with write access to jakebronstein-alt/urgent-care).
# Uses --force so GitHub always mirrors the Replit workspace state exactly.
if [ -n "$GITHUB_TOKEN" ]; then
  git remote remove github 2>/dev/null || true
  # Always clean up the credentialed remote, even if the push fails
  trap 'git remote remove github 2>/dev/null || true' EXIT
  git remote add github "https://x-access-token:${GITHUB_TOKEN}@github.com/jakebronstein-alt/urgent-care.git"
  git push github HEAD:main --force
fi
