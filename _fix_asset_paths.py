# -*- coding: utf-8 -*-
from pathlib import Path
import re
import ssl
import urllib.request

ADMIN = Path("admin")
CTX = ssl.create_default_context()
UA = "Mozilla/5.0"
BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"

# Fix relative asset paths for flat admin/ structure
for html in ADMIN.glob("*.html"):
    t = html.read_text(encoding="utf-8", errors="replace")
    t2 = t.replace("../../assets/", "assets/")
    t2 = t2.replace("../assets/", "assets/")
    # remove customizer script references (optional demo)
    t2 = t2.replace(
        '<script src="assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    if t2 != t:
        html.write_text(t2, encoding="utf-8")
        print("fixed paths", html.name)

# Collect and download all assets
paths = set()
for html in ADMIN.glob("*.html"):
    t = html.read_text(encoding="utf-8", errors="replace")
    paths |= set(re.findall(r'(?:src|href)="(assets/[^"#?]+)"', t))

print("asset refs", len(paths))
ok = fail = skip = 0
for rel in sorted(paths):
    dest = ADMIN / Path(*rel.split("/"))
    if dest.exists() and dest.stat().st_size > 0:
        skip += 1
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + rel
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    try:
        data = urllib.request.urlopen(req, context=CTX, timeout=90).read()
        dest.write_bytes(data)
        ok += 1
        print("OK", rel, len(data))
    except Exception as e:
        fail += 1
        print("FAIL", rel, e)

print("done ok", ok, "fail", fail, "skip", skip)
