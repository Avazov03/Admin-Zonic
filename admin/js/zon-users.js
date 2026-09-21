/**
 * Foydalanuvchilar — GET /Admin/Users, Block, Unblock.
 * Qatorga bosilsa accordion tafsilot ochiladi.
 * Parol: ko‘rinmaydi (hash saqlanadi) — xavfsizlik.
 */
(function () {
  var page = 1;
  var pageSize = 20;
  var q = "";
  var status = "all";
  var usersById = {};
  var openId = "";

  function n(v) {
    var x = Number(v);
    if (!isFinite(x)) return "—";
    return x.toLocaleString("uz-UZ");
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function dt(s) {
    if (!s) return "—";
    return String(s).replace("T", " ").slice(0, 16);
  }

  ready(function () {
    var root = document.querySelector(".container-xxl.flex-grow-1.container-p-y");
    if (!root || !window.ZonApi) return;

    root.innerHTML =
      '<div class="row g-6 mb-6" id="zon-user-stats"></div>' +
      '<div class="card">' +
      '<div class="card-header border-bottom">' +
      '<h5 class="card-title mb-4">Foydalanuvchilar</h5>' +
      '<p class="text-body-secondary small mb-4">Qatorga bosing — tafsilot ochiladi. Parollar xavfsizlik uchun ko‘rinmaydi (faqat hash).</p>' +
      '<div class="row g-4 align-items-end">' +
      '<div class="col-md-5"><label class="form-label" for="zon-q">Qidiruv</label>' +
      '<input id="zon-q" class="form-control" placeholder="Ism, email, telefon yoki ZONIC-ID" /></div>' +
      '<div class="col-md-3"><label class="form-label" for="zon-status">Holat</label>' +
      '<select id="zon-status" class="form-select"><option value="all">Hammasi</option>' +
      '<option value="active">Faol</option><option value="blocked">Bloklangan</option></select></div>' +
      '<div class="col-md-2"><button type="button" class="btn btn-primary w-100" id="zon-search">Qidirish</button></div>' +
      "</div></div>" +
      '<div id="zon-user-alert" class="px-6 pt-4"></div>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th style=\"width:2rem\"></th><th>Foydalanuvchi</th><th>ZONIC-ID</th><th>Telefon</th><th>Daraja</th><th>Faoliyat</th><th>Holat</th><th>Ro'yxat</th><th></th></tr></thead>" +
      '<tbody id="zon-user-body"><tr><td colspan="9" class="text-body-secondary">Yuklanmoqda…</td></tr></tbody>' +
      "</table></div>" +
      '<div class="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">' +
      '<small id="zon-user-meta" class="text-body-secondary"></small>' +
      '<div class="btn-group">' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="zon-prev">Oldingi</button>' +
      '<button type="button" class="btn btn-sm btn-label-secondary" id="zon-next">Keyingi</button>' +
      "</div></div></div>" +
      '<div class="modal fade" id="zonBlockModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Foydalanuvchini bloklash</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Yopish"></button></div>' +
      '<div class="modal-body"><p class="mb-4" id="zon-block-who"></p>' +
      '<label class="form-label" for="zon-reason">Sabab</label>' +
      '<input id="zon-reason" class="form-control" placeholder="Spam / qoidabuzarlik" /></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Bekor</button>' +
      '<button type="button" class="btn btn-danger" id="zon-block-ok">Bloklash</button></div>' +
      "</div></div></div>";

    var body = document.getElementById("zon-user-body");
    var meta = document.getElementById("zon-user-meta");
    var alertBox = document.getElementById("zon-user-alert");
    var blockId = "";

    function setAlert(kind, text) {
      if (!text) {
        alertBox.innerHTML = "";
        return;
      }
      alertBox.innerHTML = '<div class="alert alert-' + kind + '" role="alert">' + esc(text) + "</div>";
    }

    function stats(d) {
      var u = (d && d.users) || {};
      document.getElementById("zon-user-stats").innerHTML =
        stat("Jami", n(u.total), "Ro'yxatdagi", "bx-group", "primary") +
        stat("Bugun", n(u.newToday), "Yangi", "bx-user-plus", "success") +
        stat("Faol", n(u.activeLast3Days), "Oxirgi 3 kun", "bx-user-check", "info") +
        stat("Blok", n(u.blocked), "Kirish yopiq", "bx-block", "danger");
    }
    function stat(title, value, sub, icon, tone) {
      return (
        '<div class="col-sm-6 col-xl-3"><div class="card"><div class="card-body">' +
        '<div class="d-flex align-items-start justify-content-between"><div class="content-left">' +
        '<span class="text-heading">' +
        title +
        '</span><div class="d-flex align-items-center my-1"><h4 class="mb-0 me-2">' +
        value +
        "</h4></div><small>" +
        sub +
        "</small></div>" +
        '<div class="avatar"><span class="avatar-initial rounded bg-label-' +
        tone +
        '"><i class="icon-base bx ' +
        icon +
        ' icon-lg"></i></span></div></div></div></div></div>'
      );
    }

    function field(label, value) {
      return (
        '<div class="col-md-6 col-lg-4 mb-3"><label class="form-label text-body-secondary mb-1">' +
        esc(label) +
        '</label><div class="form-control bg-lighter border-0">' +
        value +
        "</div></div>"
      );
    }

    function detailHtml(u) {
      var blocked = !!u.isBlocked;
      var av =
        window.ZonUI && ZonUI.userAvatarHtml
          ? ZonUI.userAvatarHtml(u.avatarFileId, u.username, 64)
          : "";
      return (
        '<div class="p-4 zon-user-accordion">' +
        '<div class="d-flex align-items-center gap-3 mb-4">' +
        av +
        "<div><h5 class=\"mb-1\">" +
        esc(u.username || "—") +
        '</h5><p class="mb-0 text-body-secondary small">ID: ' +
        esc(u.id) +
        "</p></div></div>" +
        '<div class="row">' +
        field("Login (username)", esc(u.username || "—")) +
        field("Email", esc(u.email || "—")) +
        field("Telefon", esc(u.phone || "—")) +
        field("ZONIC-ID", esc(u.zonicId == null ? "—" : u.zonicId)) +
        field("Daraja", esc(u.level == null ? "—" : u.level)) +
        field("Admin", u.isAdmin ? "Ha" : "Yo‘q") +
        field("Holat", blocked ? "Bloklangan" : "Faol") +
        field("Blok sababi", esc(u.blockedReason || "—")) +
        field("Bloklangan", dt(u.blockedAt)) +
        field("So‘nggi faollik", dt(u.lastSeenAt)) +
        field("Ro‘yxatdan o‘tgan", dt(u.createdAt)) +
        field("Yugurishlar", n(u.runsCount != null ? u.runsCount : 0)) +
        field("Hudud egallash", n(u.territoriesCount != null ? u.territoriesCount : 0)) +
        field(
          "Parol",
          '<span class="text-body-secondary">Ko‘rinmaydi — faqat xavfsiz hash saqlanadi</span>'
        ) +
        "</div>" +
        '<div class="d-flex flex-wrap gap-2 mt-2">' +
        '<a class="btn btn-sm btn-primary" href="app-zon-user-runs.html?id=' +
        encodeURIComponent(u.id) +
        "&name=" +
        encodeURIComponent(u.username || "") +
        (u.avatarFileId ? "&avatar=" + encodeURIComponent(u.avatarFileId) : "") +
        '">Faoliyatni ochish</a>' +
        '<a class="btn btn-sm btn-label-primary" href="app-zon-map.html">Xaritaga o‘tish</a>' +
        "</div></div>"
      );
    }

    function renderRows(items) {
      usersById = {};
      body.innerHTML = items
        .map(function (u) {
          usersById[u.id] = u;
          var blocked = !!u.isBlocked;
          var badge = blocked
            ? '<span class="badge bg-label-danger">Bloklangan</span>'
            : '<span class="badge bg-label-success">Faol</span>';
          var action = u.isAdmin
            ? '<span class="badge bg-label-primary me-1">Admin</span>'
            : blocked
              ? '<button type="button" class="btn btn-sm btn-label-success me-1" data-unblock="' +
                esc(u.id) +
                '">Ochish</button>'
              : '<button type="button" class="btn btn-sm btn-label-danger me-1" data-block="' +
                esc(u.id) +
                '" data-name="' +
                esc(u.username) +
                '">Bloklash</button>';
          var created = u.createdAt ? String(u.createdAt).slice(0, 10) : "—";
          var activity =
            '<span class="badge bg-label-primary me-1" title="Yugurish">' +
            n(u.runsCount != null ? u.runsCount : 0) +
            " yug.</span>" +
            '<span class="badge bg-label-warning" title="Hudud egallash">' +
            n(u.territoriesCount != null ? u.territoriesCount : 0) +
            " hud.</span>";
          var av =
            window.ZonUI && ZonUI.userAvatarHtml
              ? ZonUI.userAvatarHtml(u.avatarFileId, u.username, 36)
              : "";
          var runsBtn =
            '<a class="btn btn-sm btn-label-info me-1" href="app-zon-user-runs.html?id=' +
            encodeURIComponent(u.id) +
            "&name=" +
            encodeURIComponent(u.username || "") +
            (u.avatarFileId ? "&avatar=" + encodeURIComponent(u.avatarFileId) : "") +
            '">Faoliyat</a>';
          var isOpen = openId === u.id;
          var chevron = isOpen ? "bx-chevron-up" : "bx-chevron-down";
          var main =
            '<tr class="zon-user-row' +
            (isOpen ? " table-active" : "") +
            '" data-toggle-user="' +
            esc(u.id) +
            '" style="cursor:pointer">' +
            '<td class="text-center"><i class="icon-base bx ' +
            chevron +
            '"></i></td>' +
            '<td><div class="d-flex align-items-center gap-2">' +
            av +
            '<div><span class="fw-medium">' +
            esc(u.username || "—") +
            '</span><br><small class="text-body-secondary">' +
            esc(u.email || "—") +
            "</small></div></div></td><td>" +
            esc(u.zonicId || "—") +
            "</td><td>" +
            esc(u.phone || "—") +
            "</td><td>" +
            esc(u.level == null ? "—" : u.level) +
            '</td><td class="text-nowrap">' +
            activity +
            "</td><td>" +
            badge +
            "</td><td>" +
            esc(created) +
            '</td><td class="text-nowrap" data-no-toggle="1">' +
            runsBtn +
            action +
            "</td></tr>";
          var detail =
            '<tr class="zon-user-detail' +
            (isOpen ? " is-open" : "") +
            '" data-detail-for="' +
            esc(u.id) +
            '"><td colspan="9" class="p-0 border-0">' +
            '<div class="zon-reveal' +
            (isOpen ? " is-shown" : "") +
            '"><div class="zon-reveal-inner">' +
            detailHtml(u) +
            "</div></div></td></tr>";
          return main + detail;
        })
        .join("");
      if (window.ZonUI && ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(body);
    }

    function applyOpenState() {
      Array.prototype.forEach.call(body.querySelectorAll("[data-toggle-user]"), function (tr) {
        var id = tr.getAttribute("data-toggle-user");
        var open = id === openId;
        tr.classList.toggle("table-active", open);
        var icon = tr.querySelector(".bx-chevron-down, .bx-chevron-up");
        if (icon) {
          icon.classList.remove("bx-chevron-down", "bx-chevron-up");
          icon.classList.add(open ? "bx-chevron-up" : "bx-chevron-down");
        }
      });
      Array.prototype.forEach.call(body.querySelectorAll("[data-detail-for]"), function (tr) {
        var id = tr.getAttribute("data-detail-for");
        var open = id === openId;
        tr.classList.toggle("is-open", open);
        var rev = tr.querySelector(".zon-reveal");
        if (rev) {
          if (window.ZonUI && ZonUI.revealSet) ZonUI.revealSet(rev, open);
          else rev.classList.toggle("is-shown", open);
        }
      });
    }

    function load() {
      setAlert("", "");
      body.innerHTML = '<tr><td colspan="9" class="text-body-secondary">Yuklanmoqda…</td></tr>';
      var path =
        "/Admin/Users?page=" +
        page +
        "&pageSize=" +
        pageSize +
        "&status=" +
        encodeURIComponent(status) +
        (q ? "&q=" + encodeURIComponent(q) : "");
      Promise.all([ZonApi.adminDashboard().catch(function () { return null; }), ZonApi.get(path)])
        .then(function (pair) {
          if (pair[0]) stats(pair[0]);
          var data = pair[1] || {};
          var items = data.items || [];
          var total = Number(data.total || 0);
          if (!items.length) {
            body.innerHTML = '<tr><td colspan="9" class="text-body-secondary">Foydalanuvchi topilmadi</td></tr>';
            usersById = {};
          } else {
            if (openId && !items.some(function (u) { return u.id === openId; })) openId = "";
            renderRows(items);
          }
          var from = total ? (page - 1) * pageSize + 1 : 0;
          var to = Math.min(page * pageSize, total);
          meta.textContent = total ? from + "–" + to + " / " + n(total) : "0 ta";
          document.getElementById("zon-prev").disabled = page <= 1;
          document.getElementById("zon-next").disabled = page * pageSize >= total;
        })
        .catch(function (err) {
          if (err && err.status === 401) {
            ZonApi.logout();
            location.replace("auth-login-basic.html");
            return;
          }
          body.innerHTML = "";
          setAlert("danger", (err && err.message) || "Ro'yxat yuklanmadi");
        });
    }

    if (window.ZonUI && ZonUI.enhanceSelect) {
      ZonUI.enhanceSelect(document.getElementById("zon-status"), {
        search: false,
        dropdownParent: document.querySelector(".card") || document.body,
      });
    }

    document.getElementById("zon-search").addEventListener("click", function () {
      q = document.getElementById("zon-q").value.trim();
      status = document.getElementById("zon-status").value;
      page = 1;
      openId = "";
      load();
    });
    document.getElementById("zon-q").addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("zon-search").click();
    });
    document.getElementById("zon-prev").addEventListener("click", function () {
      if (page > 1) {
        page -= 1;
        openId = "";
        load();
      }
    });
    document.getElementById("zon-next").addEventListener("click", function () {
      page += 1;
      openId = "";
      load();
    });

    body.addEventListener("click", function (e) {
      if (e.target.closest("[data-no-toggle]") || e.target.closest("a,button")) {
        var blockBtn = e.target.closest("[data-block]");
        var openBtn = e.target.closest("[data-unblock]");
        if (blockBtn) {
          blockId = blockBtn.getAttribute("data-block");
          document.getElementById("zon-block-who").textContent = blockBtn.getAttribute("data-name") || "";
          document.getElementById("zon-reason").value = "";
          var modalEl = document.getElementById("zonBlockModal");
          if (window.bootstrap && bootstrap.Modal) bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
        if (openBtn) {
          var id = openBtn.getAttribute("data-unblock");
          openBtn.disabled = true;
          ZonApi.post("/Admin/Users/" + encodeURIComponent(id) + "/Unblock", {})
            .then(function () {
              setAlert("success", "Foydalanuvchi ochildi.");
              load();
            })
            .catch(function (err) {
              setAlert("danger", (err && err.message) || "Ochilmadi");
              openBtn.disabled = false;
            });
        }
        return;
      }
      var row = e.target.closest("[data-toggle-user]");
      if (!row) return;
      var uid = row.getAttribute("data-toggle-user");
      openId = openId === uid ? "" : uid;
      applyOpenState();
      if (openId && window.ZonUI && ZonUI.hydrateAvatars) {
        var detail = body.querySelector('[data-detail-for="' + openId + '"]');
        if (detail) ZonUI.hydrateAvatars(detail);
      }
    });

    document.getElementById("zon-block-ok").addEventListener("click", function () {
      if (!blockId) return;
      var reason = document.getElementById("zon-reason").value.trim();
      var btn = this;
      btn.disabled = true;
      ZonApi.post("/Admin/Users/" + encodeURIComponent(blockId) + "/Block", { reason: reason })
        .then(function () {
          var modalEl = document.getElementById("zonBlockModal");
          if (window.bootstrap && bootstrap.Modal) {
            var inst = bootstrap.Modal.getInstance(modalEl);
            if (inst) inst.hide();
          }
          setAlert("success", "Foydalanuvchi bloklandi.");
          btn.disabled = false;
          load();
        })
        .catch(function (err) {
          btn.disabled = false;
          setAlert(
            "danger",
            (err && err.data && err.data.message) || (err && err.message) || "Bloklanmadi"
          );
        });
    });

    load();
  });
})();
