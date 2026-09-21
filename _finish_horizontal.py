# -*- coding: utf-8 -*-
from __future__ import annotations

import pathlib
import re
import ssl
import urllib.request

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"
ASSET_BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"
HBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/horizontal-menu-template/"
VBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/"
CTX = ssl.create_default_context()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read()


def clean_horizontal(text: str) -> str:
    text = re.sub(
        r"https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/(assets/[^\"'\s)]+)",
        r"../\1",
        text,
    )
    text = text.replace("../../assets/", "../assets/")
    text = text.replace("../assets/", "../assets/")
    text = re.sub(r'(href|src)="assets/', r'\1="../assets/', text)
    text = text.replace('data-assets-path="../../assets/"', 'data-assets-path="../assets/"')
    text = text.replace(">Sneat</span>", ">Zon</span>")
    text = text.replace(
        'class="app-brand-text demo menu-text fw-bold ms-2">Sneat',
        'class="app-brand-text demo menu-text fw-bold ms-2">Zon',
    )
    text = re.sub(r'\s*<div class="buy-now">[\s\S]*?</div>\s*', "\n", text)
    text = re.sub(
        r"<!-- \? PROD Only: Google Tag Manager[\s\S]*?<!-- End Google Tag Manager -->\s*",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"<!-- \?PROD Only: Google Tag Manager \(noscript\)[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\s*",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r'<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument[\s\S]*?cloudflareinsights\.com/[^"]+"[^>]*></script>',
        "",
        text,
        count=1,
    )
    text = re.sub(r'https?://(?:www\.)?themeselection\.com[^"\'\s<>]*', "#", text)
    text = re.sub(r"https?://demos\.themeselection\.com[^\"'\s<>]*", "#", text)
    text = text.replace(
        '<script src="../assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    # local page links stay as filename.html inside horizontal folder
    if "zon-i18n.js" not in text and "</body>" in text:
        text = text.replace(
            "</body>",
            '    <link rel="stylesheet" href="../css/zon-admin.css" />\n'
            '    <script src="../js/zon-i18n.js"></script>\n'
            '    <script src="../js/app-config.js"></script>\n'
            '    <script src="../js/api.js"></script>\n</body>',
            1,
        )
    return text


def main() -> None:
    # Ensure front page CSS/JS
    for rel in [
        "assets/vendor/css/pages/front-page.css",
        "assets/vendor/css/pages/front-page-landing.css",
        "assets/vendor/css/pages/front-page-pricing.css",
        "assets/vendor/css/pages/front-page-payment.css",
        "assets/vendor/css/pages/front-page-help-center.css",
        "assets/js/front-main.js",
        "assets/js/front-page-landing.js",
        "assets/js/front-page-pricing.js",
        "assets/js/front-page-payment.js",
        "assets/js/front-page-help-center.js",
    ]:
        dest = ADMIN / pathlib.Path(*rel.split("/"))
        if dest.exists() and dest.stat().st_size > 0:
            print("have", rel)
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            dest.write_bytes(fetch(ASSET_BASE + rel))
            print("got", rel)
        except Exception as e:
            print("fail", rel, e)

    # Download ALL horizontal pages linked from remote index
    raw = fetch(HBASE + "index.html").decode("utf-8", "replace")
    names = sorted(
        {
            p.split("/")[-1]
            for p in re.findall(r'href="([^"#?]+\.html)"', raw)
            if p.endswith(".html") and "front-pages" not in p and "http" not in p
        }
    )
    print("horizontal pages to fetch", len(names))
    ok = fail = skip = 0
    out = ADMIN / "horizontal-menu-template"
    out.mkdir(parents=True, exist_ok=True)
    for name in names + ["index.html"]:
        dest = out / name
        if dest.exists() and dest.stat().st_size > 2000 and name != "index.html":
            # refresh index always? keep existing large files
            skip += 1
            continue
        try:
            text = clean_horizontal(fetch(HBASE + name).decode("utf-8", "replace"))
            dest.write_text(text, encoding="utf-8")
            ok += 1
            if ok <= 15 or ok % 25 == 0:
                print("OK", name)
        except Exception as e:
            fail += 1
            print("FAIL", name, e)
    print("horizontal ok", ok, "fail", fail, "skip", skip)

    # Download remaining assets referenced by horizontal + front
    paths = set()
    for root in [ADMIN / "front-pages", ADMIN / "horizontal-menu-template"]:
        if not root.exists():
            continue
        for html in root.glob("*.html"):
            t = html.read_text(encoding="utf-8", errors="replace")
            for m in re.findall(r'(?:src|href)="(?:\.\./)?(assets/[^"#?]+)"', t):
                paths.add(m)
    aok = afail = askip = 0
    for rel in sorted(paths):
        if "{{" in rel:
            continue
        dest = ADMIN / pathlib.Path(*rel.split("/"))
        if dest.exists() and dest.stat().st_size > 0:
            askip += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            dest.write_bytes(fetch(ASSET_BASE + rel))
            aok += 1
            print("asset", rel)
        except Exception as e:
            afail += 1
            print("asset fail", rel, e)
    print("extra assets ok", aok, "fail", afail, "skip", askip)

    # Fix remaining user dropdown # on billing/team items
    for path in ADMIN.glob("*.html"):
        t = path.read_text(encoding="utf-8", errors="replace")
        t2 = t
        t2 = re.sub(
            r'(<a class="dropdown-item" href="#"[^>]*>[\s\S]{0,80}?bx-user[\s\S]{0,80}?</a>)',
            lambda m: m.group(1).replace('href="#"', 'href="pages-profile-user.html"', 1),
            t2,
            count=1,
        )
        # billing dollar already mapped; fix Team / Billing unlabeled
        t2 = re.sub(
            r'(<a class="dropdown-item" href="#"[^>]*>\s*<span class="d-flex align-items-center[\s\S]{0,200}?Billing)',
            lambda m: m.group(1).replace('href="#"', 'href="pages-account-settings-billing.html"', 1),
            t2,
            count=1,
        )
        t2 = re.sub(
            r'(<a class="dropdown-item" href="#"[^>]*>[\s\S]{0,120}?bx-credit-card[\s\S]{0,80}?</a>)',
            lambda m: m.group(1).replace('href="#"', 'href="pages-account-settings-billing.html"', 1),
            t2,
            count=1,
        )
        if t2 != t:
            path.write_text(t2, encoding="utf-8")

    print(
        "horizontal html count",
        len(list((ADMIN / "horizontal-menu-template").glob("*.html"))),
    )
    print("front html count", len(list((ADMIN / "front-pages").glob("*.html"))))
    print("root html count", len(list(ADMIN.glob("*.html"))))


if __name__ == "__main__":
    main()
