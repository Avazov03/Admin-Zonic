# -*- coding: utf-8 -*-
from pathlib import Path
import re

ADMIN = Path(__file__).resolve().parent / "admin"
src = (ADMIN / "app-user-list.html").read_text(encoding="utf-8", errors="replace")

LEAFLET_CSS = '    <link rel="stylesheet" href="assets/vendor/libs/leaflet/leaflet.css" />\n'
LEAFLET_JS = '    <script src="assets/vendor/libs/leaflet/leaflet.js"></script>\n'


def with_leaflet(html: str, page_js: str, title: str) -> str:
    t = html
    t = t.replace("zon-users.js", page_js)
    if "zon-ui.js" not in t:
        t = t.replace(
            f'<script src="js/{page_js}"></script>',
            f'<script src="js/zon-ui.js"></script>\n    <script src="js/{page_js}"></script>',
        )
    if "leaflet.css" not in t:
        # after core theme css block — insert before </head> vendor area: after zon css if any
        if "</head>" in t:
            t = t.replace("</head>", LEAFLET_CSS + "</head>", 1)
    if "leaflet.js" not in t:
        t = t.replace(
            f'<script src="js/{page_js}"></script>',
            LEAFLET_JS + f'    <script src="js/{page_js}"></script>',
            1,
        )
    t = re.sub(r"<title>[^<]*</title>", f"<title>{title}</title>", t, count=1)
    return t


(ADMIN / "app-zon-map.html").write_text(
    with_leaflet(src, "zon-map.js", "Hududlar xaritasi - Zonic Admin"), encoding="utf-8"
)
(ADMIN / "app-zon-user-runs.html").write_text(
    with_leaflet(src, "zon-user-runs.js", "Yugurishlar - Zonic Admin"), encoding="utf-8"
)
print("pages ok")

# menu
shell = (ADMIN / "js" / "zon-shell.js").read_text(encoding="utf-8")
new_work = """  var WORK = [
    { href: "index.html", icon: "bx-home-smile", label: "Boshqaruv" },
    { href: "app-user-list.html", icon: "bx-user", label: "Foydalanuvchilar" },
    { href: "app-zon-map.html", icon: "bx-map-alt", label: "Xarita" },
    { href: "app-zon-badges.html", icon: "bx-trophy", label: "Yutuqlar" },
    { href: "app-zon-events.html", icon: "bx-calendar-event", label: "Musobaqalar" },
    { href: "app-zon-market.html", icon: "bx-store", label: "Market" },
    { href: "app-zon-news.html", icon: "bx-news", label: "Yangiliklar" },
    { href: "app-zon-push.html", icon: "bx-bell", label: "Push" },
  ];"""
shell2 = re.sub(r"  var WORK = \[[\s\S]*?\];", new_work, shell, count=1)
# active highlight for user-runs under users
if "app-zon-map.html" not in shell2 or "bx-map-alt" not in shell2:
    (ADMIN / "js" / "zon-shell.js").write_text(shell2, encoding="utf-8")
else:
    (ADMIN / "js" / "zon-shell.js").write_text(shell2, encoding="utf-8")
print("shell ok")
