#!/usr/bin/env bash
set -euo pipefail

# Ejecutar en el Droplet, desde la carpeta del proyecto:
#   bash deploy/setup-droplet.sh

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v nginx >/dev/null 2>&1; then
  apt-get update
  apt-get install -y nginx
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

npm ci --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root || true

cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/emoticones
ln -sfn /etc/nginx/sites-available/emoticones /etc/nginx/sites-enabled/emoticones
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "Lista en http://$(curl -s ifconfig.me)"
echo "Admin: http://$(curl -s ifconfig.me)/admin"
