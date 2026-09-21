#!/usr/bin/env bash
set -euo pipefail
# strip UTF-8 BOM from app-config.js if present
python3 - <<'PY'
from pathlib import Path
p = Path("/var/www/zonic-admin/admin/js/app-config.js")
data = p.read_bytes()
if data.startswith(b"\xef\xbb\xbf"):
    p.write_bytes(data[3:])
    print("BOM removed")
else:
    print("no BOM")
print(p.read_text(encoding="utf-8")[:300])
PY

echo "=== local host checks ==="
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/ | head -10
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/admin/index.html | head -10
curl -sI -H "Host: admin.zonic.uz" http://127.0.0.1/admin/assets/vendor/css/core.css | head -8

echo "=== backups ==="
ls -lh /var/www/_backups/ | tail -10

echo "=== confirm untouched ==="
ls -ld /var/www/zonic /var/www/zonic-api
curl -sI http://127.0.0.1:5065/swagger/ | head -3
curl -sI http://127.0.0.1:4000/ | head -3
