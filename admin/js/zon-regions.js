/**
 * Viloyatlar — GET /Admin/Leaderboard/Regions?period + data/uzb-regions.json (Leaflet choropleth).
 * Viloyat bosilganda Top 5: GET /Admin/Leaderboard?regionId=…&limit=5.
 * Filtrlar URL'da saqlanadi (?metric=&mode=&period=).
 */
(function () {
  var U = window.ZonUI;
  var METRICS = [
    { id: "km", label: "Masofa", icon: "bx-run", unit: "km", dec: 2, lb: "km" },
    { id: "steps", label: "Qadam", icon: "bx-walk", unit: "qadam", dec: 0, lb: "steps" },
    { id: "areaKm2", label: "Hudud", icon: "bx-area", unit: "km²", dec: 4, lb: "area" },
    { id: "active", label: "Faol userlar", icon: "bx-user-check", unit: "kishi", dec: 0, lb: "km" },
    { id: "users", label: "Foydalanuvchilar", icon: "bx-group", unit: "kishi", dec: 0, lb: "km", noAvg: true },
  ];
  var PERIODS = [
    { id: "7d", label: "7 kun" },
    { id: "week", label: "Bu hafta" },
    { id: "month", label: "Bu oy" },
    { id: "all", label: "Umumiy" },
  ];
  var MODES = [
    { id: "total", label: "Jami" },
    { id: "avg", label: "1 kishiga" },
  ];
  var SCALE = ["#dcdcff", "#b4b5ff", "#8b8dff", "#6366f1", "#4338ca"];
  var EMPTY_FILL = "#e3e5ea";
  var MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

  var qs = new URLSearchParams(location.search);
  var state = {
    metric: pick(qs.get("metric"), METRICS, "km"),
    mode: pick(qs.get("mode"), MODES, "total"),
    period: pick(qs.get("period"), PERIODS, "month"),
  };
  var data = null;
  var req = 0;
  var map = null;
  var geoLayer = null;
  var bubbleLayer = null;
  var detailReq = 0;
  var CENTERS = {
    1: [41.31, 69.28], 2: [41.45, 69.95], 3: [40.78, 72.34], 4: [40.0, 63.9], 5: [40.25, 67.6],
    6: [43.1, 59.4], 7: [38.8, 66.2], 8: [41.7, 64.4], 9: [41.0, 71.3], 10: [39.8, 66.6],
    11: [37.9, 67.4], 12: [40.45, 68.7], 13: [40.4, 71.5], 14: [41.4, 60.8],
  };

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
  function isAvg() {
    return state.mode === "avg" && !metricOf(state.metric).noAvg;
  }

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-6">' +
      '<div><h4 class="mb-1">Viloyatlar</h4><p class="mb-0 text-body-secondary" id="zr-sub">Yuklanmoqda…</p></div>' +
      '<button type="button" class="btn btn-label-secondary" id="zr-csv" disabled><i class="icon-base bx bx-download me-1"></i>CSV</button></div>' +
      '<div class="card mb-6"><div class="card-body zon-lb-filters">' +
      '<div class="zon-seg zon-lb-metrics" id="zr-metric">' +
      METRICS.map(function (m) {
        return '<button type="button" data-v="' + m.id + '"><i class="bx ' + m.icon + '"></i>' + m.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="zon-lb-row">' +
      '<div class="zon-seg" id="zr-period">' +
      PERIODS.map(function (p) {
        return '<button type="button" data-v="' + p.id + '">' + p.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="zon-seg" id="zr-mode">' +
      MODES.map(function (m) {
        return '<button type="button" data-v="' + m.id + '">' + m.label + "</button>";
      }).join("") +
      "</div></div></div></div>" +
      '<div id="zr-alert" class="mb-4"></div>' +
      '<div class="row g-6 mb-6">' +
      '<div class="col-12 col-xl-7"><div class="card h-100"><div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">' +
      '<div><h5 class="card-title mb-1">Xarita</h5><p class="mb-0 text-body-secondary small">Rang qanchalik to‘q bo‘lsa, shuncha faol. Viloyatni bosing.</p></div>' +
      '<div class="zon-rg-legend" id="zr-legend"></div></div>' +
      '<div class="card-body pt-0"><div id="zr-map" class="zon-rg-map"></div></div></div></div>' +
      '<div class="col-12 col-xl-5"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-1">Reyting</h5>' +
      '<p class="mb-0 text-body-secondary small" id="zr-rank-sub"></p></div>' +
      '<div class="card-body pt-0"><ol class="list-unstyled mb-0 zon-rg-rank" id="zr-rank"></ol></div></div></div></div>' +
      '<div class="card"><div class="card-header"><h5 class="card-title mb-1">Barcha ko‘rsatkichlar</h5>' +
      '<p class="mb-0 text-body-secondary small">Tanlangan davr bo‘yicha · qatorni bosing — tafsilot</p></div>' +
      '<div class="table-responsive"><table class="table table-hover align-middle mb-0 zon-rg-table">' +
      "<thead><tr><th>#</th><th>Viloyat</th>" +
      '<th class="text-end">Userlar</th><th class="text-end">Faol</th><th class="text-end d-none d-md-table-cell">Yangi</th>' +
      '<th class="text-end">Masofa</th><th class="text-end d-none d-lg-table-cell">Yugurish</th>' +
      '<th class="text-end">Qadam</th><th class="text-end d-none d-lg-table-cell">Hudud</th></tr></thead>' +
      '<tbody id="zr-body"></tbody></table></div></div>' +
      detailModal();

    bindSeg("zr-metric", function (v) {
      state.metric = v;
      render();
    });
    bindSeg("zr-mode", function (v) {
      state.mode = v;
      render();
    });
    bindSeg("zr-period", function (v) {
      state.period = v;
      load();
    });
    document.getElementById("zr-csv").addEventListener("click", exportCsv);
    document.getElementById("zr-body").addEventListener("click", function (e) {
      var tr = e.target.closest("[data-rid]");
      if (tr) openDetail(tr.getAttribute("data-rid"));
    });
    document.getElementById("zr-rank").addEventListener("click", function (e) {
      var li = e.target.closest("[data-rid]");
      if (li) openDetail(li.getAttribute("data-rid"));
    });

    initMap();
    load();
    if (window.MutationObserver) {
      new MutationObserver(paintMap).observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme"] });
    }
  });

  function bindSeg(id, fn) {
    document.getElementById(id).addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]");
      if (!b || b.disabled) return;
      fn(b.getAttribute("data-v"));
    });
  }

  function syncControls() {
    var sets = { "zr-metric": state.metric, "zr-period": state.period, "zr-mode": state.mode };
    Object.keys(sets).forEach(function (id) {
      Array.prototype.forEach.call(document.querySelectorAll("#" + id + " [data-v]"), function (b) {
        b.classList.toggle("active", b.getAttribute("data-v") === sets[id]);
      });
    });
    var noAvg = !!metricOf(state.metric).noAvg;
    Array.prototype.forEach.call(document.querySelectorAll("#zr-mode [data-v]"), function (b) {
      var avg = b.getAttribute("data-v") === "avg";
      b.disabled = noAvg && avg;
      b.title = b.disabled ? "Foydalanuvchilar soni uchun o‘rtacha hisoblanmaydi" : "";
      if (noAvg) b.classList.toggle("active", !avg);
    });
    var p = new URLSearchParams();
    p.set("metric", state.metric);
    p.set("mode", state.mode);
    p.set("period", state.period);
    history.replaceState(null, "", location.pathname + "?" + p.toString());
  }

  function load() {
    syncControls();
    var token = ++req;
    document.getElementById("zr-alert").innerHTML = "";
    document.getElementById("zr-csv").disabled = true;
    var sk = '<li><span class="zon-skel d-block" style="height:34px"></span></li>';
    document.getElementById("zr-rank").innerHTML = sk + sk + sk + sk + sk;
    var row = '<tr><td colspan="9"><span class="zon-skel d-block" style="height:28px"></span></td></tr>';
    document.getElementById("zr-body").innerHTML = row + row + row;
    ZonApi.get("/Admin/Leaderboard/Regions?period=" + state.period)
      .then(function (d) {
        if (token !== req) return;
        data = d;
        render();
      })
      .catch(function (err) {
        if (token !== req || U.authFail(err)) return;
        data = null;
        document.getElementById("zr-rank").innerHTML = "";
        document.getElementById("zr-body").innerHTML = "";
        document.getElementById("zr-alert").innerHTML = U.alertHtml("danger", U.errMsg(err));
      });
  }

  function valueOf(it, metricId) {
    var raw = Number(it[metricId]) || 0;
    if (!isAvg() || metricId !== state.metric) return raw;
    if (!it.users) return 0;
    if (metricId === "active") return Math.round((raw / it.users) * 1000) / 10;
    return raw / it.users;
  }

  function fmt(v, metricId, forceTotal) {
    var m = metricOf(metricId);
    var x = Number(v) || 0;
    if (!forceTotal && isAvg() && metricId === state.metric) {
      if (metricId === "active") return U.n(x) + "% faol";
      var dec = m.dec ? Math.max(m.dec, 2) : 1;
      return U.n(Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)) + " " + m.unit + " / kishi";
    }
    var num = m.dec ? U.n(Math.round(x * Math.pow(10, m.dec)) / Math.pow(10, m.dec)) : U.n(Math.round(x));
    return num + " " + m.unit;
  }

  function periodText() {
    if (!data) return "";
    if (data.period === "all") return "Barcha vaqt";
    var a = parseDay(data.since);
    var b = parseDay(data.today);
    if (!a || !b) return "";
    var label = data.period === "7d" ? "So‘nggi 7 kun" : data.period === "week" ? "Bu hafta" : "Bu oy";
    return label + ": " + a.d + (a.m !== b.m ? "-" + MONTHS[a.m] : "") + " – " + b.d + "-" + MONTHS[b.m];
  }
  function parseDay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? { d: Number(m[3]), m: Number(m[2]) - 1 } : null;
  }

  function ranked() {
    return (data.items || [])
      .map(function (it) {
        return { it: it, v: valueOf(it, state.metric) };
      })
      .sort(function (a, b) {
        return b.v - a.v || b.it.users - a.it.users || String(a.it.name).localeCompare(String(b.it.name));
      });
  }

  function render() {
    syncControls();
    if (!data) return;
    var t = data.totals || {};
    var un = data.unassigned || {};
    document.getElementById("zr-sub").textContent =
      periodText() + " · " + U.n(t.withRegion || 0) + " / " + U.n(t.users || 0) + " foydalanuvchida viloyat ko‘rsatilgan";
    var list = ranked();
    var withValue = list.filter(function (x) {
      return x.v > 0;
    }).length;
    document.getElementById("zr-csv").disabled = !list.length;
    document.getElementById("zr-rank-sub").textContent =
      metricOf(state.metric).label + (isAvg() ? " · 1 kishiga" : " · jami") + " · " + withValue + " ta viloyatda natija bor";
    renderRank(list);
    renderTable(list, un);
    paintMap();
  }

  function renderRank(list) {
    var top = list.length && list[0].v > 0 ? list[0].v : 1;
    document.getElementById("zr-rank").innerHTML = list
      .map(function (x, i) {
        var has = x.v > 0;
        var pct = has ? Math.max(3, Math.round((x.v / top) * 100)) : 0;
        return (
          '<li data-rid="' + x.it.regionId + '" class="zon-rg-rank-item' + (has ? "" : " is-empty") + '">' +
          '<span class="zon-lb-rank' + (has && i < 3 ? " is-top is-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
          '<div class="flex-grow-1 min-w-0"><div class="d-flex justify-content-between gap-2">' +
          '<span class="text-heading fw-semibold text-truncate">' + U.esc(x.it.name) + "</span>" +
          '<span class="text-nowrap fw-semibold' + (has ? " text-heading" : " text-body-secondary") + '">' + U.esc(fmt(x.v, state.metric)) + "</span></div>" +
          '<div class="zon-rg-bar"><span style="width:' + pct + '%"></span></div></div></li>'
        );
      })
      .join("");
  }

  function renderTable(list, un) {
    var cells = function (it) {
      return (
        '<td class="text-end">' + U.n(it.users) + "</td>" +
        '<td class="text-end">' + U.n(it.active) + "</td>" +
        '<td class="text-end d-none d-md-table-cell">' + (it.newUsers ? "+" + U.n(it.newUsers) : "0") + "</td>" +
        '<td class="text-end text-nowrap">' + U.esc(fmt(it.km, "km", true)) + "</td>" +
        '<td class="text-end d-none d-lg-table-cell">' + U.n(it.runs) + "</td>" +
        '<td class="text-end text-nowrap">' + U.n(it.steps) + "</td>" +
        '<td class="text-end text-nowrap d-none d-lg-table-cell">' + U.esc(fmt(it.areaKm2, "areaKm2", true)) + "</td>"
      );
    };
    var html = list
      .map(function (x, i) {
        return (
          '<tr data-rid="' + x.it.regionId + '" class="zon-lb-tr' + (x.it.users ? "" : " zon-rg-muted") + '">' +
          "<td>" + (i + 1) + '</td><td class="fw-semibold text-heading">' + U.esc(x.it.name) + "</td>" + cells(x.it) + "</tr>"
        );
      })
      .join("");
    if (un.users) {
      html +=
        '<tr class="zon-rg-unassigned"><td>—</td><td><span class="text-body-secondary">Viloyat ko‘rsatilmagan</span></td>' + cells(un) + "</tr>";
    }
    document.getElementById("zr-body").innerHTML = html;
  }

  // ─── Xarita ──────────────────────────────────────────────────────────────
  function initMap() {
    var el = document.getElementById("zr-map");
    if (typeof L === "undefined") {
      el.innerHTML = '<div class="zon-daymodal-empty h-100"><i class="bx bx-map"></i>Xarita kutubxonasi yuklanmadi</div>';
      return;
    }
    map = L.map(el, { zoomSnap: 0.25, scrollWheelZoom: false, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 12,
      minZoom: 4,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · ' +
        'Chegaralar: <a href="https://www.geoboundaries.org" target="_blank" rel="noopener">geoBoundaries</a> (CC BY 4.0)',
    }).addTo(map);
    map.setView([41.4, 64.6], 5.5);
    fetch("data/uzb-regions.json?v=20260930h")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (geo) {
        geoLayer = L.geoJSON(geo, {
          style: styleFor,
          onEachFeature: function (f, layer) {
            layer.on({
              mouseover: function () {
                layer.setStyle({ weight: 2.5, color: "#312e81" });
                layer.bringToFront();
              },
              mouseout: function () {
                geoLayer.resetStyle(layer);
              },
              click: function () {
                openDetail(String(f.properties.id));
              },
            });
          },
        }).addTo(map);
        map.fitBounds(geoLayer.getBounds(), { padding: [8, 8] });
        paintMap();
        setTimeout(function () {
          map.invalidateSize();
          map.fitBounds(geoLayer.getBounds(), { padding: [8, 8] });
        }, 200);
      })
      .catch(function () {
        document.getElementById("zr-legend").innerHTML = '<small class="text-danger">Chegaralar fayli yuklanmadi</small>';
      });
  }

  function itemById(id) {
    return ((data && data.items) || []).filter(function (x) {
      return String(x.regionId) === String(id);
    })[0];
  }

  function maxValue() {
    return ((data && data.items) || []).reduce(function (a, it) {
      return Math.max(a, valueOf(it, state.metric));
    }, 0);
  }

  function isDark() {
    return document.documentElement.getAttribute("data-bs-theme") === "dark";
  }
  function emptyFill() {
    return isDark() ? "#3b3e59" : EMPTY_FILL;
  }

  function colorFor(v, max) {
    if (!(v > 0) || !(max > 0)) return emptyFill();
    var idx = Math.min(SCALE.length - 1, Math.floor(Math.sqrt(v / max) * SCALE.length));
    return SCALE[idx];
  }

  function styleFor(f) {
    var it = itemById(f.properties.id);
    var v = it ? valueOf(it, state.metric) : 0;
    return { fillColor: colorFor(v, maxValue()), fillOpacity: 0.85, color: isDark() ? "#25293c" : "#ffffff", weight: 1.2 };
  }

  function paintMap() {
    if (!geoLayer || !data) return;
    var max = maxValue();
    geoLayer.setStyle(styleFor);
    if (!bubbleLayer) bubbleLayer = L.layerGroup().addTo(map);
    bubbleLayer.clearLayers();
    geoLayer.eachLayer(function (layer) {
      var rid = String(layer.feature.properties.id);
      var it = itemById(rid);
      var name = it ? it.name : "";
      var v = it ? valueOf(it, state.metric) : 0;
      var tip =
        "<strong>" + U.esc(name) + "</strong><br>" + U.esc(fmt(v, state.metric)) + (it ? "<br><small>" + U.n(it.users) + " foydalanuvchi</small>" : "");
      layer.bindTooltip(tip, { sticky: true, direction: "top", className: "zon-rg-tip" });
      if (v > 0 && max > 0) {
        L.circleMarker(CENTERS[rid] || layer.getBounds().getCenter(), {
          radius: 5 + Math.sqrt(v / max) * 11,
          color: "#fff",
          weight: 2,
          fillColor: "#f59e0b",
          fillOpacity: 0.95,
        })
          .bindTooltip(tip, { direction: "top", className: "zon-rg-tip" })
          .on("click", function () {
            openDetail(rid);
          })
          .addTo(bubbleLayer);
      }
    });
    document.getElementById("zr-legend").innerHTML =
      '<span class="zon-rg-swatch" style="background:' + emptyFill() + '"></span><small>0</small>' +
      SCALE.map(function (c) {
        return '<span class="zon-rg-swatch" style="background:' + c + '"></span>';
      }).join("") +
      "<small>" + U.esc(max > 0 ? fmt(max, state.metric) : "—") + "</small>" +
      '<span class="zon-rg-dot"></span><small>natija</small>';
  }

  // ─── Tafsilot ────────────────────────────────────────────────────────────
  function detailModal() {
    return (
      '<div class="modal fade" id="zrDetailModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
      '<div class="modal-header"><div><h5 class="modal-title mb-1" id="zrd-title">Viloyat</h5><small class="text-body-secondary" id="zrd-sub"></small></div>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body pt-2"><div class="zon-ep-summary mb-4" id="zrd-tiles"></div>' +
      '<h6 class="mb-2">Top 5 · <span id="zrd-metric"></span></h6><div id="zrd-top"></div></div>' +
      '<div class="modal-footer"><a class="btn btn-primary" id="zrd-link" href="app-zon-leaderboard.html"><i class="bx bx-medal me-1"></i>Shu viloyat reytingi</a></div>' +
      "</div></div></div>"
    );
  }

  function openDetail(rid) {
    var it = itemById(rid);
    if (!it) return;
    var m = metricOf(state.metric);
    var tile = function (label, value, tone, icon) {
      return (
        '<div class="zon-ep-tile"><span class="avatar-initial rounded bg-label-' + tone + '"><i class="bx ' + icon + '"></i></span>' +
        '<div><div class="zon-ep-tile-val">' + U.esc(value) + '</div><small class="text-body-secondary">' + U.esc(label) + "</small></div></div>"
      );
    };
    var list = ranked();
    var place = 0;
    list.forEach(function (x, i) {
      if (String(x.it.regionId) === String(rid)) place = i + 1;
    });
    document.getElementById("zrd-title").textContent = it.name;
    document.getElementById("zrd-sub").textContent =
      periodText() + " · " + m.label + " bo‘yicha " + place + "-o‘rin";
    document.getElementById("zrd-tiles").innerHTML =
      tile("Foydalanuvchi · " + U.n(it.active) + " faol", U.n(it.users), "primary", "bx-group") +
      tile("Masofa · " + U.n(it.runs) + " yugurish", fmt(it.km, "km", true), "success", "bx-run") +
      tile("Qadam", U.n(it.steps), "info", "bx-walk") +
      tile("Hudud · " + U.n(it.territories) + " ta", fmt(it.areaKm2, "areaKm2", true), "warning", "bx-area");
    var lbMetric = m.lb;
    var lbLabel = lbMetric === "steps" ? "qadam" : lbMetric === "area" ? "hudud" : "masofa";
    document.getElementById("zrd-metric").textContent = lbLabel + " bo‘yicha";
    document.getElementById("zrd-link").href =
      "app-zon-leaderboard.html?metric=" + lbMetric + "&period=" + state.period + "&region=" + encodeURIComponent(rid);
    var box = document.getElementById("zrd-top");
    var sk = '<span class="zon-skel d-block mb-2" style="height:40px"></span>';
    box.innerHTML = sk + sk + sk;
    U.modalShow("zrDetailModal");
    var token = ++detailReq;
    ZonApi.get("/Admin/Leaderboard?metric=" + lbMetric + "&period=" + state.period + "&regionId=" + encodeURIComponent(rid) + "&limit=5")
      .then(function (d) {
        if (token !== detailReq) return;
        var items = (d && d.items) || [];
        if (!items.length) {
          box.innerHTML = '<div class="zon-daymodal-empty"><i class="bx bx-trophy"></i>Bu davrda natija yo‘q</div>';
          return;
        }
        var unit = lbMetric === "steps" ? " qadam" : lbMetric === "area" ? " km²" : " km";
        box.innerHTML =
          '<ul class="list-unstyled mb-0 zon-ms-buyers">' +
          items
            .map(function (u, i) {
              var href = "app-zon-user-runs.html?id=" + encodeURIComponent(u.userId) + "&name=" + encodeURIComponent(u.username || "");
              return (
                '<li><a class="zon-ms-buyer" href="' + U.esc(href) + '">' +
                '<span class="zon-lb-rank' + (i < 3 ? " is-top is-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
                U.userAvatarHtml(u.avatarFileId, u.username, 36, { zoom: false }) +
                '<span class="min-w-0 flex-grow-1"><span class="fw-semibold text-heading d-block text-truncate">' + U.esc(u.username || "—") + "</span>" +
                '<small class="text-body-secondary">ZONIC-ID ' + U.esc(u.zonicId == null ? "—" : u.zonicId) + "</small></span>" +
                '<span class="fw-semibold text-heading text-nowrap">' + U.n(u.value) + unit + "</span></a></li>"
              );
            })
            .join("") +
          "</ul>";
        U.hydrateAvatars(box);
      })
      .catch(function (err) {
        if (token !== detailReq || U.authFail(err)) return;
        box.innerHTML = U.alertHtml("danger", U.errMsg(err));
      });
  }

  // ─── CSV ─────────────────────────────────────────────────────────────────
  function exportCsv() {
    if (!data) return;
    var head = ["O'rin", "Viloyat", "Foydalanuvchilar", "Faol", "Yangi", "Masofa (km)", "Yugurishlar", "Qadam", "Hudud soni", "Hudud (km2)", "Masofa / kishi", "Qadam / kishi"];
    var per = function (v, n) {
      return n ? Math.round((v / n) * 100) / 100 : 0;
    };
    var rows = ranked().map(function (x, i) {
      var it = x.it;
      return [i + 1, it.name, it.users, it.active, it.newUsers, it.km, it.runs, it.steps, it.territories, it.areaKm2, per(it.km, it.users), per(it.steps, it.users)];
    });
    var un = data.unassigned || {};
    if (un.users) rows.push(["", "Viloyat ko'rsatilmagan", un.users, un.active, un.newUsers, un.km, un.runs, un.steps, un.territories, un.areaKm2, per(un.km, un.users), per(un.steps, un.users)]);
    var csv = [head]
      .concat(rows)
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
    a.download = "zon-viloyatlar-" + state.metric + "-" + state.period + "-" + (data.today || "") + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
})();
