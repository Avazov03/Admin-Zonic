/**
 * Hududlar xaritasi — faqat haqiqiy API:
 * GET /Admin/Territories?countryId&regionId&q
 * GET /Manual/CountrySelectList, /Manual/RegionSelectList
 * Click user → fly; bir nechta hudud → Hudud 1..N
 */
(function () {
  var U = window.ZonUI;
  var map = null;
  var layer = null;
  var highlight = null;
  var items = [];
  var owners = [];
  var selectedUserId = null;
  var countries = [];
  var regions = [];
  var UZ_COUNTRY_ID = 211;

  var state = {
    scope: "global", // global | country | region
    countryId: "",
    regionId: "",
    q: "",
  };

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi || typeof L === "undefined") {
      if (root) {
        root.innerHTML =
          '<div class="alert alert-danger">Xarita kutubxonasi yuklanmadi (Leaflet).</div>';
      }
      return;
    }

    root.innerHTML =
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">' +
      '<div><h4 class="mb-1">Hududlar xaritasi</h4>' +
      '<p class="mb-0 text-body-secondary">Haqiqiy zonalar · global / mamlakat / viloyat filter · userga bosib uchish</p></div>' +
      '<div class="d-flex flex-wrap gap-2">' +
      '<button type="button" class="btn btn-label-secondary" id="z-clear">Filterni tozalash</button>' +
      '<button type="button" class="btn btn-label-primary" id="z-reload">Yangilash</button>' +
      '<button type="button" class="btn btn-label-secondary" id="z-fit">Hammaga moslash</button>' +
      "</div></div>" +
      '<div class="card mb-4"><div class="card-body">' +
      '<div class="row g-3 align-items-end">' +
      '<div class="col-lg-4"><label class="form-label">Qamrov</label>' +
      '<div class="btn-group w-100" role="group" id="z-scope">' +
      '<button type="button" class="btn btn-primary" data-scope="global">Global</button>' +
      '<button type="button" class="btn btn-label-primary" data-scope="country">Mamlakat</button>' +
      '<button type="button" class="btn btn-label-primary" data-scope="region">Viloyat</button>' +
      "</div></div>" +
      '<div class="col-md-4 col-lg-3 zon-reveal zon-filter-slot" id="z-country-wrap">' +
      '<div class="zon-reveal-inner"><label class="form-label" for="z-country">Mamlakat</label>' +
      '<select id="z-country" class="form-select"><option value="">—</option></select></div></div>' +
      '<div class="col-md-4 col-lg-3 zon-reveal zon-filter-slot" id="z-region-wrap">' +
      '<div class="zon-reveal-inner"><label class="form-label" for="z-region">Viloyat / shahar</label>' +
      '<select id="z-region" class="form-select"><option value="">—</option></select></div></div>' +
      '<div class="col-md-4 col-lg-2"><label class="form-label" for="z-q">Qidiruv</label>' +
      '<input id="z-q" class="form-control" placeholder="Ism yoki ZONIC" /></div>' +
      "</div></div></div>" +
      '<div class="row g-6"><div class="col-lg-8">' +
      '<div class="card"><div class="card-body p-0">' +
      '<div id="zonLiveMap" class="leaflet-map" style="height:640px;width:100%;border-radius:0.5rem"></div>' +
      "</div></div></div>" +
      '<div class="col-lg-4"><div class="card h-100"><div class="card-header">' +
      '<h5 class="card-title mb-0">Foydalanuvchilar</h5></div>' +
      '<div id="z-alert" class="px-4 pt-3"></div>' +
      '<div class="card-body pt-0">' +
      '<div id="z-meta" class="text-body-secondary small mb-3"></div>' +
      '<div class="list-group list-group-flush" id="z-owners" style="max-height:540px;overflow:auto"></div>' +
      "</div></div></div></div>";

    map = L.map("zonLiveMap").setView([41.3111, 69.2797], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layer = L.layerGroup().addTo(map);

    document.getElementById("z-reload").onclick = loadData;
    document.getElementById("z-fit").onclick = fitAll;
    document.getElementById("z-clear").onclick = clearFilters;
    document.getElementById("z-scope").onclick = onScope;
    document.getElementById("z-q").onkeydown = function (e) {
      if (e.key === "Enter") {
        state.q = this.value.trim();
        loadData();
      }
    };
    document.getElementById("z-owners").onclick = onOwnersClick;

    setTimeout(function () {
      map.invalidateSize();
      loadLookups().then(loadData);
    }, 80);
  });

  function bindSelect(id, onChange, opts) {
    var el = document.getElementById(id);
    if (!el) return;
    U.enhanceSelect(el, opts || {});
    if (window.jQuery) {
      jQuery(el)
        .off("change.zon")
        .on("change.zon", function () {
          onChange.call(el);
        });
    } else {
      el.onchange = onChange;
    }
  }

  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }

  function clearFilters() {
    state.scope = "global";
    state.countryId = "";
    state.regionId = "";
    state.q = "";
    selectedUserId = null;
    document.getElementById("z-q").value = "";
    if (U.setSelectValue) {
      U.setSelectValue(document.getElementById("z-country"), "", true);
      U.setSelectValue(document.getElementById("z-region"), "", true);
    } else {
      document.getElementById("z-country").value = "";
      document.getElementById("z-region").value = "";
    }
    setScopeUi();
    loadData();
  }

  function setScopeUi() {
    Array.prototype.forEach.call(document.querySelectorAll("#z-scope [data-scope]"), function (b) {
      var on = b.getAttribute("data-scope") === state.scope;
      b.className = on ? "btn btn-primary" : "btn btn-label-primary";
    });
    var cw = document.getElementById("z-country-wrap");
    var rw = document.getElementById("z-region-wrap");
    if (U.revealSet) {
      U.revealSet(cw, state.scope !== "global");
      U.revealSet(rw, state.scope === "region");
    } else {
      cw.classList.toggle("is-shown", state.scope !== "global");
      rw.classList.toggle("is-shown", state.scope === "region");
    }
  }

  function onScope(e) {
    var btn = e.target.closest("[data-scope]");
    if (!btn) return;
    state.scope = btn.getAttribute("data-scope");
    if (state.scope === "global") {
      state.countryId = "";
      state.regionId = "";
    } else if (state.scope === "country") {
      if (!state.countryId) state.countryId = String(UZ_COUNTRY_ID);
      state.regionId = "";
      if (U.setSelectValue) U.setSelectValue(document.getElementById("z-country"), state.countryId, true);
      else document.getElementById("z-country").value = state.countryId;
    } else {
      if (!state.countryId) state.countryId = String(UZ_COUNTRY_ID);
      if (U.setSelectValue) U.setSelectValue(document.getElementById("z-country"), state.countryId, true);
      else document.getElementById("z-country").value = state.countryId;
      loadRegions(state.countryId).then(function () {
        if (!state.regionId && regions.length) {
          state.regionId = String(regions[0].value);
        }
        if (U.setSelectValue) U.setSelectValue(document.getElementById("z-region"), state.regionId, true);
        else document.getElementById("z-region").value = state.regionId;
        loadData();
      });
      setScopeUi();
      return;
    }
    setScopeUi();
    loadData();
  }

  function onCountryChange() {
    state.countryId = this.value;
    state.regionId = "";
    if (state.scope === "region") {
      loadRegions(state.countryId).then(function () {
        if (regions.length) {
          state.regionId = String(regions[0].value);
        }
        if (U.setSelectValue) U.setSelectValue(document.getElementById("z-region"), state.regionId, true);
        else document.getElementById("z-region").value = state.regionId;
        loadData();
      });
    } else {
      loadData();
    }
  }

  function loadLookups() {
    return ZonApi.get("/Admin/Lookups/Countries")
      .then(function (list) {
        countries = Array.isArray(list) ? list : [];
        var sel = document.getElementById("z-country");
        sel.innerHTML =
          '<option value="">Barcha mamlakatlar</option>' +
          countries
            .map(function (c) {
              return (
                '<option value="' +
                U.esc(c.value) +
                '">' +
                U.esc(c.text || c.value) +
                "</option>"
              );
            })
            .join("");
        bindSelect("z-country", onCountryChange, {
          placeholder: "Barcha mamlakatlar",
          allowClear: true,
          search: true,
          minSearch: 0,
          dropdownParent: document.querySelector(".card.mb-4") || document.body,
        });
        return loadRegions(UZ_COUNTRY_ID);
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("warning", "Mamlakat ro‘yxati: " + U.errMsg(err));
      });
  }

  function loadRegions(countryId) {
    var path = "/Admin/Lookups/Regions";
    if (countryId) path += "?countryId=" + encodeURIComponent(countryId);
    return ZonApi.get(path)
      .then(function (list) {
        regions = Array.isArray(list) ? list : [];
        var sel = document.getElementById("z-region");
        sel.innerHTML =
          '<option value="">Barcha viloyatlar</option>' +
          regions
            .map(function (r) {
              return (
                '<option value="' +
                U.esc(r.value) +
                '">' +
                U.esc(r.text || r.value) +
                "</option>"
              );
            })
            .join("");
        bindSelect(
          "z-region",
          function () {
            state.regionId = this.value;
            loadData();
          },
          {
            placeholder: "Barcha viloyatlar",
            allowClear: true,
            search: false,
            dropdownParent: document.querySelector(".card.mb-4") || document.body,
          }
        );
        if (state.regionId) {
          if (U.setSelectValue) U.setSelectValue(sel, state.regionId, true);
          else sel.value = state.regionId;
        }
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        regions = [];
      });
  }

  function buildQuery() {
    var parts = [];
    state.q = (document.getElementById("z-q").value || "").trim();
    if (state.scope === "country" && state.countryId) {
      parts.push("countryId=" + encodeURIComponent(state.countryId));
    }
    if (state.scope === "region") {
      if (state.countryId) parts.push("countryId=" + encodeURIComponent(state.countryId));
      if (state.regionId) parts.push("regionId=" + encodeURIComponent(state.regionId));
    }
    if (state.q) parts.push("q=" + encodeURIComponent(state.q));
    return parts.length ? "?" + parts.join("&") : "";
  }

  function loadData() {
    setScopeUi();
    setAlert("", "");
    document.getElementById("z-meta").textContent = "Yuklanmoqda…";
    ZonApi.get("/Admin/Territories" + buildQuery())
      .then(function (data) {
        items = (data && data.items) || [];
        buildOwners();
        drawAll();
        renderOwners();
        document.getElementById("z-meta").textContent =
          items.length +
          " zona · " +
          owners.length +
          " foydalanuvchi" +
          (state.scope === "global"
            ? " · global"
            : state.scope === "country"
              ? " · mamlakat"
              : " · viloyat");
        if (items.length) fitAll();
        else map.setView([41.3111, 69.2797], 6);
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("danger", U.errMsg(err));
        document.getElementById("z-meta").textContent = "";
      });
  }

  function buildOwners() {
    var mapO = {};
    items.forEach(function (z) {
      var uid = z.userId || z.username || z.id;
      if (!mapO[uid]) {
        mapO[uid] = {
          userId: z.userId,
          username: z.username || "Noma'lum",
          zonicId: z.zonicId,
          avatarFileId: z.avatarFileId || null,
          color: z.color || "#696cff",
          countryName: z.countryName,
          regionName: z.regionName,
          area: 0,
          zones: [],
        };
      }
      if (!mapO[uid].avatarFileId && z.avatarFileId) mapO[uid].avatarFileId = z.avatarFileId;
      mapO[uid].area += Number(z.areaKm2) || 0;
      mapO[uid].zones.push(z);
    });
    owners = Object.keys(mapO).map(function (k) {
      return mapO[k];
    });
    owners.sort(function (a, b) {
      return b.area - a.area;
    });
  }

  function ringToLatLngs(ring) {
    return (ring || [])
      .map(function (p) {
        return [Number(p.lat), Number(p.lng)];
      })
      .filter(function (p) {
        return isFinite(p[0]) && isFinite(p[1]);
      });
  }

  function drawAll(focusZoneId) {
    layer.clearLayers();
    highlight = null;
    var allBounds = [];
    items.forEach(function (z) {
      var polys = z.polygons && z.polygons.length ? z.polygons : z.polygon ? [z.polygon] : [];
      var color = z.color || "#696cff";
      var isFocus = focusZoneId && z.id === focusZoneId;
      polys.forEach(function (ring) {
        var latlngs = ringToLatLngs(ring);
        if (latlngs.length < 3) return;
        var poly = L.polygon(latlngs, {
          color: isFocus ? "#ff3e1d" : color,
          weight: isFocus ? 3 : 2,
          fillColor: color,
          fillOpacity: isFocus ? 0.55 : 0.32,
        }).addTo(layer);
        poly.bindPopup(
          '<div class="d-flex align-items-center gap-2 mb-1">' +
            U.userAvatarHtml(z.avatarFileId, z.username, 32) +
            "<div><strong>" +
            U.esc(z.username || "—") +
            "</strong><br><small>ZONIC " +
            U.esc(z.zonicId || "—") +
            "</small></div></div>" +
            U.n(z.areaKm2) +
            " km²" +
            (z.regionName ? "<br>" + U.esc(z.regionName) : "") +
            '<br><a href="app-zon-user-runs.html?id=' +
            encodeURIComponent(z.userId || "") +
            "&name=" +
            encodeURIComponent(z.username || "") +
            '">Faoliyat</a>',
          { className: "zon-map-popup" }
        );
        poly.on("popupopen", function () {
          if (U.hydrateAvatars) U.hydrateAvatars(document.querySelector(".zon-map-popup"));
        });
        poly.on("click", function () {
          selectedUserId = z.userId;
          renderOwners();
          flyToZone(z.id);
        });
        allBounds.push(poly.getBounds());
        if (isFocus) highlight = poly;
      });
      // Avatar + ism — zona markazida
      if (isFinite(z.lat) && isFinite(z.lng)) {
        var pin = L.marker([z.lat, z.lng], {
          icon: L.divIcon({
            className: "zon-map-pin-wrap",
            html:
              '<div class="zon-map-pin' +
              (isFocus ? " is-focus" : "") +
              '" style="--pin-accent:' +
              U.esc(color) +
              '">' +
              U.userAvatarHtml(z.avatarFileId, z.username, 28) +
              '<span class="zon-map-pin-name">' +
              U.esc(z.username || "") +
              "</span></div>",
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          riseOnHover: true,
          keyboard: false,
        }).addTo(layer);
        pin.on("click", function () {
          selectedUserId = z.userId;
          renderOwners();
          flyToZone(z.id);
        });
      }
    });
    if (U.hydrateAvatars) U.hydrateAvatars(document.getElementById("zonLiveMap"));
    return allBounds;
  }

  function fitAll() {
    if (!items.length) return;
    var bounds = L.latLngBounds([]);
    var ok = false;
    items.forEach(function (z) {
      var polys = z.polygons && z.polygons.length ? z.polygons : z.polygon ? [z.polygon] : [];
      polys.forEach(function (ring) {
        ringToLatLngs(ring).forEach(function (ll) {
          bounds.extend(ll);
          ok = true;
        });
      });
      if (isFinite(z.lat) && isFinite(z.lng)) {
        bounds.extend([z.lat, z.lng]);
        ok = true;
      }
    });
    if (ok) map.fitBounds(bounds.pad(0.18));
  }

  function flyToZone(zoneId) {
    var z = items.find(function (x) {
      return x.id === zoneId;
    });
    if (!z) return;
    drawAll(zoneId);
    var polys = z.polygons && z.polygons.length ? z.polygons : z.polygon ? [z.polygon] : [];
    var bounds = L.latLngBounds([]);
    var ok = false;
    polys.forEach(function (ring) {
      ringToLatLngs(ring).forEach(function (ll) {
        bounds.extend(ll);
        ok = true;
      });
    });
    if (ok) map.flyToBounds(bounds.pad(0.25), { duration: 0.85 });
    else if (isFinite(z.lat) && isFinite(z.lng)) map.flyTo([z.lat, z.lng], 14, { duration: 0.85 });
  }

  function flyToOwner(o) {
    var bounds = L.latLngBounds([]);
    var ok = false;
    o.zones.forEach(function (z) {
      var polys = z.polygons && z.polygons.length ? z.polygons : z.polygon ? [z.polygon] : [];
      polys.forEach(function (ring) {
        ringToLatLngs(ring).forEach(function (ll) {
          bounds.extend(ll);
          ok = true;
        });
      });
      if (isFinite(z.lat) && isFinite(z.lng)) {
        bounds.extend([z.lat, z.lng]);
        ok = true;
      }
    });
    drawAll(o.zones.length === 1 ? o.zones[0].id : null);
    if (ok) map.flyToBounds(bounds.pad(0.22), { duration: 0.9 });
  }

  function renderOwners() {
    var box = document.getElementById("z-owners");
    if (!owners.length) {
      box.innerHTML =
        '<div class="text-body-secondary">Filter bo‘yicha zona topilmadi. Qamrovni kengaytiring.</div>';
      return;
    }
    box.innerHTML = owners
      .map(function (o) {
        var open = selectedUserId && selectedUserId === o.userId;
        var place = [o.regionName, o.countryName].filter(Boolean).join(" · ");
        var zoneInner =
          o.zones.length > 1
            ? '<div class="d-flex flex-wrap gap-1 py-2">' +
              o.zones
                .map(function (z, i) {
                  return (
                    '<button type="button" class="btn btn-sm btn-label-warning" data-zone="' +
                    U.esc(z.id) +
                    '">Hudud ' +
                    (i + 1) +
                    " · " +
                    U.n(z.areaKm2) +
                    " km²</button>"
                  );
                })
                .join("") +
              "</div>"
            : o.zones.length === 1
              ? '<div class="py-2"><button type="button" class="btn btn-sm btn-label-warning" data-zone="' +
                U.esc(o.zones[0].id) +
                '">Hududga o‘tish</button></div>'
              : "";
        var zoneBtns = zoneInner
          ? '<div class="zon-reveal zon-owner-zones' +
            (open ? " is-pending" : "") +
            '"><div class="zon-reveal-inner">' +
            zoneInner +
            "</div></div>"
          : "";
        return (
          '<div class="list-group-item px-0 ' +
          (open ? "bg-label-primary bg-opacity-10" : "") +
          '">' +
          '<button type="button" class="btn btn-link text-start text-decoration-none w-100 p-0" data-user="' +
          U.esc(o.userId || "") +
          '">' +
          '<div class="d-flex justify-content-between align-items-start gap-2">' +
          '<div class="d-flex align-items-start gap-2 me-2">' +
          U.userAvatarHtml(o.avatarFileId, o.username, 36) +
          "<div><span class=\"fw-medium\">" +
          U.esc(o.username) +
          '</span><br><small class="text-body-secondary">ZONIC ' +
          U.esc(o.zonicId || "—") +
          " · " +
          U.n(o.zones.length) +
          " zona" +
          (place ? " · " + U.esc(place) : "") +
          "</small></div></div>" +
          '<span class="badge bg-label-primary rounded-pill">' +
          U.n(Math.round(o.area * 1000) / 1000) +
          " km²</span></div></button>" +
          zoneBtns +
          "</div>"
        );
      })
      .join("");
    if (U.hydrateAvatars) U.hydrateAvatars(box);
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(box.querySelectorAll(".zon-owner-zones.is-pending"), function (el) {
        el.classList.remove("is-pending");
        if (U.revealSet) U.revealSet(el, true);
        else el.classList.add("is-shown");
      });
    });
  }

  function onOwnersClick(e) {
    var zoneBtn = e.target.closest("[data-zone]");
    if (zoneBtn) {
      e.preventDefault();
      flyToZone(zoneBtn.getAttribute("data-zone"));
      return;
    }
    var userBtn = e.target.closest("[data-user]");
    if (!userBtn) return;
    e.preventDefault();
    var uid = userBtn.getAttribute("data-user");
    selectedUserId = selectedUserId === uid ? null : uid;
    renderOwners();
    var o = owners.find(function (x) {
      return x.userId === uid;
    });
    if (o) flyToOwner(o);
  }
})();
