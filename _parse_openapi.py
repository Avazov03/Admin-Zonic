# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
text = (ROOT / "_swagger_ui_init.js").read_text(encoding="utf-8", errors="replace")

m = re.search(r'"swaggerDoc":\s*(\{)', text)
if not m:
    raise SystemExit("no swaggerDoc")
start = m.start(1)
depth = 0
end = None
for i in range(start, len(text)):
    c = text[i]
    if c == "{":
        depth += 1
    elif c == "}":
        depth -= 1
        if depth == 0:
            end = i + 1
            break
raw = text[start:end]
doc = json.loads(raw)
(ROOT / "_openapi.json").write_text(
    json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
)

info = doc.get("info") or {}
print("openapi", doc.get("openapi"))
print("title", info.get("title"))
print("version", info.get("version"))
print("description", (info.get("description") or "")[:300])
print("servers", doc.get("servers"))
print("paths", len(doc.get("paths") or {}))
print(
    "schemas",
    len(((doc.get("components") or {}).get("schemas") or {})),
)
print("security", doc.get("security"))
print(
    "securitySchemes",
    list(((doc.get("components") or {}).get("securitySchemes") or {}).keys()),
)
ss = ((doc.get("components") or {}).get("securitySchemes") or {})
for k, v in ss.items():
    print(" scheme", k, "->", json.dumps(v, ensure_ascii=False)[:200])

by_tag: dict[str, list] = defaultdict(list)
for path, methods in doc["paths"].items():
    for method, op in methods.items():
        if method.startswith("x-") or not isinstance(op, dict):
            continue
        tags = op.get("tags") or ["(untagged)"]
        for t in tags:
            by_tag[t].append(
                (
                    method.upper(),
                    path,
                    op.get("summary") or op.get("operationId") or "",
                )
            )

print("\n=== TAGS / MODULES ===")
for t in sorted(by_tag.keys(), key=lambda x: (-len(by_tag[x]), x)):
    print(f"{t}: {len(by_tag[t])} endpoints")

# Heuristic admin vs client
admin_kw = (
    "admin",
    "dashboard",
    "role",
    "permission",
    "moderat",
    "report",
    "setting",
    "banner",
    "category",
    "product",
    "order",
    "invoice",
    "user",
    "account",
    "file",
    "upload",
    "notification",
    "stat",
    "analytic",
)
print("\n=== FULL LIST BY TAG ===")
for t in sorted(by_tag.keys()):
    print(f"\n## {t} ({len(by_tag[t])})")
    for method, path, summ in sorted(by_tag[t], key=lambda x: (x[1], x[0])):
        print(f"  {method:7} {path}  — {summ}")

# Auth-related schemas peek
schemas = (doc.get("components") or {}).get("schemas") or {}
for name in [
    "GenerateTokenInDto",
    "GenerateTokenOutDto",
    "RefreshTokenInDto",
    "CreateUserDto",
    "RegisterResponseDto",
]:
    if name in schemas:
        print(f"\nSCHEMA {name}:")
        print(json.dumps(schemas[name], indent=2, ensure_ascii=False)[:800])
