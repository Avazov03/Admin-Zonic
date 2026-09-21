# -*- coding: utf-8 -*-
from pathlib import Path

admin = Path(__file__).resolve().parent / "admin"
n = 0
for path in admin.glob("*.html"):
    text = path.read_text(encoding="utf-8", errors="replace")
    orig = text
    name = path.name
    if name == "index.html":
        text = text.replace('<script src="assets/js/dashboards-analytics.js"></script>', "")
        if "zon-dashboard.js" not in text:
            text = text.replace("</body>", '    <script src="js/zon-dashboard.js"></script>\n</body>', 1)
    if name == "app-user-list.html":
        text = text.replace('<script src="assets/js/app-user-list.js"></script>', "")
        if "zon-users.js" not in text:
            text = text.replace("</body>", '    <script src="js/zon-users.js"></script>\n</body>', 1)
    if name == "auth-login-basic.html":
        text = text.replace('<script src="assets/js/pages-auth.js"></script>', "")
        if "zon-login.js" not in text:
            text = text.replace("</body>", '    <script src="js/zon-login.js"></script>\n</body>', 1)
    if "zon-shell.js" not in text and "</body>" in text:
        extra = ""
        if "app-config.js" not in text:
            extra += '    <script src="js/app-config.js"></script>\n'
        if "js/api.js" not in text and "api.js" not in text:
            extra += '    <script src="js/api.js"></script>\n'
        if "zon-admin.css" not in text:
            extra += '    <link rel="stylesheet" href="css/zon-admin.css" />\n'
        extra += '    <script src="js/zon-shell.js"></script>\n'
        text = text.replace("</body>", extra + "</body>", 1)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        n += 1
print("updated", n)
