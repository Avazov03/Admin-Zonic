from pathlib import Path

p = Path("admin/index.html")
t = p.read_text(encoding="utf-8")
old = '<script src="assets/vendor/libs/i18n/i18n.js"></script>'
print("found", old in t)
t = t.replace(old, "<!-- zon custom i18n -->")
p.write_text(t, encoding="utf-8")
print("remaining", "i18n/i18n.js" in p.read_text(encoding="utf-8"))
