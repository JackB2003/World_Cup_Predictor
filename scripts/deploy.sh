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
  # standalone output requires static/public to be copied into the standalone dir manually
  echo "==> Copying static assets into standalone"
  cp -r .next/static .next/standalone/.next/static
  [ -d public ] && cp -r public .next/standalone/public
fi

if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
  echo "==> Restarting PM2 process: $PM2_APP_NAME"
  pm2 restart "$PM2_APP_NAME" --update-env
else
  echo "==> Starting PM2 process: $PM2_APP_NAME"
  pm2 start ecosystem.config.js
  pm2 save
fi

echo "==> Deploy complete"
