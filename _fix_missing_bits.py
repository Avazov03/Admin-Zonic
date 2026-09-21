# -*- coding: utf-8 -*-
from __future__ import annotations

import pathlib
import re
import ssl
import urllib.request

ADMIN = pathlib.Path(__file__).resolve().parent / "admin"
VBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/"
HBASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/html/horizontal-menu-template/"
ASSET_BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"
CTX = ssl.create_default_context()
UA = "Mozilla/5.0"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read()


def clean(text: str, prefix: str = "") -> str:
    text = text.replace("../../assets/", f"{prefix}assets/")
    text = re.sub(
        r"https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/(assets/[^\"'\s)]+)",
        rf"{prefix}\1",
        text,
    )
    text = text.replace(">Sneat</span>", ">Zon</span>")
    text = text.replace(">Sneat<", ">Zon<")
    text = re.sub(r'\s*<div class="buy-now">[\s\S]*?</div>\s*', "\n", text)
    text = re.sub(r"https?://(?:www\.)?themeselection\.com[^\"'\s<>]*", "#", text)
    text = re.sub(r"https?://demos\.themeselection\.com[^\"'\s<>]*", "#", text)
    text = text.replace(
        f'<script src="{prefix}assets/vendor/js/template-customizer.js"></script>',
        "<!-- customizer removed -->",
    )
    if "zon-i18n.js" not in text and "</body>" in text:
        text = text.replace(
            "</body>",
            f'    <link rel="stylesheet" href="{prefix}css/zon-admin.css" />\n'
            f'    <script src="{prefix}js/zon-i18n.js"></script>\n'
            f'    <script src="{prefix}js/app-config.js"></script>\n'
            f'    <script src="{prefix}js/api.js"></script>\n</body>',
            1,
        )
    return text


def main() -> None:
    # invoice print
    for base, dest, prefix in [
        (VBASE, ADMIN / "app-invoice-print.html", ""),
        (HBASE, ADMIN / "horizontal-menu-template" / "app-invoice-print.html", "../"),
    ]:
        try:
            text = clean(fetch(base + "app-invoice-print.html").decode("utf-8", "replace"), prefix)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(text, encoding="utf-8")
            print("OK", dest.relative_to(ADMIN))
        except Exception as e:
            print("FAIL invoice-print", e)

    svgs = [
        "assets/svg/icons/form-wizard-account.svg",
        "assets/svg/icons/form-wizard-address.svg",
        "assets/svg/icons/form-wizard-personal.svg",
        "assets/svg/icons/form-wizard-social-link.svg",
        "assets/svg/icons/form-wizard-submit.svg",
        "assets/svg/icons/wizard-checkout-address.svg",
        "assets/svg/icons/wizard-checkout-cart.svg",
        "assets/svg/icons/wizard-checkout-confirmation.svg",
        "assets/svg/icons/wizard-checkout-payment.svg",
    ]
    for rel in svgs:
        dest = ADMIN / pathlib.Path(*rel.split("/"))
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            dest.write_bytes(fetch(ASSET_BASE + rel))
            print("OK", rel)
        except Exception as e:
            print("FAIL", rel, e)


if __name__ == "__main__":
    main()
