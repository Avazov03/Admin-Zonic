/**
 * Market — /Admin/Market/Items (POST upsert by code)
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
      '<h5 class="card-title mb-0">Market</h5>' +
      '<button type="button" class="btn btn-primary" id="z-new">Mahsulot</button></div>' +
      '<div id="z-alert" class="px-6 pt-4"></div>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th></th><th>Kod</th><th>Nomi</th><th>Narx</th><th>Kategoriya</th><th>Holat</th><th></th></tr></thead>" +
      '<tbody id="z-body"></tbody></table></div></div>' +
      formModal();

    document.getElementById("z-new").onclick = function () {
      editing = null;
      fill({});
      document.getElementById("z-code").readOnly = false;
      document.querySelector("#zFormModal .modal-title").textContent = "Yangi mahsulot";
      U.modalShow("zFormModal");
    };
    document.getElementById("z-save").onclick = save;
    document.getElementById("z-body").onclick = onRow;
    load();
  });

  function formModal() {
    return (
      '<div class="modal fade" id="zFormModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Mahsulot</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body"><div class="row g-4">' +
      '<div class="col-md-6"><label class="form-label">Kod *</label><input id="z-code" class="form-control" placeholder="frame_gold" /></div>' +
      '<div class="col-md-6"><label class="form-label">Nomi *</label><input id="z-title" class="form-control" /></div>' +
      '<div class="col-12"><label class="form-label">Tavsif</label><textarea id="z-desc" class="form-control" rows="2"></textarea></div>' +
      '<div class="col-md-4"><label class="form-label">Narx (Tanga) *</label><input id="z-price" type="number" class="form-control" /></div>' +
      '<div class="col-md-4"><label class="form-label">Valyuta</label><input id="z-currency" class="form-control" value="tanga" /></div>' +
      '<div class="col-md-4"><label class="form-label">Kategoriya</label><input id="z-cat" class="form-control" placeholder="frame" /></div>' +
      '<div class="col-md-4"><label class="form-label">Muddat</label><input id="z-duration" class="form-control" value="permanent" /></div>' +
      '<div class="col-md-4"><label class="form-label">Chegirma yorlig\'i</label><input id="z-discount" class="form-control" /></div>' +
      '<div class="col-md-4 form-check mt-5"><input class="form-check-input" type="checkbox" id="z-premium" /><label class="form-check-label" for="z-premium">Premium</label></div>' +
      '<div class="col-md-8"><label class="form-label">imageFileId</label><input id="z-image" class="form-control" /></div>' +
      '<div class="col-md-4"><label class="form-label">Rasm</label><input id="z-file" type="file" accept="image/*" class="form-control" /></div>' +
      '<div class="col-md-6 form-check ms-2"><input class="form-check-input" type="checkbox" id="z-active" checked /><label class="form-check-label" for="z-active">Faol</label></div>' +
      '</div></div><div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Bekor</button>' +
      '<button type="button" class="btn btn-primary" id="z-save">Saqlash</button></div></div></div></div>'
    );
  }
  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function fill(m) {
    document.getElementById("z-code").value = m.code || "";
    document.getElementById("z-title").value = m.name || m.title || "";
    document.getElementById("z-desc").value = m.description || "";
    document.getElementById("z-price").value = m.price != null ? m.price : "";
    document.getElementById("z-currency").value = m.currency || "tanga";
    document.getElementById("z-cat").value = m.category || "";
    document.getElementById("z-duration").value = m.duration || "permanent";
    document.getElementById("z-discount").value = m.discountLabel || "";
    document.getElementById("z-premium").checked = !!m.isPremium;
    document.getElementById("z-image").value = m.imageFileId || "";
    document.getElementById("z-file").value = "";
    document.getElementById("z-active").checked = m.isActive !== false;
  }
  function thumb(fileId) {
    if (!fileId) return '<span class="avatar-initial rounded bg-label-secondary">—</span>';
    return '<img src="' + U.esc(U.imageUrl(fileId)) + '" alt="" class="rounded" width="38" height="38" style="object-fit:cover" />';
  }
  function load() {
    setAlert("", "");
    ZonApi.get("/Admin/Market/Items")
      .then(function (data) {
        var items = (data && data.items) || [];
        window.__market = items;
        var active = items.filter(function (x) { return x.isActive; }).length;
        document.getElementById("z-stats").innerHTML =
          U.statCard("Jami", U.n(items.length), "Mahsulot", "bx-store", "primary") +
          U.statCard("Faol", U.n(active), "Sotuvda", "bx-check-circle", "success") +
          U.statCard(
            "Premium",
            U.n(items.filter(function (x) { return x.isPremium; }).length),
            "Maxsus",
            "bx-diamond",
            "warning"
          );
        var body = document.getElementById("z-body");
        if (!items.length) {
          body.innerHTML = '<tr><td colspan="7" class="text-body-secondary">Mahsulot yo\'q</td></tr>';
          return;
        }
        body.innerHTML = items
          .map(function (m) {
            return (
              "<tr><td>" +
              thumb(m.imageFileId) +
              "</td><td><code>" +
              U.esc(m.code) +
              "</code></td><td>" +
              U.esc(m.name || m.title) +
              "</td><td>" +
              U.n(m.price) +
              " " +
              U.esc(m.currency || "tanga") +
              "</td><td>" +
              U.esc(m.category || "—") +
              "</td><td>" +
              (m.isActive ? U.badge("Faol", "success") : U.badge("O'chiq", "secondary")) +
              '</td><td><button class="btn btn-sm btn-label-primary" data-edit="' +
              U.esc(m.code) +
              '">Tahrir</button></td></tr>'
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
    if (!edit) return;
    editing = edit.getAttribute("data-edit");
    var m = (window.__market || []).find(function (x) { return x.code === editing; }) || {};
    fill(m);
    document.getElementById("z-code").readOnly = true;
    document.querySelector("#zFormModal .modal-title").textContent = "Tahrirlash: " + editing;
    U.modalShow("zFormModal");
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
        var body = {
          code: document.getElementById("z-code").value.trim(),
          title: document.getElementById("z-title").value.trim(),
          description: document.getElementById("z-desc").value.trim() || undefined,
          price: Number(document.getElementById("z-price").value),
          currency: document.getElementById("z-currency").value.trim() || "tanga",
          category: document.getElementById("z-cat").value.trim() || undefined,
          duration: document.getElementById("z-duration").value.trim() || "permanent",
          discountLabel: document.getElementById("z-discount").value.trim() || undefined,
          isPremium: document.getElementById("z-premium").checked,
          imageFileId: document.getElementById("z-image").value.trim() || undefined,
          isActive: document.getElementById("z-active").checked,
        };
        return editing ? ZonApi.put("/Admin/Market/Items", body) : ZonApi.post("/Admin/Market/Items", body);
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
