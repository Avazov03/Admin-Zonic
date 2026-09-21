/**
 * Zon Admin — API helper (fetch)
 * Zonic API: Bearer JWT (+ ixtiyoriy cookies)
 */
(function (global) {
  const cfg = global.ZON_CONFIG || {
    API_BASE_URL: "",
    TOKEN_KEY: "zon_admin_token",
    REFRESH_TOKEN_KEY: "zon_admin_refresh_token",
    WITH_CREDENTIALS: true,
  };

  function getToken() {
    try {
      return localStorage.getItem(cfg.TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(cfg.TOKEN_KEY, token);
      else localStorage.removeItem(cfg.TOKEN_KEY);
    } catch (_) {}
  }

  function getRefreshToken() {
    try {
      return localStorage.getItem(cfg.REFRESH_TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setRefreshToken(token) {
    try {
      if (token) localStorage.setItem(cfg.REFRESH_TOKEN_KEY, token);
      else localStorage.removeItem(cfg.REFRESH_TOKEN_KEY);
    } catch (_) {}
  }

  async function request(path, options = {}) {
    const base = String(cfg.API_BASE_URL || "").replace(/\/$/, "");
    const url = path.startsWith("http")
      ? path
      : base + "/" + String(path).replace(/^\//, "");

    const headers = Object.assign(
      { Accept: "application/json" },
      options.headers || {}
    );

    const hasBody = options.body !== undefined && options.body !== null;
    if (hasBody && !headers["Content-Type"] && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token && !headers.Authorization) {
      headers.Authorization = "Bearer " + token;
    }

    const cross =
      base.startsWith("http") &&
      typeof location !== "undefined" &&
      !base.startsWith(location.origin);
    const res = await fetch(
      url,
      Object.assign(
        {
          credentials: !cross && cfg.WITH_CREDENTIALS ? "include" : "omit",
        },
        options,
        { headers }
      )
    );

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }

    if (!res.ok) {
      const err = new Error(
        (data && (data.message || data.error || data.title)) ||
          res.statusText ||
          "API xato"
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function saveAuthFromResponse(data) {
    if (!data || typeof data !== "object") return data;
    const access = data.accessToken || data.token || data.access_token;
    const refresh = data.refreshToken || data.refresh_token;
    if (access) setToken(access);
    if (refresh) setRefreshToken(refresh);
    return data;
  }

  global.ZonApi = {
    getToken,
    setToken,
    getRefreshToken,
    setRefreshToken,
    request,
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) =>
      request(path, {
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body || {}),
      }),
    put: (path, body) =>
      request(path, {
        method: "PUT",
        body: body instanceof FormData ? body : JSON.stringify(body || {}),
      }),
    patch: (path, body) =>
      request(path, {
        method: "PATCH",
        body: body instanceof FormData ? body : JSON.stringify(body || {}),
      }),
    del: (path) => request(path, { method: "DELETE" }),

    /** Mobile user login (Account) */
    login: async (userName, password) => {
      const data = await request("/Account/Login", {
        method: "POST",
        body: JSON.stringify({ userName, password }),
      });
      return saveAuthFromResponse(data);
    },

    /** Admin login */
    adminLogin: async (userName, password) => {
      const data = await request("/Admin/Auth/Login", {
        method: "POST",
        body: JSON.stringify({ userName, password }),
      });
      return saveAuthFromResponse(data);
    },

    adminLogout: async () => {
      try {
        await request("/Admin/Auth/Logout", { method: "POST", body: "{}" });
      } catch (_) {}
      setToken("");
      setRefreshToken("");
    },

    adminMe: () => request("/Admin/Auth/Me", { method: "GET" }),
    adminUploadAvatar: (file) => {
      var fd = new FormData();
      fd.append("file", file);
      return request("/Admin/Auth/Avatar", { method: "POST", body: fd });
    },
    adminDashboard: (opts) => {
      const y = opts && opts.year != null ? Number(opts.year) : null;
      const q = y && isFinite(y) ? "?year=" + encodeURIComponent(String(y)) : "";
      return request("/Admin/Dashboard" + q, { method: "GET" });
    },
    adminDayActivity: (day) =>
      request("/Admin/Dashboard/DayActivity?day=" + encodeURIComponent(day), { method: "GET" }),

    logout: () => {
      setToken("");
      setRefreshToken("");
    },
  };
})(window);
