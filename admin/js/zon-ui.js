/**
 * Umumiy UI yordamchilar — shablon sinflari bilan.
 */
(function (global) {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function n(v) {
    var x = Number(v);
    if (!isFinite(x)) return "—";
    return x.toLocaleString("uz-UZ");
  }
  function day(s) {
    if (!s) return "—";
    return String(s).slice(0, 10);
  }
  function dt(s) {
    if (!s) return "—";
    return String(s).replace("T", " ").slice(0, 16);
  }
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function root() {
    return document.querySelector(".container-xxl.flex-grow-1.container-p-y");
  }
  function alertHtml(kind, text) {
    if (!text) return "";
    return '<div class="alert alert-' + kind + ' mb-0" role="alert">' + esc(text) + "</div>";
  }
  function authFail(err) {
    if (err && err.status === 401) {
      if (window.ZonApi) ZonApi.logout();
      location.replace("auth-login-basic.html");
      return true;
    }
    return false;
  }
  function errMsg(err) {
    if (!err) return "Xato";
    if (err.data) {
      if (typeof err.data.message === "string") return err.data.message;
      if (Array.isArray(err.data.message)) return err.data.message.join(", ");
      if (err.data.error) return String(err.data.error);
    }
    return err.message || "Xato";
  }
  function imageUrl(fileId) {
    if (!fileId || !window.ZonApi) return "";
    var base = String((window.ZON_CONFIG && ZON_CONFIG.API_BASE_URL) || "").replace(/\/$/, "");
    return base + "/Admin/Image?fileId=" + encodeURIComponent(fileId);
  }

  /** User profile photo — requires Bearer (use hydrateAvatars after render). */
  function userAvatarUrl(fileId) {
    if (!fileId) return "";
    var base = String((window.ZON_CONFIG && ZON_CONFIG.API_BASE_URL) || "").replace(/\/$/, "");
    return base + "/UserProfile/DownloadAvatar?fileId=" + encodeURIComponent(fileId);
  }

  var _avatarBlobCache = Object.create(null);

  function userAvatarHtml(fileId, name, sizePx) {
    sizePx = sizePx || 34;
    var letter = String(name || "?").trim().charAt(0).toUpperCase() || "?";
    var ph =
      '<span class="avatar-initial rounded-circle bg-label-secondary d-inline-flex align-items-center justify-content-center" style="width:100%;height:100%;font-size:' +
      Math.max(11, Math.round(sizePx * 0.4)) +
      'px">' +
      esc(letter) +
      "</span>";
    if (!fileId) {
      return (
        '<span class="avatar zon-user-avatar flex-shrink-0" style="width:' +
        sizePx +
        "px;height:" +
        sizePx +
        'px">' +
        ph +
        "</span>"
      );
    }
    return (
      '<span class="avatar zon-user-avatar zon-avatar-zoom flex-shrink-0" role="button" tabindex="0" title="Rasmni kattalashtirish" data-avatar-file="' +
      esc(fileId) +
      '" data-avatar-name="' +
      esc(name || "") +
      '" style="width:' +
      sizePx +
      "px;height:" +
      sizePx +
      'px;cursor:pointer">' +
      ph +
      "</span>"
    );
  }

  function loadAvatarBlob(fileId) {
    if (!fileId) return Promise.resolve("");
    if (_avatarBlobCache[fileId]) return Promise.resolve(_avatarBlobCache[fileId]);
    var token = "";
    try {
      token = localStorage.getItem((window.ZON_CONFIG && ZON_CONFIG.TOKEN_KEY) || "zon_admin_token") || "";
    } catch (_) {}
    return fetch(userAvatarUrl(fileId), {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(function (res) {
        if (!res.ok) throw new Error("avatar " + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        _avatarBlobCache[fileId] = url;
        return url;
      })
      .catch(function () {
        return "";
      });
  }

  function ensureAvatarModal() {
    if (document.getElementById("zonAvatarModal")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal fade" id="zonAvatarModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content">' +
      '<div class="modal-header border-0 pb-0">' +
      '<h5 class="modal-title" id="zonAvatarModalTitle">Profil rasmi</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Yopish"></button></div>' +
      '<div class="modal-body text-center pt-2">' +
      '<div id="zonAvatarModalBody" class="zon-avatar-modal-body mx-auto"></div>' +
      '<p class="text-body-secondary small mt-3 mb-0" id="zonAvatarModalSub"></p>' +
      "</div></div></div></div>";
    document.body.appendChild(wrap.firstChild);
  }

  function openAvatarModal(fileId, name) {
    if (!fileId) return;
    ensureAvatarModal();
    var title = document.getElementById("zonAvatarModalTitle");
    var sub = document.getElementById("zonAvatarModalSub");
    var body = document.getElementById("zonAvatarModalBody");
    if (title) title.textContent = name ? String(name) : "Profil rasmi";
    if (sub) sub.textContent = name ? "@" + String(name) : "";
    if (body) {
      body.innerHTML =
        '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">…</span></div>';
    }
    modalShow("zonAvatarModal");
    loadAvatarBlob(fileId).then(function (url) {
      if (!body || !body.isConnected) return;
      if (!url) {
        body.innerHTML = '<span class="text-body-secondary">Rasm yuklanmadi</span>';
        return;
      }
      body.innerHTML =
        '<img src="' +
        url +
        '" alt="" class="rounded-circle zon-avatar-modal-img" width="220" height="220" />';
    });
  }

  function bindAvatarZoom() {
    if (document.documentElement.getAttribute("data-zon-avatar-zoom") === "1") return;
    document.documentElement.setAttribute("data-zon-avatar-zoom", "1");
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest(".zon-avatar-zoom[data-avatar-file]") : null;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      openAvatarModal(el.getAttribute("data-avatar-file"), el.getAttribute("data-avatar-name"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var el = e.target && e.target.closest ? e.target.closest(".zon-avatar-zoom[data-avatar-file]") : null;
      if (!el) return;
      e.preventDefault();
      openAvatarModal(el.getAttribute("data-avatar-file"), el.getAttribute("data-avatar-name"));
    });
  }

  function hydrateAvatars(scope) {
    bindAvatarZoom();
    var rootEl = scope || document;
    var nodes = rootEl.querySelectorAll
      ? rootEl.querySelectorAll("[data-avatar-file]")
      : [];
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.getAttribute("data-avatar-ready") === "1") return;
      var fid = el.getAttribute("data-avatar-file");
      if (!fid) return;
      el.setAttribute("data-avatar-ready", "1");
      loadAvatarBlob(fid).then(function (url) {
        if (!url || !el.isConnected) return;
        var img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.className = "rounded-circle";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.display = "block";
        img.style.pointerEvents = "none";
        el.innerHTML = "";
        el.appendChild(img);
      });
    });
  }

  async function uploadImage(file) {
    var fd = new FormData();
    fd.append("file", file);
    return ZonApi.request("/Admin/UploadImage", { method: "POST", body: fd });
  }
  function badge(text, tone) {
    return '<span class="badge bg-label-' + tone + '">' + esc(text) + "</span>";
  }
  function statCard(title, value, sub, icon, tone) {
    return (
      '<div class="col-sm-6 col-xl-3"><div class="card"><div class="card-body">' +
      '<div class="d-flex align-items-start justify-content-between"><div class="content-left">' +
      '<span class="text-heading">' +
      esc(title) +
      '</span><div class="d-flex align-items-center my-1"><h4 class="mb-0 me-2">' +
      value +
      "</h4></div><small>" +
      esc(sub) +
      "</small></div>" +
      '<div class="avatar"><span class="avatar-initial rounded bg-label-' +
      tone +
      '"><i class="icon-base bx ' +
      icon +
      ' icon-lg"></i></span></div></div></div></div></div>'
    );
  }
  function modalShow(id) {
    var el = document.getElementById(id);
    if (!el) return;
    enhanceSelectsIn(el, { search: false });
    if (window.bootstrap && bootstrap.Modal) bootstrap.Modal.getOrCreateInstance(el).show();
  }
  function modalHide(id) {
    var el = document.getElementById(id);
    if (el && window.bootstrap && bootstrap.Modal) {
      var m = bootstrap.Modal.getInstance(el);
      if (m) m.hide();
    }
  }

  /** Silliq ko‘rsatish / yashirish (.zon-reveal) */
  function revealSet(el, shown) {
    if (!el) return;
    if (shown) el.classList.add("is-shown");
    else el.classList.remove("is-shown");
  }

  /**
   * Native select → Select2 (silliq ochilish).
   * opts: { placeholder, allowClear, search, parent, dropdownParent }
   */
  function enhanceSelect(el, opts) {
    opts = opts || {};
    if (!el || !window.jQuery || !jQuery.fn || !jQuery.fn.select2) return null;
    var $el = jQuery(el);
    if ($el.data("select2")) {
      try {
        $el.select2("destroy");
      } catch (_) {}
    }
    var parent = opts.dropdownParent || opts.parent;
    if (!parent) {
      var modal = el.closest(".modal");
      parent = modal ? jQuery(modal) : jQuery(document.body);
    } else if (!parent.jquery) {
      parent = jQuery(parent);
    }
    $el.select2({
      width: "100%",
      dropdownCssClass: "zon-select2-dropdown",
      selectionCssClass: "zon-select2-selection",
      dropdownParent: parent,
      placeholder: opts.placeholder || undefined,
      allowClear: !!opts.allowClear,
      minimumResultsForSearch: opts.search === false ? Infinity : opts.minSearch != null ? opts.minSearch : 6,
      language: {
        noResults: function () {
          return "Topilmadi";
        },
        searching: function () {
          return "Qidirilmoqda…";
        },
      },
    });
    $el.addClass("zon-enhanced-select");
    return $el;
  }

  function setSelectValue(el, value, silent) {
    if (!el) return;
    if (window.jQuery && jQuery(el).data("select2")) {
      jQuery(el).val(value == null ? "" : value);
      if (!silent) jQuery(el).trigger("change");
      else jQuery(el).trigger("change.select2");
      return;
    }
    el.value = value == null ? "" : value;
    if (!silent) {
      var ev = document.createEvent("HTMLEvents");
      ev.initEvent("change", true, false);
      el.dispatchEvent(ev);
    }
  }

  function enhanceSelectsIn(root, opts) {
    if (!root) return;
    var nodes = root.querySelectorAll("select.form-select, select.zon-select");
    Array.prototype.forEach.call(nodes, function (sel) {
      if (sel.getAttribute("data-zon-no-select2") === "1") return;
      enhanceSelect(sel, opts);
    });
  }

  global.ZonUI = {
    esc: esc,
    n: n,
    day: day,
    dt: dt,
    ready: ready,
    root: root,
    alertHtml: alertHtml,
    authFail: authFail,
    errMsg: errMsg,
    imageUrl: imageUrl,
    userAvatarUrl: userAvatarUrl,
    userAvatarHtml: userAvatarHtml,
    hydrateAvatars: hydrateAvatars,
    uploadImage: uploadImage,
    badge: badge,
    statCard: statCard,
    modalShow: modalShow,
    modalHide: modalHide,
    revealSet: revealSet,
    enhanceSelect: enhanceSelect,
    setSelectValue: setSelectValue,
    enhanceSelectsIn: enhanceSelectsIn,
    openAvatarModal: openAvatarModal,
  };
})(window);
