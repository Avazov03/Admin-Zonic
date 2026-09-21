# -*- coding: utf-8 -*-
"""Deep analysis of Zonic OpenAPI (admin + rest)."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
text = (ROOT / "_swagger_ui_init.js").read_text(encoding="utf-8", errors="replace")
m = re.search(r'"swaggerDoc":\s*(\{)', text)
start = m.start(1)
depth = 0
end = None
for i in range(start, len(text)):
    if text[i] == "{":
        depth += 1
    elif text[i] == "}":
        depth -= 1
        if depth == 0:
            end = i + 1
            break
doc = json.loads(text[start:end])
(ROOT / "_openapi.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")

schemas = (doc.get("components") or {}).get("schemas") or {}


def resolve(schema, depth=0):
    if not isinstance(schema, dict) or depth > 4:
        return schema
    if "$ref" in schema:
        name = schema["$ref"].split("/")[-1]
        return {"$name": name, **resolve(schemas.get(name) or {}, depth + 1)}
    out = {}
    if "type" in schema:
        out["type"] = schema["type"]
    if "required" in schema:
        out["required"] = schema["required"]
    if "properties" in schema:
        props = {}
        for k, v in schema["properties"].items():
            item = {}
            if "$ref" in v:
                item["ref"] = v["$ref"].split("/")[-1]
            else:
                item["type"] = v.get("type") or v.get("format")
                if "enum" in v:
                    item["enum"] = v["enum"]
                if "example" in v:
                    item["example"] = v["example"]
                if "description" in v:
                    item["desc"] = v["description"][:160]
                if "items" in v and isinstance(v["items"], dict):
                    if "$ref" in v["items"]:
                        item["items"] = v["items"]["$ref"].split("/")[-1]
                    else:
                        item["items"] = v["items"].get("type")
            props[k] = item
        out["properties"] = props
    if "enum" in schema:
        out["enum"] = schema["enum"]
    return out


def params_of(op):
    rows = []
    for p in op.get("parameters") or []:
        sch = p.get("schema") or {}
        rows.append(
            {
                "name": p.get("name"),
                "in": p.get("in"),
                "required": p.get("required"),
                "type": sch.get("type") or (sch.get("$ref") or "").split("/")[-1],
                "desc": (p.get("description") or "")[:180],
            }
        )
    return rows


def body_of(op):
    rb = op.get("requestBody") or {}
    content = (rb.get("content") or {})
    if not content:
        return None
    ctype = next(iter(content.keys()))
    schema = content[ctype].get("schema") or {}
    ref = schema.get("$ref", "").split("/")[-1] if "$ref" in schema else None
    return {
        "required": rb.get("required"),
        "contentType": ctype,
        "ref": ref,
        "shape": resolve(schema) if not ref else {"ref": ref, "shape": resolve(schemas.get(ref) or {})},
    }


def responses_of(op):
    out = []
    for code, resp in (op.get("responses") or {}).items():
        content = (resp.get("content") or {})
        ref = None
        if content:
            sch = next(iter(content.values())).get("schema") or {}
            if "$ref" in sch:
                ref = sch["$ref"].split("/")[-1]
            elif sch.get("type"):
                ref = sch.get("type")
        out.append({"code": code, "desc": (resp.get("description") or "")[:160], "schema": ref})
    return out


by_tag = defaultdict(list)
for path, methods in doc["paths"].items():
    for method, op in methods.items():
        if not isinstance(op, dict) or method.startswith("x-"):
            continue
        tags = op.get("tags") or ["(untagged)"]
        security = op.get("security", "INHERIT")
        for t in tags:
            by_tag[t].append(
                {
                    "method": method.upper(),
                    "path": path,
                    "summary": op.get("summary") or "",
                    "operationId": op.get("operationId") or "",
                    "security": security,
                    "params": params_of(op),
                    "body": body_of(op),
                    "responses": responses_of(op),
                }
            )

info = doc.get("info") or {}
lines = []
lines.append(f"# {info.get('title')} v{info.get('version')}")
lines.append(f"Base: http://18.197.174.196:5065")
lines.append(f"Paths: {len(doc['paths'])}  Schemas: {len(schemas)}")
lines.append(f"Auth scheme: bearer JWT")
lines.append("")
lines.append((info.get("description") or "")[:900])
lines.append("")

# Admin first then others
order = ["Admin"] + sorted(t for t in by_tag if t != "Admin")
for t in order:
    items = sorted(by_tag[t], key=lambda x: (x["path"], x["method"]))
    lines.append(f"\n# TAG {t} ({len(items)})")
    for op in items:
        lines.append(f"\n## {op['method']} {op['path']}")
        if op["summary"]:
            lines.append(f"summary: {op['summary']}")
        lines.append(f"op: {op['operationId']}")
        if op["params"]:
            lines.append("params:")
            for p in op["params"]:
                req = "required" if p["required"] else "optional"
                lines.append(f"  - {p['in']} {p['name']} ({p['type']}, {req}) {p['desc']}")
        if op["body"]:
            b = op["body"]
            lines.append(f"body: {b['contentType']} ref={b.get('ref')}")
            shape = b.get("shape") or {}
            inner = shape.get("shape") if "shape" in shape else shape
            props = (inner or {}).get("properties") or {}
            reqs = set((inner or {}).get("required") or [])
            if props:
                lines.append("  fields:")
                for k, v in props.items():
                    mark = "*" if k in reqs else ""
                    extra = ""
                    if v.get("example") is not None:
                        extra += f" ex={v['example']}"
                    if v.get("enum"):
                        extra += f" enum={v['enum']}"
                    if v.get("desc"):
                        extra += f" — {v['desc']}"
                    lines.append(f"    {mark}{k}: {v.get('type') or v.get('ref') or v.get('items')}{extra}")
        if op["responses"]:
            lines.append("responses: " + ", ".join(f"{r['code']} {r['schema'] or ''} {r['desc']}".strip() for r in op["responses"]))

out = ROOT / "_api_deep.txt"
out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out, "lines", len(lines), "tags", list(by_tag.keys()))
print("admin", len(by_tag["Admin"]))
