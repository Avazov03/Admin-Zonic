# -*- coding: utf-8 -*-
"""Build clean Zon Admin from HTTrack Sneat mirror."""
from __future__ import annotations

import os
import pathlib
import re
import ssl
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "demos.themeselection.com/sneat-bootstrap-html-admin-template/html/vertical-menu-template/index.html"
OUT = ROOT / "admin"
ASSETS_BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"
CTX = ssl.create_default_context()
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def download(rel: str) -> bool:
    url = ASSETS_BASE + rel.replace("\\", "/")
    dest = OUT / pathlib.Path(*rel.split("/"))
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        print("SKIP", rel)
        return True
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
            data = r.read()
        dest.write_bytes(data)
        print("OK", rel, len(data))
        return True
    except Exception as e:  # noqa: BLE001
        print("FAIL", rel, e)
        return False


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "js").mkdir(exist_ok=True)
    (OUT / "css").mkdir(exist_ok=True)

    text = SRC.read_text(encoding="utf-8", errors="replace")

    asset_pat = re.compile(
        r"https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/(assets/[^\"'\s)]+)"
    )
    urls = sorted(set(asset_pat.findall(text)))
    print(f"Assets to download: {len(urls)}")
    ok = fail = 0
    for rel in urls:
        if download(rel):
            ok += 1
        else:
            fail += 1
    print(f"Download done ok={ok} fail={fail}")

    # --- HTML transforms ---
    # Absolute asset URLs -> local
    text = asset_pat.sub(r"\1", text)

    # Absolute page links on demo site -> # (backend routing later)
    text = re.sub(
        r'href="https://demos\.themeselection\.com/sneat-bootstrap-html-admin-template/[^"]*"',
        'href="#"',
        text,
    )

    # Remove HTTrack mirror comments
    text = re.sub(r"\s*<!-- Mirrored from .*? -->\s*", "\n", text)

    # Replace header authorship block
    text = re.sub(
        r"<!-- =+.*?={3,}[\s\S]*?-->\s*<!-- beautify ignore:start -->",
        """<!--
  Zon Admin Panel
  Project: Zon Add
  Author: Zon Team
  Ready for backend API integration
-->
<!-- beautify ignore:start -->""",
        text,
        count=1,
    )

    # Title / meta
    text = re.sub(
        r"<title>.*?</title>",
        "<title>Zon Admin — Dashboard</title>",
        text,
        count=1,
        flags=re.S,
    )
    # Strip ThemeSelection SEO / OG block
    text = re.sub(
        r"<!-- Canonical SEO -->[\s\S]*?<link rel=\"canonical\"[^>]*>\s*",
        """<meta name="description" content="Zon Admin — boshqaruv paneli" />
    <meta name="author" content="Zon Team" />
""",
        text,
        count=1,
    )

    # Remove Google Tag Manager (head + body)
    text = re.sub(
        r"\s*<!-- \? PROD Only: Google Tag Manager[\s\S]*?<!-- End Google Tag Manager -->\s*",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"\s*<!-- \?PROD Only: Google Tag Manager \(noscript\)[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\s*",
        "\n",
        text,
        count=1,
    )

    # Google Fonts instead of demos cf-fonts (huge inline style)
    text = re.sub(
        r'<style type="text/css">@font-face \{font-family:\'Public Sans\'[\s\S]*?</style>',
        '<link rel="preconnect" href="https://fonts.googleapis.com" />\n'
        '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
        '    <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />',
        text,
        count=1,
    )

    # Remove template customizer script (demo theme picker)
    text = re.sub(
        r"\s*<!--! Template customizer[\s\S]*?<script src=\"assets/vendor/js/template-customizer\.js\"></script>\s*",
        "\n",
        text,
        count=1,
    )

    # Brand name Sneat -> Zon
    text = text.replace(
        '<span class="app-brand-text demo menu-text fw-bold ms-2">Sneat</span>',
        '<span class="app-brand-text demo menu-text fw-bold ms-2">Zon</span>',
    )
    text = text.replace('data-assets-path="../../assets/"', 'data-assets-path="assets/"')

    # Demo greeting
    text = text.replace("Congratulations John!", "Xush kelibsiz!")
    text = text.replace("Congratulations John", "Xush kelibsiz")

    # Footer -> Zon
    text = re.sub(
        r"<footer class=\"content-footer footer bg-footer-theme\">[\s\S]*?</footer>",
        """<footer class="content-footer footer bg-footer-theme">
  <div class="container-xxl">
    <div class="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
      <div class="mb-2 mb-md-0">
        © <span id="zon-year"></span> <strong>Zon Admin</strong> — barcha huquqlar himoyalangan
      </div>
      <div class="d-none d-lg-inline-block text-muted small">
        Backend API tayyor
      </div>
    </div>
  </div>
</footer>""",
        text,
        count=1,
    )

    # Remove Buy Now
    text = re.sub(
        r'\s*<div class="buy-now">[\s\S]*?</div>\s*',
        "\n",
        text,
        count=1,
    )

    # Remove Cloudflare challenge + beacon at end of body
    text = re.sub(
        r'<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument[\s\S]*?</script>'
        r'<script type="module" src="https://static\.cloudflareinsights\.com/[^"]+"[^>]*></script>',
        "",
        text,
        count=1,
    )

    # Any leftover themeselection / demos absolute http(s)
    text = re.sub(
        r'https?://(?:www\.)?themeselection\.com[^"\'\s<>]*',
        "#",
        text,
    )
    text = re.sub(
        r'https?://demos\.themeselection\.com[^"\'\s<>]*',
        "#",
        text,
    )

    # robots allow for own project
    text = text.replace(
        '<meta name="robots" content="noindex, nofollow" />',
        '<meta name="robots" content="noindex, nofollow" />\n    <meta name="application-name" content="Zon Admin" />',
    )

    # Inject Zon API + app config before </body>
    inject = """
    <!-- Zon Admin: API config (backend ulash shu yerda) -->
    <script src="js/app-config.js"></script>
    <script src="js/api.js"></script>
    <script>
      document.getElementById('zon-year') && (document.getElementById('zon-year').textContent = new Date().getFullYear());
    </script>
"""
    text = text.replace("</body>", inject + "\n</body>", 1)

    # Hide remaining buy-now via CSS safety + small tweaks
    hide_css = """
    <link rel="stylesheet" href="css/zon-admin.css" />
"""
    text = text.replace("</head>", hide_css + "</head>", 1)

    out_html = OUT / "index.html"
    out_html.write_text(text, encoding="utf-8")
    print("Wrote", out_html)

    # app-config.js
    (OUT / "js" / "app-config.js").write_text(
        """/**
 * Zon Admin — global config
 * Backend tayyor bo'lganda API_BASE_URL ni o'zgartiring.
 */
window.ZON_CONFIG = {
  appName: "Zon Admin",
  appVersion: "1.0.0",
  author: "Zon Team",
  // Masalan: "http://127.0.0.1:8000/api" yoki "https://api.zon.uz/api"
  API_BASE_URL: "http://127.0.0.1:8000/api",
  // Token localStorage kaliti
  TOKEN_KEY: "zon_admin_token",
};
""",
        encoding="utf-8",
    )

    # api.js
    (OUT / "js" / "api.js").write_text(
        """/**
 * Zon Admin — oddiy API helper (fetch)
 * Backend endpointlaringizni shu orqali chaqirasiz.
 */
(function (global) {
  const cfg = global.ZON_CONFIG || { API_BASE_URL: "/api", TOKEN_KEY: "zon_admin_token" };

  function getToken() {
    try {
      return localStorage.getItem(cfg.TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setToken(token) {
    if (token) localStorage.setItem(cfg.TOKEN_KEY, token);
    else localStorage.removeItem(cfg.TOKEN_KEY);
  }

  async function request(path, options = {}) {
    const url = path.startsWith("http") ? path : cfg.API_BASE_URL.replace(/\\/$/, "") + "/" + path.replace(/^\\//, "");
    const headers = Object.assign(
      { Accept: "application/json", "Content-Type": "application/json" },
      options.headers || {}
    );
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(url, Object.assign({}, options, { headers }));
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }
    if (!res.ok) {
      const err = new Error((data && data.message) || res.statusText || "API xato");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  global.ZonApi = {
    getToken,
    setToken,
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body || {}) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body || {}) }),
    patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
    del: (path) => request(path, { method: "DELETE" }),
    login: async (email, password) => {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data && (data.token || data.access_token)) {
        setToken(data.token || data.access_token);
      }
      return data;
    },
    logout: () => setToken(""),
  };
})(window);
""",
        encoding="utf-8",
    )

    (OUT / "css" / "zon-admin.css").write_text(
        """/* Zon Admin — demo/reklama qoldiqlarini yashirish */
.buy-now,
.btn-buy-now,
.template-customizer,
.template-customizer-open-btn,
div[class*="buy-now"] {
  display: none !important;
}

/* Brand tweaks */
.app-brand-text {
  letter-spacing: 0.02em;
}
""",
        encoding="utf-8",
    )

    # leftover checks
    leftover = []
    for needle in [
        "themeselection.com",
        "Buy Now",
        "GTM-5DDHKGP",
        "cloudflareinsights",
        "Mirrored from",
        "template-customizer.js",
    ]:
        if needle.lower() in text.lower() or needle in text:
            leftover.append(needle)
    print("Leftover checks:", leftover or "CLEAN")


if __name__ == "__main__":
    main()
