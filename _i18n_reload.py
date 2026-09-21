from pathlib import Path

j = Path("admin/js/zon-i18n.js")
js = j.read_text(encoding="utf-8")

old = """  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = "uz";
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
  }"""

new = """  function setLang(lang, opts) {
    if (!SUPPORTED.includes(lang)) lang = "uz";
    const prev = current;
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
    // Chart labels render once — reload so ApexCharts pick up new language
    if (opts && opts.reload === false) return;
    if (prev !== lang) location.reload();
  }"""

if old not in js:
    raise SystemExit("setLang block not found")
js = js.replace(old, new)

# Initial apply should not reload — setLang on first load uses apply only via DOMContentLoaded
# Click handler calls setLang(lang) which will reload — good.
# But wait — first page load calls apply() not setLang, so OK.

# Fix click handler — after setLang reloads, fine.
# Problem: setLang on first call if somehow... only click calls setLang.

j.write_text(js, encoding="utf-8")
print("setLang reload OK")
