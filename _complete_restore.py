# -*- coding: utf-8 -*-
"""Complete restore: front-pages, remaining HTML, assets — full original-like Zon admin."""
from __future__ import annotations

import pathlib
import re
import ssl
import urllib.request
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent
ADMIN = ROOT / "admin"
VBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/"
FBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/front-pages/"
HBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/horizontal-menu-template/"
ASSET_BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"
CTX = ssl.create_default_context()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"

FRONT_PAGES = [
    "landing-page.html",
    "pricing-page.html",
    "payment-page.html",
    "checkout-page.html",
    "help-center-landing.html",
    "help-center-article.html",
]

# Extra vertical pages often linked
EXTRA_VERTICAL = [
    "cards-gamifications.html",
    "app-ecommerce-settings-detail.html",
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read()


def clean_html(text: str, folder_prefix: str = "") -> str:
    """Rewrite remote/demo paths to local flat or front-pages/ structure."""
    # absolute assets -> assets/
    text = re.sub(
        r"https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/(assets/[^\"'\s)]+)",
        r"\1",
        text,
    )
    # absolute vertical pages -> local
    text = re.sub(
        r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/([^"]+)"',
        r'href="\1"',
        text,
    )
    # absolute front-pages -> front-pages/
    text = re.sub(
        r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/front-pages/([^"]+)"',
        r'href="front-pages/\1"',
        text,
    )
    # absolute horizontal -> keep as front note: download index into horizontal-menu-template/
    text = re.sub(
        r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/horizontal-menu-template/?"',
        'href="horizontal-menu-template/index.html"',
        text,
    )
    text = re.sub(
        r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/horizontal-menu-template/([^"]+)"',
        r'href="horizontal-menu-template/\1"',
        text,
    )

    text = text.replace("../../assets/", "assets/")
    text = text.replace("../assets/", "assets/")
    # from front-pages/*.html assets are ../../../assets in original -> we flatten to ../assets
    if folder_prefix == "front-pages":
        text = text.replace('data-assets-path="../../assets/"', 'data-assets-path="../assets/"')
        text = text.replace('data-assets-path="../assets/"', 'data-assets-path="../assets/"')
        # script/link hrefs that became assets/ should be ../assets/
        text = re.sub(r'(href|src)="assets/', r'\1="../assets/', text)
        text = text.replace('href="css/', 'href="../css/')
        text = text.replace('src="js/', 'src="../js/')
    elif folder_prefix == "horizontal-menu-template":
        text = text.replace('data-assets-path="../../assets/"', 'data-assets-path="../assets/"')
        text = re.sub(r'(href|src)="assets/', r'\1="../assets/', text)
        text = text.replace('href="css/', 'href="../css/')
        text = text.replace('src="js/', 'src="../js/')
    else:
        text = text.replace('data-assets-path="../../assets/"', 'data-assets-path="assets/"')

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
    text = re.sub(r"\s*<!-- Mirrored from .*? -->\s*", "\n", text)
    text = re.sub(r'https?://(?:www\.)?themeselection\.com[^"\'\s<>]*', "#", text)
    # leftover demos absolute (docs etc) -> #
    text = re.sub(
        r'https?://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/documentation/?[^"\'\s<>]*',
        "#",
        text,
    )
    text = re.sub(r"https?://demos\.themeselection\.com[^\"'\s<>]*", "#", text)
    text = text.replace(
        '<script src="assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    text = text.replace(
        '<script src="../assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    text = text.replace("assets//", "assets/")

    text = re.sub(
        r"<footer class=\"content-footer footer bg-footer-theme\">[\s\S]*?</footer>",
        """<footer class="content-footer footer bg-footer-theme">
  <div class="container-xxl">
    <div class="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
      <div class="mb-2 mb-md-0"><span data-zon-i18n="footer.rights">© {year} Zon Admin — All rights reserved</span></div>
      <div class="d-none d-lg-inline-block text-muted small" data-zon-i18n="footer.api">Backend API ready</div>
    </div>
  </div>
</footer>""",
        text,
        count=1,
    )

    lang = """
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
    text = re.sub(
        r'<li class="nav-item dropdown-language dropdown[\s\S]*?</li>\s*<!--/?\s*Language\s*-->',
        lang + "      <!--/ Language -->",
        text,
        count=1,
    )

    # inject zon scripts
    js_prefix = "../js/" if folder_prefix else "js/"
    css_prefix = "../css/" if folder_prefix else "css/"
    if "zon-i18n.js" not in text and "</body>" in text:
        text = text.replace(
            "</body>",
            f'    <link rel="stylesheet" href="{css_prefix}zon-admin.css" />\n'
            f'    <script src="{js_prefix}zon-i18n.js"></script>\n'
            f'    <script src="{js_prefix}app-config.js"></script>\n'
            f'    <script src="{js_prefix}api.js"></script>\n</body>',
            1,
        )
    return text


def save_page(url: str, dest: pathlib.Path, folder_prefix: str = "") -> bool:
    try:
        raw = fetch(url).decode("utf-8", errors="replace")
        text = clean_html(raw, folder_prefix=folder_prefix)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text, encoding="utf-8")
        print("OK", dest.relative_to(ADMIN))
        return True
    except Exception as e:
        print("FAIL", dest.name, e)
        return False


def find_missing_local() -> set[str]:
    have = {p.name for p in ADMIN.glob("*.html")}
    missing = set()
    for html in ADMIN.glob("*.html"):
        t = html.read_text(encoding="utf-8", errors="replace")
        for href in re.findall(r'href="([^"]+)"', t):
            if any(
                href.startswith(p)
                for p in ("http", "javascript", "#", "mailto", "front-pages/", "horizontal-menu")
            ):
                continue
            name = href.split("?")[0].split("#")[0]
            if name.endswith(".html") and "/" not in name and name not in have:
                missing.add(name)
    return missing


def rewrite_menu_front_links() -> None:
    """Ensure front-pages and horizontal links in ALL admin html point to local paths."""
    for html in list(ADMIN.glob("*.html")) + list((ADMIN / "front-pages").glob("*.html") if (ADMIN / "front-pages").exists() else []):
        t = html.read_text(encoding="utf-8", errors="replace")
        t2 = t
        # if still # for known front pages from earlier cleanup, restore from original menu text patterns
        # Map common front page menu items that became #
        replacements = [
            (
                'href="#" class="menu-link" target="_blank">\n              <div data-i18n="Landing">Landing</div>',
                'href="front-pages/landing-page.html" class="menu-link" target="_blank">\n              <div data-i18n="Landing">Landing</div>',
            ),
        ]
        # Broader: find menu Front Pages section links that are #
        # Use data-i18n Landing etc near href="#"
        t2 = re.sub(
            r'href="#"( class="menu-link"[^>]*>\s*<div data-i18n="Landing">)',
            r'href="front-pages/landing-page.html"\1',
            t2,
        )
        t2 = re.sub(
            r'href="#"( class="menu-link"[^>]*>\s*<div data-i18n="Pricing">)',
            r'href="front-pages/pricing-page.html"\1',
            t2,
        )
        t2 = re.sub(
            r'href="#"( class="menu-link"[^>]*>\s*<div data-i18n="Payment">)',
            r'href="front-pages/payment-page.html"\1',
            t2,
        )
        t2 = re.sub(
            r'href="#"( class="menu-link"[^>]*>\s*<div data-i18n="Checkout">)',
            r'href="front-pages/checkout-page.html"\1',
            t2,
        )
        t2 = re.sub(
            r'href="#"( class="menu-link"[^>]*>\s*<div data-i18n="Help Center">)',
            r'href="front-pages/help-center-landing.html"\1',
            t2,
        )
        t2 = re.sub(
            r'href="#"( class="menu-link"[^>]*target="_blank"[^>]*>\s*<div data-i18n="Horizontal">)',
            r'href="horizontal-menu-template/index.html"\1',
            t2,
        )
        # without target order variants
        t2 = re.sub(
            r'(<div data-i18n="Horizontal"></div>)',
            r"\1",
            t2,
        )
        # Horizontal link more flexible
        t2 = re.sub(
            r'href="[^"]*"( class="menu-link"[^>]*>[\s\S]{0,80}?<div data-i18n="Horizontal">)',
            r'href="horizontal-menu-template/index.html"\1',
            t2,
            count=3,
        )
        if t2 != t:
            html.write_text(t2, encoding="utf-8")
            print("links fixed", html.name)


def download_assets() -> None:
    paths = set()
    roots = [ADMIN] + ([ADMIN / "front-pages"] if (ADMIN / "front-pages").exists() else [])
    roots += (
        [ADMIN / "horizontal-menu-template"]
        if (ADMIN / "horizontal-menu-template").exists()
        else []
    )
    for root in roots:
        for html in root.glob("*.html"):
            t = html.read_text(encoding="utf-8", errors="replace")
            for m in re.findall(r'(?:src|href)="(\.\./)?(assets/[^"#?]+)"', t):
                paths.add(m[1])
    js_dir = ADMIN / "assets" / "js"
    if js_dir.exists():
        for js in js_dir.glob("*.js"):
            t = js.read_text(encoding="utf-8", errors="replace")
            for m in re.findall(r'assetsPath\+"([^"]+\.json)"', t):
                paths.add("assets/" + m)
    print("asset refs", len(paths))
    ok = fail = skip = 0
    for rel in sorted(paths):
        if "{{" in rel:
            continue
        rel = rel.replace("assets//", "assets/")
        dest = ADMIN / pathlib.Path(*rel.split("/"))
        if dest.exists() and dest.stat().st_size > 0:
            skip += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            dest.write_bytes(fetch(ASSET_BASE + rel))
            ok += 1
            if ok <= 20 or ok % 30 == 0:
                print(" asset", rel)
        except Exception as e:
            fail += 1
            print(" FAIL", rel, e)
    print("assets ok", ok, "fail", fail, "skip", skip)


def main() -> None:
    ADMIN.mkdir(exist_ok=True)

    # 1) Front pages
    for name in FRONT_PAGES:
        save_page(FBASE + name, ADMIN / "front-pages" / name, folder_prefix="front-pages")

    # 2) Horizontal menu index (entry)
    save_page(
        HBASE + "index.html",
        ADMIN / "horizontal-menu-template" / "index.html",
        folder_prefix="horizontal-menu-template",
    )

    # 3) Missing vertical pages referenced by menu
    missing = find_missing_local()
    print("missing before", len(missing), sorted(list(missing))[:30])
    for name in sorted(missing | set(EXTRA_VERTICAL)):
        if (ADMIN / name).exists() and (ADMIN / name).stat().st_size > 1000:
            continue
        save_page(VBASE + name, ADMIN / name, folder_prefix="")

    # 4) Fix front/horizontal links in menus
    rewrite_menu_front_links()

    # Also fix href="#" that cleaned badly for front pages - scan index for Front Pages section
    # Re-fetch menu from remote and re-apply clean menu if needed
    try:
        raw = fetch(VBASE + "index.html").decode("utf-8", errors="replace")
        cleaned = clean_html(raw, "")
        start = cleaned.find('<ul class="menu-inner py-1">')
        if start >= 0:
            i, depth, end = start, 0, None
            while i < len(cleaned):
                if cleaned.startswith("<ul", i):
                    depth += 1
                    i = cleaned.find(">", i) + 1
                    continue
                if cleaned.startswith("</ul>", i):
                    depth -= 1
                    i += 5
                    if depth == 0:
                        end = i
                        break
                    continue
                i += 1
            if end:
                menu = cleaned[start:end]
                # ensure front-pages local
                menu = re.sub(
                    r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/front-pages/([^"]+)"',
                    r'href="front-pages/\1"',
                    menu,
                )
                menu = menu.replace(">Sneat<", ">Zon<")
                for path in ADMIN.glob("*.html"):
                    html = path.read_text(encoding="utf-8", errors="replace")
                    s = html.find('<ul class="menu-inner py-1">')
                    if s < 0:
                        continue
                    j, d, e = s, 0, None
                    while j < len(html):
                        if html.startswith("<ul", j):
                            d += 1
                            j = html.find(">", j) + 1
                            continue
                        if html.startswith("</ul>", j):
                            d -= 1
                            j += 5
                            if d == 0:
                                e = j
                                break
                            continue
                        j += 1
                    if e:
                        path.write_text(html[:s] + menu + html[e:], encoding="utf-8")
                print("full menu reapplied to all root html")
    except Exception as e:
        print("menu reapply fail", e)

    rewrite_menu_front_links()
    download_assets()

    missing2 = find_missing_local()
    print("missing after", len(missing2), sorted(missing2))
    print("total root html", len(list(ADMIN.glob("*.html"))))
    print(
        "front-pages",
        len(list((ADMIN / "front-pages").glob("*.html")))
        if (ADMIN / "front-pages").exists()
        else 0,
    )


if __name__ == "__main__":
    main()
