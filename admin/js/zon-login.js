/**
 * Login — POST /Admin/Auth/Login. Dizayn o'sha forma.
 */
(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var title = document.querySelector("h4.mb-1");
    if (title) title.textContent = "Zonic boshqaruv paneli";
    var lead = document.querySelector("h4.mb-1 + p");
    if (lead) lead.textContent = "Admin hisobi bilan kiring";
    var label = document.querySelector('label[for="email"]');
    if (label) label.textContent = "Foydalanuvchi nomi";
    var user = document.getElementById("email");
    if (user) user.placeholder = "admin";
    var brand = document.querySelector(".app-brand-text");
    if (brand) brand.textContent = "Zonic";

    var register = document.querySelector("p.text-center");
    if (register) register.classList.add("d-none");
    var divider = document.querySelector(".divider");
    if (divider) divider.classList.add("d-none");
    var social = document.querySelector(".d-flex.justify-content-center");
    if (social) social.classList.add("d-none");
    var forgot = document.querySelector('a[href="auth-forgot-password-basic.html"]');
    if (forgot) forgot.classList.add("d-none");

    var form = document.getElementById("formAuthentication");
    if (!form) return;
    form.setAttribute("action", "javascript:void(0)");
    form.setAttribute("method", "post");

    var alertBox = document.createElement("div");
    alertBox.className = "alert alert-danger d-none";
    alertBox.setAttribute("role", "alert");
    form.insertBefore(alertBox, form.firstChild);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var userName = (document.getElementById("email").value || "").trim();
      var password = document.getElementById("password").value || "";
      alertBox.classList.add("d-none");
      if (!userName || !password) {
        alertBox.textContent = "Foydalanuvchi nomi va parol kiriting.";
        alertBox.classList.remove("d-none");
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      ZonApi.adminLogin(userName, password)
        .then(function () {
          location.href = "index.html";
        })
        .catch(function (err) {
          var msg = (err && err.data && (err.data.message || err.data.error)) || (err && err.message) || "Kirish amalga oshmadi";
          if (err && err.status === 400) msg = "Login yoki parol noto'g'ri.";
          alertBox.textContent = typeof msg === "string" ? msg : "Kirish amalga oshmadi";
          alertBox.classList.remove("d-none");
          if (btn) btn.disabled = false;
        });
    });
  });
})();
