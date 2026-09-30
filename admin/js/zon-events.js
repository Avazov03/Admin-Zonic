/**
 * Events / Musobaqalar — /Admin/Events + Participants
 * Filter: barcha / aktiv / tugagan / draft / tez orada
 */
(function () {
  var U = window.ZonUI;
  var editing = null;
  var allItems = [];
  var filter = "all";

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="row g-6 mb-6" id="z-stats"></div>' +
      '<div class="card">' +
      '<div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title mb-1">Musobaqalar</h5>' +
      '<p class="mb-0 text-body-secondary small">Qo‘shilgan = ishtirokchi. App o‘qigan = ilova inboxida ochilgan (FCM open emas)</p></div>' +
      '<button type="button" class="btn btn-primary" id="z-new">Yangi musobaqa</button></div>' +
      '<div id="z-alert" class="px-6 pt-4"></div>' +
      '<div class="card-body pt-0">' +
      '<ul class="nav nav-pills mb-4 flex-wrap gap-1" id="z-filters" role="tablist"></ul>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Nomi</th><th>Maqsad</th><th>Muddat</th><th>Qo‘shilgan</th><th>App o‘qigan</th><th>Holat</th><th></th></tr></thead>" +
      '<tbody id="z-body"></tbody></table></div></div></div>' +
      formModal() +
      partsModal();

    document.getElementById("z-new").onclick = function () {
      editing = null;
      fill({});
      document.querySelector("#zFormModal .modal-title").textContent = "Yangi musobaqa";
      if (U.revealSet) {
        U.revealSet(document.getElementById("z-publish-wrap"), true);
        U.revealSet(document.getElementById("z-status-wrap"), false);
      } else {
        document.getElementById("z-publish-wrap").classList.add("is-shown");
        document.getElementById("z-status-wrap").classList.remove("is-shown");
      }
      U.modalShow("zFormModal");
    };
    document.getElementById("z-save").onclick = save;
    document.getElementById("z-body").onclick = onRow;
    document.getElementById("z-filters").onclick = function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.getAttribute("data-filter");
      renderFilters();
      renderTable();
    };
    load();
  });

  function formModal() {
    return (
      '<div class="modal fade" id="zFormModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Musobaqa</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body"><div class="row g-4">' +
      '<div class="col-12"><label class="form-label">Nomi *</label><input id="z-title" class="form-control" /></div>' +
      '<div class="col-12"><label class="form-label">Tavsif</label><textarea id="z-desc" class="form-control" rows="2"></textarea></div>' +
      '<div class="col-md-6"><label class="form-label">Maqsad turi *</label><select id="z-goalType" class="form-select">' +
      '<option value="distance_km">Masofa (km)</option><option value="steps">Qadamlar</option></select></div>' +
      '<div class="col-md-6"><label class="form-label">Maqsad qiymati *</label><input id="z-goalValue" type="number" class="form-control" /></div>' +
      '<div class="col-md-6"><label class="form-label">Boshlanish *</label><input id="z-starts" type="datetime-local" class="form-control" /></div>' +
      '<div class="col-md-6"><label class="form-label">Tugash *</label><input id="z-ends" type="datetime-local" class="form-control" /></div>' +
      '<div class="col-md-6 zon-reveal is-shown" id="z-publish-wrap"><div class="zon-reveal-inner form-check mt-4 ms-2"><input class="form-check-input" type="checkbox" id="z-publish" />' +
      '<label class="form-check-label" for="z-publish">Darhol e\'lon (news + push)</label></div></div>' +
      '<div class="col-md-6 zon-reveal" id="z-status-wrap"><div class="zon-reveal-inner"><label class="form-label">Holat</label><select id="z-status" class="form-select">' +
      '<option value="draft">draft</option><option value="published">published</option><option value="ended">ended</option></select></div></div>' +
      '</div></div><div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Bekor</button>' +
      '<button type="button" class="btn btn-primary" id="z-save">Saqlash</button></div></div></div></div>'
    );
  }
  function partsModal() {
    return (
      '<div class="modal fade" id="zPartsModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"><div class="modal-content">' +
      '<div class="modal-header"><div class="min-w-0"><h5 class="modal-title mb-1" id="zp-title">Ishtirokchilar</h5>' +
      '<small class="text-body-secondary d-block" id="zp-sub"></small></div>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body pt-2">' +
      '<div class="zon-ep-summary mb-4" id="zp-summary"></div>' +
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '<div class="zon-seg" id="zp-filter">' +
      '<button type="button" class="active" data-f="all">Hammasi <span class="zon-seg-count" data-c="all">0</span></button>' +
      '<button type="button" data-f="done">Bajarganlar <span class="zon-seg-count" data-c="done">0</span></button>' +
      '<button type="button" data-f="left">Bajarmaganlar <span class="zon-seg-count" data-c="left">0</span></button></div>' +
      '<input type="search" class="form-control form-control-sm zon-ep-search" id="zp-q" placeholder="Ism yoki ZONIC-ID" />' +
      '<div class="ms-auto d-flex gap-2">' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="zp-csv"><i class="bx bx-download me-1"></i>CSV</button>' +
      '<button type="button" class="btn btn-sm btn-primary" id="zp-push-open"><i class="bx bx-send me-1"></i>Xabar yuborish</button></div></div>' +
      '<div class="zon-ep-compose d-none" id="zp-compose"></div>' +
      '<div id="zp-alert"></div>' +
      '<div class="table-responsive"><table class="table table-hover align-middle mb-0 zon-ep-table">' +
      '<thead><tr><th class="zon-ep-check"><input class="form-check-input" type="checkbox" id="zp-all" title="Hammasini belgilash" /></th>' +
      '<th>#</th><th>Foydalanuvchi</th><th id="zp-th-progress">Natija</th><th class="d-none d-md-table-cell">Qo‘shilgan</th></tr></thead>' +
      '<tbody id="z-parts"></tbody></table></div>' +
      "</div></div></div></div>"
    );
  }

  // ─── Ishtirokchilar ──────────────────────────────────────────────────────
  var parts = { data: null, filter: "all", q: "", selected: {}, req: 0 };
  var MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

  function goalUnit(t) {
    return t === "steps" ? "qadam" : "km";
  }
  function fmtProgress(v, t) {
    return U.n(t === "steps" ? Math.round(v) : Math.round(v * 100) / 100) + " " + goalUnit(t);
  }
  function shortDate(iso) {
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d)) return "—";
    var p = function (x) {
      return (x < 10 ? "0" : "") + x;
    };
    return d.getDate() + "-" + MONTHS[d.getMonth()] + ", " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function profileHref(it) {
    return "app-zon-user-runs.html?id=" + encodeURIComponent(it.userId) + "&name=" + encodeURIComponent(it.username || "");
  }

  function bindParts() {
    document.getElementById("zp-filter").onclick = function (e) {
      var b = e.target.closest("[data-f]");
      if (!b) return;
      parts.filter = b.getAttribute("data-f");
      Array.prototype.forEach.call(document.querySelectorAll("#zp-filter [data-f]"), function (x) {
        x.classList.toggle("active", x === b);
      });
      renderParts();
    };
    document.getElementById("zp-q").oninput = function () {
      parts.q = this.value.trim().toLowerCase();
      renderParts();
    };
    document.getElementById("zp-all").onchange = function () {
      var on = this.checked;
      visibleParts().forEach(function (it) {
        if (it.isBlocked) return;
        if (on) parts.selected[it.userId] = true;
        else delete parts.selected[it.userId];
      });
      renderParts();
    };
    document.getElementById("z-parts").onchange = function (e) {
      var cb = e.target.closest("[data-sel]");
      if (!cb) return;
      if (cb.checked) parts.selected[cb.getAttribute("data-sel")] = true;
      else delete parts.selected[cb.getAttribute("data-sel")];
      syncSelection();
    };
    document.getElementById("zp-csv").onclick = exportPartsCsv;
    document.getElementById("zp-push-open").onclick = function () {
      var box = document.getElementById("zp-compose");
      if (box.classList.contains("d-none")) openCompose();
      else box.classList.add("d-none");
    };
  }

  function openParts(eid) {
    if (!document.getElementById("zp-filter").onclick) bindParts();
    var token = ++parts.req;
    parts.data = null;
    parts.filter = "all";
    parts.q = "";
    parts.selected = {};
    document.getElementById("zp-q").value = "";
    Array.prototype.forEach.call(document.querySelectorAll("#zp-filter [data-f]"), function (x) {
      x.classList.toggle("active", x.getAttribute("data-f") === "all");
    });
    document.getElementById("zp-compose").classList.add("d-none");
    document.getElementById("zp-alert").innerHTML = "";
    var meta =
      (window.__events || []).find(function (x) {
        return x.id === eid;
      }) || {};
    document.getElementById("zp-title").textContent = meta.title || "Ishtirokchilar";
    document.getElementById("zp-sub").textContent = "Yuklanmoqda…";
    document.getElementById("zp-summary").innerHTML = "";
    var sk = '<tr><td colspan="5"><span class="zon-skel d-block" style="height:36px"></span></td></tr>';
    document.getElementById("z-parts").innerHTML = sk + sk + sk;
    U.modalShow("zPartsModal");
    ZonApi.get("/Admin/Events/" + encodeURIComponent(eid) + "/Participants")
      .then(function (data) {
        if (token !== parts.req) return;
        parts.data = data || { items: [] };
        renderPartsHeader();
        renderParts();
      })
      .catch(function (err) {
        if (token !== parts.req) return;
        if (U.authFail(err)) return;
        document.getElementById("zp-sub").textContent = "";
        document.getElementById("z-parts").innerHTML = "";
        document.getElementById("zp-alert").innerHTML = U.alertHtml("danger", U.errMsg(err));
      });
  }

  function renderPartsHeader() {
    var ev = parts.data.event || {};
    var s = parts.data.summary || {};
    var t = ev.goalType;
    document.getElementById("zp-sub").textContent =
      "Maqsad: " + fmtProgress(ev.goalValue || 0, t) + " · " + shortDate(ev.startsAt) + " – " + shortDate(ev.endsAt);
    document.getElementById("zp-th-progress").textContent = "Natija (" + goalUnit(t) + ")";
    var n = s.participants || 0;
    var donePct = n ? Math.round(((s.completed || 0) / n) * 100) : 0;
    var tile = function (label, value, sub, tone, icon) {
      return (
        '<div class="zon-ep-tile"><span class="avatar-initial rounded bg-label-' + tone + '"><i class="bx ' + icon + '"></i></span>' +
        '<div><div class="zon-ep-tile-val">' + value + '</div><small class="text-body-secondary">' + U.esc(label) +
        (sub ? " · " + U.esc(sub) : "") + "</small></div></div>"
      );
    };
    document.getElementById("zp-summary").innerHTML =
      tile("Ishtirokchi", U.n(n), "", "primary", "bx-group") +
      tile("Bajargan", U.n(s.completed || 0), donePct + "%", "success", "bx-check-circle") +
      tile("Faol", U.n(s.active || 0), "natijasi bor", "info", "bx-run") +
      tile("O‘rtacha", U.esc(fmtProgress(s.avgProgress || 0, t)), "", "warning", "bx-bar-chart-alt-2");
    var items = parts.data.items || [];
    var done = items.filter(function (x) {
      return x.completed;
    }).length;
    var setC = function (k, v) {
      document.querySelector('#zp-filter [data-c="' + k + '"]').textContent = U.n(v);
    };
    setC("all", items.length);
    setC("done", done);
    setC("left", items.length - done);
  }

  function visibleParts() {
    var items = (parts.data && parts.data.items) || [];
    return items.filter(function (it) {
      if (parts.filter === "done" && !it.completed) return false;
      if (parts.filter === "left" && it.completed) return false;
      if (!parts.q) return true;
      return (
        String(it.username || "").toLowerCase().indexOf(parts.q) >= 0 ||
        String(it.zonicId == null ? "" : it.zonicId).indexOf(parts.q) >= 0
      );
    });
  }

  function renderParts() {
    if (!parts.data) return;
    var t = (parts.data.event || {}).goalType;
    var body = document.getElementById("z-parts");
    var all = parts.data.items || [];
    var list = visibleParts();
    document.getElementById("zp-csv").disabled = !all.length;
    document.getElementById("zp-push-open").disabled = !all.length;
    if (!all.length) {
      body.innerHTML =
        '<tr><td colspan="5"><div class="zon-daymodal-empty"><i class="bx bx-group"></i><h6 class="mb-1">Hali ishtirokchi yo‘q</h6>' +
        '<p class="mb-0">Foydalanuvchilar ilovada musobaqaga qo‘shilgach shu yerda ko‘rinadi.</p></div></td></tr>';
      syncSelection();
      return;
    }
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="zon-daymodal-empty"><i class="bx bx-search"></i>Bu filtrda ishtirokchi yo‘q</div></td></tr>';
      syncSelection();
      return;
    }
    body.innerHTML = list
      .map(function (it) {
        var pct = Math.max(it.progress > 0 ? 2 : 0, Math.round(it.percent));
        return (
          "<tr>" +
          '<td class="zon-ep-check"><input class="form-check-input" type="checkbox" data-sel="' + U.esc(it.userId) + '"' +
          (parts.selected[it.userId] ? " checked" : "") + (it.isBlocked ? ' disabled title="Bloklangan — xabar yuborilmaydi"' : "") + " /></td>" +
          '<td><span class="zon-lb-rank' + (it.rank <= 3 && it.progress > 0 ? " is-top is-" + it.rank : "") + '">' + it.rank + "</span></td>" +
          '<td><div class="d-flex align-items-center gap-2">' + U.userAvatarHtml(it.avatarFileId, it.username, 34, { zoom: false }) +
          '<div class="min-w-0"><a class="fw-semibold text-heading" href="' + U.esc(profileHref(it)) + '">' + U.esc(it.username || "—") + "</a>" +
          (it.isBlocked ? ' <span class="badge bg-label-danger ms-1">Blok</span>' : "") +
          '<small class="d-block text-body-secondary">ZONIC-ID ' + U.esc(it.zonicId == null ? "—" : it.zonicId) +
          (it.regionName ? " · " + U.esc(it.regionName) : "") + "</small></div></div></td>" +
          '<td><div class="d-flex align-items-center gap-2"><span class="fw-semibold text-heading text-nowrap">' + U.esc(fmtProgress(it.progress, t)) + "</span>" +
          (it.completed ? '<span class="badge bg-label-success"><i class="bx bx-check"></i> Bajardi</span>' : '<small class="text-body-secondary">' + U.n(it.percent) + "%</small>") +
          '</div><div class="zon-ep-bar' + (it.completed ? " is-done" : "") + '"><span style="width:' + pct + '%"></span></div></td>' +
          '<td class="d-none d-md-table-cell text-body-secondary text-nowrap">' + U.esc(shortDate(it.joinedAt)) + "</td></tr>"
        );
      })
      .join("");
    U.hydrateAvatars(body);
    syncSelection();
  }

  function selectedIds() {
    return ((parts.data && parts.data.items) || [])
      .filter(function (it) {
        return parts.selected[it.userId] && !it.isBlocked;
      })
      .map(function (it) {
        return it.userId;
      });
  }

  function syncSelection() {
    var vis = visibleParts().filter(function (it) {
      return !it.isBlocked;
    });
    var allBox = document.getElementById("zp-all");
    var on = vis.filter(function (it) {
      return parts.selected[it.userId];
    }).length;
    allBox.checked = vis.length > 0 && on === vis.length;
    allBox.indeterminate = on > 0 && on < vis.length;
    var opt = document.querySelector('#zp-target option[value="selected"]');
    if (opt) {
      var n = selectedIds().length;
      opt.textContent = "Belgilanganlar (" + n + ")";
      opt.disabled = !n;
      updateComposeCount();
    }
  }

  // ─── Xabar yuborish ──────────────────────────────────────────────────────
  function targetIds(target) {
    var items = ((parts.data && parts.data.items) || []).filter(function (it) {
      return !it.isBlocked;
    });
    if (target === "selected") return selectedIds();
    return items
      .filter(function (it) {
        if (target === "done") return it.completed;
        if (target === "left") return !it.completed;
        return true;
      })
      .map(function (it) {
        return it.userId;
      });
  }

  function templateFor(target) {
    var ev = (parts.data && parts.data.event) || {};
    var title = ev.title || "Musobaqa";
    var goal = fmtProgress(ev.goalValue || 0, ev.goalType);
    var ended = ev.endsAt && new Date(ev.endsAt).getTime() < Date.now();
    if (target === "done") return { title: "Tabriklaymiz! 🎉", body: "Siz «" + title + "» musobaqasida " + goal + " maqsadini bajardingiz. Zo‘r natija!" };
    if (target === "left" && !ended)
      return { title: "Maqsadga oz qoldi!", body: "«" + title + "» musobaqasi " + shortDate(ev.endsAt) + " da tugaydi. " + goal + " maqsadiga yetish uchun davom eting!" };
    if (ended) return { title: "«" + title + "» yakunlandi", body: "Musobaqada qatnashganingiz uchun rahmat! Natijalaringizni ilovada ko‘ring." };
    return { title: "«" + title + "»", body: "Musobaqa davom etmoqda — " + goal + " maqsadi sari olg‘a!" };
  }

  function openCompose() {
    var box = document.getElementById("zp-compose");
    var hasSel = selectedIds().length > 0;
    var target = hasSel ? "selected" : "all";
    var tpl = templateFor(target);
    box.innerHTML =
      '<div class="d-flex justify-content-between align-items-center mb-3"><h6 class="mb-0"><i class="bx bx-send me-1"></i>Ishtirokchilarga xabar</h6>' +
      '<button type="button" class="btn-close" id="zp-compose-close" aria-label="Yopish"></button></div>' +
      '<div class="row g-3">' +
      '<div class="col-md-4"><label class="form-label" for="zp-target">Kimga</label>' +
      '<select class="form-select" id="zp-target" data-zon-no-select2="1">' +
      '<option value="all">Hamma ishtirokchilar</option>' +
      '<option value="left">Bajarmaganlar</option>' +
      '<option value="done">Bajarganlar</option>' +
      '<option value="selected">Belgilanganlar (0)</option></select></div>' +
      '<div class="col-md-8"><label class="form-label" for="zp-ptitle">Sarlavha *</label>' +
      '<input class="form-control" id="zp-ptitle" maxlength="200" /></div>' +
      '<div class="col-12"><label class="form-label" for="zp-pbody">Matn</label>' +
      '<textarea class="form-control" id="zp-pbody" rows="2" maxlength="500"></textarea></div>' +
      '<div class="col-12 d-flex flex-wrap align-items-center gap-2">' +
      '<small class="text-body-secondary me-auto" id="zp-count"></small>' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="zp-tpl">Shablonni qo‘yish</button>' +
      '<button type="button" class="btn btn-sm btn-primary" id="zp-send"><i class="bx bx-send me-1"></i>Yuborish</button></div></div>';
    box.classList.remove("d-none");
    document.getElementById("zp-target").value = target;
    document.getElementById("zp-ptitle").value = tpl.title;
    document.getElementById("zp-pbody").value = tpl.body;
    syncSelection();
    document.getElementById("zp-target").onchange = function () {
      var t = templateFor(this.value);
      document.getElementById("zp-ptitle").value = t.title;
      document.getElementById("zp-pbody").value = t.body;
      updateComposeCount();
    };
    document.getElementById("zp-tpl").onclick = function () {
      var t = templateFor(document.getElementById("zp-target").value);
      document.getElementById("zp-ptitle").value = t.title;
      document.getElementById("zp-pbody").value = t.body;
    };
    document.getElementById("zp-compose-close").onclick = function () {
      box.classList.add("d-none");
    };
    document.getElementById("zp-send").onclick = sendPartsPush;
    updateComposeCount();
  }

  function updateComposeCount() {
    var sel = document.getElementById("zp-target");
    var out = document.getElementById("zp-count");
    if (!sel || !out) return;
    var n = targetIds(sel.value).length;
    out.textContent = n ? n + " kishiga push va ilova bildirishnomasi boradi (bloklanganlar hisobga olinmaydi)" : "Bu guruhda qabul qiluvchi yo‘q";
    document.getElementById("zp-send").disabled = !n;
  }

  function sendPartsPush() {
    var target = document.getElementById("zp-target").value;
    var ids = targetIds(target);
    var title = document.getElementById("zp-ptitle").value.trim();
    var bodyText = document.getElementById("zp-pbody").value.trim();
    var alertBox = document.getElementById("zp-alert");
    if (!title) {
      alertBox.innerHTML = '<div class="mb-3">' + U.alertHtml("warning", "Sarlavha kiriting") + "</div>";
      return;
    }
    if (!ids.length) return;
    if (!confirm(ids.length + " kishiga xabar yuboriladi:\n\n" + title + (bodyText ? "\n" + bodyText : "") + "\n\nTasdiqlaysizmi?")) return;
    var btn = document.getElementById("zp-send");
    btn.disabled = true;
    ZonApi.post("/Admin/Push/Send", { title: title, body: bodyText || undefined, audience: "userIds", userIds: ids })
      .then(function (r) {
        document.getElementById("zp-compose").classList.add("d-none");
        alertBox.innerHTML =
          '<div class="mb-3">' + U.alertHtml("success", "Yuborildi: " + U.n((r && r.sentCount) || ids.length) + " kishi. Push tarixida ko‘rinadi.") + "</div>";
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        alertBox.innerHTML = '<div class="mb-3">' + U.alertHtml("danger", U.errMsg(err)) + "</div>";
      })
      .finally(function () {
        btn.disabled = false;
      });
  }

  function exportPartsCsv() {
    if (!parts.data || !(parts.data.items || []).length) return;
    var ev = parts.data.event || {};
    var unit = goalUnit(ev.goalType);
    var head = ["O'rin", "Username", "ZONIC-ID", "Viloyat", "Qo'shilgan", "Natija (" + unit + ")", "Maqsad (" + unit + ")", "Foiz", "Bajardi", "Bloklangan"];
    var lines = [head].concat(
      parts.data.items.map(function (it) {
        return [
          it.rank,
          it.username,
          it.zonicId,
          it.regionName || "",
          it.joinedAt || "",
          it.progress,
          ev.goalValue,
          it.percent,
          it.completed ? "ha" : "yo'q",
          it.isBlocked ? "ha" : "yo'q",
        ];
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
    var slug = String(ev.title || "musobaqa")
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "musobaqa";
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "zon-ishtirokchilar-" + slug + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function toLocal(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var pad = function (x) {
      return String(x).padStart(2, "0");
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }
  function fromLocal(v) {
    if (!v) return "";
    return new Date(v).toISOString();
  }
  function fill(ev) {
    document.getElementById("z-title").value = ev.title || "";
    document.getElementById("z-desc").value = ev.description || "";
    if (U.setSelectValue) {
      U.setSelectValue(document.getElementById("z-goalType"), ev.goalType || "distance_km", true);
      U.setSelectValue(document.getElementById("z-status"), ev.status || "draft", true);
    } else {
      document.getElementById("z-goalType").value = ev.goalType || "distance_km";
      document.getElementById("z-status").value = ev.status || "draft";
    }
    document.getElementById("z-goalValue").value = ev.goalValue != null ? ev.goalValue : "";
    document.getElementById("z-starts").value = toLocal(ev.startsAt);
    document.getElementById("z-ends").value = toLocal(ev.endsAt);
    document.getElementById("z-publish").checked = false;
  }
  function statusBadge(s) {
    if (s === "published") return U.badge("published", "success");
    if (s === "ended") return U.badge("ended", "secondary");
    return U.badge(s || "draft", "warning");
  }
  function bucket(ev) {
    var now = Date.now();
    var start = ev.startsAt ? new Date(ev.startsAt).getTime() : NaN;
    var end = ev.endsAt ? new Date(ev.endsAt).getTime() : NaN;
    if (ev.status === "draft") return "draft";
    if (ev.status === "ended" || (isFinite(end) && end < now)) return "ended";
    if (ev.status === "published" && isFinite(start) && start > now) return "upcoming";
    if (ev.status === "published") return "active";
    return "all";
  }
  function filtered() {
    if (filter === "all") return allItems.slice();
    return allItems.filter(function (ev) {
      return bucket(ev) === filter;
    });
  }
  function counts() {
    var c = { all: allItems.length, active: 0, ended: 0, draft: 0, upcoming: 0 };
    allItems.forEach(function (ev) {
      var b = bucket(ev);
      if (c[b] != null) c[b] += 1;
    });
    return c;
  }
  function renderFilters() {
    var c = counts();
    var tabs = [
      { id: "all", label: "Barcha", icon: "bx-list-ul" },
      { id: "active", label: "Aktiv", icon: "bx-play-circle" },
      { id: "upcoming", label: "Tez orada", icon: "bx-time-five" },
      { id: "ended", label: "Tugagan", icon: "bx-flag" },
      { id: "draft", label: "Qoralama", icon: "bx-file" },
    ];
    document.getElementById("z-filters").innerHTML = tabs
      .map(function (t) {
        return (
          '<li class="nav-item" role="presentation">' +
          '<button type="button" class="nav-link' +
          (filter === t.id ? " active" : "") +
          '" data-filter="' +
          t.id +
          '"><i class="icon-base bx ' +
          t.icon +
          ' me-1"></i>' +
          t.label +
          ' <span class="badge bg-label-primary rounded-pill ms-1">' +
          U.n(c[t.id] || 0) +
          "</span></button></li>"
        );
      })
      .join("");
  }
  function notifCell(ev) {
    var sent = Number(ev.notifSent || 0);
    var read = Number(ev.notifRead || 0);
    if (!sent) return '<span class="text-body-secondary">yuborilmagan</span>';
    var pct = Math.round((read / sent) * 100);
    return (
      '<span class="fw-medium">' +
      U.n(read) +
      "</span> / " +
      U.n(sent) +
      ' <small class="text-body-secondary">inbox (' +
      pct +
      "%)</small>"
    );
  }
  function renderTable() {
    var items = filtered().sort(function (a, b) {
      return new Date(b.startsAt || 0) - new Date(a.startsAt || 0);
    });
    var body = document.getElementById("z-body");
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="7" class="text-body-secondary">Bu filterda musobaqa yo\'q</td></tr>';
      return;
    }
    body.innerHTML = items
      .map(function (ev) {
        var live = bucket(ev);
        var extra =
          live === "active"
            ? ' <span class="badge bg-label-success">Aktiv</span>'
            : live === "upcoming"
              ? ' <span class="badge bg-label-info">Tez orada</span>'
              : live === "ended"
                ? ' <span class="badge bg-label-secondary">Tugagan</span>'
                : "";
        return (
          "<tr><td><span class=\"fw-medium\">" +
          U.esc(ev.title) +
          "</span>" +
          extra +
          '</td><td class="text-nowrap">' +
          U.esc(fmtProgress(Number(ev.goalValue) || 0, ev.goalType)) +
          "</td><td><small>" +
          U.dt(ev.startsAt) +
          "<br>" +
          U.dt(ev.endsAt) +
          "</small></td><td><span class=\"fw-semibold\">" +
          U.n(ev.participantCount) +
          "</span></td><td>" +
          notifCell(ev) +
          "</td><td>" +
          statusBadge(ev.status) +
          '</td><td class="text-nowrap">' +
          '<button class="btn btn-sm btn-label-primary me-1" data-edit="' +
          U.esc(ev.id) +
          '">Tahrir</button>' +
          '<button class="btn btn-sm btn-label-info me-1" data-parts="' +
          U.esc(ev.id) +
          '"><i class="bx bx-group me-1"></i>Ishtirokchilar</button>' +
          '<button class="btn btn-sm btn-label-danger" data-del="' +
          U.esc(ev.id) +
          '">O\'chirish</button></td></tr>'
        );
      })
      .join("");
  }
  function load() {
    setAlert("", "");
    document.getElementById("z-body").innerHTML =
      '<tr><td colspan="7" class="text-body-secondary">Yuklanmoqda…</td></tr>';
    ZonApi.get("/Admin/Events")
      .then(function (data) {
        allItems = (data && data.items) || [];
        window.__events = allItems;
        var c = counts();
        var parts = allItems.reduce(function (a, b) {
          return a + Number(b.participantCount || 0);
        }, 0);
        var nSent = allItems.reduce(function (a, b) {
          return a + Number(b.notifSent || 0);
        }, 0);
        var nRead = allItems.reduce(function (a, b) {
          return a + Number(b.notifRead || 0);
        }, 0);
        document.getElementById("z-stats").innerHTML =
          U.statCard("Jami", U.n(c.all), "Musobaqa", "bx-calendar-event", "primary") +
          U.statCard("Aktiv", U.n(c.active), "Hozir", "bx-play-circle", "success") +
          U.statCard("Ishtirokchilar", U.n(parts), "Qo‘shilgan", "bx-group", "info") +
          U.statCard(
            "Inbox o‘qigan",
            U.n(nRead) + (nSent ? " / " + U.n(nSent) : ""),
            "App bildirishnoma",
            "bx-envelope-open",
            "warning"
          );
        renderFilters();
        renderTable();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("danger", U.errMsg(err));
      });
  }
  function onRow(e) {
    var edit = e.target.closest("[data-edit]");
    var del = e.target.closest("[data-del]");
    var partsBtn = e.target.closest("[data-parts]");
    if (edit) {
      editing = edit.getAttribute("data-edit");
      var ev =
        (window.__events || []).find(function (x) {
          return x.id === editing;
        }) || {};
      fill(ev);
      if (U.revealSet) {
        U.revealSet(document.getElementById("z-publish-wrap"), false);
        U.revealSet(document.getElementById("z-status-wrap"), true);
      } else {
        document.getElementById("z-publish-wrap").classList.remove("is-shown");
        document.getElementById("z-status-wrap").classList.add("is-shown");
      }
      document.querySelector("#zFormModal .modal-title").textContent = "Tahrirlash";
      U.modalShow("zFormModal");
    }
    if (del) {
      var id = del.getAttribute("data-del");
      if (!confirm("Musobaqa o'chirilsinmi?")) return;
      ZonApi.del("/Admin/Events/" + encodeURIComponent(id))
        .then(function () {
          setAlert("success", "O'chirildi");
          load();
        })
        .catch(function (err) {
          setAlert("danger", U.errMsg(err));
        });
    }
    if (partsBtn) openParts(partsBtn.getAttribute("data-parts"));
  }
  function save() {
    var btn = document.getElementById("z-save");
    btn.disabled = true;
    var body = {
      title: document.getElementById("z-title").value.trim(),
      description: document.getElementById("z-desc").value.trim() || undefined,
      goalType: document.getElementById("z-goalType").value,
      goalValue: Number(document.getElementById("z-goalValue").value),
      startsAt: fromLocal(document.getElementById("z-starts").value),
      endsAt: fromLocal(document.getElementById("z-ends").value),
    };
    var req;
    if (editing) {
      body.status = document.getElementById("z-status").value;
      req = ZonApi.put("/Admin/Events/" + encodeURIComponent(editing), body);
    } else {
      body.publish = document.getElementById("z-publish").checked;
      req = ZonApi.post("/Admin/Events", body);
    }
    req
      .then(function () {
        U.modalHide("zFormModal");
        setAlert("success", "Saqlandi");
        load();
      })
      .catch(function (err) {
        setAlert("danger", U.errMsg(err));
      })
      .finally(function () {
        btn.disabled = false;
      });
  }
})();
