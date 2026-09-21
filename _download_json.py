# -*- coding: utf-8 -*-
from pathlib import Path
import re
import ssl
import urllib.request

ADMIN = Path("admin")
CTX = ssl.create_default_context()
UA = "Mozilla/5.0"
BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"

# Find json references in JS files
paths = set()
for js in (ADMIN / "assets" / "js").glob("*.js"):
    t = js.read_text(encoding="utf-8", errors="replace")
    paths |= set(re.findall(r'assetsPath\s*\+\s*["\'](json/[^"\']+)["\']', t))
    paths |= set(re.findall(r'["\']json/[^"\']+\.json["\']', t))

# normalize
norm = set()
for p in paths:
    p = p.strip("'\"")
    if p.startswith("json/"):
        norm.add("assets/" + p)
    elif "json/" in p:
        norm.add("assets/" + p.split("assets/")[-1] if p.startswith("assets/") else "assets/" + p)

# also scan for assetsPath+"json/
for js in (ADMIN / "assets" / "js").glob("*.js"):
    t = js.read_text(encoding="utf-8", errors="replace")
    for m in re.findall(r'assetsPath\+"([^"]+\.json)"', t):
        norm.add("assets/" + m)
    for m in re.findall(r"assetsPath\+'([^']+\.json)'", t):
        norm.add("assets/" + m)

print("json files needed:", sorted(norm))
ok = fail = 0
for rel in sorted(norm):
    dest = ADMIN / Path(*rel.split("/"))
    if dest.exists() and dest.stat().st_size > 0:
        print("skip", rel)
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + rel
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    try:
        data = urllib.request.urlopen(req, context=CTX, timeout=60).read()
        dest.write_bytes(data)
        ok += 1
        print("OK", rel, len(data))
    except Exception as e:
        fail += 1
        print("FAIL", rel, e)

# common ones explicitly
for rel in [
    "assets/json/user-list.json",
    "assets/json/invoice-list.json",
    "assets/json/ecommerce-product-list.json",
    "assets/json/ecommerce-customer-all.json",
    "assets/json/ecommerce-order-list.json",
    "assets/json/ecommerce-category-list.json",
    "assets/json/permissions-list.json",
    "assets/json/search-vertical.json",
    "assets/json/locales/en.json",
]:
    dest = ADMIN / Path(*rel.split("/"))
    if dest.exists() and dest.stat().st_size > 0:
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + rel
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    try:
        data = urllib.request.urlopen(req, context=CTX, timeout=60).read()
        dest.write_bytes(data)
        print("OK explicit", rel, len(data))
    except Exception as e:
        print("FAIL explicit", rel, e)

print("done", ok, fail)
