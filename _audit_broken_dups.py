# -*- coding: utf-8 -*-
"""Audit broken links, missing assets, and duplicate pages."""
from __future__ import annotations

import pathlib
import re
from collections import defaultdict

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"


def normalize(href: str) -> str | None:
    if not href or href.startswith(
        ("http://", "https://", "javascript:", "mailto:", "data:", "#")
    ):
        return None
    href = href.split("?")[0].split("#")[0].strip()
    if not href or href.endswith("/"):
        return None
    return href.replace("\\", "/")


def resolve(base: pathlib.Path, rel: str) -> pathlib.Path:
    # base is html file path
    return (base.parent / rel).resolve()


def main() -> None:
    html_files = (
        list(ADMIN.glob("*.html"))
        + list((ADMIN / "front-pages").glob("*.html"))
        + list((ADMIN / "horizontal-menu-template").glob("*.html"))
    )

    # --- duplicate filenames across folders ---
    by_name: dict[str, list[str]] = defaultdict(list)
    for p in html_files:
        by_name[p.name].append(str(p.relative_to(ADMIN)).replace("\\", "/"))

    print("=== DUPLICATE FILENAMES (same name in multiple folders) ===")
    dups = {k: v for k, v in by_name.items() if len(v) > 1}
    print(f"count: {len(dups)}")
    # Show only "basic" / dashboard / index style
    basics = []
    for name, paths in sorted(dups.items()):
        if name in {
            "index.html",
            "dashboards-analytics.html",
            "dashboards-crm.html",
            "app-ecommerce-dashboard.html",
            "auth-login-basic.html",
            "pages-faq.html",
        } or name.startswith("layouts-") or name.startswith("dashboards-"):
            basics.append((name, paths))
    print("basic/dashboard duplicates (expected: vertical + horizontal):")
    for name, paths in basics[:30]:
        print(f"  {name}:")
        for p in paths:
            print(f"    - {p}")

    # Root-only duplicate content check: same title appearing twice? 
    # Check if root has both index.html and dashboards-analytics as near-dupes
    print("\n=== ROOT ENTRY POINTS ===")
    for name in [
        "index.html",
        "dashboards-analytics.html",
        "dashboards-crm.html",
        "app-ecommerce-dashboard.html",
        "app-logistics-dashboard.html",
        "app-academy-dashboard.html",
    ]:
        p = ADMIN / name
        if p.exists():
            t = p.read_text(encoding="utf-8", errors="replace")
            title = re.search(r"<title>([^<]+)</title>", t)
            size = p.stat().st_size
            print(f"  {name}: size={size} title={(title.group(1).strip() if title else '?')[:60]}")
        else:
            print(f"  {name}: MISSING")

    # Compare index vs dashboards-analytics similarity
    if (ADMIN / "index.html").exists() and (ADMIN / "dashboards-analytics.html").exists():
        a = (ADMIN / "index.html").read_text(encoding="utf-8", errors="replace")
        b = (ADMIN / "dashboards-analytics.html").read_text(encoding="utf-8", errors="replace")
        # strip menu for comparison of main content?
        same_len = abs(len(a) - len(b)) < 500
        # check if nearly identical
        ratio = len(a) / max(len(b), 1)
        print(f"\nindex vs dashboards-analytics size ratio: {ratio:.3f} (diff bytes {abs(len(a)-len(b))})")
        # content marker
        for label, t in [("index", a), ("analytics", b)]:
            has_chart = "totalRevenueChart" in t or "Total Revenue" in t or "dashboards-analytics" in t
            print(f"  {label}: analytics markers={has_chart}")

    # --- broken links ---
    missing_html = set()
    missing_assets = set()
    checked_assets = set()
    ok_html = 0
    broken_samples = []

    for html in html_files:
        text = html.read_text(encoding="utf-8", errors="replace")
        refs = re.findall(r'(?:href|src)=["\']([^"\']+)["\']', text)
        for ref in refs:
            rel = normalize(ref)
            if not rel:
                continue
            target = resolve(html, rel)
            try:
                # stay under admin roughly
                target.relative_to(ADMIN.resolve())
            except ValueError:
                # outside admin - check exists
                if not target.exists():
                    missing_html.add(f"{html.name} -> {rel}")
                continue
            if not target.exists():
                if rel.endswith(".html") or "/html" in rel:
                    missing_html.add(rel)
                    if len(broken_samples) < 40:
                        broken_samples.append(f"{html.relative_to(ADMIN)} -> {rel}")
                elif rel.startswith("assets/") or "/assets/" in rel or rel.endswith(
                    (".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".woff", ".woff2", ".json", ".gif", ".webp")
                ):
                    # normalize to assets path
                    key = rel
                    if key.startswith("../"):
                        key = key[3:]
                    if key not in checked_assets:
                        checked_assets.add(key)
                        missing_assets.add(key)
                        if len(broken_samples) < 80:
                            broken_samples.append(f"{html.relative_to(ADMIN)} -> {rel}")
                else:
                    missing_html.add(rel)
            else:
                if rel.endswith(".html"):
                    ok_html += 1

    print("\n=== BROKEN HTML LINKS (unique targets) ===")
    mh = sorted(missing_html)
    print(f"count: {len(mh)}")
    for x in mh[:40]:
        print(" ", x)
    if len(mh) > 40:
        print(f"  ... +{len(mh)-40} more")

    print("\n=== MISSING ASSETS (unique) ===")
    ma = sorted(missing_assets)
    print(f"count: {len(ma)}")
    for x in ma[:40]:
        print(" ", x)
    if len(ma) > 40:
        print(f"  ... +{len(ma)-40} more")

    # empty / tiny html
    print("\n=== SUSPICIOUS SMALL HTML (<2KB) ===")
    small = []
    for p in html_files:
        if p.stat().st_size < 2000:
            small.append((p.relative_to(ADMIN).as_posix(), p.stat().st_size))
    print(f"count: {len(small)}")
    for name, sz in small[:20]:
        print(f"  {name} ({sz} bytes)")

    # root vs horizontal: is this intentional duplicate?
    print("\n=== SUMMARY ===")
    print(f"root html: {len(list(ADMIN.glob('*.html')))}")
    print(f"front-pages: {len(list((ADMIN/'front-pages').glob('*.html')))}")
    print(f"horizontal: {len(list((ADMIN/'horizontal-menu-template').glob('*.html')))}")
    print(f"duplicate filenames across folders: {len(dups)}")
    print(f"broken html link targets: {len(mh)}")
    print(f"missing assets: {len(ma)}")
    print(f"tiny html files: {len(small)}")
    print(
        "NOTE: root + horizontal same filenames = 2 layout variants (normal for Sneat), not accidental copies of one page."
    )


if __name__ == "__main__":
    main()
