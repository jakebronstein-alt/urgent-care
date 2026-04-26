#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Sync the urgent-care Prisma schema to the database.
# Skipped gracefully if DATABASE_URL is not set or the DB is unreachable.
if [ -n "$DATABASE_URL" ]; then
  (cd artifacts/urgent-care && pnpm exec prisma db push) || \
    echo "Warning: prisma db push failed (DB may be unreachable) — skipping"
else
  echo "DATABASE_URL not set — skipping prisma db push"
fi

# Push to GitHub
# Requires: GITHUB_TOKEN secret with write access to jakebronstein-alt/urgent-care.
# Note: if the token lacks the 'workflow' scope it cannot push .github/workflows/
# files — the push will be skipped gracefully rather than failing the merge.
if [ -n "$GITHUB_TOKEN" ]; then
  git remote remove github 2>/dev/null || true
  trap 'git remote remove github 2>/dev/null || true' EXIT
  git remote add github "https://x-access-token:${GITHUB_TOKEN}@github.com/jakebronstein-alt/urgent-care.git"
  git push github HEAD:main --force || \
    echo "Warning: GitHub push failed — token may lack 'workflow' scope for .github/workflows/ files"
fi
