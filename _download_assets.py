# -*- coding: utf-8 -*-
from pathlib import Path
import re
import ssl
import urllib.request
import json

# update i18n keys
extra = {
    "en": {
        "menu.analytics": "Analytics",
        "menu.productList": "List",
        "menu.productAdd": "Add",
        "menu.orderList": "List",
        "menu.orderDetails": "Details",
        "menu.customers": "Customers",
        "menu.userList": "List",
        "menu.userView": "View",
        "menu.roles": "Roles",
        "menu.permissions": "Permissions",
        "menu.invoices": "Invoices",
        "menu.invoiceList": "List",
        "menu.invoicePreview": "Preview",
        "menu.invoiceAdd": "Add",
        "menu.apps": "Apps",
        "menu.calendar": "Calendar",
        "menu.account": "Account",
        "menu.security": "Security",
        "menu.login": "Login",
        "menu.register": "Register",
    },
    "uz": {
        "menu.analytics": "Analytics",
        "menu.productList": "Roʻyxat",
        "menu.productAdd": "Qoʻshish",
        "menu.orderList": "Roʻyxat",
        "menu.orderDetails": "Tafsilotlar",
        "menu.customers": "Mijozlar",
        "menu.userList": "Roʻyxat",
        "menu.userView": "Koʻrish",
        "menu.roles": "Rollar",
        "menu.permissions": "Ruxsatlar",
        "menu.invoices": "Hisob-fakturalar",
        "menu.invoiceList": "Roʻyxat",
        "menu.invoicePreview": "Koʻrish",
        "menu.invoiceAdd": "Qoʻshish",
        "menu.apps": "Ilovalar",
        "menu.calendar": "Kalendar",
        "menu.account": "Hisob",
        "menu.security": "Xavfsizlik",
        "menu.login": "Kirish",
        "menu.register": "Roʻyxatdan oʻtish",
    },
    "ru": {
        "menu.analytics": "Аналитика",
        "menu.productList": "Список",
        "menu.productAdd": "Добавить",
        "menu.orderList": "Список",
        "menu.orderDetails": "Детали",
        "menu.customers": "Клиенты",
        "menu.userList": "Список",
        "menu.userView": "Просмотр",
        "menu.roles": "Роли",
        "menu.permissions": "Права",
        "menu.invoices": "Счета",
        "menu.invoiceList": "Список",
        "menu.invoicePreview": "Просмотр",
        "menu.invoiceAdd": "Добавить",
        "menu.apps": "Приложения",
        "menu.calendar": "Календарь",
        "menu.account": "Аккаунт",
        "menu.security": "Безопасность",
        "menu.login": "Вход",
        "menu.register": "Регистрация",
    },
}

loc = Path("admin/js/locales")
all_dicts = {}
for code in ("uz", "ru", "en"):
    p = loc / f"{code}.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    data.update(extra[code])
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    all_dicts[code] = data

js_path = Path("admin/js/zon-i18n.js")
js = js_path.read_text(encoding="utf-8")
m = re.search(r"const DICTS = (\{.*?\});\n\n  let current", js, re.S)
if not m:
    raise SystemExit("DICTS not found")
new_dicts = json.dumps(all_dicts, ensure_ascii=False)
js = js[: m.start(1)] + new_dicts + js[m.end(1) :]
js_path.write_text(js, encoding="utf-8")
print("i18n updated")

ADMIN = Path("admin")
CTX = ssl.create_default_context()
UA = "Mozilla/5.0"
BASE = "https://demos.themeselection.com/sneat-bootstrap-html-admin-template/"
paths = set()
for html in ADMIN.glob("*.html"):
    t = html.read_text(encoding="utf-8", errors="replace")
    paths |= set(re.findall(r'(?:src|href)="(assets/[^"]+)"', t))

print("unique asset refs", len(paths))
ok = fail = skip = 0
for rel in sorted(paths):
    rel = rel.split("?")[0]
    dest = ADMIN / Path(*rel.split("/"))
    if dest.exists() and dest.stat().st_size > 0:
        skip += 1
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + rel
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://demos.themeselection.com/"}
    )
    try:
        data = urllib.request.urlopen(req, context=CTX, timeout=60).read()
        dest.write_bytes(data)
        ok += 1
        if ok <= 40 or ok % 20 == 0:
            print("OK", rel, len(data))
    except Exception as e:
        fail += 1
        print("FAIL", rel, e)

print("done ok", ok, "fail", fail, "skip", skip)
