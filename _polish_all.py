# -*- coding: utf-8 -*-
"""Polish pass: ensure Zon scripts/CSS, language switcher, brand on all pages."""
from __future__ import annotations

import pathlib
import re

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"

LANG_BLOCK = """
      <li class="nav-item dropdown-language dropdown me-2 me-xl-0">
        <a class="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown" aria-label="Language">
          <i class="icon-base bx bx-globe icon-md"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="javascript:void(0);" data-language="uz" data-text-direction="ltr"><span data-zon-i18n="lang.uz">Oʻzbekcha</span></a></li>
          <li><a class="dropdown-item" href="javascript:void(0);" data-language="ru" data-text-direction="ltr"><span data-zon-i18n="lang.ru">Русский</span></a></li>
          <li><a class="dropdown-item" href="javascript:void(0);" data-language="en" data-text-direction="ltr"><span data-zon-i18n="lang.en">English</span></a></li>
        </ul>
      </li>
"""


def inject_scripts(text: str, prefix: str) -> str:
    if "zon-i18n.js" in text:
        return text
    if "</body>" not in text:
        return text
    block = (
        f'    <link rel="stylesheet" href="{prefix}css/zon-admin.css" />\n'
        f'    <script src="{prefix}js/zon-i18n.js"></script>\n'
        f'    <script src="{prefix}js/app-config.js"></script>\n'
        f'    <script src="{prefix}js/api.js"></script>\n'
    )
    return text.replace("</body>", block + "</body>", 1)


def ensure_lang(text: str) -> str:
    if 'data-language="uz"' in text:
        return text
    # insert before Search or Notification in navbar if possible
    m = re.search(
        r'(<!-- Search -->|<!-- Style Switcher -->|<!-- Notification -->|<li class="nav-item navbar-dropdown dropdown-user)',
        text,
    )
    if not m:
        return text
    return text[: m.start()] + LANG_BLOCK + "\n      " + text[m.start() :]


def polish(text: str, prefix: str) -> str:
    text = text.replace(">Sneat</span>", ">Zon</span>")
    text = text.replace(">Sneat<", ">Zon<")
    text = text.replace("Sneat - ", "Zon - ")
    text = re.sub(
        r"<title>\s*Sneat\b",
        "<title>Zon",
        text,
        count=1,
        flags=re.I,
    )
    text = re.sub(
        r'(class="app-brand-text[^"]*">)\s*Sneat\s*',
        r"\1Zon",
        text,
    )
    # remove buy-now / customizer leftovers
    text = re.sub(r'\s*<div class="buy-now">[\s\S]*?</div>\s*', "\n", text)
    text = text.replace(
        f'<script src="{prefix}assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    text = text.replace(
        '<script src="assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    text = text.replace(
        '<script src="../assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    text = ensure_lang(text)
    text = inject_scripts(text, prefix)
    return text


def main() -> None:
    stats = {"root": 0, "front": 0, "horiz": 0}
    for path in ADMIN.glob("*.html"):
        old = path.read_text(encoding="utf-8", errors="replace")
        new = polish(old, "")
        if new != old:
            path.write_text(new, encoding="utf-8")
            stats["root"] += 1

    for path in (ADMIN / "front-pages").glob("*.html"):
        old = path.read_text(encoding="utf-8", errors="replace")
        new = polish(old, "../")
        # front brand in navbar
        new = new.replace(">Sneat<", ">Zon<")
        if new != old:
            path.write_text(new, encoding="utf-8")
            stats["front"] += 1

    for path in (ADMIN / "horizontal-menu-template").glob("*.html"):
        old = path.read_text(encoding="utf-8", errors="replace")
        new = polish(old, "../")
        if new != old:
            path.write_text(new, encoding="utf-8")
            stats["horiz"] += 1

    # quick health
    idx = (ADMIN / "index.html").read_text(encoding="utf-8", errors="replace")
    print("updated", stats)
    print("index has zon-i18n", "zon-i18n.js" in idx)
    print("index has lang uz", 'data-language="uz"' in idx)
    print("index Sneat leftovers", idx.count("Sneat"))
    print(
        "counts",
        len(list(ADMIN.glob("*.html"))),
        len(list((ADMIN / "front-pages").glob("*.html"))),
        len(list((ADMIN / "horizontal-menu-template").glob("*.html"))),
    )


if __name__ == "__main__":
    main()
