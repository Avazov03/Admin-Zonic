# Rebuild detailed commit history for Admin-Zonic (orphan branch).
# Run from repo root: python _rebuild_commits.py
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=ROOT)


def commit(paths: list[str], title: str, body: str) -> None:
    existing = []
    for p in paths:
        fp = ROOT / p
        if fp.exists() or list(ROOT.glob(p)):
            existing.append(p)
    if not existing:
        print("skip (missing):", title)
        return
    run(["git", "add", "--"] + existing)
    # only commit if staged
    st = subprocess.check_output(["git", "diff", "--cached", "--name-only"], cwd=ROOT, text=True)
    if not st.strip():
        print("skip (empty):", title)
        return
    msg = title + "\n\n" + body.strip() + "\n"
    subprocess.check_call(["git", "commit", "-m", msg], cwd=ROOT)


def main() -> None:
    run(["git", "checkout", "--orphan", "rebuild-main"])
    run(["git", "reset"])

    commit(
        [".gitignore"],
        "chore: add gitignore for caches, secrets, and deploy artifacts",
        "Ignore HTTrack caches, generated deploy packages, keys, and one-off remote check scripts so the repo stays lean and secret-safe.",
    )
    commit(
        [".cursor/rules"],
        "chore: add Cursor rules for git-before-deploy and project remotes",
        "Always commit and push to Avazov03/Admin-Zonic before server deploy; remember ubuntu@18.197.174.196 and /var/www/zonic-admin.",
    )
    commit(
        ["_api_src"],
        "feat(api): add Admin Nest sources for territories, events, badges, geo labels",
        "Includes Admin controller/service/DTOs plus Uzbek Latin country/region name mapping and zone-related DTOs used by the live map and lookups.",
    )
    commit(
        [
            "admin/js/app-config.js",
            "admin/js/api.js",
            "admin/js/zon-ui.js",
            "admin/js/zon-shell.js",
            "admin/js/zon-login.js",
            "admin/js/zon-i18n.js",
            "admin/css/zon-admin.css",
        ],
        "feat(admin): core API client, shell, login, UI helpers, and shared CSS",
        "Adds ZonApi auth/request helpers, layout shell menu, login wiring, shared avatars/Select2/reveal helpers, and zon-admin styles for map pins and animations.",
    )
    commit(
        ["admin/js/zon-dashboard.js", "admin/index.html", "admin/auth-login-basic.html"],
        "feat(admin): dashboard page and auth entry HTML",
        "Wires the main dashboard stats view and login page into the Zon Admin shell.",
    )
    commit(
        [
            "admin/js/zon-map.js",
            "admin/app-zon-map.html",
        ],
        "feat(map): live territories map with filters, fly-to, and avatar pins",
        "Global/country/region filters, owner list, multi-zone fly-to, Select2 country/region selects, and centroid pins showing user avatar + name.",
    )
    commit(
        [
            "admin/js/zon-users.js",
            "admin/js/zon-user-runs.js",
            "admin/app-user-list.html",
            "admin/app-zon-user-runs.html",
        ],
        "feat(users): user list accordion, avatars, and sticky run/territory details",
        "Expandable user details without exposing passwords, Bearer avatar hydrate, and sticky Tafsilot/map while scrolling sessions.",
    )
    commit(
        [
            "admin/js/zon-badges.js",
            "admin/app-zon-badges.html",
        ],
        "feat(badges): Yugurish/Hudud tabs, ordered thresholds, and icon column",
        "Split distance and territory achievements into pills tabs sorted by threshold; show PNG/JPG icon thumbnails or trophy placeholder.",
    )
    commit(
        [
            "admin/js/zon-events.js",
            "admin/js/zon-news.js",
            "admin/js/zon-push.js",
            "admin/js/zon-market.js",
            "admin/app-zon-events.html",
            "admin/app-zon-news.html",
            "admin/app-zon-push.html",
            "admin/app-zon-market.html",
        ],
        "feat(content): events publish, news, push, and market admin modules",
        "Create/edit flows with Select2, event publish that fans out news+push, and market item thumbnails via Admin Image API.",
    )
    commit(
        ["DEPLOY.md", "nginx.example.conf", "web.config", "deploy/_sync_admin.sh", "deploy/_finalize.sh", "deploy/_remote_deploy.sh", "deploy/_remote_deploy2.sh", "deploy/_gen_geo_uz.py", "deploy/_verify_uz_char.py"],
        "chore(deploy): docs and sync helpers for admin.zonic.uz",
        "Nginx/IIS examples and remote sync scripts used to publish the admin static panel to the production host.",
    )
    commit(
        ["admin"],
        "chore(admin): include full Vuexy/Sneat template assets and remaining pages",
        "Adds the complete admin HTML/CSS/JS vendor tree required to run the panel UI (template pages used beside Zon modules).",
    )
    commit(
        ["."],
        "chore: add remaining project tooling and root files",
        "Includes root index, helper Python build/audit scripts, and other non-secret project utilities.",
    )

    # replace main
    run(["git", "branch", "-D", "main"])
    run(["git", "branch", "-M", "main"])
    print("DONE commits:")
    subprocess.check_call(["git", "log", "--oneline"], cwd=ROOT)


if __name__ == "__main__":
    main()
