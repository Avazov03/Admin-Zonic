# -*- coding: utf-8 -*-
from pathlib import Path

admin = Path(__file__).resolve().parent / "admin"
src = (admin / "app-user-list.html").read_text(encoding="utf-8")
t = src.replace("zon-users.js", "zon-user-runs.js")
needle = '<script src="js/zon-user-runs.js"></script>'
if "zon-ui.js" not in t:
    t = t.replace(
        needle,
        '<script src="js/zon-ui.js"></script>\n    ' + needle,
    )
t = t.replace("<title>Demo: User List", "<title>Yugurishlar")
t = t.replace("User List - Apps", "Yugurishlar - Zonic Admin")
(admin / "app-zon-user-runs.html").write_text(t, encoding="utf-8")
print("wrote app-zon-user-runs.html")
