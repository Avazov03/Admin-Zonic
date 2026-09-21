#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d_%H%M%S)

echo "=== extract with python ==="
rm -rf /tmp/zon-admin-staging
mkdir -p /tmp/zon-admin-staging
python3 - <<'PY'
import zipfile
zipfile.ZipFile("/tmp/zon-admin-deploy.zip").extractall("/tmp/zon-admin-staging")
print("extracted ok")
PY

if [ -d /tmp/zon-admin-staging/admin ]; then
  SRC=/tmp/zon-admin-staging
elif [ -d /tmp/zon-admin-staging/zon-admin-deploy/admin ]; then
  SRC=/tmp/zon-admin-staging/zon-admin-deploy
else
  echo "BAD ZIP LAYOUT"
  find /tmp/zon-admin-staging -maxdepth 2 -type d
  exit 1
fi
echo "SRC=$SRC"
grep API_BASE_URL "$SRC/admin/js/app-config.js"

echo "=== ensure backup exists ==="
sudo mkdir -p /var/www/_backups
if ! ls /var/www/_backups/zonic-admin_*.tar.gz >/dev/null 2>&1; then
  sudo tar -czf "/var/www/_backups/zonic-admin_${TS}.tar.gz" -C /var/www zonic-admin
fi
if ! ls /var/www/_backups/admin.zonic.uz.*.conf >/dev/null 2>&1; then
  sudo cp -a /etc/nginx/sites-available/admin.zonic.uz "/var/www/_backups/admin.zonic.uz.${TS}.conf"
fi

echo "=== deploy ==="
sudo find /var/www/zonic-admin -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -a "$SRC/." /var/www/zonic-admin/
sudo chown -R ubuntu:www-data /var/www/zonic-admin
sudo find /var/www/zonic-admin -type d -exec chmod 755 {} \;
sudo find /var/www/zonic-admin -type f -exec chmod 644 {} \;
echo "html=$(find /var/www/zonic-admin/admin -maxdepth 1 -name '*.html' | wc -l)"
test -f /var/www/zonic-admin/admin/index.html
grep API_BASE_URL /var/www/zonic-admin/admin/js/app-config.js

echo "=== nginx patch (admin only) ==="
# backup conf once more with this TS
sudo cp -a /etc/nginx/sites-available/admin.zonic.uz "/var/www/_backups/admin.zonic.uz.before_patch_${TS}.conf"
# Point /api/ to Zonic API on 5065 (strip /api prefix)
sudo tee /etc/nginx/sites-available/admin.zonic.uz >/dev/null <<'NGX'
# admin.zonic.uz — Zon Admin static + Zonic API reverse proxy
server {
    listen 80;
    listen [::]:80;
    server_name admin.zonic.uz;

    root /var/www/zonic-admin;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;

    # Zonic API (port 5065). Browser calls /api/... -> backend /...
    location /api/ {
        proxy_pass http://127.0.0.1:5065/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Cookie $http_cookie;
        proxy_pass_header Set-Cookie;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location = /admin/js/app-config.js {
        add_header Cache-Control "no-store";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
}
NGX

sudo nginx -t
sudo systemctl reload nginx
echo "NGINX_RELOADED"

echo "=== verify siblings ==="
ls -ld /var/www/zonic /var/www/zonic-api /var/www/zonic-admin
ls /etc/nginx/sites-enabled/
ss -tlnp | egrep ':(80|443|4000|5000|5065)\s' || true

echo "=== http checks ==="
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/admin/ | head -15
curl -s -H "Host: admin.zonic.uz" http://127.0.0.1/admin/js/app-config.js | head -25
echo "--- api proxy ---"
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/api/Admin/Dashboard | head -15
echo "--- api direct ---"
curl -sI http://127.0.0.1:5065/swagger/ | head -5
echo "--- other sites ---"
curl -sI -H "Host: zonic.uz" http://127.0.0.1/ | head -8
curl -sI -H "Host: yurist.zonic.uz" http://127.0.0.1/ | head -8
curl -sI http://127.0.0.1:5000/docs 2>/dev/null | head -5 || curl -sI http://127.0.0.1:5000/ | head -5

echo "=== DONE ${TS} ==="
