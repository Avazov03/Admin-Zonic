# -*- coding: utf-8 -*-
from pathlib import Path

ADMIN = Path(__file__).resolve().parent / "admin"
src = (ADMIN / "app-user-list.html").read_text(encoding="utf-8", errors="replace")

pages = {
    "app-zon-badges.html": ("zon-badges.js", "Yutuqlar"),
    "app-zon-events.html": ("zon-events.js", "Musobaqalar"),
    "app-zon-market.html": ("zon-market.js", "Market"),
    "app-zon-news.html": ("zon-news.js", "Yangiliklar"),
    "app-zon-push.html": ("zon-push.js", "Push"),
}

for name, (js, title) in pages.items():
    t = src
    t = t.replace("zon-users.js", js)
    if "zon-ui.js" not in t:
        t = t.replace(
            f'<script src="js/{js}"></script>',
            f'<script src="js/zon-ui.js"></script>\n    <script src="js/{js}"></script>',
        )
    # title meta
    t = t.replace("<title>Demo: User List", f"<title>{title}")
    t = t.replace("User List - Apps", f"{title} - Zonic Admin")
    # ensure brand in comments
    (ADMIN / name).write_text(t, encoding="utf-8")
    print("wrote", name)

# also add zon-ui to users page
users = (ADMIN / "app-user-list.html").read_text(encoding="utf-8", errors="replace")
if "zon-ui.js" not in users:
    users = users.replace(
        '<script src="js/zon-users.js"></script>',
        '<script src="js/zon-ui.js"></script>\n    <script src="js/zon-users.js"></script>',
    )
    (ADMIN / "app-user-list.html").write_text(users, encoding="utf-8")
    print("patched users")

# update shell WORK menu
shell = (ADMIN / "js" / "zon-shell.js").read_text(encoding="utf-8")
new_work = """  var WORK = [
    { href: "index.html", icon: "bx-home-smile", label: "Boshqaruv" },
    { href: "app-user-list.html", icon: "bx-user", label: "Foydalanuvchilar" },
    { href: "app-zon-badges.html", icon: "bx-trophy", label: "Yutuqlar" },
    { href: "app-zon-events.html", icon: "bx-calendar-event", label: "Musobaqalar" },
    { href: "app-zon-market.html", icon: "bx-store", label: "Market" },
    { href: "app-zon-news.html", icon: "bx-news", label: "Yangiliklar" },
    { href: "app-zon-push.html", icon: "bx-bell", label: "Push" },
  ];"""
import re

shell2 = re.sub(r"  var WORK = \[[\s\S]*?\];", new_work, shell, count=1)
(ADMIN / "js" / "zon-shell.js").write_text(shell2, encoding="utf-8")
print("shell updated")
