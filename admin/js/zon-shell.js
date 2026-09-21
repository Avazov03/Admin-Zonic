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

  /** Demo billing/pricing — faqat user dropdown tozalanadi; boshqa navbar keyinroq. */
  function cleanTemplateChrome() {
    // Til, theme, shortcuts, notifications — hozircha tegilmaydi
  }

  function setAvatarNodes(nodes, fileId, name) {
    Array.prototype.forEach.call(nodes, function (box) {
      if (!box) return;
      box.innerHTML = "";
      if (window.ZonUI && ZonUI.userAvatarHtml) {
        box.innerHTML = ZonUI.userAvatarHtml(fileId, name, box.classList.contains("avatar-online") ? 40 : 38);
        var inner = box.querySelector(".zon-user-avatar");
        if (inner) {
          inner.style.width = "100%";
          inner.style.height = "100%";
        }
        if (ZonUI.hydrateAvatars) ZonUI.hydrateAvatars(box);
      } else {
        var letter = String(name || "A").charAt(0).toUpperCase();
        box.innerHTML =
          '<span class="avatar-initial rounded-circle bg-label-primary">' + letter + "</span>";
      }
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
      return;
    }
    ZonApi.adminMe()
      .then(function (me) {
        state.username = (me && me.username) || "Admin";
        state.avatarFileId = (me && me.avatarFileId) || null;
        paint();
      })
      .catch(function () {
        paint();
      });
  }

  function boot() {
    splitMenu();
    cleanTemplateChrome();
    setupNavbarUser();
    bindLogout();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
