/**
 * Zon Admin - global config (production-ready)
 *
 * Serverga chiqarishda:
 *  - API_BASE_URL ni backend manziliga qoying (oxirida / bolmasin)
 *  - agar frontend va API turli domain bolsa, backendda CORS yoqing
 */
(function () {
  var host = location.hostname;
  var local = host === "localhost" || host === "127.0.0.1";
  window.ZON_CONFIG = {
    appName: "Zon Admin",
    appVersion: "1.0.0",
    author: "Zon Team",
    // Serverda nginx /api/ -> 127.0.0.1:5065/. Lokalda to'g'ridan-to'g'ri API.
    API_BASE_URL: local ? "http://18.197.174.196:5065" : "/api",
    TOKEN_KEY: "zon_admin_token",
    REFRESH_TOKEN_KEY: "zon_admin_refresh_token",
    DEFAULT_LANG: "uz",
    WITH_CREDENTIALS: !local,
  };
})();
