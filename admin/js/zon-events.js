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
      '<p class="mb-0 text-body-secondary small">Ishtirokchilar + app bildirishnoma o‘qilishi</p></div>' +
      '<button type="button" class="btn btn-primary" id="z-new">Yangi musobaqa</button></div>' +
      '<div id="z-alert" class="px-6 pt-4"></div>' +
      '<div class="card-body pt-0">' +
      '<ul class="nav nav-pills mb-4 flex-wrap gap-1" id="z-filters" role="tablist"></ul>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Nomi</th><th>Maqsad</th><th>Muddat</th><th>Ishtirokchi</th><th>Bildirishnoma</th><th>Holat</th><th></th></tr></thead>" +
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
      '<div class="modal fade" id="zPartsModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Ishtirokchilar</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body table-responsive"><table class="table"><thead><tr><th>User</th><th>ZONIC-ID</th><th>Qo\'shilgan</th></tr></thead>' +
      '<tbody id="z-parts"></tbody></table></div></div></div></div>'
    );
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
    if (!sent) return '<span class="text-body-secondary">—</span>';
    var pct = Math.round((read / sent) * 100);
    return (
      '<span class="fw-medium">' +
      U.n(read) +
      "</span> / " +
      U.n(sent) +
      ' <small class="text-body-secondary">(' +
      pct +
      "% o‘qildi)</small>"
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
          "</td><td>" +
          U.esc(ev.goalType) +
          ": " +
          U.esc(ev.goalValue) +
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
          '">Ishtirokchi</button>' +
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
            "O‘qilgan",
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
    var parts = e.target.closest("[data-parts]");
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
    if (parts) {
      var eid = parts.getAttribute("data-parts");
      var evMeta =
        (window.__events || []).find(function (x) {
          return x.id === eid;
        }) || {};
      ZonApi.get("/Admin/Events/" + encodeURIComponent(eid) + "/Participants")
        .then(function (data) {
          var items = (data && data.items) || [];
          var titleEl = document.querySelector("#zPartsModal .modal-title");
          if (titleEl) {
            titleEl.textContent =
              "Ishtirokchilar (" +
              items.length +
              ")" +
              (evMeta.title ? " — " + evMeta.title : "");
          }
          document.getElementById("z-parts").innerHTML = items.length
            ? items
                .map(function (x) {
                  return (
                    "<tr><td><div class=\"d-flex align-items-center gap-2\">" +
                    U.userAvatarHtml(x.avatarFileId, x.username, 32) +
                    "<span>" +
                    U.esc(x.username) +
                    "</span></div></td><td>" +
                    U.esc(x.zonicId) +
                    "</td><td>" +
                    U.dt(x.joinedAt) +
                    "</td></tr>"
                  );
                })
                .join("")
            : '<tr><td colspan="3">Ishtirokchi yo\'q</td></tr>';
          U.modalShow("zPartsModal");
          if (U.hydrateAvatars) U.hydrateAvatars(document.getElementById("z-parts"));
        })
        .catch(function (err) {
          setAlert("danger", U.errMsg(err));
        });
    }
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
