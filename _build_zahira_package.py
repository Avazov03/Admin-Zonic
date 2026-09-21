# -*- coding: utf-8 -*-
"""Build Zahira Admin Panel package (copy + rebrand, no layout changes)."""
from __future__ import annotations

import pathlib
import re
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
SRC_ADMIN = ROOT / "admin"
OUT = ROOT / "deploy" / "Zahira-Admin-Panel"
ZIP = ROOT / "deploy" / "Zahira-Admin-Panel.zip"

# Visible brand only — do not touch CSS class names or file paths that break assets
REPLACEMENTS = [
    ("Zon Admin Panel", "Zahira Admin Panel"),
    ("Zon Admin —", "Zahira Admin Panel —"),
    ("Zon Admin -", "Zahira Admin Panel -"),
    ("Zon Admin", "Zahira Admin Panel"),
    ("Zon Team", "Zahira Team"),
    ("Project: Zon Add", "Project: Zahira Admin Panel"),
    (">Zon</span>", ">Zahira</span>"),
    ('content="Zon"', 'content="Zahira Admin Panel"'),
    ("Zonic API", "Zahira API"),
    ("Zon - Bootstrap", "Zahira - Bootstrap"),
    ("| Zon -", "| Zahira -"),
]


def rebrand_text(text: str) -> str:
    for a, b in REPLACEMENTS:
        text = text.replace(a, b)
    # titles still saying Demo: ... | Zon
    text = re.sub(
        r"(<title>[^<]*?)\bZon\b([^<]*</title>)",
        r"\1Zahira\2",
        text,
        flags=re.I,
    )
    # app-config appName
    text = text.replace('appName: "Zahira Admin Panel"', 'appName: "Zahira Admin Panel"')
    return text


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # root redirect
    (OUT / "index.html").write_text(
        """<!doctype html>
<html lang="uz">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=admin/" />
    <title>Zahira Admin Panel</title>
    <script>location.replace("admin/");</script>
  </head>
  <body>
    <p><a href="admin/">Zahira Admin Panel</a></p>
  </body>
</html>
""",
        encoding="utf-8",
    )

    shutil.copytree(
        SRC_ADMIN,
        OUT / "admin",
        ignore=shutil.ignore_patterns("*.map", ".DS_Store", "Thumbs.db"),
    )

    # rebrand text files
    exts = {".html", ".js", ".css", ".json", ".md", ".txt"}
    n = 0
    for path in (OUT / "admin").rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in exts:
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="strict")
        except Exception:
            try:
                raw = path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
        new = rebrand_text(raw)
        # config specifics
        if path.name == "app-config.js":
            new = re.sub(
                r'appName:\s*"[^"]*"',
                'appName: "Zahira Admin Panel"',
                new,
            )
            new = re.sub(
                r'author:\s*"[^"]*"',
                'author: "Zahira Team"',
                new,
            )
            new = new.replace("Zon Admin - global", "Zahira Admin Panel - global")
            new = new.replace("TOKEN_KEY: \"zon_admin_token\"", 'TOKEN_KEY: "zahira_admin_token"')
            new = new.replace(
                "REFRESH_TOKEN_KEY: \"zon_admin_refresh_token\"",
                'REFRESH_TOKEN_KEY: "zahira_admin_refresh_token"',
            )
        if new != raw:
            path.write_text(new, encoding="utf-8")
            n += 1

    readme = OUT / "OQISH.txt"
    readme.write_text(
        """Zahira Admin Panel
==================

Ochish:
  1) index.html ni brauzerda oching
     YOKI
  2) papkada: python -m http.server 8765
     keyin: http://127.0.0.1:8765/admin/

Dizayn (CSS/layout) o'zgartirilmagan — faqat nom/brend: Zahira Admin Panel.

API:
  admin/js/app-config.js ichida API_BASE_URL ni o'zgartiring.
""",
        encoding="utf-8",
    )

    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in OUT.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(OUT.parent).as_posix())

    # quick check
    idx = (OUT / "admin" / "index.html").read_text(encoding="utf-8", errors="replace")
    print("files branded", n)
    print("brand sample:", "Zahira" in idx, "Zon Admin" in idx)
    print("sidebar:", "Zahira</span>" in idx or ">Zahira<" in idx)
    print("ZIP:", ZIP, "MB=", round(ZIP.stat().st_size / 1024 / 1024, 1))
    print("OUT:", OUT)


if __name__ == "__main__":
    main()
