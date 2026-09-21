/**
 * Push — /Admin/Push/Send + History
 */
(function () {
  var U = window.ZonUI;
  var page = 1;
  var pageSize = 20;

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="row g-6">' +
      '<div class="col-lg-5"><div class="card mb-6"><div class="card-header"><h5 class="card-title mb-0">Push yuborish</h5></div>' +
      '<div class="card-body"><div id="z-alert" class="mb-4"></div>' +
      '<div class="mb-4"><label class="form-label">Sarlavha *</label><input id="z-title" class="form-control" /></div>' +
      '<div class="mb-4"><label class="form-label">Matn</label><textarea id="z-body" class="form-control" rows="3"></textarea></div>' +
      '<div class="mb-4"><label class="form-label">Auditoriya *</label><select id="z-audience" class="form-select">' +
      '<option value="all">Hammasi</option><option value="inactive_3d">3 kundan beri nofaol</option>' +
      '<option value="userIds">Tanlangan user ID lar</option></select></div>' +
      '<div class="mb-4 zon-reveal" id="z-ids-wrap"><div class="zon-reveal-inner"><label class="form-label">User ID lar (vergul bilan)</label>' +
      '<textarea id="z-ids" class="form-control" rows="3" placeholder="uuid1, uuid2"></textarea></div></div>' +
      '<button type="button" class="btn btn-primary" id="z-send">Yuborish</button></div></div></div>' +
      '<div class="col-lg-7"><div class="card"><div class="card-header d-flex justify-content-between align-items-center">' +
      '<h5 class="card-title mb-0">Tarix</h5><small id="z-meta" class="text-body-secondary"></small></div>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Sarlavha</th><th>Auditoriya</th><th>Yuborildi</th><th>Sana</th></tr></thead>" +
      '<tbody id="z-history"></tbody></table></div>' +
      '<div class="card-footer"><div class="btn-group">' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="z-prev">Oldingi</button>' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="z-next">Keyingi</button>' +
      "</div></div></div></div></div>";

    U.enhanceSelect(document.getElementById("z-audience"), {
      search: false,
      dropdownParent: document.querySelector(".card") || document.body,
    });
    function onAudienceChange() {
      var show = this.value === "userIds";
      if (U.revealSet) U.revealSet(document.getElementById("z-ids-wrap"), show);
      else document.getElementById("z-ids-wrap").classList.toggle("is-shown", show);
    }
    if (window.jQuery) {
      jQuery("#z-audience").off("change.zon").on("change.zon", onAudienceChange);
    } else {
      document.getElementById("z-audience").onchange = onAudienceChange;
    }
    document.getElementById("z-send").onclick = send;
    document.getElementById("z-prev").onclick = function () {
      if (page > 1) {
        page -= 1;
        history();
      }
    };
    document.getElementById("z-next").onclick = function () {
      page += 1;
      history();
    };
    history();
  });

  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function history() {
    ZonApi.get("/Admin/Push/History?page=" + page + "&pageSize=" + pageSize)
      .then(function (data) {
        var items = (data && data.items) || [];
        var total = Number(data.total || 0);
        var body = document.getElementById("z-history");
        body.innerHTML = items.length
          ? items
              .map(function (x) {
                return (
                  "<tr><td><span class=\"fw-medium\">" +
                  U.esc(x.title) +
                  '</span><br><small class="text-body-secondary">' +
                  U.esc(x.body || "") +
                  "</small></td><td>" +
                  U.esc(x.audience) +
                  "</td><td>" +
                  U.n(x.sentCount) +
                  "</td><td>" +
                  U.dt(x.createdAt) +
                  "</td></tr>"
                );
              })
              .join("")
          : '<tr><td colspan="4" class="text-body-secondary">Tarix bo\'sh</td></tr>';
        document.getElementById("z-meta").textContent = total ? "Jami " + U.n(total) : "";
        document.getElementById("z-prev").disabled = page <= 1;
        document.getElementById("z-next").disabled = page * pageSize >= total;
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("danger", U.errMsg(err));
      });
  }
  function send() {
    var btn = document.getElementById("z-send");
    btn.disabled = true;
    setAlert("", "");
    var audience = document.getElementById("z-audience").value;
    var body = {
      title: document.getElementById("z-title").value.trim(),
      body: document.getElementById("z-body").value.trim() || undefined,
      audience: audience,
    };
    if (audience === "userIds") {
      body.userIds = document
        .getElementById("z-ids")
        .value.split(/[\s,;]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
    }
    ZonApi.post("/Admin/Push/Send", body)
      .then(function (res) {
        setAlert("success", "Yuborildi: " + U.n(res && res.sentCount) + " ta");
        document.getElementById("z-title").value = "";
        document.getElementById("z-body").value = "";
        page = 1;
        history();
      })
      .catch(function (err) {
        setAlert("danger", U.errMsg(err));
      })
      .finally(function () {
        btn.disabled = false;
      });
  }
})();
