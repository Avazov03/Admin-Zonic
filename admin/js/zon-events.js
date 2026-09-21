/**
 * Events / Musobaqalar — /Admin/Events + Participants
 */
(function () {
  var U = window.ZonUI;
  var editing = null;

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="row g-6 mb-6" id="z-stats"></div>' +
      '<div class="card mb-6"><div class="card-header d-flex justify-content-between align-items-center">' +
      '<h5 class="card-title mb-0">Musobaqalar</h5>' +
      '<button type="button" class="btn btn-primary" id="z-new">Yangi musobaqa</button></div>' +
      '<div id="z-alert" class="px-6 pt-4"></div>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Nomi</th><th>Maqsad</th><th>Muddat</th><th>Ishtirokchi</th><th>Holat</th><th></th></tr></thead>" +
      '<tbody id="z-body"></tbody></table></div></div>' +
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
    var pad = function (x) { return String(x).padStart(2, "0"); };
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
  function load() {
    setAlert("", "");
    ZonApi.get("/Admin/Events")
      .then(function (data) {
        var items = (data && data.items) || [];
        window.__events = items;
        var pub = items.filter(function (x) { return x.status === "published"; }).length;
        var act = items.filter(function (x) { return x.status === "published"; }).length;
        document.getElementById("z-stats").innerHTML =
          U.statCard("Jami", U.n(items.length), "Musobaqa", "bx-calendar-event", "primary") +
          U.statCard("E'lon", U.n(pub), "published", "bx-broadcast", "success") +
          U.statCard(
            "Ishtirokchilar",
            U.n(items.reduce(function (a, b) { return a + Number(b.participantCount || 0); }, 0)),
            "Jami",
            "bx-group",
            "info"
          );
        var body = document.getElementById("z-body");
        if (!items.length) {
          body.innerHTML = '<tr><td colspan="6" class="text-body-secondary">Musobaqa yo\'q</td></tr>';
          return;
        }
        body.innerHTML = items
          .map(function (ev) {
            return (
              "<tr><td><span class=\"fw-medium\">" +
              U.esc(ev.title) +
              "</span></td><td>" +
              U.esc(ev.goalType) +
              ": " +
              U.esc(ev.goalValue) +
              "</td><td><small>" +
              U.dt(ev.startsAt) +
              "<br>" +
              U.dt(ev.endsAt) +
              "</small></td><td>" +
              U.n(ev.participantCount) +
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
      var ev = (window.__events || []).find(function (x) { return x.id === editing; }) || {};
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
      ZonApi.get("/Admin/Events/" + encodeURIComponent(eid) + "/Participants")
        .then(function (data) {
          var items = (data && data.items) || [];
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
