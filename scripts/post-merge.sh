#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Sync the urgent-care Prisma schema to the database.
# --skip-generate: skip client codegen (already done by pnpm install)
pnpm --filter @workspace/urgent-care exec prisma db push --skip-generate

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
