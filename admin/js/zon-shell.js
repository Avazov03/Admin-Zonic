/**
 * Menyu: faqat Zon bo'limlari; shablon (Zahira) elementlari CSS bilan yashiriladi.
 * Navbar: real admin ism + avatar (Telegram/IG uslubida almashtirish).
 * Sessiya yo'q bo'lsa login sahifasiga qaytaradi.
 */
(function () {
  var file = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (!file || file.indexOf(".") === -1) file = "index.html";
  var isAuth = /^auth-/.test(file) || /^pages-misc-/.test(file);

  function token() {
    return window.ZonApi && ZonApi.getToken ? ZonApi.getToken() : "";
  }

  if (!isAuth && !token()) {
    location.replace("auth-login-basic.html");
    return;
  }
  if (file === "auth-login-basic.html" && token()) {
    location.replace("index.html");
    return;
  }

  // main.js demo qidiruvni faqat #autocomplete bo'lsa ishga tushiradi (JSON yuklangandan keyin).
  if (!isAuth) {
    var templateSearch = document.getElementById("autocomplete");
    if (templateSearch) templateSearch.removeAttribute("id");
  }

  var WORK = [
    { href: "index.html", icon: "bx-home-smile", label: "Boshqaruv" },
    { href: "app-user-list.html", icon: "bx-user", label: "Foydalanuvchilar" },
    { href: "app-zon-leaderboard.html", icon: "bx-medal", label: "Reyting" },
    { href: "app-zon-regions.html", icon: "bx-map-pin", label: "Viloyatlar" },
    { href: "app-zon-map.html", icon: "bx-map-alt", label: "Xarita" },
    { href: "app-zon-badges.html", icon: "bx-trophy", label: "Yutuqlar" },
    { href: "app-zon-events.html", icon: "bx-calendar-event", label: "Musobaqalar" },
    { href: "app-zon-market.html", icon: "bx-store", label: "Market" },
    { href: "app-zon-news.html", icon: "bx-news", label: "Yangiliklar" },
    { href: "app-zon-push.html", icon: "bx-bell", label: "Push" },
  ];

  function splitMenu() {
    var menu = document.querySelector("ul.menu-inner");
    if (!menu || menu.getAttribute("data-zon-split") === "1") return;
    menu.setAttribute("data-zon-split", "1");

    Array.prototype.forEach.call(menu.children, function (el) {
      el.classList.add("zon-zahira-item");
    });

    var html = '<li class="menu-header small"><span class="menu-header-text">Zon Admin</span></li>';
    WORK.forEach(function (item) {
      var active =
        file === item.href ||
        (item.href === "app-user-list.html" && file === "app-zon-user-runs.html")
          ? " active"
          : "";
      html +=
        '<li class="menu-item zon-work-item' +
        active +
        '">' +
        '<a href="' +
        item.href +
        '" class="menu-link">' +
        '<i class="menu-icon icon-base bx ' +
        item.icon +
        '"></i>' +
        "<div>" +
        item.label +
        "</div></a></li>";
    });
    menu.insertAdjacentHTML("afterbegin", html);
  }

  function bindLogout(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-zon-logout], a.dropdown-item"), function (a) {
      if (a.getAttribute("data-zon-logout") !== "1" && !/log out|chiqish/i.test(a.textContent || "")) return;
      a.removeAttribute("target");
      a.setAttribute("href", "auth-login-basic.html");
      a.setAttribute("data-zon-logout", "1");
      a.onclick = function (e) {
        e.preventDefault();
        var done = function () {
          location.href = "auth-login-basic.html";
        };
        if (window.ZonApi && ZonApi.adminLogout) ZonApi.adminLogout().then(done, done);
        else if (window.ZonApi) {
          ZonApi.logout();
          done();
        } else done();
      };
    });
  }

  /** Demo billing/pricing — faqat user dropdown tozalanadi. */
  function cleanTemplateChrome() {
    // shortcuts / theme / lang alohida setup*
  }

  var THEME_KEY = "zon_admin_theme";
  var THEME_LEGACY = "templateCustomizer-vertical-menu-template--Theme";

  function readThemeMode() {
    var mode = "light";
    try {
      mode =
        localStorage.getItem(THEME_KEY) ||
        localStorage.getItem(THEME_LEGACY) ||
        document.documentElement.getAttribute("data-zon-theme-mode") ||
        "light";
    } catch (_) {}
    if (mode !== "light" && mode !== "dark" && mode !== "system") mode = "light";
    return mode;
  }

  function resolveTheme(mode) {
    if (mode === "system") {
      try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch (_) {
        return "light";
      }
    }
    return mode === "dark" ? "dark" : "light";
  }

  function paintThemeUi(mode) {
    var resolved = resolveTheme(mode);
    document.documentElement.setAttribute("data-bs-theme", resolved);
    document.documentElement.setAttribute("data-zon-theme-mode", mode);

    var iconMap = { light: "sun", dark: "moon", system: "desktop" };
    var activeIcon = document.querySelector(".theme-icon-active");
    if (activeIcon) {
      var keep = Array.prototype.filter.call(activeIcon.classList, function (c) {
        return c.indexOf("bx-") !== 0;
      });
      activeIcon.className = "bx-" + (iconMap[mode] || "sun") + " " + keep.join(" ");
      if (activeIcon.className.indexOf("icon-base") < 0) {
        activeIcon.className = "icon-base bx bx-" + (iconMap[mode] || "sun") + " icon-md theme-icon-active";
      } else {
        activeIcon.className =
          "icon-base bx bx-" + (iconMap[mode] || "sun") + " icon-md theme-icon-active";
      }
    }

    document.querySelectorAll("[data-bs-theme-value]").forEach(function (btn) {
      var v = btn.getAttribute("data-bs-theme-value");
      var on = v === mode;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    if (window.Helpers && typeof Helpers.switchImage === "function") {
      try {
        Helpers.switchImage(resolved);
      } catch (_) {}
    }
  }

  function saveThemeMode(mode) {
    try {
      localStorage.setItem(THEME_KEY, mode);
      localStorage.setItem(THEME_LEGACY, mode);
    } catch (_) {}
  }

  function setupTheme() {
    if (document.documentElement.getAttribute("data-zon-theme") === "1") return;
    document.documentElement.setAttribute("data-zon-theme", "1");

    var mode = readThemeMode();
    paintThemeUi(mode);

    document.querySelectorAll("[data-bs-theme-value]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var next = btn.getAttribute("data-bs-theme-value") || "light";
        if (next !== "light" && next !== "dark" && next !== "system") next = "light";
        saveThemeMode(next);
        paintThemeUi(next);
      });
    });

    try {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onSys = function () {
        if (readThemeMode() === "system") paintThemeUi("system");
      };
      if (mq.addEventListener) mq.addEventListener("change", onSys);
      else if (mq.addListener) mq.addListener(onSys);
    } catch (_) {}
  }

  function setupLanguage() {
    var root = document.querySelector(".dropdown-language");
    if (!root || root.getAttribute("data-zon-lang") === "1") return;
    root.setAttribute("data-zon-lang", "1");

    // ZonI18n bind qiladi; faqat toggle matnini aniqroq qilamiz
    var toggle = root.querySelector(".nav-link");
    if (toggle && !toggle.querySelector(".zon-lang-code")) {
      var code = document.createElement("span");
      code.className = "zon-lang-code ms-1 d-none d-sm-inline small fw-semibold";
      var lang =
        (window.ZonI18n && ZonI18n.lang) ||
        (function () {
          try {
            return localStorage.getItem("zon_admin_lang") || "uz";
          } catch (_) {
            return "uz";
          }
        })();
      code.textContent = String(lang).toUpperCase();
      toggle.appendChild(code);
    }

    if (window.ZonI18n && typeof ZonI18n.apply === "function") {
      try {
        ZonI18n.apply();
      } catch (_) {}
    }
  }

  var SHORTCUTS = [
    { href: "index.html", icon: "bx-home-smile", label: "Boshqaruv", sub: "Dashboard" },
    { href: "app-user-list.html", icon: "bx-user", label: "Foydalanuvchilar", sub: "Ro‘yxat" },
    { href: "app-zon-events.html", icon: "bx-calendar-event", label: "Musobaqalar", sub: "Eventlar" },
    { href: "app-zon-market.html", icon: "bx-store", label: "Market", sub: "Mahsulotlar" },
    { href: "app-zon-news.html", icon: "bx-news", label: "Yangiliklar", sub: "News" },
    { href: "app-zon-push.html", icon: "bx-bell", label: "Push", sub: "Xabarlar" },
    { href: "app-zon-map.html", icon: "bx-map-alt", label: "Xarita", sub: "Hududlar" },
    { href: "app-zon-badges.html", icon: "bx-trophy", label: "Yutuqlar", sub: "Badge" },
  ];

  function setupShortcuts() {
    var root = document.querySelector(".dropdown-shortcuts");
    if (!root || root.getAttribute("data-zon-shortcuts") === "1") return;
    root.setAttribute("data-zon-shortcuts", "1");

    var addBtn = root.querySelector(".dropdown-shortcuts-add");
    if (addBtn) addBtn.style.display = "none";

    var list = root.querySelector(".dropdown-shortcuts-list");
    if (!list) return;

    var html = "";
    for (var i = 0; i < SHORTCUTS.length; i += 2) {
      html += '<div class="row row-bordered overflow-visible g-0">';
      for (var j = i; j < i + 2 && j < SHORTCUTS.length; j++) {
        var s = SHORTCUTS[j];
        html +=
          '<div class="dropdown-shortcuts-item col">' +
          '<span class="dropdown-shortcuts-icon rounded-circle mb-3">' +
          '<i class="icon-base bx ' +
          s.icon +
          ' icon-26px text-heading"></i></span>' +
          '<a href="' +
          s.href +
          '" class="stretched-link">' +
          esc(s.label) +
          "</a>" +
          "<small>" +
          esc(s.sub) +
          "</small></div>";
      }
      html += "</div>";
    }
    list.innerHTML = html;

    var title = root.querySelector("[data-zon-i18n='shortcuts.title'], .dropdown-header h6, .dropdown-menu-header h6");
    if (title) {
      title.removeAttribute("data-zon-i18n");
      title.textContent = "Tezkor havolalar";
    }
  }

  function notifStorageKey(kind, username) {
    return "zon.notif." + kind + "." + String(username || "admin");
  }

  function loadIdSet(key) {
    try {
      var raw = localStorage.getItem(key);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveIdSet(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
    } catch (_) {}
  }

  function relativeTime(iso) {
    var t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    var sec = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (sec < 60) return "hozir";
    var min = Math.round(sec / 60);
    if (min < 60) return min + " daqiqa oldin";
    var hr = Math.round(min / 60);
    if (hr < 48) return hr + " soat oldin";
    var day = Math.round(hr / 24);
    return day + " kun oldin";
  }

  function notifIcon(type) {
    if (type === "user") return { cls: "bg-label-primary", icon: "bx-user" };
    if (type === "event") return { cls: "bg-label-success", icon: "bx-calendar-event" };
    if (type === "news") return { cls: "bg-label-info", icon: "bx-news" };
    if (type === "push") return { cls: "bg-label-warning", icon: "bx-bell" };
    return { cls: "bg-label-secondary", icon: "bx-info-circle" };
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setupNotifications(username) {
    var root = document.querySelector(".dropdown-notifications");
    if (!root || root.getAttribute("data-zon-notif") === "1") return;
    root.setAttribute("data-zon-notif", "1");

    var listUl = root.querySelector(".dropdown-notifications-list .list-group");
    if (!listUl) return;
    listUl.innerHTML =
      '<li class="list-group-item text-center text-body-secondary py-4" data-zon-notif-empty>Yuklanmoqda…</li>';

    var badgeNew = root.querySelector(".dropdown-menu-header .badge.bg-label-primary");
    var badgeDot = root.querySelector(".badge-notifications");
    var markAll = root.querySelector(".dropdown-notifications-all");
    var viewAll = root.querySelector(".border-top a.btn");
    if (viewAll) {
      viewAll.setAttribute("href", "app-zon-push.html");
      var viewLabel = viewAll.querySelector("small");
      if (viewLabel) {
        viewLabel.removeAttribute("data-zon-i18n");
        viewLabel.textContent = "Push tarixi";
      }
    }

    var uname = username || "admin";
    var readKey = notifStorageKey("read", uname);
    var archKey = notifStorageKey("archived", uname);
    var items = [];

    function isArchived(id) {
      return loadIdSet(archKey).indexOf(id) >= 0;
    }
    function isRead(id) {
      return loadIdSet(readKey).indexOf(id) >= 0;
    }
    function markRead(id) {
      var arr = loadIdSet(readKey);
      if (arr.indexOf(id) < 0) {
        arr.push(id);
        saveIdSet(readKey, arr);
      }
    }
    function archive(id) {
      var arr = loadIdSet(archKey);
      if (arr.indexOf(id) < 0) {
        arr.push(id);
        saveIdSet(archKey, arr);
      }
      markRead(id);
    }

    function visibleItems() {
      return items.filter(function (it) {
        return !isArchived(it.id);
      });
    }

    function unreadCount() {
      return visibleItems().filter(function (it) {
        return !isRead(it.id);
      }).length;
    }

    function paintBadge() {
      var n = unreadCount();
      if (badgeNew) {
        badgeNew.textContent = n ? n + " yangi" : "";
        badgeNew.style.display = n ? "" : "none";
        badgeNew.removeAttribute("data-zon-i18n");
      }
      if (badgeDot) badgeDot.style.display = n ? "" : "none";
    }

    function avatarHtml(it) {
      var meta = notifIcon(it.type);
      if (it.type === "user" && it.avatarFileId && window.ZonUI && ZonUI.userAvatarHtml) {
        return ZonUI.userAvatarHtml(it.avatarFileId, it.title, 40);
      }
      if (it.type === "user") {
        var letter = String(it.title || "?").charAt(0).toUpperCase();
        return (
          '<span class="avatar-initial rounded-circle ' +
          meta.cls +
          '">' +
          esc(letter) +
          "</span>"
        );
      }
      return (
        '<span class="avatar-initial rounded-circle ' +
        meta.cls +
        '"><i class="icon-base bx ' +
        meta.icon +
        '"></i></span>'
      );
    }

    function render() {
      var vis = visibleItems();
      if (!vis.length) {
        listUl.innerHTML =
          '<li class="list-group-item text-center text-body-secondary py-4">Bildirishnoma yo‘q</li>';
        paintBadge();
        return;
      }
      listUl.innerHTML = vis
        .map(function (it) {
          var read = isRead(it.id);
          return (
            '<li class="list-group-item list-group-item-action dropdown-notifications-item' +
            (read ? " marked-as-read" : "") +
            '" data-zon-notif-id="' +
            esc(it.id) +
            '">' +
            '<a href="' +
            esc(it.href || "#") +
            '" class="d-flex text-body text-decoration-none">' +
            '<div class="flex-shrink-0 me-3"><div class="avatar">' +
            avatarHtml(it) +
            "</div></div>" +
            '<div class="flex-grow-1">' +
            '<h6 class="small mb-0">' +
            esc(it.title) +
            "</h6>" +
            '<small class="mb-1 d-block text-body">' +
            esc(it.body) +
            "</small>" +
            '<small class="text-body-secondary">' +
            esc(relativeTime(it.createdAt)) +
            "</small>" +
            "</div>" +
            '<div class="flex-shrink-0 dropdown-notifications-actions">' +
            (read
              ? ""
              : '<span class="dropdown-notifications-read"><span class="badge badge-dot"></span></span>') +
            '<span class="dropdown-notifications-archive ms-1" role="button" title="Yashirish"><span class="icon-base bx bx-x"></span></span>' +
            "</div></a></li>"
          );
        })
        .join("");

      if (window.ZonUI && ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(listUl);
      paintBadge();
    }

    listUl.addEventListener("click", function (e) {
      var archBtn = e.target.closest(".dropdown-notifications-archive");
      var row = e.target.closest("[data-zon-notif-id]");
      if (!row) return;
      var id = row.getAttribute("data-zon-notif-id");
      if (archBtn) {
        e.preventDefault();
        e.stopPropagation();
        archive(id);
        render();
        return;
      }
      markRead(id);
      paintBadge();
    });

    if (markAll) {
      markAll.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var arr = loadIdSet(readKey);
        visibleItems().forEach(function (it) {
          if (arr.indexOf(it.id) < 0) arr.push(it.id);
        });
        saveIdSet(readKey, arr);
        render();
      };
    }

    if (!window.ZonApi || !ZonApi.get) {
      listUl.innerHTML =
        '<li class="list-group-item text-center text-body-secondary py-4">API yo‘q</li>';
      paintBadge();
      return;
    }

    ZonApi.get("/Admin/Notifications?limit=20")
      .then(function (data) {
        items = (data && data.items) || [];
        render();
      })
      .catch(function () {
        listUl.innerHTML =
          '<li class="list-group-item text-center text-body-secondary py-4">Yuklanmadi</li>';
        paintBadge();
      });
  }

  function setAvatarNodes(nodes, fileId, name) {
    Array.prototype.forEach.call(nodes, function (box) {
      if (!box) return;
      box.innerHTML = "";
      var letter = String(name || "A").charAt(0).toUpperCase();
      if (window.ZonUI && ZonUI.userAvatarHtml) {
        box.innerHTML = ZonUI.userAvatarHtml(fileId, name, 40);
        var inner = box.querySelector(".zon-user-avatar");
        if (inner) {
          inner.style.width = "100%";
          inner.style.height = "100%";
          // navbar zoom click ochmasin — dropdown ochilsin
          inner.classList.remove("zon-avatar-zoom");
          inner.removeAttribute("role");
        }
        if (ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(box);
        return;
      }
      // Fallback (zon-ui yo'q sahifalar)
      if (!fileId || !window.ZonApi) {
        box.innerHTML =
          '<span class="avatar-initial rounded-circle bg-label-primary d-flex align-items-center justify-content-center w-100 h-100">' +
          letter +
          "</span>";
        return;
      }
      box.innerHTML =
        '<span class="avatar-initial rounded-circle bg-label-primary d-flex align-items-center justify-content-center w-100 h-100">' +
        letter +
        "</span>";
      var base = String((window.ZON_CONFIG && ZON_CONFIG.API_BASE_URL) || "").replace(/\/$/, "");
      var url = base + "/UserProfile/DownloadAvatar?fileId=" + encodeURIComponent(fileId);
      var tok = "";
      try {
        tok = localStorage.getItem((window.ZON_CONFIG && ZON_CONFIG.TOKEN_KEY) || "zon_admin_token") || "";
      } catch (_) {}
      fetch(url, { headers: tok ? { Authorization: "Bearer " + tok } : {} })
        .then(function (r) {
          if (!r.ok) throw new Error("avatar");
          return r.blob();
        })
        .then(function (blob) {
          if (!box.isConnected) return;
          var img = document.createElement("img");
          img.src = URL.createObjectURL(blob);
          img.alt = "";
          img.className = "rounded-circle w-100 h-100";
          img.style.objectFit = "cover";
          box.innerHTML = "";
          box.appendChild(img);
        })
        .catch(function () {});
    });
  }

  function setupNavbarUser() {
    var drop = document.querySelector(".navbar-dropdown.dropdown-user, .nav-item.dropdown-user");
    if (!drop || drop.getAttribute("data-zon-user") === "1") return;
    drop.setAttribute("data-zon-user", "1");

    var menu = drop.querySelector(".dropdown-menu");
    if (menu) {
      menu.innerHTML =
        '<li><a class="dropdown-item" href="javascript:void(0)" id="zon-nav-profile-head">' +
        '<div class="d-flex align-items-center">' +
        '<div class="flex-shrink-0 me-3"><div class="avatar avatar-online" id="zon-nav-avatar-menu"></div></div>' +
        '<div class="flex-grow-1">' +
        '<h6 class="mb-0" id="zon-nav-name-menu">Admin</h6>' +
        '<small class="text-body-secondary" id="zon-nav-role">Administrator</small>' +
        "</div></div></a></li>" +
        '<li><div class="dropdown-divider my-1"></div></li>' +
        '<li><a class="dropdown-item" href="javascript:void(0)" id="zon-nav-change-photo">' +
        '<i class="icon-base bx bx-camera icon-md me-3"></i><span>Rasmni almashtirish</span></a></li>' +
        '<li><a class="dropdown-item" href="javascript:void(0)" id="zon-nav-view-photo">' +
        '<i class="icon-base bx bx-image icon-md me-3"></i><span>Rasmni ko‘rish</span></a></li>' +
        '<li><div class="dropdown-divider my-1"></div></li>' +
        '<li><a class="dropdown-item" href="auth-login-basic.html" data-zon-logout="1">' +
        '<i class="icon-base bx bx-power-off icon-md me-3"></i><span>Chiqish</span></a></li>';
    }

    var toggleAvatar = drop.querySelector(".nav-link .avatar, .dropdown-toggle .avatar");
    if (toggleAvatar && !toggleAvatar.id) toggleAvatar.id = "zon-nav-avatar-toggle";

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp,image/gif";
    fileInput.className = "d-none";
    fileInput.id = "zon-nav-avatar-file";
    drop.appendChild(fileInput);

    var state = { avatarFileId: null, username: "Admin" };

    function paint() {
      var boxes = [
        document.getElementById("zon-nav-avatar-toggle"),
        document.getElementById("zon-nav-avatar-menu"),
        toggleAvatar,
      ].filter(Boolean);
      // unique
      var seen = [];
      boxes.forEach(function (b) {
        if (seen.indexOf(b) >= 0) return;
        seen.push(b);
      });
      setAvatarNodes(seen, state.avatarFileId, state.username);
      var n1 = document.getElementById("zon-nav-name-menu");
      if (n1) n1.textContent = state.username;
      drop.querySelectorAll(".dropdown-toggle h6, .nav-link h6").forEach(function () {});
    }

    function pickPhoto() {
      fileInput.value = "";
      fileInput.click();
    }

    fileInput.onchange = function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f || !window.ZonApi || !ZonApi.adminUploadAvatar) return;
      var changeBtn = document.getElementById("zon-nav-change-photo");
      if (changeBtn) changeBtn.classList.add("disabled");
      ZonApi.adminUploadAvatar(f)
        .then(function (res) {
          state.avatarFileId = res && res.fileId ? res.fileId : state.avatarFileId;
          // eski blob cache tozalash (agar ZonUI bo'lsa)
          try {
            if (window.ZonUI && state.avatarFileId) {
              /* hydrate will fetch fresh fileId */
            }
          } catch (_) {}
          paint();
        })
        .catch(function (err) {
          alert((window.ZonUI && ZonUI.errMsg(err)) || "Rasm yuklanmadi");
        })
        .finally(function () {
          if (changeBtn) changeBtn.classList.remove("disabled");
        });
    };

    var change = document.getElementById("zon-nav-change-photo");
    if (change) {
      change.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        pickPhoto();
      };
    }
    var head = document.getElementById("zon-nav-profile-head");
    if (head) {
      head.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        pickPhoto();
      };
    }
    var view = document.getElementById("zon-nav-view-photo");
    if (view) {
      view.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!state.avatarFileId) {
          pickPhoto();
          return;
        }
        if (window.ZonUI && ZonUI.openAvatarModal) {
          ZonUI.openAvatarModal(state.avatarFileId, state.username);
        }
      };
    }

    bindLogout(drop);

    if (!window.ZonApi || !ZonApi.adminMe) {
      paint();
      setupNotifications(state.username);
      return;
    }
    ZonApi.adminMe()
      .then(function (me) {
        state.username = (me && me.username) || "Admin";
        state.avatarFileId = (me && me.avatarFileId) || null;
        paint();
        setupNotifications(state.username);
      })
      .catch(function () {
        paint();
        setupNotifications(state.username);
      });
  }

  // ─── Global qidiruv (Ctrl+K) ─────────────────────────────────────────────
  var CMDK_PAGES = WORK.concat([
    { href: "app-zon-market.html#sotuvlar", icon: "bx-line-chart", label: "Market statistikasi", kw: "sotuv savdo xarid" },
    { href: "app-zon-push.html", icon: "bx-send", label: "Push yuborish", kw: "xabar bildirishnoma notification" },
    { href: "app-zon-events.html?open=new", icon: "bx-plus-circle", label: "Yangi musobaqa", kw: "event yaratish qo'shish" },
    { href: "app-zon-news.html?open=new", icon: "bx-plus-circle", label: "Yangi yangilik", kw: "news yaratish qo'shish" },
    { href: "app-zon-badges.html?open=new", icon: "bx-plus-circle", label: "Yangi yutuq", kw: "badge yaratish qo'shish" },
    { href: "app-zon-market.html?open=new#mahsulotlar", icon: "bx-plus-circle", label: "Yangi mahsulot", kw: "market yaratish qo'shish" },
  ]);
  var CMDK_KW = {
    "index.html": "dashboard bosh sahifa statistika",
    "app-user-list.html": "user userlar ro'yxat blok",
    "app-zon-leaderboard.html": "leaderboard top eng yaxshi",
    "app-zon-regions.html": "region hudud viloyat shahar",
    "app-zon-map.html": "hudud territoriya map",
    "app-zon-badges.html": "badge achievement",
    "app-zon-events.html": "event musobaqa chaqiriq",
    "app-zon-market.html": "do'kon shop mahsulot ramka",
    "app-zon-news.html": "news e'lon banner",
    "app-zon-push.html": "notification xabar bildirishnoma",
  };
  var BADGE_TYPES = { distance: "yugurish masofa", territory: "hudud maydon" };
  var CMDK_RECENT_KEY = "zon.cmdk.recent";
  var CMDK_LIMIT = 5;
  var NEWS_TYPES = { news: "Yangilik", announcement: "E’lon", banner: "Banner" };

  function cmdkNorm(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[‘’ʻʼ`´]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** -1 = mos emas; aks holda katta = yaxshiroq (birinchi maydon boshidan mos kelsa eng yuqori). */
  function cmdkScore(tokens, fields) {
    var joined = cmdkNorm(fields.join(" "));
    for (var i = 0; i < tokens.length; i++) if (joined.indexOf(tokens[i]) < 0) return -1;
    var first = cmdkNorm(fields[0]);
    var q = tokens.join(" ");
    if (first === q) return 100;
    if (first.indexOf(q) === 0) return 80;
    if (first.indexOf(" " + q) >= 0) return 60;
    if (first.indexOf(q) >= 0) return 40;
    return 20;
  }

  function cmdkHighlight(text, tokens) {
    var raw = String(text == null ? "" : text);
    var low = raw.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'");
    if (!tokens.length || low.length !== raw.length) return esc(raw);
    var marks = [];
    tokens.forEach(function (t) {
      var p = low.indexOf(t);
      if (p >= 0) marks.push([p, p + t.length]);
    });
    if (!marks.length) return esc(raw);
    marks.sort(function (a, b) {
      return a[0] - b[0];
    });
    var out = "";
    var pos = 0;
    marks.forEach(function (m) {
      if (m[0] < pos) return;
      out += esc(raw.slice(pos, m[0])) + "<mark>" + esc(raw.slice(m[0], m[1])) + "</mark>";
      pos = m[1];
    });
    return out + esc(raw.slice(pos));
  }

  function cmdkShortDate(iso) {
    var t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    var d = new Date(t);
    return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear();
  }

  function eventState(ev) {
    var now = Date.now();
    var start = Date.parse(ev.startsAt);
    var end = Date.parse(ev.endsAt);
    if (ev.status === "draft") return { label: "Qoralama", tone: "secondary" };
    if (ev.status === "ended" || end < now) return { label: "Tugagan", tone: "secondary" };
    if (start > now) return { label: "Tez orada", tone: "info" };
    return { label: "Aktiv", tone: "success" };
  }

  function setupSearch() {
    var wrap = document.querySelector(".navbar-search-wrapper");
    if (!wrap || wrap.getAttribute("data-zon-cmdk") === "1" || !window.ZonApi) return;
    wrap.setAttribute("data-zon-cmdk", "1");
    var mac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    wrap.innerHTML =
      '<button type="button" class="zon-cmdk-trigger" id="zon-cmdk-open" aria-label="Qidirish">' +
      '<i class="icon-base bx bx-search icon-md"></i><span class="d-none d-md-inline">Qidirish…</span>' +
      '<kbd class="d-none d-md-inline">' + (mac ? "⌘" : "Ctrl") + " K</kbd></button>";

    var box = document.createElement("div");
    box.className = "zon-cmdk";
    box.id = "zon-cmdk";
    box.hidden = true;
    box.innerHTML =
      '<div class="zon-cmdk-backdrop" data-cmdk-close></div>' +
      '<div class="zon-cmdk-panel" role="dialog" aria-modal="true" aria-label="Global qidiruv">' +
      '<div class="zon-cmdk-head"><i class="bx bx-search"></i>' +
      '<input type="text" id="zon-cmdk-q" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="zon-cmdk-list" ' +
      'placeholder="Foydalanuvchi, ZONIC-ID, telefon, musobaqa, yangilik, yutuq, mahsulot…" />' +
      '<span class="spinner-border spinner-border-sm text-primary" id="zon-cmdk-spin" hidden></span>' +
      '<kbd role="button" data-cmdk-close>Esc</kbd></div>' +
      '<div class="zon-cmdk-body" id="zon-cmdk-list" role="listbox"></div>' +
      '<div class="zon-cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> tanlash</span><span><kbd>Enter</kbd> ochish</span>' +
      "<span><kbd>" + (mac ? "⌘" : "Ctrl") + "</kbd>+<kbd>Enter</kbd> yangi oynada</span><span><kbd>Esc</kbd> yopish</span></div></div>";
    document.body.appendChild(box);

    var input = box.querySelector("#zon-cmdk-q");
    var list = box.querySelector("#zon-cmdk-list");
    var spin = box.querySelector("#zon-cmdk-spin");
    var isOpen = false;
    var cache = null;
    var lists = { events: [], news: [], badges: [], market: [] };
    var users = { q: "", items: [], loading: false };
    var userReq = 0;
    var userTimer = 0;
    var flat = [];
    var active = 0;

    function loadLists() {
      if (cache) return cache;
      var get = function (path) {
        return ZonApi.get(path).then(
          function (d) {
            return (d && d.items) || [];
          },
          function () {
            return [];
          }
        );
      };
      cache = Promise.all([get("/Admin/Events"), get("/Admin/News"), get("/Admin/Badges"), get("/Admin/Market/Items")]).then(function (r) {
        lists = { events: r[0], news: r[1], badges: r[2], market: r[3] };
        if (isOpen) render();
      });
      return cache;
    }

    function readRecent() {
      try {
        var arr = JSON.parse(localStorage.getItem(CMDK_RECENT_KEY) || "[]");
        return Array.isArray(arr) ? arr : [];
      } catch (_) {
        return [];
      }
    }
    function pushRecent(it) {
      if (!it || !it.href) return;
      var arr = readRecent().filter(function (x) {
        return x.href !== it.href;
      });
      arr.unshift({ href: it.href, title: it.title, sub: it.sub || "", icon: it.icon || "bx-link", tone: it.tone || "primary" });
      try {
        localStorage.setItem(CMDK_RECENT_KEY, JSON.stringify(arr.slice(0, 6)));
      } catch (_) {}
    }

    function iconHtml(it) {
      if (it.avatar) return it.avatar;
      return '<span class="avatar-initial rounded bg-label-' + (it.tone || "primary") + '"><i class="bx ' + (it.icon || "bx-link") + '"></i></span>';
    }

    function pick(source, tokens, fieldsOf, toItem) {
      return source
        .map(function (x) {
          return { x: x, s: cmdkScore(tokens, fieldsOf(x)) };
        })
        .filter(function (r) {
          return r.s >= 0;
        })
        .sort(function (a, b) {
          return b.s - a.s;
        })
        .slice(0, CMDK_LIMIT)
        .map(function (r) {
          return toItem(r.x);
        });
    }

    function buildGroups(q) {
      var tokens = cmdkNorm(q).split(" ").filter(Boolean);
      var groups = [];
      if (!tokens.length) {
        var recent = readRecent();
        if (recent.length) groups.push({ title: "So‘nggi ochilganlar", items: recent });
        groups.push({
          title: "Sahifalar",
          items: CMDK_PAGES.map(function (p) {
            return { href: p.href, title: p.label, icon: p.icon, tone: p.icon === "bx-plus-circle" ? "success" : "primary" };
          }),
        });
        return { groups: groups, tokens: tokens };
      }
      var pages = pick(CMDK_PAGES, tokens, function (p) {
        return [p.label, p.kw || CMDK_KW[p.href] || ""];
      }, function (p) {
        return { href: p.href, title: p.label, icon: p.icon, tone: p.icon === "bx-plus-circle" ? "success" : "primary" };
      });
      if (pages.length) groups.push({ title: "Sahifalar", items: pages });

      if (users.loading && users.q === q) {
        groups.push({ title: "Foydalanuvchilar", loading: true, items: [] });
      } else if (users.q === q && users.items.length) {
        groups.push({
          title: "Foydalanuvchilar",
          items: users.items.map(function (u) {
            var name = u.username || "—";
            var sub = ["ZONIC-ID " + (u.zonicId == null ? "—" : u.zonicId)];
            if (u.phone) sub.push(u.phone);
            else if (u.email) sub.push(u.email);
            return {
              href: "app-zon-user-runs.html?id=" + encodeURIComponent(u.id) + "&name=" + encodeURIComponent(name),
              title: name,
              sub: sub.join(" · "),
              icon: "bx-user",
              avatar:
                window.ZonUI && ZonUI.userAvatarHtml
                  ? ZonUI.userAvatarHtml(u.avatarFileId, name, 32, { zoom: false })
                  : '<span class="avatar-initial rounded-circle bg-label-primary">' + esc(name.charAt(0).toUpperCase()) + "</span>",
              badge: u.isBlocked ? { label: "Bloklangan", tone: "danger" } : u.isAdmin ? { label: "Admin", tone: "primary" } : null,
            };
          }),
        });
      }

      var ev = pick(lists.events, tokens, function (e) {
        return [e.title, e.description || ""];
      }, function (e) {
        var st = eventState(e);
        return {
          href: "app-zon-events.html?open=" + encodeURIComponent(e.id),
          title: e.title,
          sub: cmdkShortDate(e.startsAt) + " – " + cmdkShortDate(e.endsAt) + " · " + (e.participantCount || 0) + " ishtirokchi",
          icon: "bx-calendar-event",
          tone: "success",
          badge: st,
        };
      });
      if (ev.length) groups.push({ title: "Musobaqalar", items: ev });

      var nw = pick(lists.news, tokens, function (n) {
        return [n.title, n.body || ""];
      }, function (n) {
        return {
          href: "app-zon-news.html?open=" + encodeURIComponent(n.id),
          title: n.title,
          sub: (NEWS_TYPES[n.type] || "Yangilik") + " · " + cmdkShortDate(n.publishedAt || n.createdAt),
          icon: "bx-news",
          tone: "info",
          badge: n.isPublished ? null : { label: "Qoralama", tone: "secondary" },
        };
      });
      if (nw.length) groups.push({ title: "Yangiliklar", items: nw });

      var bd = pick(lists.badges, tokens, function (b) {
        return [b.title, b.code, b.description || "", BADGE_TYPES[b.type] || b.type || ""];
      }, function (b) {
        return {
          href: "app-zon-badges.html?open=" + encodeURIComponent(b.code),
          title: b.title,
          sub: b.code + " · " + (b.threshold || 0) + " " + (b.unit || "") + " · " + (b.unlockCount || 0) + " kishi ochgan",
          icon: "bx-trophy",
          tone: "warning",
          badge: b.isActive === false ? { label: "Nofaol", tone: "secondary" } : null,
        };
      });
      if (bd.length) groups.push({ title: "Yutuqlar", items: bd });

      var mk = pick(lists.market, tokens, function (m) {
        return [m.name, m.code, m.category || ""];
      }, function (m) {
        return {
          href: "app-zon-market.html?open=" + encodeURIComponent(m.code) + "#mahsulotlar",
          title: m.name,
          sub: (m.price || 0) + " tanga" + (m.category ? " · " + m.category : ""),
          icon: "bx-store",
          tone: "danger",
          badge: m.isActive === false ? { label: "Nofaol", tone: "secondary" } : m.isPremium ? { label: "Premium", tone: "warning" } : null,
        };
      });
      if (mk.length) groups.push({ title: "Market", items: mk });
      return { groups: groups, tokens: tokens };
    }

    function render() {
      var q = input.value;
      var built = buildGroups(q);
      flat = [];
      var html = built.groups
        .map(function (g) {
          var rows = g.loading
            ? '<div class="zon-cmdk-loading">Qidirilmoqda…</div>'
            : g.items
                .map(function (it) {
                  var i = flat.length;
                  flat.push(it);
                  return (
                    '<a class="zon-cmdk-item" role="option" id="zon-cmdk-i' + i + '" data-i="' + i + '" href="' + esc(it.href) + '">' +
                    '<span class="avatar avatar-sm flex-shrink-0">' + iconHtml(it) + "</span>" +
                    '<span class="zon-cmdk-text"><span class="zon-cmdk-title">' + cmdkHighlight(it.title, built.tokens) + "</span>" +
                    (it.sub ? "<small>" + cmdkHighlight(it.sub, built.tokens) + "</small>" : "") + "</span>" +
                    (it.badge ? '<span class="badge bg-label-' + it.badge.tone + '">' + esc(it.badge.label) + "</span>" : "") +
                    '<i class="bx bx-subdirectory-left zon-cmdk-enter"></i></a>'
                  );
                })
                .join("");
          return '<div class="zon-cmdk-group">' + esc(g.title) + "</div>" + rows;
        })
        .join("");
      if (!flat.length && !users.loading) {
        html +=
          '<div class="zon-cmdk-empty"><i class="bx bx-search-alt"></i><div>“' + esc(q) + "” bo‘yicha hech narsa topilmadi</div>" +
          "<small>Ism, ZONIC-ID, telefon yoki sarlavhaning bir qismini yozing</small></div>";
      }
      list.innerHTML = html;
      if (window.ZonUI && ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(list);
      if (active >= flat.length) active = Math.max(0, flat.length - 1);
      paintActive(false);
    }

    function paintActive(scroll) {
      Array.prototype.forEach.call(list.querySelectorAll(".zon-cmdk-item"), function (el) {
        var on = Number(el.getAttribute("data-i")) === active;
        el.classList.toggle("is-active", on);
        el.setAttribute("aria-selected", on ? "true" : "false");
        if (on && scroll) el.scrollIntoView({ block: "nearest" });
      });
      input.setAttribute("aria-activedescendant", flat.length ? "zon-cmdk-i" + active : "");
    }

    function searchUsers(q) {
      clearTimeout(userTimer);
      var clean = q.trim();
      if (clean.length < 2) {
        users = { q: q, items: [], loading: false };
        spin.hidden = true;
        return;
      }
      users = { q: q, items: [], loading: true };
      spin.hidden = false;
      var token = ++userReq;
      userTimer = setTimeout(function () {
        ZonApi.get("/Admin/Users?q=" + encodeURIComponent(clean) + "&page=1&pageSize=" + CMDK_LIMIT)
          .then(
            function (d) {
              return (d && d.items) || [];
            },
            function () {
              return [];
            }
          )
          .then(function (items) {
            if (token !== userReq) return;
            users = { q: q, items: items, loading: false };
            spin.hidden = true;
            if (isOpen) render();
          });
      }, 220);
    }

    function go(it, newTab) {
      if (!it) return;
      pushRecent(it);
      if (newTab) {
        window.open(it.href, "_blank");
        return;
      }
      close();
      location.href = it.href;
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      box.hidden = false;
      document.body.classList.add("zon-cmdk-lock");
      input.value = "";
      users = { q: "", items: [], loading: false };
      active = 0;
      render();
      loadLists();
      setTimeout(function () {
        input.focus();
      }, 0);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      box.hidden = true;
      spin.hidden = true;
      document.body.classList.remove("zon-cmdk-lock");
    }

    document.getElementById("zon-cmdk-open").addEventListener("click", open);
    box.addEventListener("click", function (e) {
      if (e.target.closest("[data-cmdk-close]")) close();
    });
    input.addEventListener("input", function () {
      active = 0;
      searchUsers(input.value);
      render();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!flat.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + flat.length) % flat.length;
        paintActive(true);
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(flat[active], e.ctrlKey || e.metaKey);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });
    list.addEventListener("mousemove", function (e) {
      var el = e.target.closest(".zon-cmdk-item");
      if (!el) return;
      var i = Number(el.getAttribute("data-i"));
      if (i !== active) {
        active = i;
        paintActive(false);
      }
    });
    list.addEventListener("click", function (e) {
      var el = e.target.closest(".zon-cmdk-item");
      if (!el || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
        if (el) pushRecent(flat[Number(el.getAttribute("data-i"))]);
        return;
      }
      e.preventDefault();
      go(flat[Number(el.getAttribute("data-i"))], false);
    });

    // Capture fazasi: main.js dagi document Ctrl+K handler (demo qidiruv) ishlamasin.
    window.addEventListener(
      "keydown",
      function (e) {
        var k = String(e.key || "").toLowerCase();
        if ((e.ctrlKey || e.metaKey) && k === "k") {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (isOpen) close();
          else open();
          return;
        }
        if (k === "/" && !isOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
          var t = e.target;
          var typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
          if (!typing && !document.querySelector(".modal.show")) {
            e.preventDefault();
            open();
          }
        }
      },
      true
    );
  }

  /** ?open=<id> — qidiruvdan kelganda yozuv modalini ochadi (open=new → "Yangi"). */
  function openFromUrl() {
    var qs = new URLSearchParams(location.search);
    var id = qs.get("open");
    if (!id) return;
    qs.delete("open");
    var rest = qs.toString();
    history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash);
    var attr = file === "app-zon-events.html" ? "data-parts" : "data-edit";
    var safe = window.CSS && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, "\\$&");
    var sel = id === "new" ? "#z-new" : "[" + attr + '="' + safe + '"]';
    var started = Date.now();
    (function tick() {
      var el = document.querySelector(sel);
      if (el) {
        el.click();
        return;
      }
      if (Date.now() - started < 10000) setTimeout(tick, 150);
    })();
  }

  function boot() {
    splitMenu();
    cleanTemplateChrome();
    setupTheme();
    if (!isAuth) {
      setupLanguage();
      setupShortcuts();
      setupSearch();
      openFromUrl();
      setupNavbarUser();
      // notifications setupNavbarUser ichida adminMe dan keyin
    } else {
      setupLanguage();
    }
    bindLogout();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
