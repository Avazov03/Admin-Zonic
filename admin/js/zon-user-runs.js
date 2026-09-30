/**
 * User profili — GET /Admin/Users/{id}/Profile (umumiy, yutuqlar, xaridlar, musobaqalar)
 * Faoliyat tabi: GET /Admin/Users/{id}/Runs, /Territories, /Admin/Runs/{id}, /Admin/Territories/{id}
 */
(function () {
  var U = window.ZonUI;
  var params = new URLSearchParams(location.search);
  var userId = params.get("id") || "";
  var username = params.get("name") || "";
  var avatarFileId = params.get("avatar") || "";
  var profile = null;
  var runMap = null;
  var runLayer = null;
  var pinApi = null;
  var allItems = [];
  var filter = "all";
  var activityLoaded = false;
  var trendMetric = "km";

  var TABS = [
    { id: "umumiy", label: "Umumiy", icon: "bx-user" },
    { id: "faoliyat", label: "Faoliyat", icon: "bx-run" },
    { id: "yutuqlar", label: "Yutuqlar", icon: "bx-trophy", count: "badges" },
    { id: "xaridlar", label: "Xaridlar", icon: "bx-shopping-bag", count: "purchases" },
    { id: "musobaqalar", label: "Musobaqalar", icon: "bx-flag", count: "events" },
  ];
  var LEVELS = {
    beginner: "Boshlang‘ich",
    intermediate: "O‘rta",
    advanced: "Ilg‘or",
    professional: "Professional",
  };
  var GENDERS = { male: "Erkak", m: "Erkak", female: "Ayol", f: "Ayol" };
  var EVENT_STATUS = {
    active: ["Faol", "success"],
    upcoming: ["Kutilmoqda", "info"],
    scheduled: ["Rejada", "info"],
    finished: ["Tugagan", "secondary"],
    ended: ["Tugagan", "secondary"],
    draft: ["Qoralama", "warning"],
    cancelled: ["Bekor", "danger"],
  };
  var CATEGORIES = { frame: "Ramka", challenge: "Challenge", boost: "Kuchaytirgich", badge: "Nishon", theme: "Mavzu" };
  var DURATION_MS = { "1h": 3600e3, "1d": 86400e3, "1m": 30 * 86400e3, "3m": 90 * 86400e3 };
  var MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

  U.ready(function () {
    var root = U.root();
    if (!root || !window.ZonApi) return;
    if (!userId) {
      root.innerHTML =
        '<div class="alert alert-warning">Foydalanuvchi tanlanmagan. <a href="app-user-list.html">Ro\'yxatga qaytish</a></div>';
      return;
    }

    root.innerHTML =
      '<div class="card zon-prof-hero mb-6" id="z-hero">' + heroHtml(null) + "</div>" +
      '<div id="z-page-alert" class="mb-4"></div>' +
      '<ul class="nav nav-pills zon-prof-tabs mb-6" role="tablist" id="z-tabs">' +
      TABS.map(function (t) {
        return (
          '<li class="nav-item"><button type="button" class="nav-link" role="tab" data-tab="' +
          t.id +
          '"><i class="icon-base bx ' +
          t.icon +
          ' me-1"></i>' +
          t.label +
          (t.count ? ' <span class="badge rounded-pill bg-label-secondary ms-1" data-count="' + t.count + '">…</span>' : "") +
          "</button></li>"
        );
      }).join("") +
      "</ul>" +
      '<div class="zon-prof-pane" data-pane="umumiy" id="z-overview">' + overviewSkeleton() + "</div>" +
      '<div class="zon-prof-pane" data-pane="faoliyat" hidden>' + activityHtml() + "</div>" +
      '<div class="zon-prof-pane" data-pane="yutuqlar" hidden id="z-badges"></div>' +
      '<div class="zon-prof-pane" data-pane="xaridlar" hidden id="z-purchases"></div>' +
      '<div class="zon-prof-pane" data-pane="musobaqalar" hidden id="z-events"></div>' +
      blockModalHtml();

    document.getElementById("z-tabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]");
      if (b) showTab(b.getAttribute("data-tab"), true);
    });
    document.getElementById("z-hero").addEventListener("click", onHeroClick);
    document.getElementById("z-overview").addEventListener("click", onOverviewClick);
    document.getElementById("z-body").onclick = onRow;
    document.getElementById("z-filter").onclick = onFilter;
    document.getElementById("z-block-ok").addEventListener("click", doBlock);
    window.addEventListener("hashchange", function () {
      showTab(tabFromHash(), false);
    });

    showTab(tabFromHash(), false);
    if (U.hydrateAvatars) U.hydrateAvatars(root);
    loadProfile();
  });

  // ─── Profil ────────────────────────────────────────────────────────────
  function tabFromHash() {
    var h = String(location.hash || "").replace("#", "");
    return TABS.some(function (t) {
      return t.id === h;
    })
      ? h
      : "umumiy";
  }

  function showTab(id, pushHash) {
    Array.prototype.forEach.call(document.querySelectorAll("#z-tabs [data-tab]"), function (b) {
      var on = b.getAttribute("data-tab") === id;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".zon-prof-pane"), function (p) {
      p.hidden = p.getAttribute("data-pane") !== id;
    });
    if (pushHash && location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    if (id === "faoliyat") ensureActivity();
  }

  function loadProfile() {
    ZonApi.get("/Admin/Users/" + encodeURIComponent(userId) + "/Profile")
      .then(function (p) {
        profile = p || {};
        var u = profile.user || {};
        username = u.username || username;
        avatarFileId = u.avatarFileId || avatarFileId;
        document.title = (username || "Foydalanuvchi") + " — Zon Admin";
        renderHero();
        renderOverview();
        renderBadges();
        renderPurchases();
        renderEvents();
        setCounts();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        document.getElementById("z-page-alert").innerHTML = U.alertHtml("danger", "Profil yuklanmadi: " + U.errMsg(err));
        document.getElementById("z-overview").innerHTML = "";
      });
  }

  function setCounts() {
    var s = (profile && profile.stats) || {};
    Array.prototype.forEach.call(document.querySelectorAll("#z-tabs [data-count]"), function (el) {
      var k = el.getAttribute("data-count");
      el.textContent = U.n(s[k] || 0);
    });
  }

  function heroHtml(p) {
    var u = (p && p.user) || { username: username, avatarFileId: avatarFileId };
    var name = u.username || username || userId;
    var chips = [];
    if (p) {
      chips.push(u.isBlocked ? U.badge("Bloklangan", "danger") : U.badge("Faol", "success"));
      if (u.isAdmin) chips.push(U.badge("Admin", "primary"));
      if (u.level) chips.push(U.badge(LEVELS[String(u.level).toLowerCase()] || u.level, "info"));
    }
    var meta = [];
    if (p) {
      meta.push(metaItem("bx-id-card", "ZONIC-ID " + (u.zonicId != null ? u.zonicId : "—")));
      var place = [u.regionName, u.countryName].filter(Boolean).join(", ");
      if (place) meta.push(metaItem("bx-map-pin", place));
      meta.push(metaItem("bx-calendar", "Ro‘yxat: " + U.day(u.createdAt)));
      meta.push(metaItem("bx-time-five", "Oxirgi faollik: " + relTime(u.lastSeenAt)));
    }
    var action = "";
    if (p && !u.isAdmin) {
      action = u.isBlocked
        ? '<button type="button" class="btn btn-success" data-act="unblock"><i class="icon-base bx bx-lock-open-alt me-1"></i>Blokdan ochish</button>'
        : '<button type="button" class="btn btn-label-danger" data-act="block"><i class="icon-base bx bx-block me-1"></i>Bloklash</button>';
    }
    return (
      '<div class="zon-prof-cover" id="z-cover"' +
      (u.color ? ' style="--zp-accent:' + U.esc(safeColor(u.color)) + '"' : "") +
      "></div>" +
      '<div class="card-body zon-prof-body">' +
      '<div class="zon-prof-avatar">' +
      U.userAvatarHtml(u.avatarFileId, name, 104) +
      "</div>" +
      '<div class="zon-prof-main">' +
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-1"><h4 class="mb-0">' +
      U.esc(name) +
      "</h4>" +
      chips.join("") +
      "</div>" +
      (p && u.bio ? '<p class="zon-prof-bio mb-2">' + U.esc(u.bio) + "</p>" : "") +
      '<div class="zon-prof-meta">' +
      (meta.length ? meta.join("") : '<span class="zon-skel" style="width:260px;height:14px"></span>') +
      "</div>" +
      (p && u.isBlocked
        ? '<div class="alert alert-danger py-2 px-3 mt-3 mb-0 small"><strong>Bloklangan</strong> ' +
          U.esc(U.dt(u.blockedAt)) +
          (u.blockedReason ? " — " + U.esc(u.blockedReason) : "") +
          "</div>"
        : "") +
      "</div>" +
      '<div class="zon-prof-actions">' +
      action +
      '<a class="btn btn-label-secondary" href="app-user-list.html"><i class="icon-base bx bx-arrow-back me-1"></i>Ro‘yxat</a>' +
      "</div></div>"
    );
  }

  function renderHero() {
    var hero = document.getElementById("z-hero");
    hero.innerHTML = heroHtml(profile);
    if (U.hydrateAvatars) U.hydrateAvatars(hero);
    var u = profile.user || {};
    if (u.coverFileId && U.loadCoverBlob) {
      U.loadCoverBlob(u.coverFileId).then(function (url) {
        var c = document.getElementById("z-cover");
        if (url && c) {
          c.style.backgroundImage = 'url("' + url + '")';
          c.classList.add("has-image");
        }
      });
    }
  }

  function metaItem(icon, text) {
    return '<span><i class="icon-base bx ' + icon + '"></i>' + U.esc(text) + "</span>";
  }

  function safeColor(c) {
    return /^#[0-9a-f]{3,8}$/i.test(String(c)) ? c : "#696cff";
  }

  function relTime(s) {
    if (!s) return "—";
    var t = new Date(String(s).replace(" ", "T")).getTime();
    if (!isFinite(t)) return U.dt(s);
    var diff = Math.max(0, Date.now() - t) / 1000;
    if (diff < 60) return "hozirgina";
    if (diff < 3600) return Math.floor(diff / 60) + " daqiqa oldin";
    if (diff < 86400) return Math.floor(diff / 3600) + " soat oldin";
    if (diff < 86400 * 30) return Math.floor(diff / 86400) + " kun oldin";
    return U.day(s);
  }

  function fmtHours(sec) {
    var s = Number(sec) || 0;
    var h = Math.floor(s / 3600);
    var m = Math.round((s % 3600) / 60);
    return h ? h + " soat " + m + " daq" : m + " daq";
  }

  function overviewSkeleton() {
    var card = '<div class="col-sm-6 col-xl-3"><div class="card"><div class="card-body"><span class="zon-skel" style="width:60%;height:14px"></span><span class="zon-skel mt-3" style="width:40%;height:24px"></span></div></div></div>';
    return '<div class="row g-6">' + card + card + card + card + "</div>";
  }

  function renderOverview() {
    var s = profile.stats || {};
    var w = profile.wallet || {};
    var u = profile.user || {};
    var html =
      '<div class="row g-6 mb-6">' +
      U.statCard("Masofa", U.n(s.runKm) + " km", U.n(s.runs) + " yugurish · " + fmtHours(s.runSeconds), "bx-run", "primary") +
      U.statCard("Qadamlar", U.n(s.steps), "Eng yaxshi kun: " + U.n(s.bestStepsDay), "bx-walk", "info") +
      U.statCard("Hududlar", U.n(s.territories), U.n(s.areaKm2) + " km² egallangan", "bx-map-alt", "warning") +
      U.statCard("Hamyon", U.n(w.tanga) + " tanga", U.n(w.xp) + " XP · sarflangan " + U.n(s.tangaSpent), "bx-wallet", "success") +
      "</div>" +
      '<div class="row g-6">' +
      '<div class="col-xl-8"><div class="card h-100">' +
      '<div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">' +
      '<div><h5 class="card-title mb-0">So‘nggi 30 kun</h5><small class="text-body-secondary">' +
      U.n(s.activeDays) +
      " ta faol kun · oxirgi faoliyat: " +
      U.esc(relTime(s.lastActivityAt)) +
      "</small></div>" +
      '<div class="zon-seg" id="z-trend-seg">' +
      segBtn("km", "Masofa") +
      segBtn("steps", "Qadam") +
      segBtn("territories", "Hudud") +
      "</div></div>" +
      '<div class="card-body"><div id="z-trend"></div></div></div></div>' +
      '<div class="col-xl-4"><div class="card h-100"><div class="card-header"><h5 class="card-title mb-0">Ma’lumotlar</h5></div>' +
      '<div class="card-body pt-0"><ul class="zon-prof-facts">' +
      fact("bx-envelope", "Email", u.email) +
      fact("bx-phone", "Telefon", u.phone) +
      fact("bx-male-female", "Jins", u.gender ? GENDERS[String(u.gender).toLowerCase()] || u.gender : null) +
      fact("bx-cake", "Yosh", u.age) +
      fact("bx-ruler", "Bo‘y / vazn", u.heightCm || u.weightKg ? (u.heightCm ? U.n(u.heightCm) + " sm" : "—") + " / " + (u.weightKg ? U.n(u.weightKg) + " kg" : "—") : null) +
      fact("bx-target-lock", "Qadam maqsadi", u.stepGoal ? U.n(u.stepGoal) + " / kun" : null) +
      fact("bx-log-in", "Kirish usuli", loginLabel(u.loginMethods)) +
      fact("bx-trophy", "Yutuqlar", U.n(s.badges) + " / " + U.n(s.badgesTotal)) +
      factHtml("bxl-instagram", "Instagram", u.instagram ? '<a href="https://instagram.com/' + encodeURIComponent(String(u.instagram).replace(/^@/, "")) + '" target="_blank" rel="noopener">@' + U.esc(String(u.instagram).replace(/^@/, "")) + "</a>" : "") +
      factHtml("bx-link-external", "Strava", u.stravaUrl && /^https?:\/\//i.test(u.stravaUrl) ? '<a href="' + U.esc(u.stravaUrl) + '" target="_blank" rel="noopener">Profilni ochish</a>' : "") +
      "</ul></div></div></div>" +
      "</div>";
    if ((profile.badges || []).length) {
      html +=
        '<div class="card mt-6"><div class="card-header d-flex justify-content-between align-items-center">' +
        '<h5 class="card-title mb-0">Oxirgi yutuqlar</h5>' +
        '<button type="button" class="btn btn-sm btn-label-primary" data-goto="yutuqlar">Hammasi</button></div>' +
        '<div class="card-body pt-0"><div class="zon-badge-grid">' +
        profile.badges.slice(0, 4).map(badgeCard).join("") +
        "</div></div></div>";
    }
    var box = document.getElementById("z-overview");
    box.innerHTML = html;
    document.getElementById("z-trend-seg").addEventListener("click", function (e) {
      var b = e.target.closest("[data-m]");
      if (!b) return;
      trendMetric = b.getAttribute("data-m");
      Array.prototype.forEach.call(this.querySelectorAll("[data-m]"), function (x) {
        x.classList.toggle("active", x === b);
      });
      renderTrend();
    });
    renderTrend();
  }

  function onOverviewClick(e) {
    var g = e.target.closest("[data-goto]");
    if (g) showTab(g.getAttribute("data-goto"), true);
  }

  function segBtn(m, label) {
    return '<button type="button" class="' + (trendMetric === m ? "active" : "") + '" data-m="' + m + '">' + label + "</button>";
  }

  function fact(icon, label, value) {
    return factHtml(icon, label, value == null || value === "" ? "" : U.esc(value));
  }

  function factHtml(icon, label, html) {
    return (
      '<li><i class="icon-base bx ' + icon + '"></i><span class="zon-prof-fact-k">' + U.esc(label) +
      '</span><span class="zon-prof-fact-v">' + (html || '<span class="text-body-secondary">—</span>') + "</span></li>"
    );
  }

  function loginLabel(methods) {
    var m = methods || [];
    var names = m.map(function (x) {
      return x === "google" ? "Google" : x === "apple" ? "Apple" : x;
    });
    return names.length ? names.join(", ") : "Telefon / parol";
  }

  function renderTrend() {
    var box = document.getElementById("z-trend");
    if (!box) return;
    var rows = profile.trend || [];
    var unit = trendMetric === "km" ? " km" : trendMetric === "steps" ? " qadam" : " hudud";
    var max = rows.reduce(function (a, r) {
      return Math.max(a, Number(r[trendMetric]) || 0);
    }, 0);
    var total = rows.reduce(function (a, r) {
      return a + (Number(r[trendMetric]) || 0);
    }, 0);
    if (!max) {
      box.innerHTML =
        '<div class="zon-trend-empty"><i class="icon-base bx bx-bar-chart-alt-2"></i><p class="mb-0">So‘nggi 30 kunda bu ko‘rsatkich bo‘yicha faollik yo‘q</p></div>';
      return;
    }
    var bars = rows
      .map(function (r, i) {
        var v = Number(r[trendMetric]) || 0;
        var h = v ? Math.max(4, Math.round((v / max) * 100)) : 0;
        var d = String(r.day || "");
        var label = Number(d.slice(8, 10)) + "-" + (MONTHS_SHORT[Number(d.slice(5, 7)) - 1] || "");
        return (
          '<div class="zon-trend-col" title="' + U.esc(label + ": " + U.n(v) + unit) + '">' +
          '<div class="zon-trend-bar' + (v ? "" : " is-zero") + '" style="height:' + h + '%"></div>' +
          '<span class="zon-trend-x">' + (i % 5 === 0 || i === rows.length - 1 ? U.esc(label) : "") + "</span></div>"
        );
      })
      .join("");
    box.innerHTML =
      '<div class="zon-trend-total">Jami: <strong>' + U.n(Math.round(total * 100) / 100) + unit + "</strong></div>" +
      '<div class="zon-trend">' + bars + "</div>";
  }

  // ─── Yutuqlar ──────────────────────────────────────────────────────────
  function badgeCard(b) {
    var icon = b.iconFileId
      ? '<img src="' + U.esc(U.imageUrl(b.iconFileId)) + '" alt="" loading="lazy" />'
      : '<i class="icon-base bx bx-trophy"></i>';
    var goal = b.threshold != null ? U.n(b.threshold) + (b.unit ? " " + b.unit : "") : "";
    var title = String(b.title || b.code || "");
    if (goal && title.replace(/\s/g, "") === goal.replace(/\s/g, "")) goal = "";
    return (
      '<div class="zon-badge-card"><div class="zon-badge-icon">' + icon + "</div>" +
      '<div class="zon-badge-info"><div class="fw-semibold text-heading">' + U.esc(b.title || b.code) + "</div>" +
      (b.description ? '<small class="text-body-secondary d-block">' + U.esc(b.description) + "</small>" : "") +
      '<small class="text-body-secondary"><i class="bx bx-calendar-check"></i> ' + (goal ? U.esc(goal) + " · " : "") + U.esc(U.day(b.unlockedAt)) + "</small>" +
      "</div></div>"
    );
  }

  function renderBadges() {
    var list = profile.badges || [];
    var s = profile.stats || {};
    var pct = s.badgesTotal ? Math.round((list.length / s.badgesTotal) * 100) : 0;
    var box = document.getElementById("z-badges");
    box.innerHTML =
      '<div class="card"><div class="card-header"><div class="d-flex justify-content-between align-items-center mb-2">' +
      '<h5 class="card-title mb-0">Yutuqlar</h5><span class="text-body-secondary small">' +
      U.n(list.length) + " / " + U.n(s.badgesTotal) + " (" + pct + "%)</span></div>" +
      '<div class="progress" style="height:6px"><div class="progress-bar" style="width:' + pct + '%"></div></div></div>' +
      '<div class="card-body">' +
      (list.length
        ? '<div class="zon-badge-grid">' + list.map(badgeCard).join("") + "</div>"
        : emptyState("bx-trophy", "Hali yutuq yo‘q", "Foydalanuvchi birorta ham yutuqni ochmagan.")) +
      "</div></div>";
  }

  // ─── Xaridlar ──────────────────────────────────────────────────────────
  function itemThumb(p) {
    var src = p.category === "frame" && p.code
      ? "https://zonic.uz/frames/" + encodeURIComponent(p.code) + ".png"
      : p.imageFileId
        ? U.imageUrl(p.imageFileId)
        : "";
    return src
      ? '<span class="zon-item-thumb"><img src="' + U.esc(src) + '" alt="" loading="lazy" /></span>'
      : '<span class="zon-item-thumb"><i class="icon-base bx bx-package"></i></span>';
  }

  function purchaseState(p) {
    if (p.consumedAt) return U.badge("Ishlatilgan", "secondary");
    var add = DURATION_MS[p.duration];
    if (!add) return U.badge("Doimiy", "primary");
    var from = new Date(String(p.purchasedAt || "").replace(" ", "T")).getTime();
    if (!isFinite(from)) return U.badge("—", "secondary");
    var exp = from + add;
    if (exp < Date.now()) return U.badge("Muddati tugagan", "secondary");
    var d = new Date(exp);
    return (
      U.badge("Faol", "success") +
      '<small class="d-block text-body-secondary mt-1">' + d.getDate() + "-" + MONTHS_SHORT[d.getMonth()] + " gacha</small>"
    );
  }

  function renderPurchases() {
    var list = profile.purchases || [];
    var s = profile.stats || {};
    var xp = list.reduce(function (a, p) {
      return a + (Number(p.xpSpent) || 0);
    }, 0);
    var box = document.getElementById("z-purchases");
    if (!list.length) {
      box.innerHTML = '<div class="card"><div class="card-body">' +
        emptyState("bx-shopping-bag", "Xarid yo‘q", "Foydalanuvchi marketdan hali hech narsa olmagan.") + "</div></div>";
      return;
    }
    box.innerHTML =
      '<div class="card"><div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">' +
      '<h5 class="card-title mb-0">Market xaridlari</h5>' +
      '<div class="d-flex gap-2 flex-wrap">' +
      U.badge(U.n(s.purchases) + " ta xarid", "primary") +
      U.badge(U.n(s.tangaSpent) + " tanga", "warning") +
      U.badge(U.n(xp) + " XP", "info") +
      "</div></div>" +
      '<div class="table-responsive"><table class="table table-hover mb-0">' +
      "<thead><tr><th>Mahsulot</th><th>Turi</th><th>Narx</th><th>Sana</th><th>Holat</th></tr></thead><tbody>" +
      list
        .map(function (p) {
          return (
            '<tr><td><div class="d-flex align-items-center gap-3">' + itemThumb(p) +
            '<div><div class="fw-medium text-heading">' + U.esc(p.title || p.code) +
            (p.isPremium ? ' <span class="badge bg-label-warning ms-1">Premium</span>' : "") +
            '</div><small class="text-body-secondary">' + U.esc(p.code) + "</small></div></div></td>" +
            "<td>" + U.esc(CATEGORIES[p.category] || p.category || "—") + "</td>" +
            '<td class="text-nowrap">' + U.n(p.priceTanga) + " tanga" +
            (p.xpSpent ? '<small class="d-block text-body-secondary">−' + U.n(p.xpSpent) + " XP</small>" : "") +
            "</td>" +
            '<td class="text-nowrap">' + U.esc(U.dt(p.purchasedAt)) + "</td>" +
            "<td>" + purchaseState(p) + "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div></div>";
  }

  // ─── Musobaqalar ───────────────────────────────────────────────────────
  function renderEvents() {
    var list = profile.events || [];
    var box = document.getElementById("z-events");
    if (!list.length) {
      box.innerHTML = '<div class="card"><div class="card-body">' +
        emptyState("bx-flag", "Musobaqada qatnashmagan", "Foydalanuvchi hali birorta musobaqaga qo‘shilmagan.") + "</div></div>";
      return;
    }
    box.innerHTML =
      '<div class="card"><div class="card-header d-flex justify-content-between align-items-center">' +
      '<h5 class="card-title mb-0">Qatnashgan musobaqalar</h5>' +
      '<a class="btn btn-sm btn-label-primary" href="app-zon-events.html">Musobaqalar sahifasi</a></div>' +
      '<div class="list-group list-group-flush">' +
      list
        .map(function (e) {
          var st = EVENT_STATUS[String(e.status || "").toLowerCase()] || [e.status || "—", "secondary"];
          var goal = e.goalValue != null ? U.n(e.goalValue) + " " + (e.goalType || "") : e.goalType || "";
          return (
            '<div class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2 px-6 py-4">' +
            '<div class="d-flex align-items-center gap-3"><span class="avatar"><span class="avatar-initial rounded bg-label-primary"><i class="icon-base bx bx-flag"></i></span></span>' +
            '<div><div class="fw-semibold text-heading">' + U.esc(e.title || "—") + "</div>" +
            '<small class="text-body-secondary">' + U.esc(U.day(e.startsAt)) + " → " + U.esc(U.day(e.endsAt)) +
            (goal ? " · Maqsad: " + U.esc(goal) : "") + "</small></div></div>" +
            '<div class="text-end">' + U.badge(st[0], st[1]) +
            '<small class="d-block text-body-secondary mt-1">Qo‘shilgan: ' + U.esc(U.day(e.joinedAt)) + "</small></div></div>"
          );
        })
        .join("") +
      "</div></div>";
  }

  function emptyState(icon, title, text) {
    return (
      '<div class="zon-daymodal-empty"><i class="bx ' + icon + '"></i>' +
      '<h6 class="mb-1">' + U.esc(title) + '</h6><p class="mb-0">' + U.esc(text) + "</p></div>"
    );
  }

  // ─── Bloklash ──────────────────────────────────────────────────────────
  function blockModalHtml() {
    return (
      '<div class="modal fade" id="zBlockModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Foydalanuvchini bloklash</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Yopish"></button></div>' +
      '<div class="modal-body"><p class="mb-4">Bloklangan user ilovaga kira olmaydi.</p>' +
      '<label class="form-label" for="z-reason">Sabab</label>' +
      '<input id="z-reason" class="form-control" placeholder="Spam / qoidabuzarlik" /></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Bekor</button>' +
      '<button type="button" class="btn btn-danger" id="z-block-ok">Bloklash</button></div>' +
      "</div></div></div>"
    );
  }

  function onHeroClick(e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    if (b.getAttribute("data-act") === "block") {
      document.getElementById("z-reason").value = "";
      U.modalShow("zBlockModal");
      return;
    }
    b.disabled = true;
    ZonApi.post("/Admin/Users/" + encodeURIComponent(userId) + "/Unblock", {})
      .then(function () {
        pageAlert("success", "Foydalanuvchi blokdan ochildi.");
        loadProfile();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        b.disabled = false;
        pageAlert("danger", U.errMsg(err));
      });
  }

  function doBlock() {
    var btn = document.getElementById("z-block-ok");
    btn.disabled = true;
    ZonApi.post("/Admin/Users/" + encodeURIComponent(userId) + "/Block", {
      reason: document.getElementById("z-reason").value.trim(),
    })
      .then(function () {
        U.modalHide("zBlockModal");
        btn.disabled = false;
        pageAlert("success", "Foydalanuvchi bloklandi.");
        loadProfile();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        btn.disabled = false;
        pageAlert("danger", U.errMsg(err));
      });
  }

  function pageAlert(kind, text) {
    var el = document.getElementById("z-page-alert");
    el.innerHTML = U.alertHtml(kind, text);
    if (kind === "success") {
      setTimeout(function () {
        if (el.textContent.indexOf(text) !== -1) el.innerHTML = "";
      }, 4000);
    }
  }

  // ─── Faoliyat (yugurish + hudud) ───────────────────────────────────────
  function activityHtml() {
    return (
      '<div id="z-alert" class="mb-4"></div>' +
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">' +
      '<div class="btn-group" role="group" id="z-filter">' +
      '<button type="button" class="btn btn-primary" data-f="all">Hammasi</button>' +
      '<button type="button" class="btn btn-label-primary" data-f="running">Yugurish</button>' +
      '<button type="button" class="btn btn-label-primary" data-f="territory">Hudud egallash</button>' +
      "</div>" +
      '<a class="btn btn-label-primary" href="app-zon-map.html"><i class="icon-base bx bx-map-alt me-1"></i>Hududlar xaritasi</a>' +
      "</div>" +
      '<div class="row g-6 align-items-start zon-runs-row" id="z-runs-row">' +
      '<div class="col-lg-6"><div class="card zon-runs-sessions-card">' +
      '<div class="card-header"><h5 class="card-title mb-0">Sessiyalar</h5></div>' +
      '<div class="table-responsive"><table class="table table-hover mb-0">' +
      "<thead><tr><th>Tur</th><th>Sana</th><th>Masofa</th><th>Vaqt</th><th></th></tr></thead>" +
      '<tbody id="z-body"><tr><td colspan="5">Yuklanmoqda…</td></tr></tbody></table></div></div></div>' +
      '<div class="col-lg-6 zon-runs-aside-col">' +
      '<div class="zon-runs-sticky" id="z-runs-sticky">' +
      '<div class="card mb-6"><div class="card-header"><h5 class="card-title mb-0">Tafsilot</h5></div>' +
      '<div class="card-body" id="z-detail"><p class="text-body-secondary mb-0">Chapdan sessiyani tanlang.</p></div></div>' +
      '<div class="card"><div class="card-header"><h5 class="card-title mb-0">Xarita</h5></div>' +
      '<div class="card-body p-0"><div id="z-run-map" class="leaflet-map" style="height:360px;width:100%"></div></div></div>' +
      "</div></div></div>"
    );
  }

  function ensureActivity() {
    if (!runMap && typeof L !== "undefined") {
      runMap = L.map("z-run-map").setView([41.3111, 69.2797], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(runMap);
      runLayer = L.layerGroup().addTo(runMap);
    }
    if (!pinApi) pinApi = bindAsidePin();
    setTimeout(function () {
      if (runMap) runMap.invalidateSize();
      if (pinApi) pinApi.update();
    }, 60);
    if (!activityLoaded) {
      activityLoaded = true;
      load();
    }
  }

  function navbarOffset() {
    var nav = document.getElementById("layout-navbar");
    var h = nav ? nav.getBoundingClientRect().height : 64;
    return Math.round(h + 16);
  }

  function bindAsidePin() {
    var aside = document.getElementById("z-runs-sticky");
    var col = aside && aside.parentElement;
    var row = document.getElementById("z-runs-row");
    if (!aside || !col || !row) return null;

    var spacer = document.createElement("div");
    spacer.className = "zon-runs-sticky-spacer";
    spacer.setAttribute("aria-hidden", "true");
    col.insertBefore(spacer, aside);

    var raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        update();
      });
    }

    function clearPin() {
      spacer.style.height = "0px";
      aside.classList.remove("is-pinned", "is-pinned-end");
      aside.style.cssText = "";
    }

    function update() {
      if (!window.matchMedia("(min-width: 992px)").matches || !row.offsetParent) {
        clearPin();
        return;
      }
      var topGap = navbarOffset();
      var rowRect = row.getBoundingClientRect();
      var colRect = col.getBoundingClientRect();
      var h = aside.offsetHeight;
      var w = Math.round(colRect.width);
      if (h < 40 || w < 40) {
        clearPin();
        return;
      }
      if (rowRect.top >= topGap) {
        clearPin();
        return;
      }
      spacer.style.height = h + "px";
      col.style.position = "relative";
      if (rowRect.bottom <= topGap + h) {
        aside.classList.remove("is-pinned");
        aside.classList.add("is-pinned-end");
        aside.style.position = "absolute";
        aside.style.top = "auto";
        aside.style.bottom = "0";
        aside.style.left = "0";
        aside.style.width = w + "px";
        aside.style.zIndex = "3";
        return;
      }
      aside.classList.add("is-pinned");
      aside.classList.remove("is-pinned-end");
      aside.style.position = "fixed";
      aside.style.top = topGap + "px";
      aside.style.left = Math.round(colRect.left) + "px";
      aside.style.width = w + "px";
      aside.style.bottom = "auto";
      aside.style.zIndex = "3";
      if (runMap) runMap.invalidateSize({ animate: false });
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("scroll", schedule, { passive: true, capture: true });
    return { update: schedule };
  }

  function setAlert(k, t) {
    document.getElementById("z-alert").innerHTML = U.alertHtml(k, t);
  }
  function fmtDur(sec) {
    var s = Number(sec) || 0;
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  }
  function typeBadge(t) {
    if (t === "territory") {
      return '<span class="badge bg-label-warning">Hudud</span>';
    }
    return '<span class="badge bg-label-primary">Yugurish</span>';
  }
  function onFilter(e) {
    var btn = e.target.closest("[data-f]");
    if (!btn) return;
    filter = btn.getAttribute("data-f");
    Array.prototype.forEach.call(document.querySelectorAll("#z-filter [data-f]"), function (b) {
      var on = b.getAttribute("data-f") === filter;
      b.className = on ? "btn btn-primary" : "btn btn-label-primary";
    });
    renderList();
  }
  function filtered() {
    if (filter === "all") return allItems;
    return allItems.filter(function (x) {
      return x.type === filter;
    });
  }
  function renderList() {
    var items = filtered();
    var body = document.getElementById("z-body");
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="5" class="text-body-secondary">Yozuv yo‘q</td></tr>';
      return;
    }
    body.innerHTML = items
      .map(function (r) {
        return (
          "<tr><td>" +
          typeBadge(r.type) +
          "</td><td>" +
          U.dt(r.startedAt) +
          "</td><td>" +
          U.n(r.distanceKm) +
          (r.type === "territory" ? " km · " + U.n(r.areaKm2) + " km²" : " km") +
          "</td><td>" +
          fmtDur(r.durationSeconds) +
          '</td><td><button type="button" class="btn btn-sm btn-label-primary" data-kind="' +
          U.esc(r.type) +
          '" data-id="' +
          U.esc(r.id) +
          '">Ko‘rish</button></td></tr>'
        );
      })
      .join("");
  }
  function load() {
    setAlert("", "");
    Promise.all([
      ZonApi.get("/Admin/Users/" + encodeURIComponent(userId) + "/Runs"),
      ZonApi.get("/Admin/Users/" + encodeURIComponent(userId) + "/Territories").catch(function (err) {
        if (err && err.status === 404) return { items: [] };
        throw err;
      }),
    ])
      .then(function (pair) {
        var runs = ((pair[0] && pair[0].items) || []).map(function (r) {
          return {
            id: r.id,
            type: "running",
            startedAt: r.startedAt,
            durationSeconds: r.durationSeconds,
            distanceKm: r.distanceKm,
            averageSpeedKmh: r.averageSpeedKmh,
            paceMinPerKm: r.paceMinPerKm,
          };
        });
        var terr = ((pair[1] && pair[1].items) || []).map(function (r) {
          return {
            id: r.id,
            type: "territory",
            startedAt: r.capturedAt,
            durationSeconds: r.durationSeconds,
            distanceKm: r.distanceKm,
            areaKm2: r.areaKm2,
            averageSpeedKmh: r.averageSpeedKmh,
            color: r.color,
          };
        });
        allItems = runs.concat(terr).sort(function (a, b) {
          return String(b.startedAt).localeCompare(String(a.startedAt));
        });
        renderList();
        if (pinApi) pinApi.update();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        setAlert("danger", U.errMsg(err));
      });
  }
  function onRow(e) {
    var btn = e.target.closest("[data-id]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var kind = btn.getAttribute("data-kind") || "running";
    var box = document.getElementById("z-detail");
    box.innerHTML = '<p class="text-body-secondary mb-0">Yuklanmoqda…</p>';
    var url =
      kind === "territory"
        ? "/Admin/Territories/" + encodeURIComponent(id)
        : "/Admin/Runs/" + encodeURIComponent(id);
    ZonApi.get(url)
      .then(function (r) {
        if (kind === "territory") {
          box.innerHTML =
            '<dl class="row mb-0">' +
            row("Tur", "Hudud egallash") +
            row("ID", r.id) +
            row("Foydalanuvchi", (r.username || "—") + " / " + (r.zonicId || "—")) +
            row("Egallangan", U.dt(r.capturedAt)) +
            row("Yugurish masofasi", U.n(r.distanceKm) + " km") +
            row("Maydon", U.n(r.areaKm2) + " km²") +
            row("Davomiylik", fmtDur(r.durationSeconds)) +
            row("O‘rtacha tezlik", U.n(r.averageSpeedKmh) + " km/h") +
            "</dl>";
          drawPolygon(r.polygon || [], r.color || "#696cff");
        } else {
          var pts = (r.polyline && r.polyline.length) || 0;
          box.innerHTML =
            '<dl class="row mb-0">' +
            row("Tur", "Oddiy yugurish") +
            row("ID", r.id) +
            row("Foydalanuvchi", (r.username || "—") + " / " + (r.zonicId || "—")) +
            row("Boshlanish", U.dt(r.startedAt)) +
            row("Tugash", U.dt(r.endedAt)) +
            row("Masofa", U.n(r.distanceKm) + " km") +
            row("Davomiylik", fmtDur(r.durationSeconds)) +
            row("O‘rtacha tezlik", U.n(r.averageSpeedKmh) + " km/h") +
            row("Temp", U.n(r.paceMinPerKm) + " min/km") +
            row("Nuqtalar", U.n(pts) + " ta") +
            "</dl>";
          drawRoute(r.polyline || []);
        }
        if (pinApi) pinApi.update();
      })
      .catch(function (err) {
        if (U.authFail(err)) return;
        box.innerHTML = U.alertHtml("danger", U.errMsg(err));
      });
  }
  function drawRoute(polyline) {
    if (!runMap || !runLayer) return;
    runLayer.clearLayers();
    var latlngs = polyline
      .map(function (p) {
        return [Number(p.lat), Number(p.lng)];
      })
      .filter(function (p) {
        return isFinite(p[0]) && isFinite(p[1]);
      });
    if (!latlngs.length) {
      setAlert("warning", "Marshrut nuqtalari yo‘q");
      return;
    }
    setAlert("", "");
    var line = L.polyline(latlngs, { color: "#696cff", weight: 4 }).addTo(runLayer);
    L.circleMarker(latlngs[0], { radius: 6, color: "#71dd37", fillOpacity: 1 }).addTo(runLayer).bindPopup("Start");
    L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: "#ff3e1d", fillOpacity: 1 })
      .addTo(runLayer)
      .bindPopup("Finish");
    runMap.fitBounds(line.getBounds().pad(0.15));
    setTimeout(function () {
      runMap.invalidateSize();
      if (pinApi) pinApi.update();
    }, 50);
  }
  function drawPolygon(ring, color) {
    if (!runMap || !runLayer) return;
    runLayer.clearLayers();
    var latlngs = ring
      .map(function (p) {
        return [Number(p.lat), Number(p.lng)];
      })
      .filter(function (p) {
        return isFinite(p[0]) && isFinite(p[1]);
      });
    if (latlngs.length < 3) {
      setAlert("warning", "Hudud poligoni yo‘q");
      return;
    }
    setAlert("", "");
    var poly = L.polygon(latlngs, {
      color: color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.35,
    }).addTo(runLayer);
    runMap.fitBounds(poly.getBounds().pad(0.15));
    setTimeout(function () {
      runMap.invalidateSize();
      if (pinApi) pinApi.update();
    }, 50);
  }
  function row(k, v) {
    return (
      '<dt class="col-sm-5 text-body-secondary">' +
      U.esc(k) +
      '</dt><dd class="col-sm-7">' +
      U.esc(v) +
      "</dd>"
    );
  }
})();
