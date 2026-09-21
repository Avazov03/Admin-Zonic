/**
 * User runs + territories — mavjud Runs API o‘zgarmaydi.
 * Yangi: GET /Admin/Users/{id}/Territories, GET /Admin/Territories/{id}
 */
(function () {
  var U = window.ZonUI;
  var params = new URLSearchParams(location.search);
  var userId = params.get("id") || "";
  var username = params.get("name") || "";
  var avatarFileId = params.get("avatar") || "";
  var runMap = null;
  var runLayer = null;
  var pinApi = null;
  var allItems = [];
  var filter = "all";

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    if (!userId) {
      root.innerHTML =
        '<div class="alert alert-warning">Foydalanuvchi tanlanmagan. <a href="app-user-list.html">Ro\'yxatga qaytish</a></div>';
      return;
    }

    root.innerHTML =
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-6">' +
      '<div class="d-flex align-items-center gap-3">' +
      U.userAvatarHtml(avatarFileId, username || userId, 48) +
      '<div><h4 class="mb-1">Faoliyat</h4><p class="mb-0 text-body-secondary">' +
      U.esc(username || userId) +
      " — yugurish va hudud egallash</p></div></div>" +
      '<div class="d-flex gap-2">' +
      '<a class="btn btn-label-primary" href="app-zon-map.html">Hududlar xaritasi</a>' +
      '<a class="btn btn-label-secondary" href="app-user-list.html">Orqaga</a></div></div>' +
      '<div class="row g-6 mb-6" id="z-stats"></div>' +
      '<div id="z-alert" class="mb-4"></div>' +
      '<div class="btn-group mb-4" role="group" id="z-filter">' +
      '<button type="button" class="btn btn-primary" data-f="all">Hammasi</button>' +
      '<button type="button" class="btn btn-label-primary" data-f="running">Yugurish</button>' +
      '<button type="button" class="btn btn-label-primary" data-f="territory">Hudud egallash</button>' +
      "</div>" +
      '<div class="row g-6 align-items-start zon-runs-row" id="z-runs-row">' +
      '<div class="col-lg-6"><div class="card zon-runs-sessions-card">' +
      '<div class="card-header"><h5 class="card-title mb-0">Sessiyalar</h5></div>' +
      '<div class="table-responsive"><table class="table table-hover mb-0">' +
      "<thead><tr><th>Tur</th><th>Sana</th><th>Masofa</th><th>Vaqt</th><th></th></tr></thead>" +
      '<tbody id="z-body"><tr><td colspan="5">Yuklanmoqda…</td></tr></tbody></table></div></div></div>' +
      '<div class="col-lg-6 zon-runs-aside-col">' +
      '<div class="zon-runs-sticky" id="z-runs-sticky">' +
      '<div class="card mb-6"><div class="card-header"><h5 class="card-title mb-0">Tafsilot</h5></div>' +
      '<div class="card-body" id="z-detail"><p class="text-body-secondary mb-0">Chapdan sessiyani tanlang.</p></div></div>' +
      '<div class="card"><div class="card-header"><h5 class="card-title mb-0">Xarita</h5></div>' +
      '<div class="card-body p-0"><div id="z-run-map" class="leaflet-map" style="height:360px;width:100%"></div></div></div>' +
      "</div></div></div>";

    document.getElementById("z-body").onclick = onRow;
    document.getElementById("z-filter").onclick = onFilter;
    if (typeof L !== "undefined") {
      runMap = L.map("z-run-map").setView([41.3111, 69.2797], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(runMap);
      runLayer = L.layerGroup().addTo(runMap);
      setTimeout(function () {
        runMap.invalidateSize();
      }, 150);
    }
    pinApi = bindAsidePin();
    if (U.hydrateAvatars) U.hydrateAvatars(root);
    load();
  });

  function navbarOffset() {
    var nav = document.getElementById("layout-navbar");
    var h = nav ? nav.getBoundingClientRect().height : 64;
    return Math.round(h + 16);
  }

  function bindAsidePin() {
    var aside = document.getElementById("z-runs-sticky");
    var col = aside && aside.parentElement;
    var row = document.getElementById("z-runs-row");
    if (!aside || !col || !row) return null;

    var spacer = document.createElement("div");
    spacer.className = "zon-runs-sticky-spacer";
    spacer.setAttribute("aria-hidden", "true");
    col.insertBefore(spacer, aside);

    var raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        update();
      });
    }

    function clearPin() {
      spacer.style.height = "0px";
      aside.classList.remove("is-pinned", "is-pinned-end");
      aside.style.cssText = "";
    }

    function update() {
      if (!window.matchMedia("(min-width: 992px)").matches) {
        clearPin();
        return;
      }
      var topGap = navbarOffset();
      var rowRect = row.getBoundingClientRect();
      var colRect = col.getBoundingClientRect();
      var h = aside.offsetHeight;
      var w = Math.round(colRect.width);
      if (h < 40 || w < 40) {
        clearPin();
        return;
      }
      if (rowRect.top >= topGap) {
        clearPin();
        return;
      }
      spacer.style.height = h + "px";
      col.style.position = "relative";
      if (rowRect.bottom <= topGap + h) {
        aside.classList.remove("is-pinned");
        aside.classList.add("is-pinned-end");
        aside.style.position = "absolute";
        aside.style.top = "auto";
        aside.style.bottom = "0";
        aside.style.left = "0";
        aside.style.width = w + "px";
        aside.style.zIndex = "3";
        return;
      }
      aside.classList.add("is-pinned");
      aside.classList.remove("is-pinned-end");
      aside.style.position = "fixed";
      aside.style.top = topGap + "px";
      aside.style.left = Math.round(colRect.left) + "px";
      aside.style.width = w + "px";
      aside.style.bottom = "auto";
      aside.style.zIndex = "3";
      if (runMap) runMap.invalidateSize({ animate: false });
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("scroll", schedule, { passive: true, capture: true });
    return { update: schedule };
  }

  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function fmtDur(sec) {
    var s = Number(sec) || 0;
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  }
  function typeBadge(t) {
    if (t === "territory") {
      return '<span class="badge bg-label-warning">Hudud</span>';
    }
    return '<span class="badge bg-label-primary">Yugurish</span>';
  }
  function onFilter(e) {
    var btn = e.target.closest("[data-f]");
    if (!btn) return;
    filter = btn.getAttribute("data-f");
    Array.prototype.forEach.call(document.querySelectorAll("#z-filter [data-f]"), function (b) {
      var on = b.getAttribute("data-f") === filter;
      b.className = on ? "btn btn-primary" : "btn btn-label-primary";
    });
    renderList();
  }
  function filtered() {
    if (filter === "all") return allItems;
    return allItems.filter(function (x) {
      return x.type === filter;
    });
  }
  function renderList() {
    var items = filtered();
    var body = document.getElementById("z-body");
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="5" class="text-body-secondary">Yozuv yo‘q</td></tr>';
      return;
    }
    body.innerHTML = items
      .map(function (r) {
        return (
          "<tr><td>" +
          typeBadge(r.type) +
          "</td><td>" +
          U.dt(r.startedAt) +
          "</td><td>" +
          U.n(r.distanceKm) +
          (r.type === "territory" ? " km · " + U.n(r.areaKm2) + " km²" : " km") +
          "</td><td>" +
          fmtDur(r.durationSeconds) +
          '</td><td><button type="button" class="btn btn-sm btn-label-primary" data-kind="' +
          U.esc(r.type) +
          '" data-id="' +
          U.esc(r.id) +
          '">Ko‘rish</button></td></tr>'
        );
      })
      .join("");
  }
  function load() {
    setAlert("", "");
    Promise.all([
      ZonApi.get("/Admin/Users/" + encodeURIComponent(userId) + "/Runs"),
      ZonApi.get("/Admin/Users/" + encodeURIComponent(userId) + "/Territories").catch(function (err) {
        if (err && err.status === 404) return { items: [] };
        throw err;
      }),
    ])
      .then(function (pair) {
        var runs = ((pair[0] && pair[0].items) || []).map(function (r) {
          return {
            id: r.id,
            type: "running",
            startedAt: r.startedAt,
            durationSeconds: r.durationSeconds,
            distanceKm: r.distanceKm,
            averageSpeedKmh: r.averageSpeedKmh,
            paceMinPerKm: r.paceMinPerKm,
          };
        });
        var terr = ((pair[1] && pair[1].items) || []).map(function (r) {
          return {
            id: r.id,
            type: "territory",
            startedAt: r.capturedAt,
            durationSeconds: r.durationSeconds,
            distanceKm: r.distanceKm,
            areaKm2: r.areaKm2,
            averageSpeedKmh: r.averageSpeedKmh,
            color: r.color,
          };
        });
        allItems = runs.concat(terr).sort(function (a, b) {
          return String(b.startedAt).localeCompare(String(a.startedAt));
        });

        var runKm = runs.reduce(function (a, b) {
          return a + Number(b.distanceKm || 0);
        }, 0);
        var area = terr.reduce(function (a, b) {
          return a + Number(b.areaKm2 || 0);
        }, 0);
        document.getElementById("z-stats").innerHTML =
          U.statCard("Yugurish", U.n(runs.length), "Sessiya", "bx-run", "primary") +
          U.statCard("Hudud", U.n(terr.length), "Egallash", "bx-map-alt", "warning") +
          U.statCard("Masofa", U.n(Math.round(runKm * 100) / 100) + " km", "Yugurish", "bx-map", "success") +
          U.statCard("Maydon", U.n(Math.round(area * 1000) / 1000) + " km²", "Hudud", "bx-area", "info");

        renderList();
        if (pinApi) pinApi.update();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("danger", U.errMsg(err));
      });
  }
  function onRow(e) {
    var btn = e.target.closest("[data-id]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var kind = btn.getAttribute("data-kind") || "running";
    var box = document.getElementById("z-detail");
    box.innerHTML = '<p class="text-body-secondary mb-0">Yuklanmoqda…</p>';
    var url =
      kind === "territory"
        ? "/Admin/Territories/" + encodeURIComponent(id)
        : "/Admin/Runs/" + encodeURIComponent(id);
    ZonApi.get(url)
      .then(function (r) {
        if (kind === "territory") {
          box.innerHTML =
            '<dl class="row mb-0">' +
            row("Tur", "Hudud egallash") +
            row("ID", r.id) +
            row("Foydalanuvchi", (r.username || "—") + " / " + (r.zonicId || "—")) +
            row("Egallangan", U.dt(r.capturedAt)) +
            row("Yugurish masofasi", U.n(r.distanceKm) + " km") +
            row("Maydon", U.n(r.areaKm2) + " km²") +
            row("Davomiylik", fmtDur(r.durationSeconds)) +
            row("O‘rtacha tezlik", U.n(r.averageSpeedKmh) + " km/h") +
            "</dl>";
          drawPolygon(r.polygon || [], r.color || "#696cff");
        } else {
          var pts = (r.polyline && r.polyline.length) || 0;
          box.innerHTML =
            '<dl class="row mb-0">' +
            row("Tur", "Oddiy yugurish") +
            row("ID", r.id) +
            row("Foydalanuvchi", (r.username || "—") + " / " + (r.zonicId || "—")) +
            row("Boshlanish", U.dt(r.startedAt)) +
            row("Tugash", U.dt(r.endedAt)) +
            row("Masofa", U.n(r.distanceKm) + " km") +
            row("Davomiylik", fmtDur(r.durationSeconds)) +
            row("O‘rtacha tezlik", U.n(r.averageSpeedKmh) + " km/h") +
            row("Temp", U.n(r.paceMinPerKm) + " min/km") +
            row("Nuqtalar", U.n(pts) + " ta") +
            "</dl>";
          drawRoute(r.polyline || []);
        }
        if (pinApi) pinApi.update();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        box.innerHTML = U.alertHtml("danger", U.errMsg(err));
      });
  }
  function drawRoute(polyline) {
    if (!runMap || !runLayer) return;
    runLayer.clearLayers();
    var latlngs = polyline
      .map(function (p) {
        return [Number(p.lat), Number(p.lng)];
      })
      .filter(function (p) {
        return isFinite(p[0]) && isFinite(p[1]);
      });
    if (!latlngs.length) {
      setAlert("warning", "Marshrut nuqtalari yo‘q");
      return;
    }
    setAlert("", "");
    var line = L.polyline(latlngs, { color: "#696cff", weight: 4 }).addTo(runLayer);
    L.circleMarker(latlngs[0], { radius: 6, color: "#71dd37", fillOpacity: 1 }).addTo(runLayer).bindPopup("Start");
    L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: "#ff3e1d", fillOpacity: 1 })
      .addTo(runLayer)
      .bindPopup("Finish");
    runMap.fitBounds(line.getBounds().pad(0.15));
    setTimeout(function () {
      runMap.invalidateSize();
      if (pinApi) pinApi.update();
    }, 50);
  }
  function drawPolygon(ring, color) {
    if (!runMap || !runLayer) return;
    runLayer.clearLayers();
    var latlngs = ring
      .map(function (p) {
        return [Number(p.lat), Number(p.lng)];
      })
      .filter(function (p) {
        return isFinite(p[0]) && isFinite(p[1]);
      });
    if (latlngs.length < 3) {
      setAlert("warning", "Hudud poligoni yo‘q");
      return;
    }
    setAlert("", "");
    var poly = L.polygon(latlngs, {
      color: color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.35,
    }).addTo(runLayer);
    runMap.fitBounds(poly.getBounds().pad(0.15));
    setTimeout(function () {
      runMap.invalidateSize();
      if (pinApi) pinApi.update();
    }, 50);
  }
  function row(k, v) {
    return (
      '<dt class="col-sm-5 text-body-secondary">' +
      U.esc(k) +
      '</dt><dd class="col-sm-7">' +
      U.esc(v) +
      "</dd>"
    );
  }
})();
