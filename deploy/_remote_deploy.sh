#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d_%H%M%S)

echo "=== 1) BACKUP admin only ==="
sudo mkdir -p /var/www/_backups
sudo tar -czf "/var/www/_backups/zonic-admin_${TS}.tar.gz" -C /var/www zonic-admin
sudo cp -a /etc/nginx/sites-available/admin.zonic.uz "/var/www/_backups/admin.zonic.uz.${TS}.conf"
ls -lh "/var/www/_backups/zonic-admin_${TS}.tar.gz"
ls -lh "/var/www/_backups/admin.zonic.uz.${TS}.conf"

echo "=== 2) STAGING extract ==="
rm -rf /tmp/zon-admin-staging
mkdir -p /tmp/zon-admin-staging
unzip -q /tmp/zon-admin-deploy.zip -d /tmp/zon-admin-staging
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
ls "$SRC" | head
grep -n API_BASE_URL "$SRC/admin/js/app-config.js" || true

echo "=== 3) DEPLOY into /var/www/zonic-admin ==="
sudo find /var/www/zonic-admin -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -a "$SRC/." /var/www/zonic-admin/
sudo chown -R ubuntu:www-data /var/www/zonic-admin
sudo find /var/www/zonic-admin -type d -exec chmod 755 {} \;
sudo find /var/www/zonic-admin -type f -exec chmod 644 {} \;
echo "deployed html count: $(find /var/www/zonic-admin/admin -maxdepth 1 -name '*.html' | wc -l)"
test -f /var/www/zonic-admin/index.html
test -f /var/www/zonic-admin/admin/index.html
test -f /var/www/zonic-admin/admin/js/app-config.js
grep API_BASE_URL /var/www/zonic-admin/admin/js/app-config.js

echo "=== 4) NGINX: only admin.zonic.uz /api -> 5065 ==="
sudo sed -i 's|proxy_pass http://127.0.0.1:4000/api/;|proxy_pass http://127.0.0.1:5065/;|' /etc/nginx/sites-available/admin.zonic.uz
echo "--- new admin conf ---"
sudo cat /etc/nginx/sites-available/admin.zonic.uz
sudo nginx -t
sudo systemctl reload nginx
echo "NGINX_RELOADED"

echo "=== 5) VERIFY other projects untouched ==="
ss -tlnp | egrep ':(80|443|4000|5000|5065|5432)\s' || true
ls -ld /var/www/zonic /var/www/zonic-api /var/www/zonic-admin /var/www/html
ls /etc/nginx/sites-enabled/

echo "=== 6) HTTP checks ==="
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/ | head -12
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/admin/ | head -12
curl -s -H "Host: admin.zonic.uz" http://127.0.0.1/admin/js/app-config.js | head -20
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/api/Admin/Dashboard | head -12
curl -sI http://127.0.0.1:5065/swagger/ | head -5
curl -sI -H "Host: zonic.uz" http://127.0.0.1/ | head -8
curl -sI -H "Host: yurist.zonic.uz" http://127.0.0.1/ | head -8

echo "=== DONE TS=${TS} ==="
