# -*- coding: utf-8 -*-
"""Download essential Sneat admin pages and restore working menu."""
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

# Core pages for a real admin
PAGES = [
    "index.html",
    "dashboards-analytics.html",
    "dashboards-crm.html",
    "app-ecommerce-dashboard.html",
    "app-ecommerce-product-list.html",
    "app-ecommerce-product-add.html",
    "app-ecommerce-category-list.html",
    "app-ecommerce-order-list.html",
    "app-ecommerce-order-details.html",
    "app-ecommerce-customer-all.html",
    "app-user-list.html",
    "app-user-view-account.html",
    "app-invoice-list.html",
    "app-invoice-preview.html",
    "app-invoice-add.html",
    "app-access-roles.html",
    "app-access-permission.html",
    "app-calendar.html",
    "app-chat.html",
    "app-email.html",
    "app-kanban.html",
    "pages-account-settings-account.html",
    "pages-account-settings-security.html",
    "pages-profile-user.html",
    "pages-pricing.html",
    "pages-faq.html",
    "auth-login-basic.html",
    "auth-register-basic.html",
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read()


def download_page(name: str) -> bool:
    url = BASE + name
    dest = ADMIN / name
    try:
        data = fetch(url)
        text = data.decode("utf-8", errors="replace")
        # rewrite absolute asset URLs to local
        text = re.sub(
            r"https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/(assets/[^\"'\s)]+)",
            r"\1",
            text,
        )
        # rewrite absolute page links in same folder to local
        text = re.sub(
            r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/([^"]+)"',
            r'href="\1"',
            text,
        )
        # brand + remove buy now / gtm / cloudflare / themeselection footer promo
        text = text.replace(">Sneat</span>", ">Zon</span>")
        text = text.replace(">Sneat<", ">Zon<")
        text = re.sub(
            r'<div class="buy-now">[\s\S]*?</div>\s*',
            "\n",
            text,
            count=1,
        )
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
        text = re.sub(
            r'https?://(?:www\.)?themeselection\.com[^"\'\s<>]*',
            "#",
            text,
        )
        text = text.replace('data-assets-path="../../assets/"', 'data-assets-path="assets/"')
        # fonts: leave google or absolute — convert cf-fonts block is huge; leave remote demos fonts if any
        text = re.sub(
            r"https://demos\.themeselection\.com/cf-fonts/",
            "https://demos.themeselection.com/cf-fonts/",
            text,
        )
        # inject zon scripts before </body> if missing
        if "js/zon-i18n.js" not in text and "</body>" in text:
            inject = """
    <link rel="stylesheet" href="css/zon-admin.css" />
    <script src="js/zon-i18n.js"></script>
    <script src="js/app-config.js"></script>
    <script src="js/api.js"></script>
"""
            text = text.replace("</body>", inject + "</body>", 1)
        dest.write_text(text, encoding="utf-8")
        print("OK", name, len(text))
        return True
    except Exception as e:
        print("FAIL", name, e)
        return False


def download_extra_assets_from(html: str) -> None:
    paths = set(
        re.findall(
            r'(?:src|href)="(assets/[^"]+\.(?:js|css|png|jpg|jpeg|svg|ico|woff2?|json))"',
            html,
        )
    )
    # also img without quotes weirdness
    for rel in sorted(paths):
        dest = ADMIN / pathlib.Path(*rel.split("/"))
        if dest.exists() and dest.stat().st_size > 0:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        url = ASSET_BASE + rel
        try:
            dest.write_bytes(fetch(url))
            print("  asset", rel)
        except Exception as e:
            print("  asset FAIL", rel, e)


MENU = """
    <ul class="menu-inner py-1">
      <li class="menu-item active open">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-home-smile"></i>
          <div data-zon-i18n="menu.dashboard">Dashboard</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item active">
            <a href="index.html" class="menu-link"><div data-zon-i18n="menu.analytics">Analytics</div></a>
          </li>
          <li class="menu-item">
            <a href="dashboards-crm.html" class="menu-link"><div>CRM</div></a>
          </li>
          <li class="menu-item">
            <a href="app-ecommerce-dashboard.html" class="menu-link"><div>eCommerce</div></a>
          </li>
        </ul>
      </li>

      <li class="menu-header small text-uppercase"><span class="menu-header-text" data-zon-i18n="menu.management">Boshqaruv</span></li>

      <li class="menu-item">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-package"></i>
          <div data-zon-i18n="menu.products">Mahsulotlar</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item"><a href="app-ecommerce-product-list.html" class="menu-link"><div data-zon-i18n="menu.productList">Roʻyxat</div></a></li>
          <li class="menu-item"><a href="app-ecommerce-product-add.html" class="menu-link"><div data-zon-i18n="menu.productAdd">Qoʻshish</div></a></li>
          <li class="menu-item"><a href="app-ecommerce-category-list.html" class="menu-link"><div data-zon-i18n="menu.categories">Kategoriyalar</div></a></li>
        </ul>
      </li>

      <li class="menu-item">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-cart"></i>
          <div data-zon-i18n="menu.orders">Buyurtmalar</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item"><a href="app-ecommerce-order-list.html" class="menu-link"><div data-zon-i18n="menu.orderList">Roʻyxat</div></a></li>
          <li class="menu-item"><a href="app-ecommerce-order-details.html" class="menu-link"><div data-zon-i18n="menu.orderDetails">Tafsilotlar</div></a></li>
          <li class="menu-item"><a href="app-ecommerce-customer-all.html" class="menu-link"><div data-zon-i18n="menu.customers">Mijozlar</div></a></li>
        </ul>
      </li>

      <li class="menu-item">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-user"></i>
          <div data-zon-i18n="menu.users">Foydalanuvchilar</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item"><a href="app-user-list.html" class="menu-link"><div data-zon-i18n="menu.userList">Roʻyxat</div></a></li>
          <li class="menu-item"><a href="app-user-view-account.html" class="menu-link"><div data-zon-i18n="menu.userView">Koʻrish</div></a></li>
          <li class="menu-item"><a href="app-access-roles.html" class="menu-link"><div data-zon-i18n="menu.roles">Rollar</div></a></li>
          <li class="menu-item"><a href="app-access-permission.html" class="menu-link"><div data-zon-i18n="menu.permissions">Ruxsatlar</div></a></li>
        </ul>
      </li>

      <li class="menu-item">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-food-menu"></i>
          <div data-zon-i18n="menu.invoices">Hisob-fakturalar</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item"><a href="app-invoice-list.html" class="menu-link"><div data-zon-i18n="menu.invoiceList">Roʻyxat</div></a></li>
          <li class="menu-item"><a href="app-invoice-preview.html" class="menu-link"><div data-zon-i18n="menu.invoicePreview">Koʻrish</div></a></li>
          <li class="menu-item"><a href="app-invoice-add.html" class="menu-link"><div data-zon-i18n="menu.invoiceAdd">Qoʻshish</div></a></li>
        </ul>
      </li>

      <li class="menu-item">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-envelope"></i>
          <div data-zon-i18n="menu.apps">Ilovalar</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item"><a href="app-email.html" class="menu-link"><div>Email</div></a></li>
          <li class="menu-item"><a href="app-chat.html" class="menu-link"><div>Chat</div></a></li>
          <li class="menu-item"><a href="app-calendar.html" class="menu-link"><div data-zon-i18n="menu.calendar">Kalendar</div></a></li>
          <li class="menu-item"><a href="app-kanban.html" class="menu-link"><div>Kanban</div></a></li>
        </ul>
      </li>

      <li class="menu-header small text-uppercase"><span class="menu-header-text" data-zon-i18n="menu.system">Tizim</span></li>

      <li class="menu-item">
        <a href="javascript:void(0);" class="menu-link menu-toggle">
          <i class="menu-icon icon-base bx bx-cog"></i>
          <div data-zon-i18n="menu.settings">Sozlamalar</div>
        </a>
        <ul class="menu-sub">
          <li class="menu-item"><a href="pages-account-settings-account.html" class="menu-link"><div data-zon-i18n="menu.account">Hisob</div></a></li>
          <li class="menu-item"><a href="pages-account-settings-security.html" class="menu-link"><div data-zon-i18n="menu.security">Xavfsizlik</div></a></li>
          <li class="menu-item"><a href="pages-profile-user.html" class="menu-link"><div data-zon-i18n="user.profile">Profil</div></a></li>
          <li class="menu-item"><a href="pages-pricing.html" class="menu-link"><div data-zon-i18n="user.pricing">Narxlar</div></a></li>
          <li class="menu-item"><a href="pages-faq.html" class="menu-link"><div data-zon-i18n="user.faq">FAQ</div></a></li>
        </ul>
      </li>

      <li class="menu-item">
        <a href="auth-login-basic.html" class="menu-link">
          <i class="menu-icon icon-base bx bx-log-in"></i>
          <div data-zon-i18n="menu.login">Kirish</div>
        </a>
      </li>
      <li class="menu-item">
        <a href="auth-register-basic.html" class="menu-link">
          <i class="menu-icon icon-base bx bx-user-plus"></i>
          <div data-zon-i18n="menu.register">Roʻyxatdan oʻtish</div>
        </a>
      </li>
    </ul>
"""


def replace_menu(html: str) -> str:
    start = html.find('<ul class="menu-inner py-1">')
    if start < 0:
        return html
    i, depth, end = start, 0, None
    while i < len(html):
        if html.startswith("<ul", i):
            depth += 1
            i = html.find(">", i) + 1
            continue
        if html.startswith("</ul>", i):
            depth -= 1
            i += 5
            if depth == 0:
                end = i
                break
            continue
        i += 1
    if end is None:
        return html
    return html[:start] + MENU + html[end:]


def main() -> None:
    ADMIN.mkdir(exist_ok=True)
    ok = 0
    # Keep our cleaned index.html — don't overwrite with raw download for index
    # Instead download OTHER pages, then patch menus on all including index
    for name in PAGES:
        if name == "index.html":
            continue
        if download_page(name):
            ok += 1

    # Patch menus on all html pages in admin
    for path in sorted(ADMIN.glob("*.html")):
        html = path.read_text(encoding="utf-8", errors="replace")
        html2 = replace_menu(html)
        # brand link home
        html2 = re.sub(
            r'(<a href=")[^"]*(" class="app-brand-link")',
            r'\1index.html\2',
            html2,
            count=1,
        )
        if html2 != html:
            path.write_text(html2, encoding="utf-8")
            print("menu patched", path.name)
        download_extra_assets_from(html2)

    print("Downloaded pages (excl index):", ok)


if __name__ == "__main__":
    main()
