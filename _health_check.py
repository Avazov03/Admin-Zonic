# -*- coding: utf-8 -*-
"""Local health check before server deploy."""
from __future__ import annotations

import json
import pathlib
import re
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
ADMIN = ROOT / "admin"
BASE = "http://127.0.0.1:8765"
API = "http://18.197.174.196:5065"


def http_ok(url: str, timeout: int = 12) -> tuple[bool, int, str]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ZonHealth/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return True, r.status, f"len={len(r.read(200))}"
    except urllib.error.HTTPError as e:
        return False, e.code, str(e.reason)
    except Exception as e:
        return False, 0, str(e)


def main() -> None:
    report = []
    pages = [
        "/",
        "/admin/",
        "/admin/index.html",
        "/admin/app-user-list.html",
        "/admin/auth-login-basic.html",
        "/admin/front-pages/landing-page.html",
        "/admin/horizontal-menu-template/index.html",
        "/admin/assets/vendor/css/core.css",
        "/admin/js/app-config.js",
        "/admin/js/api.js",
        "/admin/js/zon-i18n.js",
        "/admin/css/zon-admin.css",
    ]
    print("=== LOCAL PAGES ===")
    fail = 0
    for p in pages:
        ok, code, info = http_ok(BASE + p)
        status = "OK" if ok else "FAIL"
        if not ok:
            fail += 1
        print(f"  {status} {code} {p} {info}")
        report.append({"url": p, "ok": ok, "code": code})

    print("\n=== API REACHABILITY ===")
    for p in ["/swagger/", "/Admin/Dashboard", "/swagger/swagger-ui-init.js"]:
        ok, code, info = http_ok(API + p)
        print(f"  {'OK' if ok else 'FAIL'} {code} {API}{p} {info}")

    # missing html refs from index
    print("\n=== INDEX MENU HTML EXISTS ===")
    idx = (ADMIN / "index.html").read_text(encoding="utf-8", errors="replace")
    missing = []
    for href in re.findall(r'href="([^"]+\.html)"', idx):
        if href.startswith(("http", "javascript", "#")):
            continue
        target = (ADMIN / href.split("?")[0]).resolve()
        if not target.exists():
            missing.append(href)
    print(f"  missing from index: {len(missing)}")
    for m in missing[:20]:
        print("   ", m)

    # critical assets on index
    print("\n=== INDEX CRITICAL ASSETS ===")
    asset_fail = []
    for rel in re.findall(r'(?:src|href)="(assets/[^"#?]+|js/[^"#?]+|css/[^"#?]+)"', idx):
        if not (ADMIN / rel).exists():
            asset_fail.append(rel)
    print(f"  missing assets referenced by index: {len(asset_fail)}")
    for a in asset_fail[:20]:
        print("   ", a)

    # sneat leftovers / buy-now
    print("\n=== CLEANLINESS SPOT CHECK ===")
    sneat = idx.count("Sneat")
    buy = idx.count("buy-now")
    zon = "zon-i18n.js" in idx
    print(f"  Sneat leftovers: {sneat}, buy-now: {buy}, zon-i18n: {zon}")

    summary = {
        "local_page_fails": fail,
        "index_missing_html": len(missing),
        "index_missing_assets": len(asset_fail),
        "html_counts": {
            "root": len(list(ADMIN.glob("*.html"))),
            "front": len(list((ADMIN / "front-pages").glob("*.html"))),
            "horizontal": len(
                list((ADMIN / "horizontal-menu-template").glob("*.html"))
            ),
        },
    }
    (ROOT / "_health_report.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    print("\n=== SUMMARY ===")
    print(json.dumps(summary, indent=2))
    if fail or missing or asset_fail:
        print("RESULT: NEEDS FIX")
    else:
        print("RESULT: HEALTHY")


if __name__ == "__main__":
    main()
