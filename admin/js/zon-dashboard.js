/**
 * Dashboard — GET /Admin/Dashboard + ApexCharts.
 * Raqamlar faqat API dan. Demo dollar/foiz yo'q.
 */
(function () {
  var charts = [];
  var heatMetric = "runs";
  var heatData = [];
  var heatYear = new Date().getFullYear();
  var heatMonth = 0; // 0 = whole year
  var availableYears = [];
  var dashCache = null;
  var MONTHS_UZ = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

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

  function dayValue(d, metric) {
    if (metric === "steps") return Number(d.steps) || 0;
    if (metric === "newUsers") return Number(d.newUsers) || 0;
    return Number(d.runs) || 0;
  }

  function metricLabel(metric) {
    if (metric === "steps") return "Qadam";
    if (metric === "newUsers") return "Yangi user";
    return "Yugurish";
  }

  function heatLevel(v, max) {
    if (!v || v <= 0) return 0;
    if (!max || max <= 0) return 1;
    var r = v / max;
    if (r <= 0.25) return 1;
    if (r <= 0.5) return 2;
    if (r <= 0.75) return 3;
    return 4;
  }

  function computeHeatStats(days, metric) {
    var total = 0;
    var maxVal = 0;
    var maxDay = null;
    var monthSum = {};
    days.forEach(function (d) {
      var v = dayValue(d, metric);
      total += v;
      if (v > maxVal) {
        maxVal = v;
        maxDay = d.day;
      }
      if (v > 0 && d.day) {
        var mk = String(d.day).slice(0, 7);
        monthSum[mk] = (monthSum[mk] || 0) + v;
      }
    });
    var bestMonth = null;
    var bestMonthVal = 0;
    Object.keys(monthSum).forEach(function (mk) {
      if (monthSum[mk] > bestMonthVal) {
        bestMonthVal = monthSum[mk];
        bestMonth = mk;
      }
    });
    var longest = 0;
    var current = 0;
    var run = 0;
    days.forEach(function (d) {
      if (dayValue(d, metric) > 0) {
        run += 1;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    });
    for (var i = days.length - 1; i >= 0; i--) {
      if (dayValue(days[i], metric) > 0) current += 1;
      else break;
    }
    var monthLabel = "—";
    if (bestMonth) {
      var parts = bestMonth.split("-");
      var mi = Number(parts[1]) - 1;
      monthLabel = (MONTHS_UZ[mi] || bestMonth) + " " + parts[0];
    }
    return {
      total: total,
      maxVal: maxVal,
      maxDay: maxDay,
      bestMonth: monthLabel,
      longest: longest,
      current: current,
    };
  }

  function renderHeatmap() {
    var host = document.getElementById("z-heat-grid");
    var meta = document.getElementById("z-heat-total");
    var statsEl = document.getElementById("z-heat-stats");
    var rangeEl = document.getElementById("z-heat-range");
    if (!host) return;

    var prefix =
      heatMonth > 0
        ? heatYear + "-" + String(heatMonth).padStart(2, "0")
        : String(heatYear);
    var days = heatData.filter(function (d) {
      return d.day && String(d.day).indexOf(prefix) === 0;
    });
    var stats = computeHeatStats(days, heatMetric);
    if (meta) meta.textContent = n(stats.total);
    var title = document.getElementById("z-heat-title");
    if (title) title.textContent = metricLabel(heatMetric) + " katakchasi";
    if (rangeEl) {
      rangeEl.textContent =
        heatMonth > 0
          ? MONTHS_UZ[heatMonth - 1] + " " + heatYear
          : heatYear + " yil (to‘liq)";
    }
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="zon-heat-stat"><span class="text-body-secondary">Eng faol oy</span><strong>' +
        stats.bestMonth +
        '</strong></div>' +
        '<div class="zon-heat-stat"><span class="text-body-secondary">Eng faol kun</span><strong>' +
        (stats.maxDay || "—") +
        '</strong></div>' +
        '<div class="zon-heat-stat"><span class="text-body-secondary">Eng uzun streak</span><strong>' +
        stats.longest +
        "k</strong></div>" +
        '<div class="zon-heat-stat"><span class="text-body-secondary">Joriy streak</span><strong>' +
        stats.current +
        "k</strong></div>";
    }

    var weeks = [];
    var cur = null;
    days.forEach(function (d) {
      var dt = new Date(d.day + "T12:00:00");
      var dow = (dt.getDay() + 6) % 7;
      if (!cur || dow === 0) {
        cur = { days: [null, null, null, null, null, null, null] };
        weeks.push(cur);
      }
      cur.days[dow] = d;
    });

    var monthMarks = [];
    var lastMonth = "";
    weeks.forEach(function (w) {
      var first = w.days.find(function (x) {
        return x && x.day;
      });
      if (!first) {
        monthMarks.push("");
        return;
      }
      var m = first.day.slice(0, 7);
      if (m !== lastMonth) {
        lastMonth = m;
        monthMarks.push(MONTHS_UZ[Number(first.day.slice(5, 7)) - 1] || "");
      } else {
        monthMarks.push("");
      }
    });

    var sizeClass = heatMonth > 0 ? " is-month" : " is-year";
    var html =
      '<div class="zon-heat-wrap' +
      sizeClass +
      '"><div class="zon-heat-months">' +
      monthMarks
        .map(function (m) {
          return '<span class="zon-heat-month">' + m + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="zon-heat-body' +
      sizeClass +
      '">' +
      '<div class="zon-heat-ydays">' +
      "<span>Du</span><span></span><span>Chor</span><span></span><span>Ju</span><span></span><span>Yak</span>" +
      "</div>" +
      '<div class="zon-heat-weeks">';

    weeks.forEach(function (w) {
      html += '<div class="zon-heat-week">';
      w.days.forEach(function (d) {
        if (!d) {
          html += '<span class="zon-heat-cell is-empty"></span>';
          return;
        }
        var v = dayValue(d, heatMetric);
        var lvl = heatLevel(v, stats.maxVal);
        html +=
          '<span class="zon-heat-cell lvl-' +
          lvl +
          '" data-day="' +
          d.day +
          '" data-val="' +
          v +
          '" data-km="' +
          (Number(d.distanceKm) || 0) +
          '" data-runs="' +
          (Number(d.runs) || 0) +
          '" data-steps="' +
          (Number(d.steps) || 0) +
          '" data-users="' +
          (Number(d.newUsers) || 0) +
          '"></span>';
      });
      html += "</div>";
    });

    html +=
      "</div></div>" +
      '<div class="zon-heat-legend"><span>Kam</span>' +
      '<span class="zon-heat-cell lvl-0"></span><span class="zon-heat-cell lvl-1"></span>' +
      '<span class="zon-heat-cell lvl-2"></span><span class="zon-heat-cell lvl-3"></span>' +
      '<span class="zon-heat-cell lvl-4"></span><span>Ko‘p</span></div>' +
      '</div><div id="z-heat-tip" class="zon-heat-tip" hidden></div>';

    host.innerHTML = html;
    bindHeatTip(host);

    document.querySelectorAll("[data-heat]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-heat") === heatMetric);
    });
  }

  function bindHeatTip(host) {
    var tip = document.getElementById("z-heat-tip");
    if (!tip || !host) return;
    function hide() {
      tip.hidden = true;
    }
    host.onmouseleave = hide;
    host.onmousemove = function (e) {
      var cell = e.target.closest(".zon-heat-cell[data-day]");
      if (!cell) {
        hide();
        return;
      }
      var day = cell.getAttribute("data-day");
      var val = Number(cell.getAttribute("data-val")) || 0;
      var runs = Number(cell.getAttribute("data-runs")) || 0;
      var steps = Number(cell.getAttribute("data-steps")) || 0;
      var users = Number(cell.getAttribute("data-users")) || 0;
      var dist = Number(cell.getAttribute("data-km")) || 0;
      tip.innerHTML =
        '<div class="zon-heat-tip-day">' +
        day +
        "</div>" +
        '<div><strong>' +
        n(val) +
        "</strong> " +
        metricLabel(heatMetric) +
        "</div>" +
        '<div class="text-body-secondary small">Yugurish: ' +
        n(runs) +
        " · Qadam: " +
        n(steps) +
        " · User: " +
        n(users) +
        (dist ? " · " + km(dist) + " km" : "") +
        "</div>";
      tip.hidden = false;
      var pad = 14;
      var x = e.clientX + pad;
      var y = e.clientY + pad;
      tip.style.left = "0px";
      tip.style.top = "0px";
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      if (x + tw > window.innerWidth - 8) x = e.clientX - tw - pad;
      if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    };
  }

  function fillYearMonthSelects() {
    var ySel = document.getElementById("z-heat-year");
    var mSel = document.getElementById("z-heat-month");
    if (!ySel || !mSel) return;
    var years = availableYears.length ? availableYears.slice() : [heatYear];
    ySel.innerHTML = years
      .map(function (y) {
        return (
          '<option value="' +
          y +
          '"' +
          (y === heatYear ? " selected" : "") +
          ">" +
          y +
          "</option>"
        );
      })
      .join("");
    var months =
      '<option value="0"' +
      (heatMonth === 0 ? " selected" : "") +
      ">Barcha oylar</option>";
    for (var i = 1; i <= 12; i++) {
      months +=
        '<option value="' +
        i +
        '"' +
        (heatMonth === i ? " selected" : "") +
        ">" +
        MONTHS_UZ[i - 1] +
        "</option>";
    }
    mSel.innerHTML = months;
  }

  function loadCalendarYear(year) {
    heatYear = year;
    return ZonApi.adminDashboard({ year: year }).then(function (data) {
      dashCache = data;
      heatData = data.activityCalendar || [];
      availableYears = data.availableYears || availableYears;
      heatYear = data.calendarYear || year;
      fillYearMonthSelects();
      renderHeatmap();
      return data;
    });
  }

  function bindHeatmap(data) {
    dashCache = data;
    heatData = data.activityCalendar || [];
    availableYears = data.availableYears || [];
    heatYear = data.calendarYear || heatYear;
    fillYearMonthSelects();

    var tabs = document.getElementById("z-heat-tabs");
    if (tabs && !tabs.getAttribute("data-bound")) {
      tabs.setAttribute("data-bound", "1");
      tabs.onclick = function (e) {
        var btn = e.target.closest("[data-heat]");
        if (!btn) return;
        heatMetric = btn.getAttribute("data-heat");
        renderHeatmap();
      };
    }
    var ySel = document.getElementById("z-heat-year");
    var mSel = document.getElementById("z-heat-month");
    if (ySel && !ySel.getAttribute("data-bound")) {
      ySel.setAttribute("data-bound", "1");
      ySel.onchange = function () {
        var y = Number(ySel.value);
        ySel.disabled = true;
        loadCalendarYear(y)
          .catch(function () {})
          .finally(function () {
            ySel.disabled = false;
          });
      };
    }
    if (mSel && !mSel.getAttribute("data-bound")) {
      mSel.setAttribute("data-bound", "1");
      mSel.onchange = function () {
        heatMonth = Number(mSel.value) || 0;
        renderHeatmap();
      };
    }
    renderHeatmap();
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
      '<div class="card mb-6"><div class="card-header d-flex flex-wrap justify-content-between align-items-start gap-3">' +
      '<div><h5 class="card-title mb-1" id="z-heat-title">Faollik katakchasi</h5>' +
      '<div class="d-flex align-items-baseline gap-2 flex-wrap">' +
      '<h3 class="mb-0" id="z-heat-total">—</h3>' +
      '<span class="text-body-secondary small" id="z-heat-range">—</span></div></div>' +
      '<div class="d-flex flex-wrap align-items-center gap-2">' +
      '<select id="z-heat-year" class="form-select form-select-sm" style="width:auto;min-width:5.5rem"></select>' +
      '<select id="z-heat-month" class="form-select form-select-sm" style="width:auto;min-width:8rem"></select>' +
      '<ul class="nav nav-pills flex-wrap gap-1 mb-0" id="z-heat-tabs" role="tablist">' +
      '<li class="nav-item"><button type="button" class="nav-link active" data-heat="runs">Yugurish</button></li>' +
      '<li class="nav-item"><button type="button" class="nav-link" data-heat="steps">Qadam</button></li>' +
      '<li class="nav-item"><button type="button" class="nav-link" data-heat="newUsers">Yangi user</button></li>' +
      "</ul></div></div>" +
      '<div class="card-body"><div id="z-heat-grid" class="zon-heat"></div>' +
      '<div class="zon-heat-stats mt-4" id="z-heat-stats"></div></div></div>' +
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
      bindHeatmap(data);
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
