/**
 * Menyu: ishlaydigan qism yuqorida, qolgani Zahira.
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

  function bindLogout() {
    Array.prototype.forEach.call(document.querySelectorAll("a.dropdown-item"), function (a) {
      if (!/log out|chiqish/i.test(a.textContent || "")) return;
      a.removeAttribute("target");
      a.setAttribute("href", "auth-login-basic.html");
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var done = function () {
          location.href = "auth-login-basic.html";
        };
        if (window.ZonApi && ZonApi.adminLogout) {
          ZonApi.adminLogout().then(done, done);
        } else if (window.ZonApi) {
          ZonApi.logout();
          done();
        } else done();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      splitMenu();
      bindLogout();
    });
  } else {
    splitMenu();
    bindLogout();
  }
})();
