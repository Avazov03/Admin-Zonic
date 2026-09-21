/**
 * Dashboard — GET /Admin/Dashboard va /Admin/Auth/Me.
 * Raqamlar faqat API dan. Demo dollar va foiz ko'rsatilmaydi.
 */
(function () {
  function n(v) {
    var x = Number(v);
    if (!isFinite(x)) return "—";
    return x.toLocaleString("uz-UZ");
  }
  function km(v) {
    var x = Number(v);
    if (!isFinite(x)) return "—";
    return x.toLocaleString("uz-UZ", { maximumFractionDigits: 2 });
  }
  function card(label, value, sub, icon, tone) {
    return (
      '<div class="col-sm-6 col-xl-3">' +
      '<div class="card h-100"><div class="card-body">' +
      '<div class="d-flex align-items-start justify-content-between">' +
      '<div><span class="text-heading">' +
      label +
      '</span><h4 class="mb-1 mt-2">' +
      value +
      "</h4><small class=\"text-body-secondary\">" +
      sub +
      "</small></div>" +
      '<div class="avatar"><span class="avatar-initial rounded bg-label-' +
      tone +
      '"><i class="icon-base bx ' +
      icon +
      ' icon-lg"></i></span></div>' +
      "</div></div></div></div>"
    );
  }

  function render(root, me, data) {
    var u = data.users || {};
    var ev = data.events || {};
    var act = data.activityToday || {};
    var days = data.last7Days || [];
    var name = (me && me.username) || "Admin";
    var rows = days
      .map(function (d) {
        return (
          "<tr><td>" +
          (d.day || "—") +
          "</td><td>" +
          n(d.newUsers) +
          "</td><td>" +
          n(d.runs) +
          "</td><td>" +
          km(d.distanceKm) +
          "</td></tr>"
        );
      })
      .join("");
    if (!rows) rows = '<tr><td colspan="4" class="text-body-secondary">So\'nggi 7 kun bo\'yicha yozuv yo\'q</td></tr>';

    root.innerHTML =
      '<div class="row g-6 mb-6">' +
      '<div class="col-12"><div class="card"><div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title text-primary mb-1">Salom, ' +
      name +
      '</h5><p class="mb-0 text-body-secondary">Zonic — jonli ilova. Raqamlar hozirgi bazadan.</p></div>' +
      '<a href="app-user-list.html" class="btn btn-sm btn-label-primary me-2">Foydalanuvchilar</a>' +
      '<a href="app-zon-events.html" class="btn btn-sm btn-label-secondary">Musobaqalar</a>' +
      "</div></div></div></div>" +
      '<div class="row g-6 mb-6">' +
      card("Foydalanuvchilar", n(u.total), "Jami ro'yxat", "bx-group", "primary") +
      card("Bugun yangi", n(u.newToday), "Bugun ro'yxatdan o'tgan", "bx-user-plus", "success") +
      card("Faol (3 kun)", n(u.activeLast3Days), "Oxirgi 3 kunda ko'rilgan", "bx-user-check", "info") +
      card("Bloklangan", n(u.blocked), "Kirish rad etiladi", "bx-block", "danger") +
      "</div>" +
      '<div class="row g-6 mb-6">' +
      card("Yugurish (bugun)", n(act.runs), "Bugungi sessiyalar", "bx-run", "primary") +
      card("Masofa (bugun)", km(act.distanceKm) + " km", "Erkin yugurish", "bx-map", "success") +
      card("Qadamlar (bugun)", n(act.steps), "Bugungi qadamlar", "bx-walk", "warning") +
      card("Musobaqalar", n(ev.active), "Hozir faol / e'lon " + n(ev.published), "bx-trophy", "info") +
      "</div>" +
      '<div class="card"><div class="card-header"><h5 class="card-title mb-0">So\'nggi 7 kun</h5></div>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Kun</th><th>Yangi foydalanuvchi</th><th>Yugurish</th><th>Masofa (km)</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table></div></div>";
  }

  function showError(root, err) {
    var msg = (err && err.status === 401 && "Sessiya tugagan. Qayta kiring.") || (err && err.message) || "Ma'lumot yuklanmadi";
    root.innerHTML =
      '<div class="alert alert-danger" role="alert">' +
      msg +
      '</div><a class="btn btn-primary" href="auth-login-basic.html">Kirish</a>';
  }

  function boot() {
    var root = document.querySelector(".container-xxl.flex-grow-1.container-p-y");
    if (!root || !window.ZonApi) return;
    root.innerHTML = '<div class="card"><div class="card-body text-body-secondary">Yuklanmoqda…</div></div>';
    Promise.all([ZonApi.adminMe(), ZonApi.adminDashboard()])
      .then(function (pair) {
        render(root, pair[0], pair[1] || {});
      })
      .catch(function (err) {
        if (err && err.status === 401) {
          ZonApi.logout();
          location.replace("auth-login-basic.html");
          return;
        }
        showError(root, err);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
