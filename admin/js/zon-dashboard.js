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
  var heatLayout = null;
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

  function isoDate(dt) {
    return (
      dt.getFullYear() +
      "-" +
      String(dt.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(dt.getDate()).padStart(2, "0")
    );
  }

  function todayIso() {
    return isoDate(new Date());
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
    var today = todayIso();
    // The calendar covers the whole year, so future days must not break streaks.
    var past = days.filter(function (d) {
      return d.day && d.day <= today;
    });
    var longest = 0;
    var current = 0;
    var run = 0;
    past.forEach(function (d) {
      if (dayValue(d, metric) > 0) {
        run += 1;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    });
    var i = past.length - 1;
    // Today is still in progress: no activity yet shouldn't reset the streak.
    if (i >= 0 && past[i].day === today && dayValue(past[i], metric) <= 0) i--;
    for (; i >= 0; i--) {
      if (dayValue(past[i], metric) > 0) current += 1;
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
        " kun</strong></div>" +
        '<div class="zon-heat-stat"><span class="text-body-secondary">Joriy streak</span><strong>' +
        stats.current +
        " kun</strong></div>";
    }

    // Each month is its own block of Monday-first week columns, so month labels
    // never collide and blocks are separated by exactly one cell.
    var blocks = [];
    var byMonth = {};
    days.forEach(function (d) {
      var mk = d.day.slice(0, 7);
      var b = byMonth[mk];
      if (!b) {
        b = byMonth[mk] = { key: mk, weeks: [], cur: null };
        blocks.push(b);
      }
      var dow = (new Date(d.day + "T12:00:00").getDay() + 6) % 7;
      if (!b.cur || dow === 0) {
        b.cur = [null, null, null, null, null, null, null];
        b.weeks.push(b.cur);
      }
      b.cur[dow] = d;
    });
    var cols = blocks.reduce(function (s, b) {
      return s + b.weeks.length;
    }, 0);

    var html =
      '<div class="zon-heat-wrap' +
      (heatMonth > 0 ? " is-month" : " is-year") +
      '"><div class="zon-heat-body">' +
      '<div class="zon-heat-ydays">' +
      "<span>Du</span><span></span><span>Chor</span><span></span><span>Ju</span><span></span><span>Yak</span>" +
      "</div>" +
      '<div class="zon-heat-blocks">';

    var today = todayIso();
    blocks.forEach(function (b) {
      html +=
        '<div class="zon-heat-mblock"><div class="zon-heat-month">' +
        (MONTHS_UZ[Number(b.key.slice(5, 7)) - 1] || "") +
        '</div><div class="zon-heat-weeks">';
      b.weeks.forEach(function (w) {
        html += '<div class="zon-heat-week">';
        w.forEach(function (d) {
          if (!d) {
            html += '<span class="zon-heat-cell is-empty"></span>';
            return;
          }
          var v = dayValue(d, heatMetric);
          var lvl = heatLevel(v, stats.maxVal);
          html +=
            '<span class="zon-heat-cell lvl-' +
            lvl +
            (d.day > today ? " is-future" : "") +
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
      html += "</div></div>";
    });

    html +=
      "</div></div>" +
      '<div class="zon-heat-legend"><span>Kam</span>' +
      '<span class="zon-heat-cell lvl-0"></span><span class="zon-heat-cell lvl-1"></span>' +
      '<span class="zon-heat-cell lvl-2"></span><span class="zon-heat-cell lvl-3"></span>' +
      '<span class="zon-heat-cell lvl-4"></span><span>Ko‘p</span></div>' +
      '</div><div id="z-heat-tip" class="zon-heat-tip" hidden></div>';

    host.innerHTML = html;
    heatLayout = { cols: cols, blocks: blocks.length };
    fitHeatmap();
    bindHeatTip(host);
    host.onclick = function (e) {
      var cell = e.target.closest(".zon-heat-cell[data-day]");
      if (!cell || cell.classList.contains("is-future")) return;
      var tip = document.getElementById("z-heat-tip");
      if (tip) tip.hidden = true;
      openDayModal(cell.getAttribute("data-day"));
    };

    document.querySelectorAll("[data-heat]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-heat") === heatMetric);
    });
  }

  function fitHeatmap() {
    var host = document.getElementById("z-heat-grid");
    if (!host || !heatLayout || !heatLayout.cols) return;
    var wrap = host.querySelector(".zon-heat-wrap");
    var ydays = host.querySelector(".zon-heat-ydays");
    var body = host.querySelector(".zon-heat-body");
    if (!wrap || !ydays || !body) return;
    var bodyGap = parseFloat(getComputedStyle(body).columnGap) || 0;
    var avail = host.clientWidth - ydays.offsetWidth - bodyGap - 2;
    var cols = heatLayout.cols;
    var blocks = heatLayout.blocks;
    var max = heatMonth > 0 ? 22 : 18;
    // cols cells + (cols - blocks) inner gaps + (blocks - 1) one-cell month gaps
    function size(gap) {
      return Math.floor((avail - (cols - blocks) * gap) / (cols + blocks - 1));
    }
    var gap = 3;
    var cell = size(gap);
    if (cell < 12) {
      gap = 2;
      cell = size(gap);
    }
    cell = Math.max(8, Math.min(max, cell));
    wrap.style.setProperty("--zh-cell", cell + "px");
    wrap.style.setProperty("--zh-gap", gap + "px");
  }

  // ─── Day users modal (heatmap cell click) ─────────────────────────────
  var WEEKDAYS_UZ = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  var MONTHS_UZ_FULL = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr",
  ];
  var DAY_FILTERS = [
    { key: "all", label: "Barchasi", test: function () { return true; } },
    { key: "runs", label: "Yugurgan", test: function (u) { return (u.day || {}).runs > 0; } },
    { key: "steps", label: "Qadam", test: function (u) { return (u.day || {}).steps > 0; } },
    { key: "terr", label: "Hudud", test: function (u) { return (u.day || {}).territories > 0; } },
    { key: "new", label: "Yangi", test: function (u) { return !!u.isNew; } },
  ];
  var METRIC_FILTER = { runs: "runs", steps: "steps", newUsers: "new" };
  var dayModal = { day: null, filter: "all", q: "", users: null, req: 0, cache: Object.create(null) };

  function esc(s) {
    return window.ZonUI ? ZonUI.esc(s) : String(s == null ? "" : s);
  }

  function prettyDay(day) {
    var p = day.split("-");
    return Number(p[2]) + "-" + MONTHS_UZ_FULL[Number(p[1]) - 1] + ", " + p[0];
  }

  function shiftDay(day, delta) {
    var dt = new Date(day + "T12:00:00");
    dt.setDate(dt.getDate() + delta);
    return isoDate(dt);
  }

  function calendarDay(day) {
    for (var i = 0; i < heatData.length; i++) {
      if (heatData[i].day === day) return heatData[i];
    }
    return null;
  }

  function ensureDayModal() {
    if (document.getElementById("zonDayModal")) return;
    var segs = DAY_FILTERS.map(function (f) {
      return (
        '<button type="button" role="tab" data-f="' +
        f.key +
        '">' +
        f.label +
        ' <span class="zon-seg-count" data-count="' +
        f.key +
        '">0</span></button>'
      );
    }).join("");
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal fade zon-daymodal" id="zonDayModal" tabindex="-1" aria-labelledby="zonDayModalTitle" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"><div class="modal-content">' +
      '<div class="modal-header zon-daymodal-head">' +
      '<div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">' +
      '<button type="button" class="btn btn-icon btn-sm btn-label-secondary rounded-pill" data-day-nav="-1" aria-label="Oldingi kun" title="Oldingi kun (←)"><i class="icon-base bx bx-chevron-left"></i></button>' +
      '<div class="min-w-0 px-1"><h5 class="modal-title mb-0 text-truncate" id="zonDayModalTitle">—</h5>' +
      '<small class="text-body-secondary" id="zonDayModalSub"></small></div>' +
      '<button type="button" class="btn btn-icon btn-sm btn-label-secondary rounded-pill" data-day-nav="1" aria-label="Keyingi kun" title="Keyingi kun (→)"><i class="icon-base bx bx-chevron-right"></i></button>' +
      "</div>" +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Yopish"></button></div>' +
      '<div class="zon-daymodal-tools">' +
      '<div class="zon-daymodal-summary" id="zonDaySummary"></div>' +
      '<div class="d-flex flex-wrap gap-2 align-items-center mt-3">' +
      '<div class="zon-seg" id="zonDayFilter" role="tablist" aria-label="Filtr">' +
      segs +
      "</div>" +
      '<div class="input-group input-group-sm input-group-merge zon-daymodal-search ms-auto">' +
      '<span class="input-group-text"><i class="icon-base bx bx-search"></i></span>' +
      '<input type="search" class="form-control" id="zonDaySearch" placeholder="Username yoki ZONIC-ID" autocomplete="off" aria-label="Qidirish" />' +
      "</div></div></div>" +
      '<div class="modal-body zon-daymodal-body" id="zonDayBody"></div>' +
      "</div></div></div>";
    var el = wrap.firstChild;
    document.body.appendChild(el);

    el.querySelector("#zonDayFilter").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-f]");
      if (!btn || btn.disabled) return;
      dayModal.filter = btn.getAttribute("data-f");
      paintDayList();
    });
    el.querySelector("#zonDaySearch").addEventListener("input", function (e) {
      dayModal.q = e.target.value;
      paintDayList();
    });
    el.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-day-nav]");
      if (nav && !nav.disabled) loadDayModal(shiftDay(dayModal.day, Number(nav.getAttribute("data-day-nav"))));
      var retry = e.target.closest("[data-day-retry]");
      if (retry) loadDayModal(dayModal.day);
      if (e.target.closest("[data-day-all]")) {
        dayModal.filter = "all";
        paintDayList();
      }
    });
    el.addEventListener("keydown", function (e) {
      if (e.target && e.target.id === "zonDaySearch") return;
      var btn = null;
      if (e.key === "ArrowLeft") btn = el.querySelector('[data-day-nav="-1"]');
      if (e.key === "ArrowRight") btn = el.querySelector('[data-day-nav="1"]');
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
    });
  }

  function openDayModal(day) {
    ensureDayModal();
    dayModal.filter = METRIC_FILTER[heatMetric] || "all";
    dayModal.q = "";
    document.getElementById("zonDaySearch").value = "";
    loadDayModal(day);
    if (window.ZonUI) ZonUI.modalShow("zonDayModal");
  }

  function loadDayModal(day) {
    dayModal.day = day;
    dayModal.users = null;
    var dt = new Date(day + "T12:00:00");
    document.getElementById("zonDayModalTitle").textContent = prettyDay(day);
    document.getElementById("zonDayModalSub").textContent = WEEKDAYS_UZ[dt.getDay()];
    var today = todayIso();
    var prev = shiftDay(day, -1);
    var next = shiftDay(day, 1);
    document.querySelector('#zonDayModal [data-day-nav="-1"]').disabled = !calendarDay(prev);
    document.querySelector('#zonDayModal [data-day-nav="1"]').disabled = next > today || !calendarDay(next);
    paintDaySummary(null);
    paintDayList();

    var req = ++dayModal.req;
    var cached = dayModal.cache[day];
    var p = cached ? Promise.resolve(cached) : ZonApi.adminDayActivity(day);
    p.then(function (payload) {
      // Today's list is still changing, so only past days are cached.
      if (day < today) dayModal.cache[day] = payload;
      if (req !== dayModal.req) return;
      var users = (payload && payload.users) || [];
      users.sort(function (a, b) {
        return String(a.username || "").localeCompare(String(b.username || ""), "uz", {
          sensitivity: "base",
          numeric: true,
        });
      });
      dayModal.users = users;
      paintDaySummary(users);
      paintDayList();
    }).catch(function (err) {
      if (req !== dayModal.req) return;
      if (window.ZonUI && ZonUI.authFail(err)) return;
      document.getElementById("zonDayBody").innerHTML =
        '<div class="zon-daymodal-empty"><i class="icon-base bx bx-error-circle text-danger"></i>' +
        '<div class="fw-semibold text-heading mb-1">Ma’lumot yuklanmadi</div>' +
        '<div class="small mb-3">' +
        esc((window.ZonUI && ZonUI.errMsg(err)) || "Tarmoq xatosi") +
        "</div>" +
        '<button type="button" class="btn btn-sm btn-primary" data-day-retry="1"><i class="icon-base bx bx-refresh me-1"></i>Qayta urinish</button></div>';
    });
  }

  function paintDaySummary(users) {
    var host = document.getElementById("zonDaySummary");
    var c = calendarDay(dayModal.day) || {};
    function tile(label, value, icon, tone) {
      return (
        '<div class="zon-daymodal-tile is-' +
        tone +
        '"><i class="icon-base bx ' +
        icon +
        '"></i><div><span>' +
        label +
        "</span><strong>" +
        value +
        "</strong></div></div>"
      );
    }
    host.innerHTML =
      tile("Faol user", users ? n(users.length) : "…", "bx-group", "primary") +
      tile("Yugurish", n(c.runs), "bx-run", "success") +
      tile("Masofa", km(c.distanceKm) + " km", "bx-trip", "warning") +
      tile("Qadam", n(c.steps), "bx-walk", "info");
  }

  function dayUserRow(u) {
    var d = u.day || {};
    var U = window.ZonUI;
    var av = U ? U.userAvatarHtml(u.avatarFileId, u.username, 42, { zoom: false }) : "";
    var sub = ["ZONIC-ID " + (u.zonicId != null ? u.zonicId : "—")];
    if (u.regionName) sub.push(esc(u.regionName));
    if (u.level) sub.push(esc(u.level));
    var chips = "";
    if (d.runs > 0) {
      chips +=
        '<span class="zon-chip is-run" title="Yugurish"><i class="icon-base bx bx-run"></i>' +
        n(d.runs) +
        (d.distanceKm ? " · " + km(d.distanceKm) + " km" : "") +
        "</span>";
    }
    if (d.steps > 0) {
      chips += '<span class="zon-chip is-step" title="Qadam"><i class="icon-base bx bx-walk"></i>' + n(d.steps) + "</span>";
    }
    if (d.territories > 0) {
      chips +=
        '<span class="zon-chip is-terr" title="Hudud"><i class="icon-base bx bx-map-alt"></i>' + n(d.territories) + "</span>";
    }
    if (!chips && u.isNew) {
      chips = '<span class="zon-chip" title="Faollik yo‘q">Faollik yo‘q</span>';
    }
    var href =
      "app-zon-user-runs.html?id=" +
      encodeURIComponent(u.id) +
      "&name=" +
      encodeURIComponent(u.username || "") +
      (u.avatarFileId ? "&avatar=" + encodeURIComponent(u.avatarFileId) : "");
    return (
      '<a class="zon-dayuser" href="' +
      href +
      '">' +
      av +
      '<div class="zon-dayuser-main"><div class="zon-dayuser-name">' +
      esc(u.username || "—") +
      (u.isNew ? ' <span class="badge rounded-pill bg-label-success zon-dayuser-new">Yangi</span>' : "") +
      '</div><div class="zon-dayuser-sub">' +
      sub.join(" · ") +
      "</div></div>" +
      '<div class="zon-dayuser-stats">' +
      chips +
      "</div>" +
      '<i class="icon-base bx bx-chevron-right zon-dayuser-go"></i></a>'
    );
  }

  function paintDayList() {
    var body = document.getElementById("zonDayBody");
    var users = dayModal.users;

    DAY_FILTERS.forEach(function (f) {
      var cnt = users ? users.filter(f.test).length : 0;
      var btn = document.querySelector('#zonDayFilter button[data-f="' + f.key + '"]');
      btn.querySelector(".zon-seg-count").textContent = users ? n(cnt) : "–";
      btn.disabled = !!users && f.key !== "all" && cnt === 0 && dayModal.filter !== f.key;
      btn.classList.toggle("active", dayModal.filter === f.key);
      btn.setAttribute("aria-selected", dayModal.filter === f.key ? "true" : "false");
    });

    if (!users) {
      var sk = "";
      for (var i = 0; i < 5; i++) {
        sk +=
          '<div class="zon-dayuser is-skeleton"><span class="zon-skel rounded-circle" style="width:42px;height:42px"></span>' +
          '<div class="zon-dayuser-main"><span class="zon-skel d-block mb-2" style="width:' +
          (40 + ((i * 17) % 35)) +
          '%;height:12px"></span><span class="zon-skel d-block" style="width:30%;height:10px"></span></div></div>';
      }
      body.innerHTML = sk;
      return;
    }

    var f = DAY_FILTERS.filter(function (x) {
      return x.key === dayModal.filter;
    })[0] || DAY_FILTERS[0];
    var q = dayModal.q.trim().toLowerCase();
    var list = users.filter(function (u) {
      if (!f.test(u)) return false;
      if (!q) return true;
      return (
        String(u.username || "").toLowerCase().indexOf(q) !== -1 ||
        String(u.zonicId || "").indexOf(q) !== -1
      );
    });

    if (!list.length) {
      body.innerHTML = q
        ? '<div class="zon-daymodal-empty"><i class="icon-base bx bx-search-alt"></i>' +
          '<div class="fw-semibold text-heading mb-1">Hech kim topilmadi</div>' +
          '<div class="small">“' +
          esc(dayModal.q.trim()) +
          "” bo‘yicha natija yo‘q</div></div>"
        : !users.length
          ? '<div class="zon-daymodal-empty"><i class="icon-base bx bx-user-x"></i>' +
            '<div class="fw-semibold text-heading mb-1">Bu kuni faol user yo‘q</div>' +
            '<div class="small">Boshqa kunni tanlang</div></div>'
          : '<div class="zon-daymodal-empty"><i class="icon-base bx bx-filter-alt"></i>' +
            '<div class="fw-semibold text-heading mb-1">“' +
            f.label +
            "” bo‘yicha user yo‘q</div>" +
            '<div class="small mb-3">Bu kuni ' +
            n(users.length) +
            " ta user boshqa faollik qilgan</div>" +
            '<button type="button" class="btn btn-sm btn-label-primary" data-day-all="1">Barchasini ko‘rish</button></div>';
      return;
    }

    var html = '<div class="zon-daylist">';
    var letter = null;
    list.forEach(function (u) {
      var ch = String(u.username || "#").trim().charAt(0).toLocaleUpperCase("uz");
      if (!/\p{L}/u.test(ch)) ch = "#";
      if (ch !== letter) {
        letter = ch;
        html += '<div class="zon-daylist-letter">' + esc(ch) + "</div>";
      }
      html += dayUserRow(u);
    });
    html += "</div>";
    body.innerHTML = html;
    if (window.ZonUI && ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(body);
  }

  var heatResizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(heatResizeTimer);
    heatResizeTimer = setTimeout(fitHeatmap, 120);
  });

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
        "</div>" +
        (cell.classList.contains("is-future")
          ? ""
          : '<div class="zon-heat-tip-hint"><i class="icon-base bx bx-pointer"></i> Bosing — faol userlar</div>');
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

  function fmtCoords(lat, lng) {
    if (lat == null || lng == null || !isFinite(Number(lat)) || !isFinite(Number(lng))) return "—";
    return Number(lat).toFixed(4) + ", " + Number(lng).toFixed(4);
  }

  function dayHasSignal(d) {
    return (
      Number(d.runs) > 0 ||
      Number(d.territories) > 0 ||
      Number(d.steps) > 0 ||
      Number(d.newUsers) > 0 ||
      Number(d.unlocks) > 0
    );
  }

  function renderDayDetail(host, payload) {
    var U = window.ZonUI;
    var users = (payload && payload.users) || [];
    var events = (payload && payload.events) || [];
    if (!users.length && !events.length) {
      host.innerHTML = '<p class="text-body-secondary mb-0 px-2">Bu kunda faol foydalanuvchi yo‘q.</p>';
      return;
    }
    var html =
      '<div class="zon-day-detail">' +
      '<div class="d-flex flex-wrap gap-2 mb-3">' +
      '<span class="badge bg-label-primary">Faol user: ' +
      n(users.length) +
      "</span>" +
      '<span class="badge bg-label-success">Yugurish: ' +
      n(events.filter(function (e) { return e.kind === "run"; }).length) +
      "</span>" +
      '<span class="badge bg-label-warning">Hudud: ' +
      n(events.filter(function (e) { return e.kind === "territory"; }).length) +
      "</span></div>";

    users.forEach(function (u) {
      var av =
        U && U.userAvatarHtml
          ? U.userAvatarHtml(u.avatarFileId, u.username, 40)
          : "";
      var d = u.day || {};
      var t = u.total || {};
      var userEvents = events.filter(function (e) {
        return e.userId === u.id;
      });
      html +=
        '<div class="zon-day-user card mb-3">' +
        '<div class="card-body py-3">' +
        '<div class="d-flex flex-wrap align-items-start justify-content-between gap-3">' +
        '<div class="d-flex align-items-center gap-3">' +
        av +
        '<div><a class="fw-semibold" href="app-zon-user-runs.html?id=' +
        encodeURIComponent(u.id) +
        "&name=" +
        encodeURIComponent(u.username || "") +
        (u.avatarFileId ? "&avatar=" + encodeURIComponent(u.avatarFileId) : "") +
        '">' +
        (U ? U.esc(u.username) : u.username) +
        '</a><div class="small text-body-secondary">ZONIC-ID: ' +
        (u.zonicId != null ? u.zonicId : "—") +
        " · Shu kun: <strong>" +
        n(d.activityCount) +
        "</strong> faollik</div></div></div>" +
        '<div class="zon-day-metrics">' +
        '<div><span class="text-body-secondary">Bugun</span><strong>' +
        n(d.runs) +
        " yug · " +
        km(d.distanceKm) +
        " km · " +
        n(d.territories) +
        " hudud</strong></div>" +
        '<div><span class="text-body-secondary">Jami</span><strong>' +
        n(t.runs) +
        " yug · " +
        km(t.distanceKm) +
        " km · " +
        n(t.territories) +
        " hudud</strong></div>" +
        "</div></div>";

      if (userEvents.length) {
        html +=
          '<div class="table-responsive mt-3"><table class="table table-sm mb-0">' +
          "<thead><tr><th>Turi</th><th>Vaqt</th><th>Natija</th><th>Joy</th></tr></thead><tbody>";
        userEvents.forEach(function (ev) {
          var kind =
            ev.kind === "territory"
              ? '<span class="badge bg-label-warning">Hudud</span>'
              : '<span class="badge bg-label-success">Yugurish</span>';
          var result =
            ev.kind === "territory"
              ? km(ev.distanceKm) +
                " km yug · " +
                (ev.areaKm2 != null ? Number(ev.areaKm2).toLocaleString("uz-UZ", { maximumFractionDigits: 4 }) : "—") +
                " km²"
              : km(ev.distanceKm) + " km · " + n(Math.round((ev.durationSeconds || 0) / 60)) + " daq";
          var place =
            ev.place ||
            (ev.lat != null ? fmtCoords(ev.lat, ev.lng) : "—");
          html +=
            "<tr><td>" +
            kind +
            "</td><td class=\"text-nowrap\">" +
            (U ? U.dt(ev.at) : ev.at) +
            "</td><td>" +
            result +
            "</td><td><small>" +
            (U ? U.esc(place) : place) +
            "</small></td></tr>";
        });
        html += "</tbody></table></div>";
      }
      html += "</div></div>";
    });
    html += "</div>";
    host.innerHTML = html;
    if (U && U.hydrateAvatars) U.hydrateAvatars(host);
  }

  function bindDaysTable(days) {
    var body = document.getElementById("z-days-body");
    var filter = document.getElementById("z-days-filter");
    if (!body) return;
    var openDay = null;
    var cache = Object.create(null);

    function visibleDays() {
      var f = filter ? filter.value : "all";
      return days.filter(function (d) {
        if (f === "active") return dayHasSignal(d);
        if (f === "runs") return Number(d.runs) > 0;
        if (f === "territories") return Number(d.territories) > 0;
        if (f === "users") return Number(d.newUsers) > 0;
        return true;
      });
    }

    function paint() {
      var list = visibleDays().slice().reverse();
      if (!list.length) {
        body.innerHTML =
          '<tr><td colspan="8" class="text-body-secondary">Filtr bo‘yicha kun yo‘q</td></tr>';
        return;
      }
      body.innerHTML = list
        .map(function (d) {
          var active = openDay === d.day;
          return (
            '<tr class="zon-day-row' +
            (active ? " is-open" : "") +
            (dayHasSignal(d) ? "" : " is-quiet") +
            '" data-day="' +
            d.day +
            '" role="button">' +
            '<td class="text-nowrap"><i class="icon-base bx ' +
            (active ? "bx-chevron-down" : "bx-chevron-right") +
            ' me-1"></i>' +
            d.day +
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
            '</td><td class="text-body-secondary small">' +
            (dayHasSignal(d) ? "Ochish" : "—") +
            "</td></tr>" +
            '<tr class="zon-day-panel' +
            (active ? " is-open" : "") +
            '" data-panel="' +
            d.day +
            '"' +
            (active ? "" : " hidden") +
            '><td colspan="8"><div class="zon-day-panel-inner" id="z-day-panel-' +
            d.day +
            '">' +
            (active ? '<div class="text-body-secondary py-2">Yuklanmoqda…</div>' : "") +
            "</div></td></tr>"
          );
        })
        .join("");
      if (openDay) loadDay(openDay);
    }

    function loadDay(day) {
      var host = document.getElementById("z-day-panel-" + day);
      if (!host) return;
      if (cache[day]) {
        renderDayDetail(host, cache[day]);
        return;
      }
      host.innerHTML = '<div class="text-body-secondary py-2">Yuklanmoqda…</div>';
      ZonApi.adminDayActivity(day)
        .then(function (payload) {
          cache[day] = payload;
          if (openDay === day) renderDayDetail(host, payload);
        })
        .catch(function (err) {
          if (window.ZonUI && ZonUI.authFail(err)) return;
          host.innerHTML =
            '<div class="alert alert-danger mb-0">' +
            ((window.ZonUI && ZonUI.errMsg(err)) || "Yuklanmadi") +
            "</div>";
        });
    }

    body.onclick = function (e) {
      var row = e.target.closest("tr.zon-day-row[data-day]");
      if (!row) return;
      var day = row.getAttribute("data-day");
      openDay = openDay === day ? null : day;
      paint();
    };
    if (filter && !filter.getAttribute("data-bound")) {
      filter.setAttribute("data-bound", "1");
      filter.onchange = paint;
    }
    paint();
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
    var days30 = data.last30Days || data.last7Days || [];
    var name = (me && me.username) || "Admin";

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
      '<select id="z-heat-year" class="form-select form-select-sm" style="width:auto;min-width:5.5rem" data-zon-no-select2="1"></select>' +
      '<select id="z-heat-month" class="form-select form-select-sm" style="width:auto;min-width:8rem" data-zon-no-select2="1"></select>' +
      '<ul class="nav nav-pills flex-wrap gap-1 mb-0" id="z-heat-tabs" role="tablist">' +
      '<li class="nav-item"><button type="button" class="nav-link active" data-heat="runs">Yugurish</button></li>' +
      '<li class="nav-item"><button type="button" class="nav-link" data-heat="steps">Qadam</button></li>' +
      '<li class="nav-item"><button type="button" class="nav-link" data-heat="newUsers">Yangi user</button></li>' +
      "</ul></div></div>" +
      '<div class="card-body"><div id="z-heat-grid" class="zon-heat"></div>' +
      '<div class="zon-heat-stats mt-4" id="z-heat-stats"></div></div></div>' +
      '<div class="card mb-6"><div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title mb-1">Yetakchilar</h5>' +
      '<p class="mb-0 text-body-secondary small">So‘nggi 7 kun — Top 5</p></div>' +
      '<div class="d-flex flex-wrap align-items-center gap-2">' +
      '<div class="zon-seg" id="z-top-seg">' +
      '<button type="button" class="active" data-m="km">Masofa</button>' +
      '<button type="button" data-m="steps">Qadam</button>' +
      '<button type="button" data-m="area">Hudud</button></div>' +
      '<a class="btn btn-sm btn-label-primary" id="z-top-all" href="app-zon-leaderboard.html?metric=km&period=7d">To‘liq reyting</a>' +
      "</div></div>" +
      '<div class="card-body"><div class="zon-top5" id="z-top"></div></div></div>' +
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
      '<div class="card"><div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">' +
      '<div><h5 class="card-title mb-1">So\'nggi 30 kun</h5>' +
      '<p class="mb-0 text-body-secondary small">Kunni bosing — faol userlar, yugurish va hudud</p></div>' +
      '<select id="z-days-filter" class="form-select form-select-sm" style="width:auto;min-width:10rem" data-zon-no-select2="1">' +
      '<option value="all">Barcha kunlar</option>' +
      '<option value="active">Faqat faol</option>' +
      '<option value="runs">Yugurish bor</option>' +
      '<option value="territories">Hudud bor</option>' +
      '<option value="users">Yangi user bor</option>' +
      "</select></div>" +
      '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      "<thead><tr><th>Kun</th><th>Yangi</th><th>Yugurish</th><th>Masofa</th><th>Qadam</th><th>Hudud</th><th>Unlock</th><th></th></tr></thead>" +
      '<tbody id="z-days-body"></tbody></table></div></div>';

    setTimeout(function () {
      bindHeatmap(data);
      bindTop5();
      renderCharts(data);
      bindDaysTable(days30);
    }, 0);
  }

  var TOP_UNITS = { km: " km", steps: " qadam", area: " km²" };
  var topReq = 0;

  function bindTop5() {
    var seg = document.getElementById("z-top-seg");
    if (!seg) return;
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("[data-m]");
      if (!b) return;
      Array.prototype.forEach.call(seg.querySelectorAll("[data-m]"), function (x) {
        x.classList.toggle("active", x === b);
      });
      loadTop5(b.getAttribute("data-m"));
    });
    loadTop5("km");
  }

  function loadTop5(metric) {
    var box = document.getElementById("z-top");
    var token = ++topReq;
    document.getElementById("z-top-all").href = "app-zon-leaderboard.html?metric=" + metric + "&period=7d";
    var sk =
      '<div class="zon-top5-item"><span class="zon-skel" style="width:52px;height:52px;border-radius:50%"></span>' +
      '<span class="zon-skel mt-2" style="width:70%;height:12px"></span><span class="zon-skel mt-2" style="width:50%;height:16px"></span></div>';
    box.innerHTML = sk + sk + sk + sk + sk;
    ZonApi.get("/Admin/Leaderboard?metric=" + metric + "&period=7d&limit=5")
      .then(function (d) {
        if (token !== topReq) return;
        var items = (d && d.items) || [];
        if (!items.length) {
          box.innerHTML =
            '<div class="zon-daymodal-empty w-100 py-4"><i class="bx bx-medal"></i>So‘nggi 7 kunda natija yo‘q</div>';
          return;
        }
        box.innerHTML = items
          .map(function (it) {
            var href =
              "app-zon-user-runs.html?id=" + encodeURIComponent(it.userId) +
              "&name=" + encodeURIComponent(it.username || "") +
              (it.avatarFileId ? "&avatar=" + encodeURIComponent(it.avatarFileId) : "");
            var avatar = window.ZonUI && ZonUI.userAvatarHtml
              ? ZonUI.userAvatarHtml(it.avatarFileId, it.username, 52, { zoom: false })
              : "";
            return (
              '<a class="zon-top5-item" href="' + esc(href) + '">' +
              '<span class="zon-lb-rank' + (it.rank <= 3 ? " is-top is-" + it.rank : "") + '">' + it.rank + "</span>" +
              avatar +
              '<span class="zon-top5-name">' + esc(it.username || "—") + "</span>" +
              '<span class="zon-top5-val">' + n(it.value) + TOP_UNITS[metric] + "</span></a>"
            );
          })
          .join("");
        if (window.ZonUI && ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(box);
      })
      .catch(function (err) {
        if (token !== topReq) return;
        box.innerHTML = '<div class="text-body-secondary small">Reyting yuklanmadi: ' + esc((err && err.message) || "xato") + "</div>";
      });
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
