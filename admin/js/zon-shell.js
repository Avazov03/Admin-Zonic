/**
 * Menyu: ishlaydigan qism yuqorida, qolgani Zahira.
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

  var WORK = [
    { href: "index.html", icon: "bx-home-smile", label: "Boshqaruv" },
    { href: "app-user-list.html", icon: "bx-user", label: "Foydalanuvchilar" },
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

    var html = '<li class="menu-header small"><span class="menu-header-text">Ishlaydi</span></li>';
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
    html +=
      '<li class="menu-header small zon-zahira-head"><span class="menu-header-text">Zahira katalog</span></li>';
    menu.insertAdjacentHTML("afterbegin", html);

    Array.prototype.forEach.call(menu.querySelectorAll(":scope > .zon-zahira-item > a.menu-link"), function (a) {
      if (a.querySelector(".zon-zahira-badge")) return;
      a.insertAdjacentHTML("beforeend", '<span class="zon-zahira-badge">Zahira</span>');
    });
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
    // Til, theme — keyinga; shortcuts setupShortcuts() da
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

  function boot() {
    splitMenu();
    cleanTemplateChrome();
    if (!isAuth) {
      setupShortcuts();
      setupNavbarUser();
      // notifications setupNavbarUser ichida adminMe dan keyin
    }
    bindLogout();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
