/**
 * Push — /Admin/Push/Send + History
 * Auditoriya filtri + statistika
 */
(function () {
  var U = window.ZonUI;
  var page = 1;
  var pageSize = 20;
  var filter = "all";
  var allItems = [];
  var totalAll = 0;

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    root.innerHTML =
      '<div class="row g-6 mb-6" id="z-stats"></div>' +
      '<div class="row g-6">' +
      '<div class="col-lg-5"><div class="card mb-6"><div class="card-header"><h5 class="card-title mb-0">Push yuborish</h5>' +
      '<p class="mb-0 text-body-secondary small mt-1">Hammaga yoki tanlanganlarga</p></div>' +
      '<div class="card-body"><div id="z-alert" class="mb-4"></div>' +
      '<div class="mb-4"><label class="form-label">Sarlavha *</label><input id="z-title" class="form-control" maxlength="120" /></div>' +
      '<div class="mb-4"><label class="form-label">Matn</label><textarea id="z-body" class="form-control" rows="3" maxlength="500"></textarea></div>' +
      '<div class="mb-4"><label class="form-label">Auditoriya *</label><select id="z-audience" class="form-select">' +
      '<option value="all">Barcha foydalanuvchilar</option><option value="inactive_3d">3 kundan beri nofaol</option>' +
      '<option value="userIds">Tanlangan user ID lar</option></select></div>' +
      '<div class="mb-4 zon-reveal" id="z-ids-wrap"><div class="zon-reveal-inner"><label class="form-label">User ID lar (vergul bilan)</label>' +
      '<textarea id="z-ids" class="form-control" rows="3" placeholder="uuid1, uuid2"></textarea></div></div>' +
      '<button type="button" class="btn btn-primary" id="z-send">Yuborish</button></div></div></div>' +
      '<div class="col-lg-7"><div class="card"><div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">' +
      '<div><h5 class="card-title mb-1">Tarix</h5><small id="z-meta" class="text-body-secondary"></small></div></div>' +
      '<div class="card-body pt-0">' +
      '<ul class="nav nav-pills mb-4 flex-wrap gap-1" id="z-filters" role="tablist"></ul>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Sarlavha</th><th>Auditoriya</th><th>Yuborildi</th><th>Sana</th></tr></thead>" +
      '<tbody id="z-history"></tbody></table></div>' +
      '<div class="d-flex justify-content-between align-items-center mt-3">' +
      '<div class="btn-group">' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="z-prev">Oldingi</button>' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="z-next">Keyingi</button>' +
      "</div></div></div></div></div></div>";

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
    document.getElementById("z-filters").onclick = function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.getAttribute("data-filter");
      renderFilters();
      renderHistory();
    };
    history();
  });

  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function audienceLabel(a) {
    if (a === "all") return "Hammasi";
    if (a === "inactive_3d") return "Nofaol 3k";
    if (a === "userIds") return "Tanlangan";
    return a || "—";
  }
  function audienceBadge(a) {
    var map = { all: "primary", inactive_3d: "warning", userIds: "info" };
    return U.badge(audienceLabel(a), map[a] || "secondary");
  }
  function counts() {
    var c = { all: allItems.length, audience_all: 0, inactive_3d: 0, userIds: 0 };
    var sent = 0;
    allItems.forEach(function (x) {
      sent += Number(x.sentCount) || 0;
      if (x.audience === "all") c.audience_all += 1;
      else if (x.audience === "inactive_3d") c.inactive_3d += 1;
      else if (x.audience === "userIds") c.userIds += 1;
    });
    return { tabs: c, sent: sent };
  }
  function renderFilters() {
    var c = counts().tabs;
    var list = [
      { id: "all", label: "Barcha", icon: "bx-list-ul", count: c.all },
      { id: "audience_all", label: "Hammaga", icon: "bx-group", count: c.audience_all },
      { id: "inactive_3d", label: "Nofaol", icon: "bx-time-five", count: c.inactive_3d },
      { id: "userIds", label: "Tanlangan", icon: "bx-user", count: c.userIds },
    ];
    document.getElementById("z-filters").innerHTML = list
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
          U.n(t.count || 0) +
          "</span></button></li>"
        );
      })
      .join("");
  }
  function renderHistory() {
    var items = allItems.filter(function (x) {
      if (filter === "all") return true;
      if (filter === "audience_all") return x.audience === "all";
      return x.audience === filter;
    });
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
              audienceBadge(x.audience) +
              "</td><td>" +
              U.n(x.sentCount) +
              "</td><td>" +
              U.dt(x.createdAt) +
              "</td></tr>"
            );
          })
          .join("")
      : '<tr><td colspan="4" class="text-body-secondary">Tarix bo\'sh</td></tr>';
    document.getElementById("z-meta").textContent = totalAll ? "Jami " + U.n(totalAll) : "";
    document.getElementById("z-prev").disabled = page <= 1;
    document.getElementById("z-next").disabled = page * pageSize >= totalAll;
  }
  function history() {
    ZonApi.get("/Admin/Push/History?page=" + page + "&pageSize=" + pageSize)
      .then(function (data) {
        allItems = (data && data.items) || [];
        totalAll = Number(data.total || 0);
        var c = counts();
        document.getElementById("z-stats").innerHTML =
          U.statCard("Tarix", U.n(totalAll), "Yuboruv", "bx-bell", "primary") +
          U.statCard("Shu sahifa", U.n(c.sent), "Qabul qiluvchi", "bx-send", "success") +
          U.statCard("Nofaol", U.n(c.tabs.inactive_3d), "3 kun", "bx-time-five", "warning");
        renderFilters();
        renderHistory();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("danger", U.errMsg(err));
      });
  }
  function send() {
    var btn = document.getElementById("z-send");
    var title = document.getElementById("z-title").value.trim();
    if (!title) {
      setAlert("warning", "Sarlavha kiriting");
      return;
    }
    btn.disabled = true;
    setAlert("", "");
    var audience = document.getElementById("z-audience").value;
    var body = {
      title: title,
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
      if (!body.userIds.length) {
        setAlert("warning", "Kamida bitta user ID kiriting");
        btn.disabled = false;
        return;
      }
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
