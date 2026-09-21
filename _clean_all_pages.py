# -*- coding: utf-8 -*-
"""Clean ThemeSelection leftovers on all admin pages + unify language switcher."""
from pathlib import Path
import re

ADMIN = Path("admin")

LANG = """
      <li class="nav-item dropdown-language dropdown me-2 me-xl-0">
        <a class="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown" aria-label="Language">
          <i class="icon-base bx bx-globe icon-md"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="uz" data-text-direction="ltr">
              <span data-zon-i18n="lang.uz">Oʻzbekcha</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="ru" data-text-direction="ltr">
              <span data-zon-i18n="lang.ru">Русский</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="en" data-text-direction="ltr">
              <span data-zon-i18n="lang.en">English</span>
            </a>
          </li>
        </ul>
      </li>
"""

FOOTER = """
<footer class="content-footer footer bg-footer-theme">
  <div class="container-xxl">
    <div class="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
      <div class="mb-2 mb-md-0">
        <span data-zon-i18n="footer.rights">© {year} Zon Admin — All rights reserved</span>
      </div>
      <div class="d-none d-lg-inline-block text-muted small" data-zon-i18n="footer.api">Backend API ready</div>
    </div>
  </div>
</footer>
"""

for path in sorted(ADMIN.glob("*.html")):
    if path.name == "index.html":
        # index already cleaned mostly
        t = path.read_text(encoding="utf-8", errors="replace")
    else:
        t = path.read_text(encoding="utf-8", errors="replace")

    # language dropdown: replace any dropdown-language block
    t2 = re.sub(
        r'<li class="nav-item dropdown-language dropdown[\s\S]*?</li>\s*<!--/?\s*Language\s*-->',
        LANG + "      <!--/ Language -->",
        t,
        count=1,
    )

    # footer
    t2 = re.sub(
        r"<footer class=\"content-footer footer bg-footer-theme\">[\s\S]*?</footer>",
        FOOTER,
        t2,
        count=1,
    )

    # buy now
    t2 = re.sub(r'\s*<div class="buy-now">[\s\S]*?</div>\s*', "\n", t2)

    # ThemeSelection leftover URLs in footer already replaced; also kill More Themes text remnants
    t2 = re.sub(r"https?://(?:www\.)?themeselection\.com[^\"'\s<>]*", "#", t2)
    t2 = re.sub(r"https?://demos\.themeselection\.com[^\"'\s<>]*", "#", t2)

    # brand text
    t2 = t2.replace(">Sneat</span>", ">Zon</span>")
    t2 = t2.replace('class="app-brand-text demo menu-text fw-bold ms-2">Sneat',
                    'class="app-brand-text demo menu-text fw-bold ms-2">Zon')

    # ensure zon scripts
    if "js/zon-i18n.js" not in t2 and "</body>" in t2:
        t2 = t2.replace(
            "</body>",
            '    <link rel="stylesheet" href="css/zon-admin.css" />\n'
            '    <script src="js/zon-i18n.js"></script>\n'
            '    <script src="js/app-config.js"></script>\n'
            '    <script src="js/api.js"></script>\n</body>',
            1,
        )

    # fix assets// double slash
    t2 = t2.replace("assets//", "assets/")

    if t2 != t:
        path.write_text(t2, encoding="utf-8")
        print("cleaned", path.name)
    else:
        print("skip", path.name)

print("done")
