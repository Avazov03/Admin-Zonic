# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
doc = json.loads((ROOT / "_openapi.json").read_text(encoding="utf-8"))
by: dict[str, list] = defaultdict(list)
for path, methods in doc["paths"].items():
    for method, op in methods.items():
        if not isinstance(op, dict) or method.startswith("x-"):
            continue
        for t in op.get("tags") or ["(untagged)"]:
            by[t].append((method.upper(), path, (op.get("summary") or "")[:140]))

lines = []
info = doc["info"]
lines.append(f"API: {info.get('title')} v{info.get('version')}")
lines.append("Base: http://18.197.174.196:5065")
lines.append("Swagger: http://18.197.174.196:5065/swagger")
lines.append("Auth: Bearer JWT (http bearer)")
lines.append(
    f"Paths: {len(doc['paths'])}  Schemas: {len(doc['components']['schemas'])}"
)
lines.append("")
lines.append((info.get("description") or "")[:800])
lines.append("")
for t in sorted(by):
    lines.append(f"## {t} ({len(by[t])})")
    for m, p, s in sorted(by[t], key=lambda x: (x[1], x[0])):
        lines.append(f"  {m:7} {p} | {s}")
    lines.append("")

(ROOT / "_api_catalog.txt").write_text("\n".join(lines), encoding="utf-8")
print("catalog lines", len(lines))
print("admin endpoints", sum(1 for t, items in by.items() if t == "Admin" for _ in items))

# Auth DTOs
schemas = doc["components"]["schemas"]
for n in sorted(schemas):
    if "Admin" in n or n in {
        "GenerateTokenInDto",
        "GenerateTokenOutDto",
        "RefreshTokenInDto",
        "CreateUserDto",
    }:
        print("\nSCHEMA", n)
        print(json.dumps(schemas[n], ensure_ascii=False, indent=2)[:700])

# Admin login op
op = doc["paths"]["/Admin/Auth/Login"]["post"]
print("\nAdmin Login request:", json.dumps(op.get("requestBody"), ensure_ascii=False)[:500])
print("Admin Login responses keys:", list(op.get("responses", {}).keys()))
