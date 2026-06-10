#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${DEPLOY_PATH:-/var/www/world-cup-predictor}"
PM2_APP_NAME="${PM2_APP_NAME:-world-cup-predictor}"

cd "$APP_DIR"

echo "==> Pulling latest code from main"
git pull origin main

if [[ ! -f package.json ]]; then
  echo "==> No package.json yet — code updated, app start skipped until scaffolding is complete."
  exit 0
fi

echo "==> Installing dependencies"
npm ci

if npm run | grep -q '^  build$'; then
  echo "==> Building application"
  npm run build
fi

if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
  echo "==> Restarting PM2 process: $PM2_APP_NAME"
  pm2 restart "$PM2_APP_NAME"
else
  echo "==> Starting PM2 process: $PM2_APP_NAME"
  pm2 start npm --name "$PM2_APP_NAME" -- start
  pm2 save
fi

echo "==> Deploy complete"
