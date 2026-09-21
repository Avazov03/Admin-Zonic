# -*- coding: utf-8 -*-
"""Build clean server deploy folder + zip (no HTTrack junk / helper scripts)."""
from __future__ import annotations

import pathlib
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "deploy" / "zon-admin-deploy"
ZIP = ROOT / "deploy" / "zon-admin-deploy.zip"

SKIP_DIR_NAMES = {
    "hts-cache",
    "demos.themeselection.com",
    "node_modules",
    ".git",
    ".cursor",
    "deploy",
    "__pycache__",
}


def should_skip(path: pathlib.Path) -> bool:
    name = path.name
    if name in SKIP_DIR_NAMES:
        return True
    if name.startswith("_") and path.suffix in {
        ".py",
        ".js",
        ".json",
        ".txt",
        ".html",
        ".log",
    }:
        return True
    if name.endswith(".py") and name.startswith("_"):
        return True
    return False


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # root essentials
    for name in ["index.html", "DEPLOY.md", "nginx.example.conf", "web.config"]:
        src = ROOT / name
        if src.exists():
            shutil.copy2(src, OUT / name)

    # admin tree (full)
    dest_admin = OUT / "admin"
    shutil.copytree(
        ROOT / "admin",
        dest_admin,
        ignore=shutil.ignore_patterns(
            "*.map",
            ".DS_Store",
            "Thumbs.db",
        ),
    )

    # zip
    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in OUT.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(OUT).as_posix())

    files = sum(1 for _ in OUT.rglob("*") if _.is_file())
    size_mb = ZIP.stat().st_size / (1024 * 1024)
    print(f"OUT: {OUT}")
    print(f"ZIP: {ZIP} ({size_mb:.1f} MB)")
    print(f"files: {files}")
    print("html root", len(list((OUT / "admin").glob("*.html"))))


if __name__ == "__main__":
    main()
