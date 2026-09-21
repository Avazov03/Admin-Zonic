/**
 * News — /Admin/News CRUD
 * Filter: barcha / e'lon / qoralama + tur (news/announcement/banner)
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
      '<div><h5 class="card-title mb-1">Yangiliklar</h5>' +
      '<p class="mb-0 text-body-secondary small">Holat va tur bo‘yicha filtr</p></div>' +
      '<button type="button" class="btn btn-primary" id="z-new">Yangi</button></div>' +
      '<div id="z-alert" class="px-6 pt-4"></div>' +
      '<div class="card-body pt-0">' +
      '<ul class="nav nav-pills mb-4 flex-wrap gap-1" id="z-filters" role="tablist"></ul>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th></th><th>Tur</th><th>Sarlavha</th><th>Holat</th><th>Sana</th><th></th></tr></thead>" +
      '<tbody id="z-body"></tbody></table></div></div></div>' +
      formModal();

    document.getElementById("z-new").onclick = function () {
      editing = null;
      fill({});
      if (U.revealSet) {
        U.revealSet(document.getElementById("z-publish-wrap"), true);
        U.revealSet(document.getElementById("z-pub-status-wrap"), false);
      } else {
        document.getElementById("z-publish-wrap").classList.add("is-shown");
        document.getElementById("z-pub-status-wrap").classList.remove("is-shown");
      }
      document.querySelector("#zFormModal .modal-title").textContent = "Yangi yozuv";
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
      '<div class="modal-header"><h5 class="modal-title">Yangilik</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body"><div class="row g-4">' +
      '<div class="col-md-4"><label class="form-label">Tur *</label><select id="z-type" class="form-select">' +
      '<option value="news">Yangilik</option><option value="announcement">E\'lon</option><option value="banner">Banner</option></select></div>' +
      '<div class="col-md-8"><label class="form-label">Sarlavha *</label><input id="z-title" class="form-control" /></div>' +
      '<div class="col-12"><label class="form-label">Matn</label><textarea id="z-body" class="form-control" rows="4"></textarea></div>' +
      '<div class="col-md-8"><label class="form-label">Rasm ID</label><input id="z-image" class="form-control" placeholder="yuklang yoki ID kiriting" /></div>' +
      '<div class="col-md-4"><label class="form-label">Rasm yuklash</label><input id="z-file" type="file" accept="image/*" class="form-control" /></div>' +
      '<div class="col-md-6 zon-reveal is-shown" id="z-publish-wrap"><div class="zon-reveal-inner form-check ms-2"><input class="form-check-input" type="checkbox" id="z-publish" checked />' +
      '<label class="form-check-label" for="z-publish">Darhol e\'lon qilish</label></div></div>' +
      '<div class="col-md-6 zon-reveal" id="z-pub-status-wrap"><div class="zon-reveal-inner form-check ms-2"><input class="form-check-input" type="checkbox" id="z-published" />' +
      '<label class="form-check-label" for="z-published">E\'lon qilingan</label></div></div>' +
      '</div></div><div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Bekor</button>' +
      '<button type="button" class="btn btn-primary" id="z-save">Saqlash</button></div></div></div></div>'
    );
  }
  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function typeLabel(t) {
    if (t === "announcement") return "E'lon";
    if (t === "banner") return "Banner";
    return "Yangilik";
  }
  function typeBadge(t) {
    var map = { news: "info", announcement: "warning", banner: "primary" };
    return U.badge(typeLabel(t || "news"), map[t] || "info");
  }
  function thumb(fileId) {
    if (!fileId) return '<span class="avatar-initial rounded bg-label-secondary">—</span>';
    return (
      '<img src="' +
      U.esc(U.imageUrl(fileId)) +
      '" alt="" class="rounded" width="38" height="38" style="object-fit:cover" />'
    );
  }
  function fill(n) {
    if (U.setSelectValue) U.setSelectValue(document.getElementById("z-type"), n.type || "news", true);
    else document.getElementById("z-type").value = n.type || "news";
    document.getElementById("z-title").value = n.title || "";
    document.getElementById("z-body").value = n.body || "";
    document.getElementById("z-image").value = n.imageFileId || "";
    document.getElementById("z-file").value = "";
    document.getElementById("z-publish").checked = true;
    document.getElementById("z-published").checked = !!n.isPublished;
  }
  function bucket(n) {
    if (filter === "published") return !!n.isPublished;
    if (filter === "draft") return !n.isPublished;
    if (filter === "news" || filter === "announcement" || filter === "banner") return (n.type || "news") === filter;
    return true;
  }
  function counts() {
    var c = { all: allItems.length, published: 0, draft: 0, news: 0, announcement: 0, banner: 0 };
    allItems.forEach(function (n) {
      if (n.isPublished) c.published += 1;
      else c.draft += 1;
      var t = n.type || "news";
      if (c[t] != null) c[t] += 1;
    });
    return c;
  }
  function renderFilters() {
    var c = counts();
    var tabs = [
      { id: "all", label: "Barcha", icon: "bx-list-ul" },
      { id: "published", label: "E'lon", icon: "bx-check-circle" },
      { id: "draft", label: "Qoralama", icon: "bx-file" },
      { id: "news", label: "Yangilik", icon: "bx-news" },
      { id: "announcement", label: "E'lon turi", icon: "bx-megaphone" },
      { id: "banner", label: "Banner", icon: "bx-image" },
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
  function renderTable() {
    var items = allItems.filter(bucket).slice().sort(function (a, b) {
      var da = new Date(a.publishedAt || a.createdAt || 0).getTime();
      var db = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return (isFinite(db) ? db : 0) - (isFinite(da) ? da : 0);
    });
    var body = document.getElementById("z-body");
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="6" class="text-body-secondary">Yangilik yo\'q</td></tr>';
      return;
    }
    body.innerHTML = items
      .map(function (n) {
        return (
          "<tr><td>" +
          thumb(n.imageFileId) +
          "</td><td>" +
          typeBadge(n.type) +
          "</td><td><span class=\"fw-medium\">" +
          U.esc(n.title) +
          "</span></td><td>" +
          (n.isPublished ? U.badge("E'lon", "success") : U.badge("Qoralama", "secondary")) +
          "</td><td>" +
          U.day(n.publishedAt || n.createdAt) +
          '</td><td class="text-nowrap">' +
          '<button class="btn btn-sm btn-label-primary me-1" data-edit="' +
          U.esc(n.id) +
          '">Tahrir</button>' +
          '<button class="btn btn-sm btn-label-danger" data-del="' +
          U.esc(n.id) +
          '">O\'chirish</button></td></tr>'
        );
      })
      .join("");
  }
  function load() {
    setAlert("", "");
    ZonApi.get("/Admin/News")
      .then(function (data) {
        allItems = (data && data.items) || [];
        window.__news = allItems;
        var c = counts();
        document.getElementById("z-stats").innerHTML =
          U.statCard("Jami", U.n(c.all), "Yozuv", "bx-news", "primary") +
          U.statCard("E'lon", U.n(c.published), "Ko'rinadi", "bx-check-circle", "success") +
          U.statCard("Qoralama", U.n(c.draft), "Yashirin", "bx-file", "warning");
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
    if (edit) {
      editing = edit.getAttribute("data-edit");
      var n = allItems.find(function (x) {
        return x.id === editing;
      }) || {};
      fill(n);
      if (U.revealSet) {
        U.revealSet(document.getElementById("z-publish-wrap"), false);
        U.revealSet(document.getElementById("z-pub-status-wrap"), true);
      } else {
        document.getElementById("z-publish-wrap").classList.remove("is-shown");
        document.getElementById("z-pub-status-wrap").classList.add("is-shown");
      }
      document.querySelector("#zFormModal .modal-title").textContent = "Tahrirlash";
      U.modalShow("zFormModal");
    }
    if (del) {
      var id = del.getAttribute("data-del");
      if (!confirm("O'chirilsinmi?")) return;
      ZonApi.del("/Admin/News/" + encodeURIComponent(id))
        .then(function () {
          setAlert("success", "O'chirildi");
          load();
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
          document.getElementById("z-image").value = r.fileId;
        })
      : Promise.resolve();
    chain
      .then(function () {
        if (editing) {
          return ZonApi.put("/Admin/News/" + encodeURIComponent(editing), {
            type: document.getElementById("z-type").value,
            title: document.getElementById("z-title").value.trim(),
            body: document.getElementById("z-body").value.trim() || undefined,
            imageFileId: document.getElementById("z-image").value.trim() || undefined,
            isPublished: document.getElementById("z-published").checked,
          });
        }
        return ZonApi.post("/Admin/News", {
          type: document.getElementById("z-type").value,
          title: document.getElementById("z-title").value.trim(),
          body: document.getElementById("z-body").value.trim() || undefined,
          imageFileId: document.getElementById("z-image").value.trim() || undefined,
          publish: document.getElementById("z-publish").checked,
        });
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
