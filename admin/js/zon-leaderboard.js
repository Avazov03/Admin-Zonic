/**
 * Reyting — GET /Admin/Leaderboard?metric&period&regionId&limit
 * Filtrlar URL'da saqlanadi (?metric=&period=&region=) — havolani ulashish mumkin.
 */
(function () {
  var U = window.ZonUI;
  var UZ_COUNTRY_ID = 211;
  var METRICS = [
    { id: "km", label: "Masofa", icon: "bx-run", unit: "km", dec: 2 },
    { id: "steps", label: "Qadam", icon: "bx-walk", unit: "qadam", dec: 0 },
    { id: "area", label: "Hudud maydoni", icon: "bx-area", unit: "km²", dec: 4 },
    { id: "territories", label: "Hudud soni", icon: "bx-map-alt", unit: "ta", dec: 0 },
    { id: "runs", label: "Yugurishlar", icon: "bx-stopwatch", unit: "ta", dec: 0 },
    { id: "xp", label: "XP", icon: "bx-star", unit: "XP", dec: 0 },
  ];
  var PERIODS = [
    { id: "7d", label: "7 kun" },
    { id: "week", label: "Bu hafta" },
    { id: "month", label: "Bu oy" },
    { id: "all", label: "Umumiy" },
  ];
  var MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

  var qs = new URLSearchParams(location.search);
  var state = {
    metric: pick(qs.get("metric"), METRICS, "km"),
    period: pick(qs.get("period"), PERIODS, "week"),
    region: qs.get("region") || "",
    q: "",
  };
  var data = null;
  var req = 0;

  function pick(v, list, def) {
    return list.some(function (x) {
      return x.id === v;
    })
      ? v
      : def;
  }
  function metricOf(id) {
    return METRICS.filter(function (m) {
      return m.id === id;
    })[0];
  }

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-6">' +
      '<div><h4 class="mb-1">Reyting</h4><p class="mb-0 text-body-secondary" id="z-sub">Yuklanmoqda…</p></div>' +
      '<button type="button" class="btn btn-label-secondary" id="z-csv" disabled><i class="icon-base bx bx-download me-1"></i>CSV</button>' +
      "</div>" +
      '<div class="card mb-6"><div class="card-body zon-lb-filters">' +
      '<div class="zon-seg zon-lb-metrics" id="z-metric">' +
      METRICS.map(function (m) {
        return '<button type="button" data-v="' + m.id + '"><i class="bx ' + m.icon + '"></i>' + m.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="zon-lb-row">' +
      '<div class="zon-seg" id="z-period">' +
      PERIODS.map(function (p) {
        return '<button type="button" data-v="' + p.id + '">' + p.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="zon-lb-region"><select id="z-region" class="form-select" data-zon-no-select2="1"><option value="">Barcha viloyatlar</option></select></div>' +
      '<div class="zon-lb-search"><div class="input-group input-group-merge"><span class="input-group-text"><i class="bx bx-search"></i></span>' +
      '<input type="search" class="form-control" id="z-q" placeholder="Ism yoki ZONIC-ID" /></div></div>' +
      "</div></div></div>" +
      '<div id="z-alert" class="mb-4"></div>' +
      '<div class="zon-lb-podium mb-6" id="z-podium"></div>' +
      '<div class="card"><div class="table-responsive"><table class="table table-hover mb-0 zon-lb-table">' +
      '<thead><tr><th style="width:4.5rem">#</th><th>Foydalanuvchi</th><th class="text-end" id="z-th-value">Qiymat</th><th class="d-none d-lg-table-cell">Boshqa ko‘rsatkichlar</th><th style="width:2.5rem"></th></tr></thead>' +
      '<tbody id="z-body"></tbody></table></div></div>';

    document.getElementById("z-metric").addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]");
      if (!b || b.disabled) return;
      state.metric = b.getAttribute("data-v");
      if (state.metric === "xp") state.period = "all";
      load();
    });
    document.getElementById("z-period").addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]");
      if (!b || b.disabled) return;
      state.period = b.getAttribute("data-v");
      load();
    });
    var regionSel = document.getElementById("z-region");
    regionSel.addEventListener("change", function () {
      state.region = this.value;
      load();
    });
    if (U.enhanceSelect) {
      U.enhanceSelect(regionSel, { search: true, minSearch: 0 });
      if (window.jQuery) jQuery(regionSel).on("select2:select select2:clear", function () {
        state.region = regionSel.value;
        load();
      });
    }
    var qTimer = 0;
    document.getElementById("z-q").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(qTimer);
      qTimer = setTimeout(function () {
        state.q = v.trim().toLowerCase();
        render();
      }, 150);
    });
    document.getElementById("z-body").addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      var tr = e.target.closest("[data-href]");
      if (tr) location.href = tr.getAttribute("data-href");
    });
    document.getElementById("z-csv").addEventListener("click", exportCsv);

    loadRegions();
    load();
  });

  function loadRegions() {
    ZonApi.get("/Admin/Lookups/Regions?countryId=" + UZ_COUNTRY_ID)
      .then(function (list) {
        var sel = document.getElementById("z-region");
        (Array.isArray(list) ? list : []).forEach(function (r) {
          var o = document.createElement("option");
          o.value = String(r.value != null ? r.value : r.id);
          o.textContent = r.text || r.name || o.value;
          sel.appendChild(o);
        });
        if (U.setSelectValue) U.setSelectValue(sel, state.region, true);
        else sel.value = state.region;
      })
      .catch(function (err) {
        U.authFail(err);
      });
  }

  function syncControls() {
    Array.prototype.forEach.call(document.querySelectorAll("#z-metric [data-v]"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-v") === state.metric);
    });
    Array.prototype.forEach.call(document.querySelectorAll("#z-period [data-v]"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-v") === state.period);
      b.disabled = state.metric === "xp" && b.getAttribute("data-v") !== "all";
      b.title = b.disabled ? "XP faqat umumiy hisoblanadi" : "";
    });
    var p = new URLSearchParams();
    p.set("metric", state.metric);
    p.set("period", state.period);
    if (state.region) p.set("region", state.region);
    history.replaceState(null, "", location.pathname + "?" + p.toString());
  }

  function load() {
    syncControls();
    var token = ++req;
    document.getElementById("z-alert").innerHTML = "";
    document.getElementById("z-csv").disabled = true;
    document.getElementById("z-podium").innerHTML = podiumSkeleton();
    document.getElementById("z-body").innerHTML = rowsSkeleton();
    var path =
      "/Admin/Leaderboard?metric=" + state.metric + "&period=" + state.period + "&limit=100" +
      (state.region ? "&regionId=" + encodeURIComponent(state.region) : "");
    ZonApi.get(path)
      .then(function (d) {
        if (token !== req) return;
        data = d || { items: [] };
        render();
      })
      .catch(function (err) {
        if (token !== req || U.authFail(err)) return;
        data = null;
        document.getElementById("z-podium").innerHTML = "";
        document.getElementById("z-body").innerHTML = "";
        document.getElementById("z-alert").innerHTML = U.alertHtml("danger", U.errMsg(err));
      });
  }

  function fmtVal(v, metricId) {
    var m = metricOf(metricId);
    var x = Number(v) || 0;
    var num = m.dec ? U.n(Math.round(x * Math.pow(10, m.dec)) / Math.pow(10, m.dec)) : U.n(Math.round(x));
    return num + " " + m.unit;
  }

  function periodText() {
    if (!data) return "";
    if (data.period === "all") return "Umumiy — barcha vaqt";
    var a = parseDay(data.since);
    var b = parseDay(data.today);
    if (!a || !b) return "";
    var from = a.d + (a.m !== b.m ? "-" + MONTHS[a.m] : "");
    var label = data.period === "7d" ? "So‘nggi 7 kun: " : data.period === "week" ? "Bu hafta: " : "Bu oy: ";
    return label + from + " – " + b.d + "-" + MONTHS[b.m];
  }
  function parseDay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ""));
    return m ? { d: Number(m[3]), m: Number(m[2]) - 1 } : null;
  }

  function filteredItems() {
    var items = (data && data.items) || [];
    if (!state.q) return items;
    return items.filter(function (it) {
      return (
        String(it.username || "").toLowerCase().indexOf(state.q) !== -1 ||
        String(it.zonicId == null ? "" : it.zonicId).indexOf(state.q) !== -1
      );
    });
  }

  function profileHref(it) {
    return (
      "app-zon-user-runs.html?id=" + encodeURIComponent(it.userId) +
      "&name=" + encodeURIComponent(it.username || "") +
      (it.avatarFileId ? "&avatar=" + encodeURIComponent(it.avatarFileId) : "")
    );
  }

  function render() {
    if (!data) return;
    var m = metricOf(data.metric);
    var regionName = "";
    var sel = document.getElementById("z-region");
    if (state.region && sel.selectedIndex > 0) regionName = sel.options[sel.selectedIndex].textContent;
    document.getElementById("z-sub").textContent =
      periodText() + " · " + U.n(data.participants) + " ta ishtirokchi" + (regionName ? " · " + regionName : "");
    document.getElementById("z-th-value").textContent = m.label;
    document.getElementById("z-csv").disabled = !(data.items || []).length;

    var all = data.items || [];
    var items = filteredItems();
    var podium = document.getElementById("z-podium");
    var body = document.getElementById("z-body");

    if (!all.length) {
      podium.innerHTML = "";
      body.innerHTML =
        '<tr><td colspan="5"><div class="zon-daymodal-empty"><i class="bx bx-trophy"></i>' +
        '<h6 class="mb-1">Bu davrda natija yo‘q</h6><p class="mb-0">Boshqa davr yoki ko‘rsatkichni tanlang.</p></div></td></tr>';
      return;
    }

    podium.innerHTML = state.q ? "" : all.slice(0, 3).map(podiumCard).join("");
    if (!items.length) {
      body.innerHTML =
        '<tr><td colspan="5"><div class="zon-daymodal-empty"><i class="bx bx-search"></i>' +
        '<h6 class="mb-1">Topilmadi</h6><p class="mb-0">“' + U.esc(state.q) + '” bo‘yicha user yo‘q.</p></div></td></tr>';
      return;
    }
    var top = Number(all[0].value) || 1;
    body.innerHTML = items
      .map(function (it) {
        var pct = Math.max(2, Math.round(((Number(it.value) || 0) / top) * 100));
        return (
          '<tr data-href="' + U.esc(profileHref(it)) + '" class="zon-lb-tr">' +
          '<td><span class="zon-lb-rank' + (it.rank <= 3 ? " is-top is-" + it.rank : "") + '">' + it.rank + "</span></td>" +
          '<td><div class="d-flex align-items-center gap-3">' +
          U.userAvatarHtml(it.avatarFileId, it.username, 38, { zoom: false }) +
          '<div class="min-w-0"><a class="fw-semibold text-heading" href="' + U.esc(profileHref(it)) + '">' + U.esc(it.username || "—") + "</a>" +
          (it.isBlocked ? ' <span class="badge bg-label-danger ms-1">Blok</span>' : "") +
          '<small class="d-block text-body-secondary">ZONIC-ID ' + U.esc(it.zonicId == null ? "—" : it.zonicId) +
          (it.regionName ? " · " + U.esc(it.regionName) : "") + "</small></div></div></td>" +
          '<td class="text-end"><div class="fw-semibold text-heading text-nowrap">' + U.esc(fmtVal(it.value, data.metric)) + "</div>" +
          '<div class="zon-lb-bar"><span style="width:' + pct + '%"></span></div></td>' +
          '<td class="d-none d-lg-table-cell"><div class="zon-dayuser-stats justify-content-start">' + secondaryChips(it, data.metric) + "</div></td>" +
          '<td class="text-end"><i class="bx bx-chevron-right zon-dayuser-go"></i></td></tr>'
        );
      })
      .join("");
    if (U.hydrateAvatars) {
      U.hydrateAvatars(body);
      U.hydrateAvatars(podium);
    }
  }

  function secondaryChips(it, metric) {
    var chips = [];
    if (metric !== "km" && it.km) chips.push('<span class="zon-chip is-run"><i class="bx bx-run"></i>' + U.n(it.km) + " km</span>");
    if (metric !== "steps" && it.steps) chips.push('<span class="zon-chip is-step"><i class="bx bx-walk"></i>' + U.n(it.steps) + "</span>");
    if (metric !== "area" && metric !== "territories" && it.territories)
      chips.push('<span class="zon-chip is-terr"><i class="bx bx-map-alt"></i>' + U.n(it.territories) + " · " + U.n(it.areaKm2) + " km²</span>");
    if (metric !== "runs" && it.runs) chips.push('<span class="zon-chip"><i class="bx bx-stopwatch"></i>' + U.n(it.runs) + " ta</span>");
    return chips.join("") || '<span class="text-body-secondary small">—</span>';
  }

  function podiumCard(it) {
    return (
      '<a class="card zon-lb-podium-card is-' + it.rank + '" href="' + U.esc(profileHref(it)) + '">' +
      '<div class="card-body text-center">' +
      '<span class="zon-lb-medal">' + it.rank + "</span>" +
      '<div class="zon-lb-podium-av">' + U.userAvatarHtml(it.avatarFileId, it.username, it.rank === 1 ? 84 : 68, { zoom: false }) + "</div>" +
      '<div class="fw-semibold text-heading mt-3 text-truncate">' + U.esc(it.username || "—") + "</div>" +
      '<small class="text-body-secondary d-block text-truncate">' + U.esc(it.regionName || "ZONIC-ID " + (it.zonicId == null ? "—" : it.zonicId)) + "</small>" +
      '<div class="zon-lb-podium-val">' + U.esc(fmtVal(it.value, data.metric)) + "</div>" +
      "</div></a>"
    );
  }

  function podiumSkeleton() {
    var c = '<div class="card zon-lb-podium-card"><div class="card-body text-center"><span class="zon-skel" style="width:68px;height:68px;border-radius:50%"></span><span class="zon-skel d-block mx-auto mt-3" style="width:60%;height:14px"></span><span class="zon-skel d-block mx-auto mt-2" style="width:40%;height:20px"></span></div></div>';
    return c + c + c;
  }
  function rowsSkeleton() {
    var r = '<tr><td><span class="zon-skel" style="width:28px;height:28px;border-radius:50%"></span></td><td><div class="d-flex align-items-center gap-3"><span class="zon-skel" style="width:38px;height:38px;border-radius:50%"></span><span class="zon-skel" style="width:140px;height:14px"></span></div></td><td class="text-end"><span class="zon-skel" style="width:80px;height:14px"></span></td><td class="d-none d-lg-table-cell"><span class="zon-skel" style="width:160px;height:14px"></span></td><td></td></tr>';
    return r + r + r + r + r;
  }

  function exportCsv() {
    if (!data || !(data.items || []).length) return;
    var head = ["O'rin", "Username", "ZONIC-ID", "Viloyat", "Masofa (km)", "Yugurishlar", "Qadam", "Hudud soni", "Hudud (km2)", "XP"];
    var lines = [head].concat(
      data.items.map(function (it) {
        return [it.rank, it.username, it.zonicId, it.regionName, it.km, it.runs, it.steps, it.territories, it.areaKm2, it.xp];
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
    a.download = "zon-reyting-" + data.metric + "-" + data.period + "-" + (data.today || "") + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
})();
