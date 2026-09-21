#!/usr/bin/env bash
set -euo pipefail
# Sync only changed admin static files into /var/www/zonic-admin/admin
# Does NOT touch zonic.uz, API process, or other sites.

SRC=/tmp/zon-admin-sync
rm -rf "$SRC"
mkdir -p "$SRC"

# files arrive via tar from client into /tmp/zon-admin-sync.tgz
tar -xzf /tmp/zon-admin-sync.tgz -C "$SRC"
test -d "$SRC/admin"

sudo mkdir -p /var/www/zonic-admin/admin/js /var/www/zonic-admin/admin/css
# copy js/css + new html pages + updated key pages
sudo rsync -a "$SRC/admin/js/" /var/www/zonic-admin/admin/js/
sudo rsync -a "$SRC/admin/css/" /var/www/zonic-admin/admin/css/
sudo rsync -a \
  "$SRC/admin/index.html" \
  "$SRC/admin/app-user-list.html" \
  "$SRC/admin/auth-login-basic.html" \
  "$SRC"/admin/app-zon-*.html \
  /var/www/zonic-admin/admin/

# ensure root redirect still points to admin/
if [ -f "$SRC/index.html" ]; then
  sudo cp "$SRC/index.html" /var/www/zonic-admin/index.html
fi

sudo chown -R ubuntu:www-data /var/www/zonic-admin
echo "SYNC_OK"
ls /var/www/zonic-admin/admin/js/zon-*.js
ls /var/www/zonic-admin/admin/app-zon-*.html
curl -sI -H 'Host: admin.zonic.uz' http://127.0.0.1/admin/js/zon-badges.js | head -3
curl -sI -H 'Host: admin.zonic.uz' http://127.0.0.1/admin/app-zon-events.html | head -3
# siblings untouched
ls -ld /var/www/zonic /var/www/zonic-api
curl -sI http://127.0.0.1:5065/swagger/ | head -2
