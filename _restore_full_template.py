# -*- coding: utf-8 -*-
"""Restore FULL Sneat vertical-menu pages + original-style menu (localized to Zon)."""
from __future__ import annotations

import pathlib
import re
import ssl
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
ADMIN = ROOT / "admin"
BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/"
ASSET_BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"
CTX = ssl.create_default_context()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"

# Full page list for vertical-menu-template (Sneat PRO demo)
PAGES = [
    # dashboards
    "index.html",
    "dashboards-analytics.html",
    "dashboards-crm.html",
    "app-ecommerce-dashboard.html",
    "app-logistics-dashboard.html",
    "app-academy-dashboard.html",
    # layouts
    "layouts-collapsed-menu.html",
    "layouts-content-navbar.html",
    "layouts-content-navbar-with-sidebar.html",
    "layouts-without-menu.html",
    "layouts-without-navbar.html",
    "layouts-fluid.html",
    "layouts-container.html",
    "layouts-blank.html",
    # apps
    "app-email.html",
    "app-chat.html",
    "app-calendar.html",
    "app-kanban.html",
    "app-ecommerce-dashboard.html",
    "app-ecommerce-product-list.html",
    "app-ecommerce-product-add.html",
    "app-ecommerce-category-list.html",
    "app-ecommerce-order-list.html",
    "app-ecommerce-order-details.html",
    "app-ecommerce-customer-all.html",
    "app-ecommerce-customer-details-overview.html",
    "app-ecommerce-customer-details-security.html",
    "app-ecommerce-customer-details-billing.html",
    "app-ecommerce-customer-details-notifications.html",
    "app-ecommerce-manage-reviews.html",
    "app-ecommerce-referral.html",
    "app-ecommerce-settings-detail.html",
    "app-ecommerce-settings-payments.html",
    "app-ecommerce-settings-checkout.html",
    "app-ecommerce-settings-shipping.html",
    "app-ecommerce-settings-locations.html",
    "app-ecommerce-settings-notifications.html",
    "app-academy-dashboard.html",
    "app-academy-course.html",
    "app-academy-course-details.html",
    "app-logistics-dashboard.html",
    "app-logistics-fleet.html",
    "app-invoice-list.html",
    "app-invoice-preview.html",
    "app-invoice-edit.html",
    "app-invoice-add.html",
    "app-user-list.html",
    "app-user-view-account.html",
    "app-user-view-security.html",
    "app-user-view-billing.html",
    "app-user-view-notifications.html",
    "app-user-view-connections.html",
    "app-access-roles.html",
    "app-access-permission.html",
    # pages
    "pages-profile-user.html",
    "pages-profile-teams.html",
    "pages-profile-projects.html",
    "pages-profile-connections.html",
    "pages-account-settings-account.html",
    "pages-account-settings-security.html",
    "pages-account-settings-billing.html",
    "pages-account-settings-notifications.html",
    "pages-account-settings-connections.html",
    "pages-faq.html",
    "pages-pricing.html",
    "pages-misc-error.html",
    "pages-misc-under-maintenance.html",
    "pages-misc-comingsoon.html",
    "pages-misc-not-authorized.html",
    # auth
    "auth-login-basic.html",
    "auth-login-cover.html",
    "auth-register-basic.html",
    "auth-register-cover.html",
    "auth-register-multisteps.html",
    "auth-verify-email-basic.html",
    "auth-verify-email-cover.html",
    "auth-reset-password-basic.html",
    "auth-reset-password-cover.html",
    "auth-forgot-password-basic.html",
    "auth-forgot-password-cover.html",
    "auth-two-steps-basic.html",
    "auth-two-steps-cover.html",
    # wizards / modals
    "wizard-ex-checkout.html",
    "wizard-ex-property-listing.html",
    "wizard-ex-create-deal.html",
    "modal-examples.html",
    # cards / ui
    "cards-basic.html",
    "cards-advance.html",
    "cards-statistics.html",
    "cards-analytics.html",
    "cards-actions.html",
    "ui-accordion.html",
    "ui-alerts.html",
    "ui-badges.html",
    "ui-buttons.html",
    "ui-carousel.html",
    "ui-collapse.html",
    "ui-dropdowns.html",
    "ui-footer.html",
    "ui-list-groups.html",
    "ui-modals.html",
    "ui-navbar.html",
    "ui-offcanvas.html",
    "ui-pagination-breadcrumbs.html",
    "ui-progress.html",
    "ui-spinners.html",
    "ui-tabs-pills.html",
    "ui-toasts.html",
    "ui-tooltips-popovers.html",
    "ui-typography.html",
    # extended
    "extended-ui-avatar.html",
    "extended-ui-blockui.html",
    "extended-ui-drag-and-drop.html",
    "extended-ui-media-player.html",
    "extended-ui-perfect-scrollbar.html",
    "extended-ui-star-ratings.html",
    "extended-ui-sweetalert2.html",
    "extended-ui-text-divider.html",
    "extended-ui-timeline-basic.html",
    "extended-ui-timeline-fullscreen.html",
    "extended-ui-tour.html",
    "extended-ui-treeview.html",
    "extended-ui-misc.html",
    # icons
    "icons-boxicons.html",
    "icons-font-awesome.html",
    # forms
    "forms-basic-inputs.html",
    "forms-input-groups.html",
    "forms-custom-options.html",
    "forms-editors.html",
    "forms-file-upload.html",
    "forms-pickers.html",
    "forms-selects.html",
    "forms-sliders.html",
    "forms-switches.html",
    "forms-extras.html",
    "form-layouts-vertical.html",
    "form-layouts-horizontal.html",
    "form-layouts-sticky.html",
    "form-wizard-numbered.html",
    "form-wizard-icons.html",
    "form-validation.html",
    # tables
    "tables-basic.html",
    "tables-datatables-basic.html",
    "tables-datatables-advanced.html",
    "tables-datatables-extensions.html",
    # charts maps
    "charts-apex.html",
    "charts-chartjs.html",
    "maps-leaflet.html",
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read()


def clean_html(text: str) -> str:
    text = re.sub(
        r"https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/(assets/[^\"'\s)]+)",
        r"\1",
        text,
    )
    text = re.sub(
        r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/([^"]+)"',
        r'href="\1"',
        text,
    )
    text = text.replace("../../assets/", "assets/")
    text = text.replace("../assets/", "assets/")
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
    text = re.sub(r"https?://demos\.themeselection\.com[^\"'\s<>]*", "#", text)
    text = text.replace(
        '<script src="assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    text = text.replace("assets//", "assets/")

    # footer
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

    # language switcher UZ/RU/EN
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

    # brand home
    text = re.sub(
        r'(<a href=")[^"]*(" class="app-brand-link")',
        r"\1index.html\2",
        text,
        count=1,
    )

    if "js/zon-i18n.js" not in text and "</body>" in text:
        text = text.replace(
            "</body>",
            '    <link rel="stylesheet" href="css/zon-admin.css" />\n'
            '    <script src="js/zon-i18n.js"></script>\n'
            '    <script src="js/app-config.js"></script>\n'
            '    <script src="js/api.js"></script>\n</body>',
            1,
        )
    return text


def download_page(name: str) -> bool:
    dest = ADMIN / name
    # keep our polished index.html menu later — still refresh other pages
    url = BASE + name
    try:
        raw = fetch(url).decode("utf-8", errors="replace")
        text = clean_html(raw)
        dest.write_text(text, encoding="utf-8")
        print("OK", name)
        return True
    except Exception as e:
        print("FAIL", name, e)
        return False


def download_assets() -> None:
    paths = set()
    for html in ADMIN.glob("*.html"):
        t = html.read_text(encoding="utf-8", errors="replace")
        paths |= set(re.findall(r'(?:src|href)="(assets/[^"#?]+)"', t))
    for js in (ADMIN / "assets" / "js").glob("*.js") if (ADMIN / "assets" / "js").exists() else []:
        t = js.read_text(encoding="utf-8", errors="replace")
        for m in re.findall(r'assetsPath\+"([^"]+\.json)"', t):
            paths.add("assets/" + m)
    print("asset refs", len(paths))
    ok = fail = skip = 0
    for rel in sorted(paths):
        rel = rel.replace("assets//", "assets/")
        if "{{" in rel:
            continue
        dest = ADMIN / pathlib.Path(*rel.split("/"))
        if dest.exists() and dest.stat().st_size > 0:
            skip += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            dest.write_bytes(fetch(ASSET_BASE + rel))
            ok += 1
            if ok <= 30 or ok % 25 == 0:
                print(" asset", rel)
        except Exception as e:
            fail += 1
            print(" asset FAIL", rel, e)
    print("assets ok", ok, "fail", fail, "skip", skip)


def main() -> None:
    ADMIN.mkdir(exist_ok=True)
    # backup current index menu separately not needed — we restore original menus FROM downloaded HTML
    # Do NOT overwrite index with remote if we want our i18n dashboard — download as dashboards-analytics style
    # Strategy: download all pages EXCEPT keep local index.html content for dashboard widgets;
    # but restore FULL menu from a freshly downloaded analytics page onto ALL pages including index.

    ok = fail = 0
    for name in dict.fromkeys(PAGES):  # unique preserve order
        if name == "index.html":
            # download remote index as temporary to extract menu, but save as _remote_index_menu_src.html
            try:
                raw = fetch(BASE + "index.html").decode("utf-8", errors="replace")
                (ADMIN / "_remote_index_raw.html").write_text(raw, encoding="utf-8")
                print("OK remote index cached for menu")
            except Exception as e:
                print("FAIL remote index", e)
            continue
        if download_page(name):
            ok += 1
        else:
            fail += 1

    # Extract FULL menu from remote raw (relative links already in remote as absolute -> clean)
    raw_path = ADMIN / "_remote_index_raw.html"
    if raw_path.exists():
        raw = clean_html(raw_path.read_text(encoding="utf-8", errors="replace"))
        start = raw.find('<ul class="menu-inner py-1">')
        if start >= 0:
            i, depth, end = start, 0, None
            while i < len(raw):
                if raw.startswith("<ul", i):
                    depth += 1
                    i = raw.find(">", i) + 1
                    continue
                if raw.startswith("</ul>", i):
                    depth -= 1
                    i += 5
                    if depth == 0:
                        end = i
                        break
                    continue
                i += 1
            if end:
                full_menu = raw[start:end]
                # brand Sneat leftovers in menu already cleaned via clean_html on raw... brand text in menu logo area outside ul
                for path in sorted(ADMIN.glob("*.html")):
                    if path.name.startswith("_"):
                        continue
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
                        html = html[:s] + full_menu + html[e:]
                        html = html.replace(">Sneat</span>", ">Zon</span>")
                        path.write_text(html, encoding="utf-8")
                        print("menu restored", path.name)

    download_assets()
    # cleanup temp
    for tmp in ADMIN.glob("_remote*"):
        tmp.unlink(missing_ok=True)
    print("DONE pages ok", ok, "fail", fail, "total html", len(list(ADMIN.glob("*.html"))))


if __name__ == "__main__":
    main()
