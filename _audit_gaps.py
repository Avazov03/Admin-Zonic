# -*- coding: utf-8 -*-
"""Audit remaining gaps vs remote vertical template sitemap."""
from __future__ import annotations

import pathlib
import re
import ssl
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
ADMIN = ROOT / "admin"
VBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/"
CTX = ssl.create_default_context()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read()


def main() -> None:
    # Collect all .html links from local menus
    local = {p.name for p in ADMIN.glob("*.html")}
    from_menu = set()
    for html in ADMIN.glob("*.html"):
        t = html.read_text(encoding="utf-8", errors="replace")
        for href in re.findall(r'href="([^"]+\.html)"', t):
            name = href.split("/")[-1].split("?")[0]
            if name.endswith(".html"):
                from_menu.add(name)

    # Fetch remote index and extract all html links
    remote = fetch(VBASE + "index.html").decode("utf-8", errors="replace")
    remote_pages = set(re.findall(r'href="([^"#?]+\.html)"', remote))
    remote_names = {p.split("/")[-1] for p in remote_pages if p.endswith(".html")}

    only_remote = sorted(remote_names - local)
    print("local html", len(local))
    print("remote names from index", len(remote_names))
    print("only on remote (missing locally)", len(only_remote))
    for n in only_remote:
        print(" ", n)

    # Check # hrefs that look like menu items
    sharp = 0
    sample = []
    t = (ADMIN / "index.html").read_text(encoding="utf-8", errors="replace")
    for m in re.finditer(r'<a[^>]+href="#"[^>]*>[\s\S]{0,120}?</a>', t):
        sharp += 1
        if len(sample) < 15:
            sample.append(re.sub(r"\s+", " ", m.group(0))[:120])
    print("href=# in index", sharp)
    for s in sample:
        print(" ", s)

    # front-pages / horizontal presence
    print("front-pages", list((ADMIN / "front-pages").glob("*.html")))
    print("horizontal", list((ADMIN / "horizontal-menu-template").glob("*.html")))

    # zon files
    for f in ["js/zon-i18n.js", "js/api.js", "js/app-config.js", "css/zon-admin.css"]:
        p = ADMIN / f
        print(f, "OK" if p.exists() else "MISSING", p.stat().st_size if p.exists() else 0)


if __name__ == "__main__":
    main()
