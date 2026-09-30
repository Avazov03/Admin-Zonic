/**
 * Market sotuvlari — GET /Admin/Market/Stats?days=7|30|90|0
 * zon-market.js "Sotuvlar" ko‘rinishini shu modul chizadi; mahsulot jadvalidagi
 * "Sotildi" ustuni ham shu javobdagi totalPurchases dan olinadi.
 */
(function () {
  var U = window.ZonUI;
  var PERIODS = [
    { id: 7, label: "7 kun" },
    { id: 30, label: "30 kun" },
    { id: 90, label: "90 kun" },
    { id: 0, label: "Umumiy" },
  ];
  var MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  var CATEGORIES = {
    frame: "Ramka",
    challenge: "Challenge",
    boost: "Kuchaytirgich",
    booster: "Kuchaytirgich",
    badge: "Nishon",
    theme: "Mavzu",
  };

  var state = { days: 30, chart: "purchases" };
  var data = null;
  var cache = {};
  var req = 0;
  var el = null;

  function fetchStats(days) {
    if (!cache[days]) {
      cache[days] = ZonApi.get("/Admin/Market/Stats?days=" + days).catch(function (err) {
        delete cache[days];
        throw err;
      });
    }
    return cache[days];
  }

  /** item code → all-time purchases, for the products table. */
  function soldCounts() {
    return fetchStats(state.days).then(function (d) {
      var map = {};
      (d.items || []).forEach(function (it) {
        map[it.code] = it.totalPurchases;
      });
      return map;
    });
  }

  function invalidate() {
    cache = {};
  }

  function mount(target) {
    el = target;
    if (el.getAttribute("data-mounted") === "1") return;
    el.setAttribute("data-mounted", "1");
    el.innerHTML =
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">' +
      '<div class="zon-seg" id="zs-period">' +
      PERIODS.map(function (p) {
        return '<button type="button" data-d="' + p.id + '"' + (p.id === state.days ? ' class="active"' : "") + ">" + p.label + "</button>";
      }).join("") +
      "</div>" +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="zs-csv" disabled><i class="bx bx-download me-1"></i>CSV</button></div>' +
      '<div id="zs-alert"></div>' +
      '<div class="row g-6 mb-6" id="zs-cards"></div>' +
      '<div class="card mb-6"><div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title mb-1">Kunlik sotuv</h5><p class="mb-0 text-body-secondary small" id="zs-chart-sub"></p></div>' +
      '<div class="zon-seg" id="zs-chart-seg"><button type="button" class="active" data-c="purchases">Xaridlar</button>' +
      '<button type="button" data-c="tanga">Tanga</button></div></div>' +
      '<div class="card-body"><div id="zs-chart"></div></div></div>' +
      '<div class="row g-6 mb-6">' +
      '<div class="col-12 col-xl-7"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-1">Eng ko‘p sotilganlar</h5>' +
      '<p class="mb-0 text-body-secondary small" id="zs-items-sub"></p></div>' +
      '<div class="table-responsive"><table class="table table-hover align-middle mb-0 zon-ms-table">' +
      '<thead><tr><th>Mahsulot</th><th class="text-end">Sotildi</th><th class="text-end d-none d-md-table-cell">Xaridor</th><th class="text-end">Tanga</th></tr></thead>' +
      '<tbody id="zs-items"></tbody></table></div></div></div>' +
      '<div class="col-12 col-xl-5"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-1">Top xaridorlar</h5>' +
      '<p class="mb-0 text-body-secondary small">Sarflangan tanga bo‘yicha</p></div>' +
      '<div class="card-body pt-0" id="zs-buyers"></div></div></div></div>' +
      '<div class="card"><div class="card-header"><h5 class="card-title mb-1">So‘nggi xaridlar</h5>' +
      '<p class="mb-0 text-body-secondary small">Oxirgi 30 ta</p></div>' +
      '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Mahsulot</th><th class="text-end">Narx</th></tr></thead>' +
      '<tbody id="zs-recent"></tbody></table></div></div>';

    document.getElementById("zs-period").addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]");
      if (!b) return;
      state.days = Number(b.getAttribute("data-d"));
      setActive("zs-period", "data-d", String(state.days));
      load();
    });
    document.getElementById("zs-chart-seg").addEventListener("click", function (e) {
      var b = e.target.closest("[data-c]");
      if (!b) return;
      state.chart = b.getAttribute("data-c");
      setActive("zs-chart-seg", "data-c", state.chart);
      renderChart();
    });
    document.getElementById("zs-csv").addEventListener("click", exportCsv);
    el.addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-href]");
      if (tr && !e.target.closest("a")) location.href = tr.getAttribute("data-href");
    });
    load();
  }

  function setActive(id, attr, v) {
    Array.prototype.forEach.call(document.querySelectorAll("#" + id + " [" + attr + "]"), function (b) {
      b.classList.toggle("active", b.getAttribute(attr) === v);
    });
  }

  function load() {
    var token = ++req;
    document.getElementById("zs-alert").innerHTML = "";
    document.getElementById("zs-csv").disabled = true;
    skeleton();
    fetchStats(state.days)
      .then(function (d) {
        if (token !== req) return;
        data = d;
        render();
      })
      .catch(function (err) {
        if (token !== req) return;
        if (U.authFail(err)) return;
        document.getElementById("zs-alert").innerHTML = '<div class="mb-4">' + U.alertHtml("danger", U.errMsg(err)) + "</div>";
      });
  }

  function skeleton() {
    var card = '<div class="col-sm-6 col-xl-3"><div class="card"><div class="card-body"><span class="zon-skel" style="width:50%;height:12px"></span><span class="zon-skel d-block mt-3" style="width:40%;height:24px"></span><span class="zon-skel d-block mt-2" style="width:70%;height:10px"></span></div></div></div>';
    document.getElementById("zs-cards").innerHTML = card + card + card + card;
    document.getElementById("zs-chart").innerHTML = '<span class="zon-skel d-block" style="height:200px"></span>';
    var row = '<tr><td colspan="4"><span class="zon-skel d-block" style="height:32px"></span></td></tr>';
    document.getElementById("zs-items").innerHTML = row + row + row;
    document.getElementById("zs-recent").innerHTML = row + row + row;
    document.getElementById("zs-buyers").innerHTML = '<span class="zon-skel d-block mb-2" style="height:40px"></span><span class="zon-skel d-block" style="height:40px"></span>';
  }

  function periodLabel() {
    return state.days ? "So‘nggi " + state.days + " kun" : "Barcha vaqt";
  }

  function delta(cur, prev) {
    if (prev == null) return "";
    if (!prev) return cur ? '<span class="zon-ms-delta is-up"><i class="bx bx-up-arrow-alt"></i>yangi</span>' : "";
    var pct = Math.round(((cur - prev) / prev) * 100);
    if (!pct) return '<span class="zon-ms-delta">0%</span>';
    return (
      '<span class="zon-ms-delta ' + (pct > 0 ? "is-up" : "is-down") + '"><i class="bx bx-' + (pct > 0 ? "up" : "down") + '-arrow-alt"></i>' +
      Math.abs(pct) + "%</span>"
    );
  }

  function card(title, value, deltaHtml, sub, icon, tone) {
    return (
      '<div class="col-sm-6 col-xl-3"><div class="card h-100"><div class="card-body">' +
      '<div class="d-flex align-items-start justify-content-between"><div class="content-left">' +
      '<span class="text-heading">' + U.esc(title) + "</span>" +
      '<div class="d-flex align-items-center flex-wrap gap-2 my-1"><h4 class="mb-0">' + value + "</h4>" + deltaHtml + "</div>" +
      "<small>" + U.esc(sub) + "</small></div>" +
      '<div class="avatar"><span class="avatar-initial rounded bg-label-' + tone + '"><i class="icon-base bx ' + icon + ' icon-lg"></i></span></div>' +
      "</div></div></div></div>"
    );
  }

  function render() {
    var s = data.summary;
    var prevNote = state.days ? "oldingi " + state.days + " kunga nisbatan" : "barcha vaqt";
    var share = s.users ? Math.round((s.buyers / s.users) * 1000) / 10 : 0;
    document.getElementById("zs-cards").innerHTML =
      card("Xaridlar", U.n(s.purchases), delta(s.purchases, s.prevPurchases), prevNote, "bx-cart", "primary") +
      card("Sarflangan tanga", U.n(s.tanga), delta(s.tanga, s.prevTanga), prevNote, "bx-coin-stack", "warning") +
      card("Xaridorlar", U.n(s.buyers), "", share + "% foydalanuvchilardan", "bx-user-check", "success") +
      card("Bugun", U.n(s.today), "", "Jami " + U.n(s.totalPurchases) + " xarid · " + U.n(s.totalTanga) + " tanga", "bx-calendar-check", "info");
    document.getElementById("zs-csv").disabled = !(data.items || []).some(function (it) {
      return it.purchases;
    });
    renderChart();
    renderItems();
    renderBuyers();
    renderRecent();
  }

  function dayLabel(d) {
    d = String(d || "");
    return Number(d.slice(8, 10)) + "-" + (MONTHS[Number(d.slice(5, 7)) - 1] || "");
  }

  function renderChart() {
    if (!data) return;
    var key = state.chart;
    var unit = key === "tanga" ? " tanga" : " ta";
    var rows = data.daily || [];
    var max = 0;
    var total = 0;
    rows.forEach(function (r) {
      max = Math.max(max, r[key]);
      total += r[key];
    });
    document.getElementById("zs-chart-sub").textContent =
      (state.days ? "So‘nggi " + data.chartDays + " kun" : "Umumiy tanlanganda — so‘nggi " + data.chartDays + " kun") +
      " · jami " + U.n(total) + unit;
    var box = document.getElementById("zs-chart");
    if (!max) {
      box.innerHTML = '<div class="zon-trend-empty"><i class="icon-base bx bx-bar-chart-alt-2"></i><p class="mb-0">Bu davrda xarid bo‘lmagan</p></div>';
      return;
    }
    var step = rows.length > 45 ? 10 : rows.length > 14 ? 5 : 1;
    box.innerHTML =
      '<div class="zon-trend' + (rows.length > 45 ? " is-dense" : "") + '">' +
      rows
        .map(function (r, i) {
          var v = r[key];
          var h = v ? Math.max(4, Math.round((v / max) * 100)) : 0;
          var label = dayLabel(r.day);
          return (
            '<div class="zon-trend-col" title="' + U.esc(label + ": " + U.n(r.purchases) + " xarid · " + U.n(r.tanga) + " tanga") + '">' +
            '<div class="zon-trend-bar' + (v ? "" : " is-zero") + '" style="height:' + h + '%"></div>' +
            '<span class="zon-trend-x">' + (i % step === 0 || i === rows.length - 1 ? U.esc(label) : "") + "</span></div>"
          );
        })
        .join("") +
      "</div>";
  }

  function thumb(fileId, title) {
    return (
      '<span class="zon-item-thumb zon-ms-thumb">' +
      (fileId ? '<img src="' + U.esc(U.imageUrl(fileId)) + '" alt="' + U.esc(title || "") + '" loading="lazy" />' : '<i class="bx bx-package"></i>') +
      "</span>"
    );
  }

  function catName(c) {
    if (!c) return "Boshqa";
    return CATEGORIES[c] || c.charAt(0).toUpperCase() + c.slice(1);
  }

  function profileHref(userId, username) {
    return "app-zon-user-runs.html?id=" + encodeURIComponent(userId) + "&name=" + encodeURIComponent(username || "");
  }

  function renderItems() {
    var sold = (data.items || []).filter(function (it) {
      return it.purchases;
    });
    var unsold = (data.items || []).length - sold.length;
    document.getElementById("zs-items-sub").textContent =
      periodLabel() + " · " + U.n(sold.length) + " ta mahsulot sotildi" + (unsold ? " · " + U.n(unsold) + " tasi sotilmadi" : "");
    var body = document.getElementById("zs-items");
    if (!sold.length) {
      body.innerHTML = '<tr><td colspan="4"><div class="zon-daymodal-empty"><i class="bx bx-cart"></i>Bu davrda hech narsa sotilmagan</div></td></tr>';
      return;
    }
    var top = sold[0].purchases || 1;
    body.innerHTML = sold
      .slice(0, 10)
      .map(function (it) {
        var pct = Math.max(3, Math.round((it.purchases / top) * 100));
        return (
          "<tr><td><div class=\"d-flex align-items-center gap-3\">" + thumb(it.imageFileId, it.title) +
          '<div class="min-w-0"><div class="fw-semibold text-heading text-truncate">' + U.esc(it.title || it.code) +
          (it.isActive ? "" : ' <span class="badge bg-label-secondary ms-1">O‘chiq</span>') + "</div>" +
          '<small class="text-body-secondary">' + U.esc(catName(it.category)) + " · " + U.n(it.price) + " tanga</small></div></div></td>" +
          '<td class="text-end"><div class="fw-semibold text-heading">' + U.n(it.purchases) + '</div><div class="zon-lb-bar"><span style="width:' + pct + '%"></span></div></td>' +
          '<td class="text-end d-none d-md-table-cell">' + U.n(it.buyers) + "</td>" +
          '<td class="text-end text-nowrap">' + U.n(it.tanga) + "</td></tr>"
        );
      })
      .join("");
  }

  function renderBuyers() {
    var box = document.getElementById("zs-buyers");
    var list = data.topBuyers || [];
    if (!list.length) {
      box.innerHTML = '<div class="zon-daymodal-empty"><i class="bx bx-user"></i>Xaridorlar yo‘q</div>';
      return;
    }
    box.innerHTML =
      '<ul class="list-unstyled mb-0 zon-ms-buyers">' +
      list
        .map(function (b, i) {
          return (
            '<li><a class="zon-ms-buyer" href="' + U.esc(profileHref(b.userId, b.username)) + '">' +
            '<span class="zon-lb-rank' + (i < 3 ? " is-top is-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
            U.userAvatarHtml(b.avatarFileId, b.username, 36, { zoom: false }) +
            '<span class="min-w-0 flex-grow-1"><span class="fw-semibold text-heading d-block text-truncate">' + U.esc(b.username || "—") + "</span>" +
            '<small class="text-body-secondary">' + U.n(b.purchases) + " ta xarid</small></span>" +
            '<span class="fw-semibold text-heading text-nowrap">' + U.n(b.tanga) + ' <small class="text-body-secondary fw-normal">tanga</small></span>' +
            "</a></li>"
          );
        })
        .join("") +
      "</ul>";
    U.hydrateAvatars(box);
  }

  function when(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return U.dt(iso);
    var p = function (x) {
      return (x < 10 ? "0" : "") + x;
    };
    return d.getDate() + "-" + MONTHS[d.getMonth()] + ", " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function renderRecent() {
    var body = document.getElementById("zs-recent");
    var list = data.recent || [];
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="4"><div class="zon-daymodal-empty"><i class="bx bx-receipt"></i>Bu davrda xarid yo‘q</div></td></tr>';
      return;
    }
    body.innerHTML = list
      .map(function (r) {
        return (
          '<tr data-href="' + U.esc(profileHref(r.userId, r.username)) + '" class="zon-lb-tr">' +
          '<td class="text-nowrap text-body-secondary">' + U.esc(when(r.purchasedAt)) + "</td>" +
          '<td><div class="d-flex align-items-center gap-2">' + U.userAvatarHtml(r.avatarFileId, r.username, 30, { zoom: false }) +
          '<a class="fw-semibold text-heading" href="' + U.esc(profileHref(r.userId, r.username)) + '">' + U.esc(r.username || "—") + "</a></div></td>" +
          '<td><div class="d-flex align-items-center gap-2">' + thumb(r.imageFileId, r.title) +
          '<div class="min-w-0"><div class="text-heading text-truncate">' + U.esc(r.title || r.code) + '</div><small class="text-body-secondary">' +
          U.esc(catName(r.category)) + "</small></div></div></td>" +
          '<td class="text-end text-nowrap fw-semibold">' + U.n(r.price) + ' <small class="text-body-secondary fw-normal">tanga</small></td></tr>'
        );
      })
      .join("");
    U.hydrateAvatars(body);
  }

  function exportCsv() {
    if (!data) return;
    var head = ["Kod", "Nomi", "Kategoriya", "Narx", "Sotildi (davr)", "Xaridorlar (davr)", "Tanga (davr)", "Jami sotildi", "Oxirgi xarid"];
    var lines = [head].concat(
      (data.items || []).map(function (it) {
        return [it.code, it.title, catName(it.category), it.price, it.purchases, it.buyers, it.tanga, it.totalPurchases, it.lastAt || ""];
      })
    );
    var csv = lines
      .map(function (row) {
        return row
          .map(function (v) {
            var s = v == null ? "" : String(v);
            return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          })
          .join(",");
      })
      .join("\r\n");
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "zon-market-sotuv-" + (state.days ? state.days + "kun" : "umumiy") + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  window.ZonMarketStats = { mount: mount, soldCounts: soldCounts, invalidate: invalidate };
})();
