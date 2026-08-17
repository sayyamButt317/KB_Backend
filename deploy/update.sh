#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/update.sh"
  exit 1
fi

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$APP_DIR"
git pull
npm install --omit=dev --legacy-peer-deps
systemctl restart kb-api kb-worker
systemctl status --no-pager kb-api kb-worker

echo "Updated and restarted kb-api + kb-worker."
