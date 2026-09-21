# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parent / "admin" / "index.html"
t = p.read_text(encoding="utf-8")

new_menu = """
    <ul class="menu-inner py-1">
      <li class="menu-item active">
        <a href="index.html" class="menu-link">
          <i class="menu-icon icon-base bx bx-home-smile"></i>
          <div>Dashboard</div>
        </a>
      </li>

      <li class="menu-header small text-uppercase">
        <span class="menu-header-text">Boshqaruv</span>
      </li>

      <li class="menu-item">
        <a href="#" class="menu-link" data-zon-page="users">
          <i class="menu-icon icon-base bx bx-user"></i>
          <div>Foydalanuvchilar</div>
        </a>
      </li>
      <li class="menu-item">
        <a href="#" class="menu-link" data-zon-page="products">
          <i class="menu-icon icon-base bx bx-package"></i>
          <div>Mahsulotlar</div>
        </a>
      </li>
      <li class="menu-item">
        <a href="#" class="menu-link" data-zon-page="orders">
          <i class="menu-icon icon-base bx bx-cart"></i>
          <div>Buyurtmalar</div>
        </a>
      </li>
      <li class="menu-item">
        <a href="#" class="menu-link" data-zon-page="categories">
          <i class="menu-icon icon-base bx bx-category"></i>
          <div>Kategoriyalar</div>
        </a>
      </li>

      <li class="menu-header small text-uppercase">
        <span class="menu-header-text">Tizim</span>
      </li>

      <li class="menu-item">
        <a href="#" class="menu-link" data-zon-page="settings">
          <i class="menu-icon icon-base bx bx-cog"></i>
          <div>Sozlamalar</div>
        </a>
      </li>
      <li class="menu-item">
        <a href="#" class="menu-link" data-zon-page="logout" id="zon-logout">
          <i class="menu-icon icon-base bx bx-log-out"></i>
          <div>Chiqish</div>
        </a>
      </li>
    </ul>
"""

start = t.find('<ul class="menu-inner py-1">')
if start < 0:
    raise SystemExit("menu start not found")

i = start
depth = 0
end = None
while i < len(t):
    if t.startswith("<ul", i):
        depth += 1
        i = t.find(">", i) + 1
        continue
    if t.startswith("</ul>", i):
        depth -= 1
        i += 5
        if depth == 0:
            end = i
            break
        continue
    i += 1

if end is None:
    raise SystemExit("menu end not found")

t = t[:start] + new_menu + t[end:]
p.write_text(t, encoding="utf-8")
print(f"OK: replaced {end - start} chars with {len(new_menu)} chars")
