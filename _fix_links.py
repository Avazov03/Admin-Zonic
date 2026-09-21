# -*- coding: utf-8 -*-
"""Fix broken relative links and navbar shortcuts without touching page content."""
from __future__ import annotations

import pathlib
import re

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"

SHORTCUT_MAP = {
    "shortcuts.calendar": "app-calendar.html",
    "shortcuts.invoice": "app-invoice-list.html",
    "shortcuts.user": "app-user-list.html",
    "shortcuts.role": "app-access-roles.html",
    "shortcuts.dashboard": "index.html",
    "shortcuts.setting": "pages-account-settings-account.html",
    "shortcuts.faqs": "pages-faq.html",
    "shortcuts.modals": "modal-examples.html",
}

USER_MAP = {
    "user.profile": "pages-profile-user.html",
    "user.settings": "pages-account-settings-account.html",
    "user.pricing": "pages-pricing.html",
    "user.faq": "pages-faq.html",
    "user.logout": "auth-login-basic.html",
}


def fix_text(t: str, is_subdir: bool = False) -> str:
    # Front pages / horizontal paths for root admin pages
    if not is_subdir:
        t = t.replace('href="../front-pages/', 'href="front-pages/')
        t = t.replace("href='../front-pages/", "href='front-pages/")
        # horizontal may be absolute leftover or wrong
        t = re.sub(
            r'href="[^"]*horizontal-menu-template/?[^"]*"(\s+class="menu-link"[^>]*>[\s\S]{0,100}?data-i18n="Horizontal")',
            r'href="horizontal-menu-template/index.html"\1',
            t,
            count=2,
        )
        # If Horizontal still points elsewhere
        t = re.sub(
            r'(href=")[^"]*(" class="menu-link"[^>]*target="_blank"[^>]*>\s*<div data-i18n="Horizontal">)',
            r"\1horizontal-menu-template/index.html\2",
            t,
        )
        t = re.sub(
            r'(href=")[^"]*(" class="menu-link" target="_blank">\s*<div data-i18n="Horizontal">)',
            r"\1horizontal-menu-template/index.html\2",
            t,
        )

        # Support / Documentation → local FAQ / pages (no external)
        t = re.sub(
            r'<a href="#" target="_blank" class="menu-link">\s*<i class="menu-icon icon-base bx bx-support"></i>\s*<div data-i18n="Support">Support</div>\s*</a>',
            '<a href="pages-faq.html" class="menu-link">\n          <i class="menu-icon icon-base bx bx-support"></i>\n          <div data-i18n="Support">Support</div>\n        </a>',
            t,
        )
        t = re.sub(
            r'<a href="#" target="_blank" class="menu-link">\s*<i class="menu-icon icon-base bx bx-file"></i>\s*<div data-i18n="Documentation">Documentation</div>\s*</a>',
            '<a href="pages-faq.html" class="menu-link">\n          <i class="menu-icon icon-base bx bx-file"></i>\n          <div data-i18n="Documentation">Documentation</div>\n        </a>',
            t,
        )

        for key, href in SHORTCUT_MAP.items():
            t = re.sub(
                rf'<a href="#" class="stretched-link" data-zon-i18n="{re.escape(key)}">',
                f'<a href="{href}" class="stretched-link" data-zon-i18n="{key}">',
                t,
            )

        for key, href in USER_MAP.items():
            # various dropdown formats
            t = re.sub(
                rf'(<a class="dropdown-item" href="#"[^>]*>[\s\S]{{0,120}}?data-zon-i18n="{re.escape(key)}")',
                lambda m, h=href: m.group(1).replace('href="#"', f'href="{h}"', 1),
                t,
            )
            t = re.sub(
                rf'(<a class="dropdown-item" href="#" target="_blank">[\s\S]{{0,120}}?data-zon-i18n="{re.escape(key)}")',
                lambda m, h=href: m.group(1).replace('href="#"', f'href="{h}"', 1),
                t,
            )
    else:
        # front-pages or horizontal: links back to ../ for vertical pages
        t = t.replace('href="../../vertical-menu-template/', 'href="../')
        t = t.replace('href="../vertical-menu-template/', 'href="../')
        t = re.sub(
            r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/([^"]+)"',
            r'href="../\1"',
            t,
        )
        t = re.sub(
            r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/front-pages/([^"]+)"',
            r'href="\1"',
            t,
        )

    return t


def main() -> None:
    n = 0
    for path in ADMIN.glob("*.html"):
        old = path.read_text(encoding="utf-8", errors="replace")
        new = fix_text(old, is_subdir=False)
        if new != old:
            path.write_text(new, encoding="utf-8")
            n += 1
            print("fixed", path.name)

    for sub in ("front-pages", "horizontal-menu-template"):
        d = ADMIN / sub
        if not d.exists():
            continue
        for path in d.glob("*.html"):
            old = path.read_text(encoding="utf-8", errors="replace")
            new = fix_text(old, is_subdir=True)
            if new != old:
                path.write_text(new, encoding="utf-8")
                n += 1
                print("fixed", sub + "/" + path.name)

    # Verify front-pages links on index
    idx = (ADMIN / "index.html").read_text(encoding="utf-8", errors="replace")
    print("sample front links:")
    for m in re.findall(r'href="[^"]*front-pages[^"]*"', idx)[:8]:
        print(" ", m)
    for m in re.findall(r'href="[^"]*horizontal[^"]*"', idx)[:5]:
        print(" ", m)
    sharp = idx.count('href="#"')
    print("remaining href=#", sharp)
    print("files updated", n)


if __name__ == "__main__":
    main()
