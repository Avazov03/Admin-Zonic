# -*- coding: utf-8 -*-
from __future__ import annotations

import pathlib
import re

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"


def main() -> None:
    n = 0
    for path in list(ADMIN.glob("*.html")) + list(
        (ADMIN / "horizontal-menu-template").glob("*.html")
    ):
        t = path.read_text(encoding="utf-8", errors="replace")
        t2 = t
        # header user card
        t2 = re.sub(
            r'(<a class="dropdown-item" href="#">\s*<div class="d-flex">)',
            r'<a class="dropdown-item" href="pages-profile-user.html">\n              <div class="d-flex">',
            t2,
            count=1,
        )
        # billing plan
        t2 = re.sub(
            r'(<a class="dropdown-item" href="#">\s*<span class="d-flex align-items-center align-middle">\s*<i class="flex-shrink-0 icon-base bx bx-credit-card)',
            r'<a class="dropdown-item" href="pages-account-settings-billing.html">\n              <span class="d-flex align-items-center align-middle">\n                <i class="flex-shrink-0 icon-base bx bx-credit-card',
            t2,
            count=1,
        )
        # horizontal: profile links need ../
        if "horizontal-menu-template" in str(path):
            t2 = t2.replace(
                'href="pages-profile-user.html"', 'href="../pages-profile-user.html"'
            )
            t2 = t2.replace(
                'href="pages-account-settings-billing.html"',
                'href="../pages-account-settings-billing.html"',
            )
            # front pages in horizontal menus often ../front-pages
            t2 = t2.replace('href="../front-pages/', 'href="../front-pages/')
            t2 = re.sub(
                r'href="\.\./\.\./front-pages/',
                'href="../front-pages/',
                t2,
            )
        if t2 != t:
            path.write_text(t2, encoding="utf-8")
            n += 1
    idx = (ADMIN / "index.html").read_text(encoding="utf-8", errors="replace")
    print("index href=# count", idx.count('href="#"'))
    print("updated", n)

    # quick integrity: menu hrefs that are .html must exist
    missing = set()
    have = {p.name for p in ADMIN.glob("*.html")}
    have_fp = {
        "front-pages/" + p.name for p in (ADMIN / "front-pages").glob("*.html")
    }
    have_h = {
        "horizontal-menu-template/" + p.name
        for p in (ADMIN / "horizontal-menu-template").glob("*.html")
    }
    allhave = have | have_fp | have_h
    for href in re.findall(r'href="([^"]+\.html)"', idx):
        if href.startswith("http") or href.startswith("javascript"):
            continue
        name = href.split("?")[0].split("#")[0]
        if name not in allhave and not (ADMIN / name).exists():
            missing.add(name)
    print("missing from index menu", sorted(missing))


if __name__ == "__main__":
    main()
