# -*- coding: utf-8 -*-
import json
from pathlib import Path

doc = json.loads(Path(r"d:\SCP loyhalar\Zon Add\_openapi.json").read_text(encoding="utf-8"))
keys = [
    "leader",
    "rating",
    "rank",
    "scope",
    "country",
    "region",
    "global",
    "step",
    "territor",
    "freerun",
    "distance",
]
for path, methods in sorted(doc["paths"].items()):
    for method, op in methods.items():
        if not isinstance(op, dict):
            continue
        blob = " ".join(
            [
                path,
                op.get("summary") or "",
                op.get("operationId") or "",
                " ".join(op.get("tags") or []),
            ]
        ).lower()
        if not any(k in blob for k in keys):
            continue
        print(f"{method.upper():6} {path}")
        print(f"       {(op.get('summary') or '')[:120]}")
        for p in op.get("parameters") or []:
            if "$ref" in p:
                continue
            print(
                f"       param {p.get('name')} ({p.get('in')}): {(p.get('description') or '')[:90]}"
            )
        # also query schema enums from components if inline
        rb = (op.get("requestBody") or {})
        print()
