# -*- coding: utf-8 -*-
"""Finalize i18n: inline locales, chart labels, script order."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "admin"
loc_dir = ROOT / "js" / "locales"

# Add month + chart keys to all locale files
extra = {
    "en": {
        "m.jan": "Jan", "m.feb": "Feb", "m.mar": "Mar", "m.apr": "Apr",
        "m.may": "May", "m.jun": "Jun", "m.jul": "Jul", "m.aug": "Aug",
        "m.sep": "Sep", "m.oct": "Oct", "m.nov": "Nov", "m.dec": "Dec",
        "chart.growth": "Growth", "chart.weekly": "Weekly",
    },
    "uz": {
        "m.jan": "Yan", "m.feb": "Fev", "m.mar": "Mar", "m.apr": "Apr",
        "m.may": "May", "m.jun": "Iyun", "m.jul": "Iyul", "m.aug": "Avg",
        "m.sep": "Sen", "m.oct": "Okt", "m.nov": "Noy", "m.dec": "Dek",
        "chart.growth": "Oʻsish", "chart.weekly": "Haftalik",
    },
    "ru": {
        "m.jan": "Янв", "m.feb": "Фев", "m.mar": "Мар", "m.apr": "Апр",
        "m.may": "Май", "m.jun": "Июн", "m.jul": "Июл", "m.aug": "Авг",
        "m.sep": "Сен", "m.oct": "Окт", "m.nov": "Ноя", "m.dec": "Дек",
        "chart.growth": "Рост", "chart.weekly": "Неделя",
    },
}

all_locales = {}
for code in ("uz", "ru", "en"):
    data = json.loads((loc_dir / f"{code}.json").read_text(encoding="utf-8"))
    data.update(extra[code])
    (loc_dir / f"{code}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    all_locales[code] = data

# Rewrite zon-i18n.js with inline dictionaries (sync, no flash)
engine = f"""/**
 * Zon Admin i18n — UZ / RU / EN (inline dictionaries)
 */
(function (global) {{
  const STORAGE_KEY = "zon_admin_lang";
  const SUPPORTED = ["uz", "ru", "en"];
  const DICTS = {json.dumps(all_locales, ensure_ascii=False)};

  let current = localStorage.getItem(STORAGE_KEY) || "uz";
  if (!SUPPORTED.includes(current)) current = "uz";

  function t(key, vars) {{
    const dict = DICTS[current] || {{}};
    let str = dict[key] != null ? dict[key] : (DICTS.en[key] != null ? DICTS.en[key] : key);
    if (vars) {{
      Object.keys(vars).forEach((k) => {{
        str = String(str).replace(new RegExp("\\\\{{" + k + "\\\\}}", "g"), String(vars[k]));
      }});
    }}
    return str;
  }}

  function apply() {{
    document.documentElement.setAttribute("lang", current);
    document.title = t("page.title");

    document.querySelectorAll("[data-i18n]").forEach((el) => {{
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = t(key, {{ year: new Date().getFullYear() }});
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    }});

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {{
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    }});

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {{
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    }});

    document.querySelectorAll(".dropdown-language .dropdown-item").forEach((item) => {{
      item.classList.toggle("active", item.getAttribute("data-language") === current);
    }});

    const langBtn = document.querySelector(".dropdown-language .nav-link");
    if (langBtn) {{
      let badge = langBtn.querySelector(".zon-lang-code");
      if (!badge) {{
        badge = document.createElement("span");
        badge.className = "zon-lang-code ms-1 d-none d-sm-inline small fw-semibold";
        langBtn.appendChild(badge);
      }}
      badge.textContent = current.toUpperCase();
    }}

    if (global.SearchConfig) global.SearchConfig.placeholder = t("search.placeholder");
    const ph = document.querySelector(".aa-DetachedSearchButtonPlaceholder");
    if (ph) ph.textContent = t("search.placeholder");

    global.dispatchEvent(new CustomEvent("zon:langchange", {{ detail: {{ lang: current }} }}));
  }}

  function setLang(lang) {{
    if (!SUPPORTED.includes(lang)) lang = "uz";
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
  }}

  function bindSwitcher() {{
    const root = document.querySelector(".dropdown-language");
    if (!root) return;
    root.querySelectorAll("[data-language]").forEach((item) => {{
      item.addEventListener(
        "click",
        function (e) {{
          e.preventDefault();
          e.stopImmediatePropagation();
          setLang(this.getAttribute("data-language"));
        }},
        true
      );
    }});
  }}

  global.ZonI18n = {{
    t,
    setLang,
    apply,
    get lang() {{ return current; }},
    SUPPORTED,
    monthsShort() {{
      return ["m.jan","m.feb","m.mar","m.apr","m.may","m.jun","m.jul","m.aug","m.sep","m.oct","m.nov","m.dec"].map((k) => t(k));
    }},
  }};

  // Apply ASAP (script is deferred after DOM partial) — also on DOMContentLoaded
  if (document.readyState === "loading") {{
    document.addEventListener("DOMContentLoaded", function () {{
      apply();
      bindSwitcher();
    }});
  }} else {{
    apply();
    bindSwitcher();
  }}
}})(window);
"""

(ROOT / "js" / "zon-i18n.js").write_text(engine, encoding="utf-8")
print("Rewrote zon-i18n.js inline")

# Patch analytics chart labels
js_path = ROOT / "assets" / "js" / "dashboards-analytics.js"
js = js_path.read_text(encoding="utf-8")
js = js.replace('labels:["Growth"]', 'labels:[window.ZonI18n?ZonI18n.t("chart.growth"):"Growth"]')
js = js.replace('label:"Weekly"', 'label:(window.ZonI18n?ZonI18n.t("chart.weekly"):"Weekly")')
js = js.replace(
    'categories:["Jan","Feb","Mar","Apr","May","Jun","Jul"]',
    'categories:(window.ZonI18n?ZonI18n.monthsShort().slice(0,7):["Jan","Feb","Mar","Apr","May","Jun","Jul"])',
)
js_path.write_text(js, encoding="utf-8")
print("Patched dashboards-analytics.js")

# Move zon-i18n.js BEFORE dashboards-analytics.js
html_path = ROOT / "index.html"
html = html_path.read_text(encoding="utf-8")
html = html.replace('    <script src="js/zon-i18n.js"></script>\n', "")
if "js/zon-i18n.js" not in html:
    html = html.replace(
        '<script src="assets/js/dashboards-analytics.js"></script>',
        '<script src="js/zon-i18n.js"></script>\n    <script src="assets/js/dashboards-analytics.js"></script>',
        1,
    )
html_path.write_text(html, encoding="utf-8")
print("Script order fixed")
