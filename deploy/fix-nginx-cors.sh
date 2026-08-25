set -euo pipefail

SITE=""
for f in \
  /etc/nginx/sites-available/api-kb.techtimize.co \
  /etc/nginx/sites-enabled/api-kb.techtimize.co \
  /etc/nginx/conf.d/api-kb.techtimize.co.conf
do
  if [[ -f "$f" ]]; then SITE="$f"; break; fi
done

if [[ -z "$SITE" ]]; then
  echo "Nginx site file for api-kb.techtimize.co not found."
  exit 1
fi

echo "Updating: $SITE"
cp "$SITE" "${SITE}.bak.$(date +%s)"

cat > "$SITE" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api-kb.techtimize.co;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api-kb.techtimize.co;

    ssl_certificate /etc/letsencrypt/live/api-kb.techtimize.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-kb.techtimize.co/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 200M;

    location / {
        # OPTIONS only here. Do not add CORS on proxied responses.
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "$http_origin" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400 always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Origin $http_origin;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
EOF

nginx -t
systemctl reload nginx
echo "Nginx reloaded (no duplicate CORS on POST/GET)."
echo "Confirm API is up: sudo systemctl restart kb-api && curl -sI http://127.0.0.1:8000/api/v1/auth/login"
