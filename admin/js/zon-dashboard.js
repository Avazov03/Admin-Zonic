/**
 * Dashboard — GET /Admin/Dashboard + ApexCharts.
 * Raqamlar faqat API dan. Demo dollar/foiz yo'q.
 */
(function () {
  var charts = [];

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
  function color(key, fallback) {
    try {
      if (window.config && config.colors && config.colors[key]) return config.colors[key];
    } catch (e) {}
    return fallback;
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
  function destroyCharts() {
    charts.forEach(function (c) {
      try {
        c.destroy();
      } catch (e) {}
    });
    charts = [];
  }
  function mount(el, opts) {
    if (!el || typeof ApexCharts === "undefined") return null;
    var c = new ApexCharts(el, opts);
    c.render();
    charts.push(c);
    return c;
  }

  function renderCharts(data) {
    destroyCharts();
    var days = data.last7Days || [];
    var labels = days.map(function (d) {
      return String(d.day || "").slice(5);
    });
    var primary = color("primary", "#696cff");
    var success = color("success", "#28c76f");
    var warning = color("warning", "#ff9f43");
    var info = color("info", "#00cfe8");
    var danger = color("danger", "#ea5455");
    var muted = color("textMuted", "#a5a3ae");
    var heading = color("headingColor", "#5d596c");
    var border = color("borderColor", "#dbdade");
    var u = data.users || {};
    var ev = data.events || {};
    var news = data.news || {};
    var market = data.market || {};
    var push = data.push || {};

    // 7-day multi series: users, runs, km
    mount(document.querySelector("#z-chart-trend"), {
      chart: { height: 320, type: "line", toolbar: { show: false }, parentHeightOffset: 0 },
      series: [
        { name: "Yangi user", type: "column", data: days.map(function (d) { return Number(d.newUsers) || 0; }) },
        { name: "Yugurish", type: "column", data: days.map(function (d) { return Number(d.runs) || 0; }) },
        { name: "Masofa (km)", type: "line", data: days.map(function (d) { return Number(d.distanceKm) || 0; }) },
      ],
      colors: [primary, success, warning],
      stroke: { width: [0, 0, 3], curve: "smooth" },
      plotOptions: { bar: { columnWidth: "45%", borderRadius: 4 } },
      dataLabels: { enabled: false },
      legend: { position: "top", horizontalAlign: "start", labels: { colors: heading } },
      grid: { borderColor: border, strokeDashArray: 4 },
      xaxis: { categories: labels, labels: { style: { colors: muted } }, axisBorder: { show: false } },
      yaxis: [
        { title: { text: "Soni" }, labels: { style: { colors: muted } } },
        { opposite: true, title: { text: "km" }, labels: { style: { colors: muted } } },
      ],
      tooltip: { shared: true },
    });

    // User status donut
    var inactive = Math.max(0, Number(u.total || 0) - Number(u.activeLast3Days || 0) - Number(u.blocked || 0));
    mount(document.querySelector("#z-chart-users"), {
      chart: { height: 280, type: "donut" },
      labels: ["Faol (3 kun)", "Bloklangan", "Boshqa"],
      series: [Number(u.activeLast3Days) || 0, Number(u.blocked) || 0, inactive],
      colors: [success, danger, primary],
      legend: { position: "bottom", labels: { colors: heading } },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: { show: true },
              value: { show: true, formatter: function (v) { return n(v); } },
              total: { show: true, label: "Jami", formatter: function () { return n(u.total); } },
            },
          },
        },
      },
    });

    // Today activity bars
    var act = data.activityToday || {};
    mount(document.querySelector("#z-chart-today"), {
      chart: { height: 280, type: "bar", toolbar: { show: false } },
      series: [{ name: "Bugun", data: [Number(act.runs) || 0, Number(act.distanceKm) || 0, Number(act.steps) || 0] }],
      colors: [info],
      plotOptions: { bar: { borderRadius: 6, columnWidth: "45%", distributed: true } },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories: ["Yugurish", "Masofa (km)", "Qadam"],
        labels: { style: { colors: muted } },
        axisBorder: { show: false },
      },
      yaxis: { labels: { style: { colors: muted } } },
      grid: { borderColor: border, strokeDashArray: 4 },
      tooltip: {
        y: {
          formatter: function (val, opts) {
            var i = opts && opts.dataPointIndex;
            if (i === 1) return km(val) + " km";
            return n(val);
          },
        },
      },
    });

    // Territory + badge unlocks (7d)
    mount(document.querySelector("#z-chart-growth"), {
      chart: { height: 300, type: "area", toolbar: { show: false } },
      series: [
        { name: "Hudud", data: days.map(function (d) { return Number(d.territories) || 0; }) },
        { name: "Badge unlock", data: days.map(function (d) { return Number(d.unlocks) || 0; }) },
      ],
      colors: [warning, primary],
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
      stroke: { curve: "smooth", width: 3 },
      dataLabels: { enabled: false },
      legend: { position: "top", horizontalAlign: "start", labels: { colors: heading } },
      grid: { borderColor: border, strokeDashArray: 4 },
      xaxis: { categories: labels, labels: { style: { colors: muted } }, axisBorder: { show: false } },
      yaxis: { labels: { style: { colors: muted } } },
    });

    // Content snapshot
    mount(document.querySelector("#z-chart-content"), {
      chart: { height: 300, type: "bar", toolbar: { show: false } },
      series: [
        {
          name: "Soni",
          data: [
            Number(ev.active) || 0,
            Number(ev.participantsTotal) || 0,
            Number(news.published) || 0,
            Number(news.draft) || 0,
            Number(market.active) || 0,
            Number(market.premium) || 0,
            Number(push.campaigns) || 0,
          ],
        },
      ],
      colors: [success],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
      dataLabels: { enabled: true, formatter: function (v) { return n(v); } },
      legend: { show: false },
      xaxis: {
        categories: [
          "Faol musobaqa",
          "Ishtirokchi",
          "Yangilik (e'lon)",
          "Yangilik (qoralama)",
          "Market faol",
          "Market premium",
          "Push kampaniya",
        ],
        labels: { style: { colors: muted } },
      },
      yaxis: { labels: { style: { colors: muted } } },
      grid: { borderColor: border, strokeDashArray: 4 },
    });
  }

  function render(root, me, data) {
    var u = data.users || {};
    var ev = data.events || {};
    var act = data.activityToday || {};
    var terr = data.territories || {};
    var badges = data.badges || {};
    var market = data.market || {};
    var news = data.news || {};
    var push = data.push || {};
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
          "</td><td>" +
          n(d.steps) +
          "</td><td>" +
          n(d.territories) +
          "</td><td>" +
          n(d.unlocks) +
          "</td></tr>"
        );
      })
      .join("");
    if (!rows) rows = '<tr><td colspan="7" class="text-body-secondary">So\'nggi 7 kun bo\'yicha yozuv yo\'q</td></tr>';

    root.innerHTML =
      '<div class="row g-6 mb-6">' +
      '<div class="col-12"><div class="card"><div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title text-primary mb-1">Salom, ' +
      name +
      '</h5><p class="mb-0 text-body-secondary">Zonic — jonli ma\'lumotlar va diagrammalar.</p></div>' +
      '<div class="d-flex flex-wrap gap-2">' +
      '<a href="app-user-list.html" class="btn btn-sm btn-label-primary">Foydalanuvchilar</a>' +
      '<a href="app-zon-events.html" class="btn btn-sm btn-label-secondary">Musobaqalar</a>' +
      '<a href="app-zon-map.html" class="btn btn-sm btn-label-warning">Xarita</a>' +
      "</div></div></div></div></div>" +
      '<div class="row g-6 mb-6">' +
      card("Foydalanuvchilar", n(u.total), "Jami ro'yxat", "bx-group", "primary") +
      card("Bugun yangi", n(u.newToday), "Bugun ro'yxatdan o'tgan", "bx-user-plus", "success") +
      card("Faol (3 kun)", n(u.activeLast3Days), "Oxirgi 3 kunda ko'rilgan", "bx-user-check", "info") +
      card("Bloklangan", n(u.blocked), "Kirish rad etiladi", "bx-block", "danger") +
      "</div>" +
      '<div class="row g-6 mb-6">' +
      card("Yugurish (bugun)", n(act.runs), "Bugungi sessiyalar", "bx-run", "primary") +
      card("Masofa (bugun)", km(act.distanceKm) + " km", "Erkin yugurish", "bx-map", "success") +
      card("Hududlar", n(terr.total), "Bugun +" + n(terr.capturedToday), "bx-map-alt", "warning") +
      card("Badge unlock", n(badges.totalUnlocks), "Jami ochilish", "bx-trophy", "info") +
      "</div>" +
      '<div class="row g-6 mb-6">' +
      card("Musobaqa (faol)", n(ev.active), "E'lon " + n(ev.published) + " · ishtirok " + n(ev.participantsTotal), "bx-calendar-event", "primary") +
      card("Yangiliklar", n(news.published), "Qoralama " + n(news.draft), "bx-news", "success") +
      card("Market", n(market.active), "Premium " + n(market.premium), "bx-store", "warning") +
      card("Push", n(push.campaigns), "Yuborilgan " + n(push.sentTotal), "bx-bell", "info") +
      "</div>" +
      '<div class="row g-6 mb-6">' +
      '<div class="col-12 col-xl-8"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-0">So\'nggi 7 kun — o\'sish</h5></div>' +
      '<div class="card-body"><div id="z-chart-trend"></div></div></div></div>' +
      '<div class="col-12 col-xl-4"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-0">Foydalanuvchi holati</h5></div>' +
      '<div class="card-body"><div id="z-chart-users"></div></div></div></div></div>' +
      '<div class="row g-6 mb-6">' +
      '<div class="col-12 col-md-6 col-xl-4"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-0">Bugungi aktivlik</h5></div>' +
      '<div class="card-body"><div id="z-chart-today"></div></div></div></div>' +
      '<div class="col-12 col-md-6 col-xl-4"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-0">Hudud va yutuqlar</h5></div>' +
      '<div class="card-body"><div id="z-chart-growth"></div></div></div></div>' +
      '<div class="col-12 col-xl-4"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-0">Kontent snapshot</h5></div>' +
      '<div class="card-body"><div id="z-chart-content"></div></div></div></div></div>' +
      '<div class="card"><div class="card-header"><h5 class="card-title mb-0">So\'nggi 7 kun (jadval)</h5></div>' +
      '<div class="table-responsive"><table class="table table-hover">' +
      "<thead><tr><th>Kun</th><th>Yangi user</th><th>Yugurish</th><th>Masofa (km)</th><th>Qadam</th><th>Hudud</th><th>Unlock</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table></div></div>";

    // charts after DOM paint
    setTimeout(function () {
      renderCharts(data);
    }, 0);
  }

  function showError(root, err) {
    var msg =
      (err && err.status === 401 && "Sessiya tugagan. Qayta kiring.") ||
      (err && err.message) ||
      "Ma'lumot yuklanmadi";
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
