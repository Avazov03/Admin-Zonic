/**
 * Badges — /Admin/Badges CRUD + Unlocks
 */
(function () {
  var U = window.ZonUI;
  var editing = null;

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="row g-6 mb-6" id="z-stats"></div>' +
      '<div class="card">' +
      '<div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title mb-1">Yutuqlar</h5>' +
      '<p class="mb-0 text-body-secondary small">Kategoriya tanlang · chegara bo‘yicha tartib</p></div>' +
      '<button type="button" class="btn btn-primary" id="z-new">Yangi badge</button></div>' +
      '<div id="z-alert" class="px-6 pt-4"></div>' +
      '<div class="card-body pt-0">' +
      '<ul class="nav nav-pills mb-4 flex-wrap gap-1" id="z-tabs" role="tablist"></ul>' +
      '<div class="tab-content" id="z-tab-panels"></div>' +
      "</div></div>" +
      formModal() +
      unlocksModal();

    var activeTab = "distance";

    document.getElementById("z-new").onclick = function () {
      editing = null;
      fillForm({ type: activeTab, unit: activeTab === "territory" ? "km²" : "km" });
      document.getElementById("z-code").readOnly = false;
      document.querySelector("#zFormModal .modal-title").textContent = "Yangi badge";
      U.modalShow("zFormModal");
    };
    document.getElementById("z-save").onclick = save;
    document.getElementById("z-tab-panels").onclick = onRow;
    document.getElementById("z-tabs").onclick = function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      e.preventDefault();
      activeTab = btn.getAttribute("data-tab");
      switchTab(activeTab);
    };
    document.getElementById("z-file").onchange = function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var url = URL.createObjectURL(f);
      var box = document.getElementById("z-icon-preview");
      if (box) {
        box.innerHTML =
          '<img src="' +
          url +
          '" alt="" class="zon-badge-thumb rounded" width="56" height="56" style="object-fit:cover" />';
      }
    };
    document.getElementById("z-icon").oninput = function () {
      if (!document.getElementById("z-file").files.length) setPreview(this.value.trim());
    };
    load();

    function switchTab(type) {
      activeTab = type || "distance";
      Array.prototype.forEach.call(document.querySelectorAll("#z-tabs [data-tab]"), function (el) {
        var on = el.getAttribute("data-tab") === activeTab;
        el.classList.toggle("active", on);
        el.setAttribute("aria-selected", on ? "true" : "false");
      });
      Array.prototype.forEach.call(document.querySelectorAll("#z-tab-panels .tab-pane"), function (pane) {
        var on = pane.getAttribute("data-pane") === activeTab;
        pane.classList.toggle("show", on);
        pane.classList.toggle("active", on);
      });
    }
    window.__zonBadgeSwitchTab = switchTab;
    window.__zonBadgeActiveTab = function () {
      return activeTab;
    };
  });

  function formModal() {
    return (
      '<div class="modal fade" id="zFormModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Badge</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body"><div class="row g-4">' +
      field("z-code", "Kod *", "text", "dist_5_night") +
      field("z-title", "Nomi *", "text", "Tungi yuguruvchi") +
      '<div class="col-md-6"><label class="form-label">Tur *</label><select id="z-type" class="form-select">' +
      '<option value="distance">Yugurish (distance)</option>' +
      '<option value="territory">Hudud (territory)</option>' +
      '<option value="steps">Qadamlar (steps)</option>' +
      '<option value="custom">Boshqa (custom)</option></select></div>' +
      field("z-threshold", "Chegara *", "number", "5") +
      field("z-unit", "Birlik *", "text", "km") +
      '<div class="col-12"><label class="form-label">Tavsif</label><textarea id="z-desc" class="form-control" rows="2"></textarea></div>' +
      '<div class="col-md-3 d-flex align-items-end"><div id="z-icon-preview" class="zon-badge-thumb mb-1"></div></div>' +
      '<div class="col-md-5"><label class="form-label">Icon fileId</label><input id="z-icon" class="form-control" placeholder="Yuklangandan keyin avtomatik" /></div>' +
      '<div class="col-md-4"><label class="form-label">Rasm (PNG / JPG / WebP)</label><input id="z-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="form-control" /></div>' +
      '<div class="col-12"><small class="text-body-secondary">SVG qo‘llab-quvvatlanmaydi. Rasm yuklamasangiz jadvalda trophy belgi chiqadi.</small></div>' +
      '<div class="col-md-6 form-check mt-4 ms-2 d-none" id="z-active-wrap"><input class="form-check-input" type="checkbox" id="z-active" checked />' +
      '<label class="form-check-label" for="z-active">Faol</label></div>' +
      '</div></div><div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Bekor</button>' +
      '<button type="button" class="btn btn-primary" id="z-save">Saqlash</button></div></div></div></div>'
    );
  }
  function unlocksModal() {
    return (
      '<div class="modal fade" id="zUnlocksModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Kim ochgan</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body table-responsive"><table class="table"><thead><tr><th>User</th><th>ZONIC-ID</th><th>Vaqt</th></tr></thead>' +
      '<tbody id="z-unlocks"></tbody></table></div></div></div></div>'
    );
  }
  function field(id, label, type, ph) {
    return (
      '<div class="col-md-6"><label class="form-label" for="' +
      id +
      '">' +
      label +
      '</label><input id="' +
      id +
      '" type="' +
      type +
      '" class="form-control" placeholder="' +
      ph +
      '" /></div>'
    );
  }
  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function thumb(fileId, size) {
    size = size || 40;
    if (!fileId) {
      return (
        '<span class="zon-badge-thumb zon-badge-thumb--empty d-inline-flex align-items-center justify-content-center rounded" style="width:' +
        size +
        "px;height:" +
        size +
        'px"><i class="bx bx-trophy"></i></span>'
      );
    }
    return (
      '<img src="' +
      U.esc(U.imageUrl(fileId)) +
      '" alt="" class="zon-badge-thumb rounded" width="' +
      size +
      '" height="' +
      size +
      '" style="object-fit:cover" />'
    );
  }
  function setPreview(fileId) {
    var box = document.getElementById("z-icon-preview");
    if (box) box.innerHTML = thumb(fileId, 56);
  }
  function fillForm(b) {
    document.getElementById("z-code").value = b.code || "";
    document.getElementById("z-title").value = b.title || "";
    if (U.setSelectValue) U.setSelectValue(document.getElementById("z-type"), b.type || "distance", true);
    else document.getElementById("z-type").value = b.type || "distance";
    document.getElementById("z-threshold").value = b.threshold != null ? b.threshold : "";
    document.getElementById("z-unit").value = b.unit || "";
    document.getElementById("z-desc").value = b.description || "";
    document.getElementById("z-icon").value = b.iconFileId || "";
    document.getElementById("z-file").value = "";
    document.getElementById("z-active").checked = b.isActive !== false;
    document.getElementById("z-active-wrap").classList.toggle("d-none", !editing);
    setPreview(b.iconFileId || "");
  }
  function typeMeta(t) {
    if (t === "distance") return { title: "Yugurish", sub: "5 km dan boshlab · km", icon: "bx-run" };
    if (t === "territory") return { title: "Hudud", sub: "0.5 km² dan boshlab · km²", icon: "bx-map" };
    if (t === "steps") return { title: "Qadamlar", sub: "Qadamlar bo‘yicha", icon: "bx-walk" };
    return { title: "Boshqa", sub: "Maxsus yutuqlar", icon: "bx-star" };
  }
  function sortByThreshold(a, b) {
    return Number(a.threshold || 0) - Number(b.threshold || 0);
  }
  function rowHtml(b) {
    return (
      "<tr><td>" +
      thumb(b.iconFileId, 40) +
      "</td><td><code>" +
      U.esc(b.code) +
      "</code></td><td>" +
      U.esc(b.title) +
      "</td><td>" +
      U.esc(b.threshold) +
      " " +
      U.esc(b.unit) +
      "</td><td>" +
      U.n(b.unlockCount) +
      "</td><td>" +
      (b.isActive ? U.badge("Faol", "success") : U.badge("O'chiq", "secondary")) +
      '</td><td class="text-nowrap">' +
      '<button class="btn btn-sm btn-label-primary me-1" data-edit="' +
      U.esc(b.code) +
      '">Tahrir</button>' +
      '<button class="btn btn-sm btn-label-info me-1" data-unlocks="' +
      U.esc(b.code) +
      '">Ochganlar</button>' +
      '<button class="btn btn-sm btn-label-danger" data-del="' +
      U.esc(b.code) +
      '">O\'chirish</button></td></tr>'
    );
  }
  function paneHtml(type, list) {
    var rows = list.slice().sort(sortByThreshold);
    var meta = typeMeta(type);
    return (
      '<div class="tab-pane fade" data-pane="' +
      U.esc(type) +
      '" role="tabpanel">' +
      '<p class="text-body-secondary small mb-3">' +
      U.esc(meta.sub) +
      " · " +
      U.n(rows.length) +
      " ta yutuq</p>" +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th></th><th>Kod</th><th>Nomi</th><th>Chegara</th><th>Ochilgan</th><th>Holat</th><th></th></tr></thead>" +
      "<tbody>" +
      (rows.length
        ? rows.map(rowHtml).join("")
        : '<tr><td colspan="7" class="text-body-secondary">Bu kategoriya bo‘sh</td></tr>') +
      "</tbody></table></div></div>"
    );
  }
  function tabBtn(type, count, first) {
    var meta = typeMeta(type);
    return (
      '<li class="nav-item" role="presentation">' +
      '<button type="button" class="nav-link' +
      (first ? " active" : "") +
      '" data-tab="' +
      U.esc(type) +
      '" role="tab">' +
      '<i class="icon-base bx ' +
      meta.icon +
      ' me-1"></i>' +
      U.esc(meta.title) +
      ' <span class="badge bg-label-primary rounded-pill ms-1">' +
      U.n(count) +
      "</span></button></li>"
    );
  }
  function load() {
    setAlert("", "");
    var tabs = document.getElementById("z-tabs");
    var panels = document.getElementById("z-tab-panels");
    panels.innerHTML = '<div class="text-body-secondary py-4">Yuklanmoqda…</div>';
    ZonApi.get("/Admin/Badges")
      .then(function (data) {
        var items = (data && data.items) || [];
        window.__badges = items;
        var groups = {
          distance: items.filter(function (x) { return x.type === "distance"; }),
          territory: items.filter(function (x) { return x.type === "territory"; }),
        };
        items.forEach(function (b) {
          if (b.type === "distance" || b.type === "territory") return;
          var t = b.type || "custom";
          if (!groups[t]) groups[t] = [];
          groups[t].push(b);
        });
        var order = ["distance", "territory"].concat(
          Object.keys(groups)
            .filter(function (k) {
              return k !== "distance" && k !== "territory";
            })
            .sort()
        );
        document.getElementById("z-stats").innerHTML =
          U.statCard("Jami", U.n(items.length), "Badge", "bx-trophy", "primary") +
          U.statCard("Yugurish", U.n((groups.distance || []).length), "km", "bx-run", "info") +
          U.statCard("Hudud", U.n((groups.territory || []).length), "km²", "bx-map", "success") +
          U.statCard(
            "Ochilishlar",
            U.n(items.reduce(function (a, b) { return a + Number(b.unlockCount || 0); }, 0)),
            "Jami",
            "bx-gift",
            "warning"
          );
        if (!items.length) {
          tabs.innerHTML = "";
          panels.innerHTML = '<div class="alert alert-secondary mb-0">Badge yo\'q</div>';
          return;
        }
        var prev = window.__zonBadgeActiveTab ? window.__zonBadgeActiveTab() : "distance";
        if (!groups[prev] || !groups[prev].length) prev = order[0];
        tabs.innerHTML = order
          .map(function (t, i) {
            return tabBtn(t, (groups[t] || []).length, t === prev);
          })
          .join("");
        panels.innerHTML = order
          .map(function (t) {
            return paneHtml(t, groups[t] || []);
          })
          .join("");
        if (window.__zonBadgeSwitchTab) window.__zonBadgeSwitchTab(prev);
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        panels.innerHTML = "";
        setAlert("danger", U.errMsg(err));
      });
  }
  function onRow(e) {
    var edit = e.target.closest("[data-edit]");
    var del = e.target.closest("[data-del]");
    var un = e.target.closest("[data-unlocks]");
    if (edit) {
      editing = edit.getAttribute("data-edit");
      var b = (window.__badges || []).find(function (x) { return x.code === editing; }) || {};
      fillForm(b);
      document.getElementById("z-code").readOnly = true;
      document.querySelector("#zFormModal .modal-title").textContent = "Tahrirlash: " + editing;
      U.modalShow("zFormModal");
    }
    if (del) {
      var code = del.getAttribute("data-del");
      if (!confirm(code + " o'chirilsinmi?")) return;
      ZonApi.del("/Admin/Badges/" + encodeURIComponent(code))
        .then(function () {
          setAlert("success", "O'chirildi");
          load();
        })
        .catch(function (err) {
          setAlert("danger", U.errMsg(err));
        });
    }
    if (un) {
      var c = un.getAttribute("data-unlocks");
      ZonApi.get("/Admin/Badges/" + encodeURIComponent(c) + "/Unlocks?page=1&pageSize=50")
        .then(function (data) {
          var items = (data && data.items) || [];
          document.getElementById("z-unlocks").innerHTML = items.length
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
                    U.dt(x.unlockedAt) +
                    "</td></tr>"
                  );
                })
                .join("")
            : '<tr><td colspan="3">Hali hech kim ochmagan</td></tr>';
          U.modalShow("zUnlocksModal");
          if (U.hydrateAvatars) U.hydrateAvatars(document.getElementById("z-unlocks"));
        })
        .catch(function (err) {
          setAlert("danger", U.errMsg(err));
        });
    }
  }
  function save() {
    var btn = document.getElementById("z-save");
    btn.disabled = true;
    var file = document.getElementById("z-file").files[0];
    var chain = file
      ? U.uploadImage(file).then(function (r) {
          document.getElementById("z-icon").value = r.fileId || (r && r.fileId);
          return r;
        })
      : Promise.resolve();
    chain
      .then(function () {
        var body = {
          title: document.getElementById("z-title").value.trim(),
          type: document.getElementById("z-type").value,
          threshold: Number(document.getElementById("z-threshold").value),
          unit: document.getElementById("z-unit").value.trim(),
          description: document.getElementById("z-desc").value.trim() || undefined,
          iconFileId: document.getElementById("z-icon").value.trim() || undefined,
        };
        if (editing) {
          body.isActive = document.getElementById("z-active").checked;
          return ZonApi.put("/Admin/Badges/" + encodeURIComponent(editing), body);
        }
        body.code = document.getElementById("z-code").value.trim();
        return ZonApi.post("/Admin/Badges", body);
      })
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
