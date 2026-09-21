# -*- coding: utf-8 -*-
from pathlib import Path

p = Path("admin/index.html")
t = p.read_text(encoding="utf-8")
t = t.replace("data-i18n-html", "data-zon-i18n-html")
t = t.replace("data-i18n-title", "data-zon-i18n-title")
t = t.replace("data-i18n-placeholder", "data-zon-i18n-placeholder")
t = t.replace("data-i18n-aria", "data-zon-i18n-aria")
t = t.replace("data-i18n=", "data-zon-i18n=")
p.write_text(t, encoding="utf-8")
print("html", t.count("data-zon-i18n"))

j = Path("admin/js/zon-i18n.js")
js = j.read_text(encoding="utf-8")
js = js.replace('[data-i18n]', "[data-zon-i18n]")
js = js.replace("data-i18n-html", "data-zon-i18n-html")
js = js.replace('getAttribute("data-i18n")', 'getAttribute("data-zon-i18n")')
js = js.replace("[data-i18n-title]", "[data-zon-i18n-title]")
js = js.replace("data-i18n-title", "data-zon-i18n-title")
js = js.replace("[data-i18n-placeholder]", "[data-zon-i18n-placeholder]")
js = js.replace("data-i18n-placeholder", "data-zon-i18n-placeholder")

# Ensure re-apply after template i18next
needle = "apply();\n      bindSwitcher();"
repl = "apply();\n      bindSwitcher();\n      setTimeout(apply, 0);\n      setTimeout(apply, 800);"
if "setTimeout(apply" not in js:
    js = js.replace(needle, repl)
    js = js.replace(
        "apply();\n    bindSwitcher();\n  }\n})(window);",
        "apply();\n    bindSwitcher();\n    setTimeout(apply, 0);\n    setTimeout(apply, 800);\n  }\n})(window);",
    )

j.write_text(js, encoding="utf-8")
print("js ok", "data-zon-i18n" in js)
