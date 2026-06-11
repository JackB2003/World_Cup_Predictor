#!/usr/bin/env bash
set -a
source /var/www/world-cup-predictor/.env
set +a
exec node /var/www/world-cup-predictor/.next/standalone/server.js
