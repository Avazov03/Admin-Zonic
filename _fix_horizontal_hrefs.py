# -*- coding: utf-8 -*-
"""Restore horizontal page links to same-folder when page exists locally."""
from __future__ import annotations

import pathlib
import re

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"
H = ADMIN / "horizontal-menu-template"
have = {p.name for p in H.glob("*.html")}


def main() -> None:
    n = 0
    for path in H.glob("*.html"):
        t = path.read_text(encoding="utf-8", errors="replace")
        t2 = t

        def repl(m: re.Match) -> str:
            name = m.group(1)
            if name in have:
                return f'href="{name}"'
            # front-pages stay as ../front-pages/
            return m.group(0)

        t2 = re.sub(r'href="\.\./([A-Za-z0-9_-]+\.html)"', repl, t2)
        # ensure front-pages path correct
        t2 = t2.replace('href="../../front-pages/', 'href="../front-pages/')
        t2 = re.sub(
            r'href="front-pages/',
            'href="../front-pages/',
            t2,
        )
        if t2 != t:
            path.write_text(t2, encoding="utf-8")
            n += 1
    print("horizontal files fixed", n, "pages", len(have))


if __name__ == "__main__":
    main()
