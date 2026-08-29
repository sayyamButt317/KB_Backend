#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/setup.sh"
  exit 1
fi

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != "root" ]]; then
  APP_USER="$SUDO_USER"
else
  APP_USER="$(stat -c '%U' "$APP_DIR")"
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js not found. Install Node 18+ first."
  exit 1
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Missing $APP_DIR/.env — copy .env.example and fill keys first."
  exit 1
fi

echo "App dir: $APP_DIR"
echo "User:    $APP_USER"
echo "Node:    $NODE_BIN"

mkdir -p "$APP_DIR/uploads"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/uploads"

cd "$APP_DIR"
npm install --omit=dev --legacy-peer-deps

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    docker compose up -d valkey
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d valkey
  fi
else
  echo "Docker not found. Start Redis/Valkey on 127.0.0.1:6379 yourself."
fi

sed -e "s|__APP_DIR__|$APP_DIR|g" \
    -e "s|__APP_USER__|$APP_USER|g" \
    -e "s|__NODE_BIN__|$NODE_BIN|g" \
    "$APP_DIR/deploy/kb-api.service" > /etc/systemd/system/kb-api.service

sed -e "s|__APP_DIR__|$APP_DIR|g" \
    -e "s|__APP_USER__|$APP_USER|g" \
    -e "s|__NODE_BIN__|$NODE_BIN|g" \
    "$APP_DIR/deploy/kb-worker.service" > /etc/systemd/system/kb-worker.service

rm -f /etc/nginx/sites-enabled/api-kb.tachtimize.co \
      /etc/nginx/sites-available/api-kb.tachtimize.co \
      /etc/nginx/conf.d/api-kb.tachtimize.co.conf

if [[ -d /etc/nginx/sites-available ]]; then
  cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/api-kb.techtimize.co
  ln -sfn /etc/nginx/sites-available/api-kb.techtimize.co /etc/nginx/sites-enabled/api-kb.techtimize.co
  rm -f /etc/nginx/sites-enabled/default
else
  cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/api-kb.techtimize.co.conf
fi

nginx -t
systemctl daemon-reload
systemctl enable --now kb-api kb-worker
systemctl reload nginx

echo
echo "API and worker are running."
echo "Next, enable HTTPS:"
echo "  sudo certbot --nginx -d api-kb.techtimize.co"
echo
echo "Check:"
echo "  curl -I http://127.0.0.1:8000/api/v1/conversations"
echo "  sudo systemctl status kb-api kb-worker"
