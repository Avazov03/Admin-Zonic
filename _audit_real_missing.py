# -*- coding: utf-8 -*-
from __future__ import annotations

import pathlib
import re

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"


def main() -> None:
    html_files = (
        list(ADMIN.glob("*.html"))
        + list((ADMIN / "front-pages").glob("*.html"))
        + list((ADMIN / "horizontal-menu-template").glob("*.html"))
    )
    missing = set()
    for html in html_files:
        text = html.read_text(encoding="utf-8", errors="replace")
        for ref in re.findall(r'href=["\']([^"\']+)["\']', text):
            if not ref.endswith(".html"):
                continue
            if ref.startswith(("http", "javascript", "mailto", "#")):
                continue
            if "/cdn-cgi/" in ref:
                continue
            target = (html.parent / ref.split("?")[0].split("#")[0]).resolve()
            if not target.exists():
                missing.add((str(html.relative_to(ADMIN)).replace("\\", "/"), ref))

    print("REAL missing .html targets:")
    for src, ref in sorted(missing)[:80]:
        print(f"  {src} -> {ref}")
    print("total unique pairs", len(missing))
    uniq = sorted({ref for _, ref in missing})
    print("unique targets", len(uniq))
    for u in uniq:
        print(" ", u)

    # index vs analytics: are they the same page duplicated in ROOT?
    a = (ADMIN / "index.html").read_bytes()
    b = (ADMIN / "dashboards-analytics.html").read_bytes()
    print("\nroot index == dashboards-analytics?", a == b)
    print("sizes", len(a), len(b))

    # any exact duplicate pairs inside ROOT only?
    root = list(ADMIN.glob("*.html"))
    by_hash: dict[int, list[str]] = {}
    for p in root:
        by_hash.setdefault(p.stat().st_size, []).append(p.name)
    print("\nSame-size pairs in ROOT (possible clones):")
    for sz, names in sorted(by_hash.items()):
        if len(names) > 1:
            # verify exact
            groups = {}
            for n in names:
                data = (ADMIN / n).read_bytes()
                groups.setdefault(hash(data), []).append(n)
            for files in groups.values():
                if len(files) > 1:
                    print("  EXACT DUP:", files)


if __name__ == "__main__":
    main()
