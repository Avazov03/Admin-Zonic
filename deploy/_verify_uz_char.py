# -*- coding: utf-8 -*-
from pathlib import Path
import re
t = Path(r"d:\SCP loyhalar\Zon Add\_api_src\geo-uz-names.ts").read_text(encoding="utf-8")
m = re.search(r"211: '([^']+)'", t)
print(repr(m.group(1)) if m else "missing")
