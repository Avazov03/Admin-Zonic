# -*- coding: utf-8 -*-
"""Build Zon Admin UZ/RU/EN i18n: locales + HTML data-i18n + engine."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "admin"
HTML = ROOT / "index.html"

# English base keys -> then uz, ru
EN = {
    # meta
    "page.title": "Zon Admin — Dashboard",
    "footer.rights": "© {year} Zon Admin — All rights reserved",
    "footer.api": "Backend API ready",

    # menu
    "menu.dashboard": "Dashboard",
    "menu.management": "Management",
    "menu.users": "Users",
    "menu.products": "Products",
    "menu.orders": "Orders",
    "menu.categories": "Categories",
    "menu.system": "System",
    "menu.settings": "Settings",
    "menu.logout": "Log out",

    # languages
    "lang.uz": "Oʻzbekcha",
    "lang.ru": "Русский",
    "lang.en": "English",

    # theme
    "theme.toggle": "Toggle theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    # search
    "search.placeholder": "Search [CTRL + K]",
    "search.noResults": "No results found",

    # shortcuts
    "shortcuts.title": "Shortcuts",
    "shortcuts.add": "Add shortcuts",
    "shortcuts.calendar": "Calendar",
    "shortcuts.calendar.sub": "Appointments",
    "shortcuts.invoice": "Invoice App",
    "shortcuts.invoice.sub": "Manage Accounts",
    "shortcuts.user": "User App",
    "shortcuts.user.sub": "Manage Users",
    "shortcuts.role": "Role Management",
    "shortcuts.role.sub": "Permission",
    "shortcuts.dashboard": "Dashboard",
    "shortcuts.dashboard.sub": "User Dashboard",
    "shortcuts.setting": "Setting",
    "shortcuts.setting.sub": "Account Settings",
    "shortcuts.faqs": "FAQs",
    "shortcuts.faqs.sub": "FAQs & Articles",
    "shortcuts.modals": "Modals",
    "shortcuts.modals.sub": "Useful Popups",

    # notifications
    "notif.title": "Notification",
    "notif.new": "8 New",
    "notif.markAll": "Mark all as read",
    "notif.viewAll": "View all notifications",
    "notif.1.title": "Congratulation Lettie 🎉",
    "notif.1.body": "Won the monthly best seller gold badge",
    "notif.1.time": "1h ago",
    "notif.2.title": "Charles Franklin",
    "notif.2.body": "Accepted your connection",
    "notif.2.time": "12hr ago",
    "notif.3.title": "New Message ✉️",
    "notif.3.body": "You have new message from Natalie",
    "notif.3.time": "1h ago",
    "notif.4.title": "Whoo! You have new order 🛒",
    "notif.4.body": "ACME Inc. made new order $1,154",
    "notif.4.time": "1 day ago",
    "notif.5.title": "Application has been approved 🚀",
    "notif.5.body": "Your ABC project application has been approved.",
    "notif.5.time": "2 days ago",
    "notif.6.title": "Monthly report is generated",
    "notif.6.body": "July monthly financial report is generated",
    "notif.6.time": "3 days ago",
    "notif.7.title": "Send connection request",
    "notif.7.body": "Peter sent you connection request",
    "notif.7.time": "4 days ago",
    "notif.8.title": "New message from Jane",
    "notif.8.body": "You have new message from Jane",
    "notif.8.time": "5 days ago",
    "notif.9.title": "CPU is running high",
    "notif.9.body": "CPU Utilization Percent is currently at 88.63%",
    "notif.9.time": "5 days ago",

    # user menu
    "user.role": "Admin",
    "user.profile": "My Profile",
    "user.settings": "Settings",
    "user.billing": "Billing Plan",
    "user.pricing": "Pricing",
    "user.faq": "FAQ",
    "user.logout": "Log Out",

    # dashboard cards
    "dash.welcome": "Welcome! 🎉",
    "dash.welcome.body": "You have done 72% more sales today.<br />Check your new badge in your profile.",
    "dash.viewBadges": "View Badges",
    "dash.order": "Order",
    "dash.sales": "Sales",
    "dash.payments": "Payments",
    "dash.revenue": "Revenue",
    "dash.totalRevenue": "Total Revenue",
    "dash.companyGrowth": "62% Company Growth",
    "dash.profileReport": "Profile Report",
    "dash.year2022": "YEAR 2022",
    "dash.orderStats": "Order Statistics",
    "dash.totalSales": "42.82k Total Sales",
    "dash.totalOrders": "Total Orders",
    "dash.electronic": "Electronic",
    "dash.electronic.sub": "Mobile, Earbuds, TV",
    "dash.fashion": "Fashion",
    "dash.fashion.sub": "T-shirt, Jeans, Shoes",
    "dash.decor": "Decor",
    "dash.decor.sub": "Fine Art, Dining",
    "dash.sports": "Sports",
    "dash.sports.sub": "Football, Cricket Kit",
    "dash.income": "Income",
    "dash.expenses": "Expenses",
    "dash.profit": "Profit",
    "dash.totalBalance": "Total Balance",
    "dash.incomeWeek": "Income this week",
    "dash.incomeWeek.sub": "$39k less than last week",
    "dash.transactions": "Transactions",
    "dash.sendMoney": "Send money",
    "dash.refund": "Refund",
    "dash.orderedFood": "Ordered Food",
    "dash.activity": "Activity Timeline",
    "dash.invPaid": "12 Invoices have been paid",
    "dash.invPaid.time": "12 min ago",
    "dash.invPaid.body": "Invoices have been paid to the company",
    "dash.clientMeeting": "Client Meeting",
    "dash.clientMeeting.time": "45 min ago",
    "dash.clientMeeting.body": "Project meeting with john @10:15am",
    "dash.client": "Lester McCarthy (Client)",
    "dash.newProject": "Create a new project for client",
    "dash.newProject.time": "2 Day Ago",
    "dash.newProject.body": "6 team members in a project",
    "dash.more3": "+3",

    # common actions
    "action.viewMore": "View More",
    "action.delete": "Delete",
    "action.selectAll": "Select All",
    "action.refresh": "Refresh",
    "action.share": "Share",
    "action.last28": "Last 28 Days",
    "action.lastMonth": "Last Month",
    "action.lastYear": "Last Year",
    "action.toggleDropdown": "Toggle Dropdown",

    # tables
    "table.no": "No",
    "table.browser": "Browser",
    "table.visits": "Visits",
    "table.percent": "Data In Percentage",
    "table.system": "System",
    "table.country": "Country",
    "tab.browser": "Browser",
    "tab.os": "Operating System",
    "tab.country": "Country",

    # countries
    "country.us": "USA",
    "country.br": "Brazil",
    "country.in": "India",
    "country.au": "Australia",
    "country.fr": "France",
    "country.ca": "Canada",

    # chart / analytics (used by JS)
    "chart.growth": "Growth",
    "chart.weekly": "Weekly",
    "chart.order": "Order",
}

UZ = {
    "page.title": "Zon Admin — Boshqaruv paneli",
    "footer.rights": "© {year} Zon Admin — Barcha huquqlar himoyalangan",
    "footer.api": "Backend API tayyor",
    "menu.dashboard": "Dashboard",
    "menu.management": "Boshqaruv",
    "menu.users": "Foydalanuvchilar",
    "menu.products": "Mahsulotlar",
    "menu.orders": "Buyurtmalar",
    "menu.categories": "Kategoriyalar",
    "menu.system": "Tizim",
    "menu.settings": "Sozlamalar",
    "menu.logout": "Chiqish",
    "lang.uz": "Oʻzbekcha",
    "lang.ru": "Русский",
    "lang.en": "English",
    "theme.toggle": "Mavzuni almashtirish",
    "theme.light": "Yorugʻ",
    "theme.dark": "Qorongʻu",
    "theme.system": "Tizim",
    "search.placeholder": "Qidirish [CTRL + K]",
    "search.noResults": "Natija topilmadi",
    "shortcuts.title": "Tezkor havolalar",
    "shortcuts.add": "Tezkor havola qoʻshish",
    "shortcuts.calendar": "Kalendar",
    "shortcuts.calendar.sub": "Uchrashuvlar",
    "shortcuts.invoice": "Hisob-faktura",
    "shortcuts.invoice.sub": "Hisoblarni boshqarish",
    "shortcuts.user": "Foydalanuvchilar",
    "shortcuts.user.sub": "Foydalanuvchilarni boshqarish",
    "shortcuts.role": "Rollar",
    "shortcuts.role.sub": "Ruxsatlar",
    "shortcuts.dashboard": "Dashboard",
    "shortcuts.dashboard.sub": "Foydalanuvchi paneli",
    "shortcuts.setting": "Sozlama",
    "shortcuts.setting.sub": "Hisob sozlamalari",
    "shortcuts.faqs": "Savollar",
    "shortcuts.faqs.sub": "FAQ va maqolalar",
    "shortcuts.modals": "Modallar",
    "shortcuts.modals.sub": "Foydali oynalar",
    "notif.title": "Bildirishnomalar",
    "notif.new": "8 yangi",
    "notif.markAll": "Hammasini oʻqilgan deb belgilash",
    "notif.viewAll": "Barcha bildirishnomalar",
    "notif.1.title": "Tabriklaymiz, Lettie 🎉",
    "notif.1.body": "Oylik eng yaxshi sotuvchi oltin belgisini yutdi",
    "notif.1.time": "1 soat oldin",
    "notif.2.title": "Charles Franklin",
    "notif.2.body": "Ulanish soʻrovingizni qabul qildi",
    "notif.2.time": "12 soat oldin",
    "notif.3.title": "Yangi xabar ✉️",
    "notif.3.body": "Nataliedan yangi xabaringiz bor",
    "notif.3.time": "1 soat oldin",
    "notif.4.title": "Yangi buyurtma! 🛒",
    "notif.4.body": "ACME Inc. $1,154 lik buyurtma berdi",
    "notif.4.time": "1 kun oldin",
    "notif.5.title": "Ariza tasdiqlandi 🚀",
    "notif.5.body": "ABC loyihasi arizangiz tasdiqlandi.",
    "notif.5.time": "2 kun oldin",
    "notif.6.title": "Oylik hisobot tayyor",
    "notif.6.body": "Iyul oyi moliyaviy hisoboti yaratildi",
    "notif.6.time": "3 kun oldin",
    "notif.7.title": "Ulanish soʻrovi",
    "notif.7.body": "Peter sizga ulanish soʻrovi yubordi",
    "notif.7.time": "4 kun oldin",
    "notif.8.title": "Janedan yangi xabar",
    "notif.8.body": "Janedan yangi xabaringiz bor",
    "notif.8.time": "5 kun oldin",
    "notif.9.title": "CPU yuklamasi yuqori",
    "notif.9.body": "CPU foydalanish foizi hozir 88.63%",
    "notif.9.time": "5 kun oldin",
    "user.role": "Admin",
    "user.profile": "Profilim",
    "user.settings": "Sozlamalar",
    "user.billing": "Toʻlov rejasi",
    "user.pricing": "Narxlar",
    "user.faq": "FAQ",
    "user.logout": "Chiqish",
    "dash.welcome": "Xush kelibsiz! 🎉",
    "dash.welcome.body": "Bugun savdo 72% ga oshdi.<br />Profilingizdagi yangi belgini koʻring.",
    "dash.viewBadges": "Belgilarni koʻrish",
    "dash.order": "Buyurtma",
    "dash.sales": "Savdo",
    "dash.payments": "Toʻlovlar",
    "dash.revenue": "Daromad",
    "dash.totalRevenue": "Umumiy daromad",
    "dash.companyGrowth": "62% kompaniya oʻsishi",
    "dash.profileReport": "Profil hisoboti",
    "dash.year2022": "2022 YIL",
    "dash.orderStats": "Buyurtma statistikasi",
    "dash.totalSales": "42.82k jami savdo",
    "dash.totalOrders": "Jami buyurtmalar",
    "dash.electronic": "Elektronika",
    "dash.electronic.sub": "Telefon, quloqchin, TV",
    "dash.fashion": "Moda",
    "dash.fashion.sub": "Futbolka, jinsi, poyabzal",
    "dash.decor": "Dekor",
    "dash.decor.sub": "Sanʼat, oshxona",
    "dash.sports": "Sport",
    "dash.sports.sub": "Futbol, kriket toʻplami",
    "dash.income": "Daromad",
    "dash.expenses": "Xarajatlar",
    "dash.profit": "Foyda",
    "dash.totalBalance": "Umumiy balans",
    "dash.incomeWeek": "Shu hafta daromadi",
    "dash.incomeWeek.sub": "Oʻtgan haftadan $39k kam",
    "dash.transactions": "Tranzaksiyalar",
    "dash.sendMoney": "Pul yuborish",
    "dash.refund": "Qaytarish",
    "dash.orderedFood": "Ovqat buyurtmasi",
    "dash.activity": "Faoliyat tarixi",
    "dash.invPaid": "12 ta hisob-faktura toʻlandi",
    "dash.invPaid.time": "12 daqiqa oldin",
    "dash.invPaid.body": "Kompaniyaga hisob-fakturalar toʻlandi",
    "dash.clientMeeting": "Mijoz bilan uchrashuv",
    "dash.clientMeeting.time": "45 daqiqa oldin",
    "dash.clientMeeting.body": "John bilan loyiha uchrashuvi @10:15",
    "dash.client": "Lester McCarthy (Mijoz)",
    "dash.newProject": "Mijoz uchun yangi loyiha",
    "dash.newProject.time": "2 kun oldin",
    "dash.newProject.body": "Loyihada 6 ta jamoa aʼzosi",
    "dash.more3": "+3",
    "action.viewMore": "Koʻproq",
    "action.delete": "Oʻchirish",
    "action.selectAll": "Hammasini tanlash",
    "action.refresh": "Yangilash",
    "action.share": "Ulashish",
    "action.last28": "Oxirgi 28 kun",
    "action.lastMonth": "Oʻtgan oy",
    "action.lastYear": "Oʻtgan yil",
    "action.toggleDropdown": "Menyuni ochish",
    "table.no": "№",
    "table.browser": "Brauzer",
    "table.visits": "Tashriflar",
    "table.percent": "Foizda maʼlumot",
    "table.system": "Tizim",
    "table.country": "Mamlakat",
    "tab.browser": "Brauzer",
    "tab.os": "Operatsion tizim",
    "tab.country": "Mamlakat",
    "country.us": "AQSH",
    "country.br": "Braziliya",
    "country.in": "Hindiston",
    "country.au": "Avstraliya",
    "country.fr": "Fransiya",
    "country.ca": "Kanada",
    "chart.growth": "Oʻsish",
    "chart.weekly": "Haftalik",
    "chart.order": "Buyurtma",
}

RU = {
    "page.title": "Zon Admin — Панель управления",
    "footer.rights": "© {year} Zon Admin — Все права защищены",
    "footer.api": "Backend API готов",
    "menu.dashboard": "Дашборд",
    "menu.management": "Управление",
    "menu.users": "Пользователи",
    "menu.products": "Товары",
    "menu.orders": "Заказы",
    "menu.categories": "Категории",
    "menu.system": "Система",
    "menu.settings": "Настройки",
    "menu.logout": "Выйти",
    "lang.uz": "Oʻzbekcha",
    "lang.ru": "Русский",
    "lang.en": "English",
    "theme.toggle": "Сменить тему",
    "theme.light": "Светлая",
    "theme.dark": "Тёмная",
    "theme.system": "Системная",
    "search.placeholder": "Поиск [CTRL + K]",
    "search.noResults": "Ничего не найдено",
    "shortcuts.title": "Ярлыки",
    "shortcuts.add": "Добавить ярлык",
    "shortcuts.calendar": "Календарь",
    "shortcuts.calendar.sub": "Встречи",
    "shortcuts.invoice": "Счета",
    "shortcuts.invoice.sub": "Управление счетами",
    "shortcuts.user": "Пользователи",
    "shortcuts.user.sub": "Управление пользователями",
    "shortcuts.role": "Роли",
    "shortcuts.role.sub": "Права доступа",
    "shortcuts.dashboard": "Дашборд",
    "shortcuts.dashboard.sub": "Панель пользователя",
    "shortcuts.setting": "Настройка",
    "shortcuts.setting.sub": "Настройки аккаунта",
    "shortcuts.faqs": "FAQ",
    "shortcuts.faqs.sub": "Вопросы и статьи",
    "shortcuts.modals": "Модалки",
    "shortcuts.modals.sub": "Полезные окна",
    "notif.title": "Уведомления",
    "notif.new": "8 новых",
    "notif.markAll": "Отметить все как прочитанные",
    "notif.viewAll": "Все уведомления",
    "notif.1.title": "Поздравляем, Lettie 🎉",
    "notif.1.body": "Получила золотой значок лучшего продавца месяца",
    "notif.1.time": "1 ч назад",
    "notif.2.title": "Charles Franklin",
    "notif.2.body": "Принял ваш запрос на связь",
    "notif.2.time": "12 ч назад",
    "notif.3.title": "Новое сообщение ✉️",
    "notif.3.body": "У вас новое сообщение от Natalie",
    "notif.3.time": "1 ч назад",
    "notif.4.title": "Новый заказ! 🛒",
    "notif.4.body": "ACME Inc. оформила заказ на $1,154",
    "notif.4.time": "1 день назад",
    "notif.5.title": "Заявка одобрена 🚀",
    "notif.5.body": "Ваша заявка по проекту ABC одобрена.",
    "notif.5.time": "2 дня назад",
    "notif.6.title": "Месячный отчёт готов",
    "notif.6.body": "Финансовый отчёт за июль сформирован",
    "notif.6.time": "3 дня назад",
    "notif.7.title": "Запрос на связь",
    "notif.7.body": "Peter отправил вам запрос на связь",
    "notif.7.time": "4 дня назад",
    "notif.8.title": "Сообщение от Jane",
    "notif.8.body": "У вас новое сообщение от Jane",
    "notif.8.time": "5 дней назад",
    "notif.9.title": "Высокая нагрузка CPU",
    "notif.9.body": "Загрузка CPU сейчас 88.63%",
    "notif.9.time": "5 дней назад",
    "user.role": "Админ",
    "user.profile": "Мой профиль",
    "user.settings": "Настройки",
    "user.billing": "Тарифный план",
    "user.pricing": "Цены",
    "user.faq": "FAQ",
    "user.logout": "Выйти",
    "dash.welcome": "Добро пожаловать! 🎉",
    "dash.welcome.body": "Сегодня продажи выросли на 72%.<br />Проверьте новый значок в профиле.",
    "dash.viewBadges": "Смотреть значки",
    "dash.order": "Заказы",
    "dash.sales": "Продажи",
    "dash.payments": "Платежи",
    "dash.revenue": "Выручка",
    "dash.totalRevenue": "Общая выручка",
    "dash.companyGrowth": "Рост компании 62%",
    "dash.profileReport": "Отчёт профиля",
    "dash.year2022": "ГОД 2022",
    "dash.orderStats": "Статистика заказов",
    "dash.totalSales": "42.82k всего продаж",
    "dash.totalOrders": "Всего заказов",
    "dash.electronic": "Электроника",
    "dash.electronic.sub": "Телефон, наушники, ТВ",
    "dash.fashion": "Мода",
    "dash.fashion.sub": "Футболки, джинсы, обувь",
    "dash.decor": "Декор",
    "dash.decor.sub": "Искусство, кухня",
    "dash.sports": "Спорт",
    "dash.sports.sub": "Футбол, крикет",
    "dash.income": "Доход",
    "dash.expenses": "Расходы",
    "dash.profit": "Прибыль",
    "dash.totalBalance": "Общий баланс",
    "dash.incomeWeek": "Доход за неделю",
    "dash.incomeWeek.sub": "На $39k меньше прошлой недели",
    "dash.transactions": "Транзакции",
    "dash.sendMoney": "Отправка денег",
    "dash.refund": "Возврат",
    "dash.orderedFood": "Заказ еды",
    "dash.activity": "Лента активности",
    "dash.invPaid": "Оплачено 12 счетов",
    "dash.invPaid.time": "12 мин назад",
    "dash.invPaid.body": "Счета компании были оплачены",
    "dash.clientMeeting": "Встреча с клиентом",
    "dash.clientMeeting.time": "45 мин назад",
    "dash.clientMeeting.body": "Встреча по проекту с john @10:15",
    "dash.client": "Lester McCarthy (Клиент)",
    "dash.newProject": "Новый проект для клиента",
    "dash.newProject.time": "2 дня назад",
    "dash.newProject.body": "В проекте 6 участников команды",
    "dash.more3": "+3",
    "action.viewMore": "Подробнее",
    "action.delete": "Удалить",
    "action.selectAll": "Выбрать всё",
    "action.refresh": "Обновить",
    "action.share": "Поделиться",
    "action.last28": "Последние 28 дней",
    "action.lastMonth": "Прошлый месяц",
    "action.lastYear": "Прошлый год",
    "action.toggleDropdown": "Открыть меню",
    "table.no": "№",
    "table.browser": "Браузер",
    "table.visits": "Визиты",
    "table.percent": "Данные в процентах",
    "table.system": "Система",
    "table.country": "Страна",
    "tab.browser": "Браузер",
    "tab.os": "ОС",
    "tab.country": "Страна",
    "country.us": "США",
    "country.br": "Бразилия",
    "country.in": "Индия",
    "country.au": "Австралия",
    "country.fr": "Франция",
    "country.ca": "Канада",
    "chart.growth": "Рост",
    "chart.weekly": "Неделя",
    "chart.order": "Заказ",
}

# Ensure all keys exist in all langs
assert set(EN) == set(UZ) == set(RU), (set(EN) - set(UZ), set(EN) - set(RU))

LOCALES = {"uz": UZ, "ru": RU, "en": EN}


def write_locales() -> None:
    loc_dir = ROOT / "js" / "locales"
    loc_dir.mkdir(parents=True, exist_ok=True)
    for code, data in LOCALES.items():
        (loc_dir / f"{code}.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print("Wrote locale JSON files")


ENGINE = r"""/**
 * Zon Admin i18n — UZ / RU / EN
 */
(function (global) {
  const STORAGE_KEY = "zon_admin_lang";
  const SUPPORTED = ["uz", "ru", "en"];
  const cache = {};
  let current = localStorage.getItem(STORAGE_KEY) || "uz";
  if (!SUPPORTED.includes(current)) current = "uz";

  function t(key, vars) {
    const dict = cache[current] || {};
    let str = dict[key] != null ? dict[key] : (cache.en && cache.en[key]) || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]));
      });
    }
    return str;
  }

  function apply() {
    document.documentElement.setAttribute("lang", current);
    document.title = t("page.title");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = t(key, { year: new Date().getFullYear() });
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });

    // language dropdown active state + label
    document.querySelectorAll(".dropdown-language .dropdown-item").forEach((item) => {
      const lang = item.getAttribute("data-language");
      item.classList.toggle("active", lang === current);
    });
    const langBtn = document.querySelector(".dropdown-language .nav-link");
    if (langBtn) {
      let badge = langBtn.querySelector(".zon-lang-code");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "zon-lang-code ms-1 d-none d-sm-inline small fw-semibold";
        langBtn.appendChild(badge);
      }
      badge.textContent = current.toUpperCase();
    }

    // Algolia search placeholder if present
    if (global.SearchConfig) {
      global.SearchConfig.placeholder = t("search.placeholder");
    }
    const searchBtn = document.querySelector(".aa-DetachedSearchButtonPlaceholder");
    if (searchBtn) searchBtn.textContent = t("search.placeholder");

    // Footer year already in rights string via {year}
    const yearEl = document.getElementById("zon-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    global.dispatchEvent(new CustomEvent("zon:langchange", { detail: { lang: current } }));
  }

  async function load(lang) {
    if (cache[lang]) return cache[lang];
    const res = await fetch("js/locales/" + lang + ".json?v=1");
    if (!res.ok) throw new Error("Locale load failed: " + lang);
    cache[lang] = await res.json();
    return cache[lang];
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = "uz";
    await load(lang);
    // preload fallback
    if (!cache.en) await load("en");
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
  }

  function bindSwitcher() {
    const root = document.querySelector(".dropdown-language");
    if (!root) return;
    root.querySelectorAll("[data-language]").forEach((item) => {
      item.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          setLang(this.getAttribute("data-language"));
        },
        true
      );
    });
  }

  global.ZonI18n = { t, setLang, apply, get lang() { return current; }, SUPPORTED };

  document.addEventListener("DOMContentLoaded", async function () {
    try {
      await setLang(current);
      bindSwitcher();
    } catch (err) {
      console.error(err);
    }
  });
})(window);
"""


def patch_html(html: str) -> str:
    # Language dropdown
    old_lang = """      <li class="nav-item dropdown-language dropdown me-2 me-xl-0">
        <a class="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown">
          <i class="icon-base bx bx-globe icon-md"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="en" data-text-direction="ltr">
              <span>English</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="fr" data-text-direction="ltr">
              <span>French</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="ar" data-text-direction="rtl">
              <span>Arabic</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="de" data-text-direction="ltr">
              <span>German</span>
            </a>
          </li>
        </ul>
      </li>"""

    new_lang = """      <li class="nav-item dropdown-language dropdown me-2 me-xl-0">
        <a class="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown" aria-label="Language">
          <i class="icon-base bx bx-globe icon-md"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="uz" data-text-direction="ltr">
              <span data-i18n="lang.uz">Oʻzbekcha</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="ru" data-text-direction="ltr">
              <span data-i18n="lang.ru">Русский</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-language="en" data-text-direction="ltr">
              <span data-i18n="lang.en">English</span>
            </a>
          </li>
        </ul>
      </li>"""
    if old_lang not in html:
        raise SystemExit("language dropdown block not found")
    html = html.replace(old_lang, new_lang, 1)

    # Menu items
    reps = [
        ('<div>Dashboard</div>', '<div data-i18n="menu.dashboard">Dashboard</div>'),
        ('<span class="menu-header-text">Boshqaruv</span>', '<span class="menu-header-text" data-i18n="menu.management">Boshqaruv</span>'),
        ('<div>Foydalanuvchilar</div>', '<div data-i18n="menu.users">Foydalanuvchilar</div>'),
        ('<div>Mahsulotlar</div>', '<div data-i18n="menu.products">Mahsulotlar</div>'),
        ('<div>Buyurtmalar</div>', '<div data-i18n="menu.orders">Buyurtmalar</div>'),
        ('<div>Kategoriyalar</div>', '<div data-i18n="menu.categories">Kategoriyalar</div>'),
        ('<span class="menu-header-text">Tizim</span>', '<span class="menu-header-text" data-i18n="menu.system">Tizim</span>'),
        ('data-zon-page="settings">\n          <i class="menu-icon icon-base bx bx-cog"></i>\n          <div>Sozlamalar</div>',
         'data-zon-page="settings">\n          <i class="menu-icon icon-base bx bx-cog"></i>\n          <div data-i18n="menu.settings">Sozlamalar</div>'),
        ('id="zon-logout">\n          <i class="menu-icon icon-base bx bx-log-out"></i>\n          <div>Chiqish</div>',
         'id="zon-logout">\n          <i class="menu-icon icon-base bx bx-log-out"></i>\n          <div data-i18n="menu.logout">Chiqish</div>'),
        # theme
        ('id="nav-theme-text">Toggle theme</span>', 'id="nav-theme-text" data-i18n="theme.toggle">Toggle theme</span>'),
        ('data-icon="sun"></i>Light</span>', 'data-icon="sun"></i><span data-i18n="theme.light">Light</span></span>'),
        ('data-icon="moon"></i>Dark</span>', 'data-icon="moon"></i><span data-i18n="theme.dark">Dark</span></span>'),
        ('data-icon="desktop"></i>System</span>', 'data-icon="desktop"></i><span data-i18n="theme.system">System</span></span>'),
        # shortcuts header
        ('<h6 class="mb-0 me-auto">Shortcuts</h6>', '<h6 class="mb-0 me-auto" data-i18n="shortcuts.title">Shortcuts</h6>'),
        ('title="Add shortcuts"', 'data-i18n-title="shortcuts.add" title="Add shortcuts"'),
        ('<a href="#" class="stretched-link">Calendar</a>\n                <small>Appointments</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.calendar">Calendar</a>\n                <small data-i18n="shortcuts.calendar.sub">Appointments</small>'),
        ('<a href="#" class="stretched-link">Invoice App</a>\n                <small>Manage Accounts</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.invoice">Invoice App</a>\n                <small data-i18n="shortcuts.invoice.sub">Manage Accounts</small>'),
        ('<a href="#" class="stretched-link">User App</a>\n                <small>Manage Users</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.user">User App</a>\n                <small data-i18n="shortcuts.user.sub">Manage Users</small>'),
        ('<a href="#" class="stretched-link">Role Management</a>\n                <small>Permission</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.role">Role Management</a>\n                <small data-i18n="shortcuts.role.sub">Permission</small>'),
        ('<a href="#" class="stretched-link">Dashboard</a>\n                <small>User Dashboard</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.dashboard">Dashboard</a>\n                <small data-i18n="shortcuts.dashboard.sub">User Dashboard</small>'),
        ('<a href="#" class="stretched-link">Setting</a>\n                <small>Account Settings</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.setting">Setting</a>\n                <small data-i18n="shortcuts.setting.sub">Account Settings</small>'),
        ('<a href="#" class="stretched-link">FAQs</a>\n                <small>FAQs & Articles</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.faqs">FAQs</a>\n                <small data-i18n="shortcuts.faqs.sub">FAQs & Articles</small>'),
        ('<a href="#" class="stretched-link">Modals</a>\n                <small>Useful Popups</small>',
         '<a href="#" class="stretched-link" data-i18n="shortcuts.modals">Modals</a>\n                <small data-i18n="shortcuts.modals.sub">Useful Popups</small>'),
        # notifications
        ('<h6 class="mb-0 me-auto">Notification</h6>', '<h6 class="mb-0 me-auto" data-i18n="notif.title">Notification</h6>'),
        ('<span class="badge bg-label-primary me-2">8 New</span>', '<span class="badge bg-label-primary me-2" data-i18n="notif.new">8 New</span>'),
        ('title="Mark all as read"', 'data-i18n-title="notif.markAll" title="Mark all as read"'),
        ('<small class="align-middle">View all notifications</small>', '<small class="align-middle" data-i18n="notif.viewAll">View all notifications</small>'),
        # user menu
        ('<h6 class="mb-0">Admin</h6>\n                  <small class="text-body-secondary">Admin</small>',
         '<h6 class="mb-0">Admin</h6>\n                  <small class="text-body-secondary" data-i18n="user.role">Admin</small>'),
        ('<span>My Profile</span>', '<span data-i18n="user.profile">My Profile</span>'),
        ('<span>Settings</span> </a>\n          </li>\n          <li>\n            <a class="dropdown-item" href="#">\n              <span class="d-flex',
         '<span data-i18n="user.settings">Settings</span> </a>\n          </li>\n          <li>\n            <a class="dropdown-item" href="#">\n              <span class="d-flex'),
        ('<span class="flex-grow-1 align-middle">Billing Plan</span>', '<span class="flex-grow-1 align-middle" data-i18n="user.billing">Billing Plan</span>'),
        ('<span>Pricing</span>', '<span data-i18n="user.pricing">Pricing</span>'),
        ('<span>FAQ</span>', '<span data-i18n="user.faq">FAQ</span>'),
        ('<span>Log Out</span>', '<span data-i18n="user.logout">Log Out</span>'),
        # welcome
        ('Xush kelibsiz! 🎉', ''),  # handled below carefully
    ]

    # Welcome block
    html = html.replace(
        '<h5 class="card-title text-primary mb-3">Xush kelibsiz! 🎉</h5>\n              <p class="mb-6">You have done 72% more sales today.<br />Check your new badge in your profile.</p>\n\n              <a href="javascript:;" class="btn btn-sm btn-label-primary">View Badges</a>',
        '<h5 class="card-title text-primary mb-3" data-i18n="dash.welcome">Xush kelibsiz! 🎉</h5>\n              <p class="mb-6" data-i18n="dash.welcome.body" data-i18n-html>You have done 72% more sales today.<br />Check your new badge in your profile.</p>\n\n              <a href="javascript:;" class="btn btn-sm btn-label-primary" data-i18n="dash.viewBadges">View Badges</a>',
        1,
    )

    # Simple label replacements (order matters for duplicates)
    simple = [
        ('<span class="d-block fw-medium mb-1">Order</span>', '<span class="d-block fw-medium mb-1" data-i18n="dash.order">Order</span>'),
        ('<p class="mb-1">Sales</p>', '<p class="mb-1" data-i18n="dash.sales">Sales</p>'),
        ('<p class="mb-1">Payments</p>', '<p class="mb-1" data-i18n="dash.payments">Payments</p>'),
        ('<span class="d-block fw-medium mb-1">Revenue</span>', '<span class="d-block fw-medium mb-1" data-i18n="dash.revenue">Revenue</span>'),
        ('<h5 class="m-0 me-2">Total Revenue</h5>', '<h5 class="m-0 me-2" data-i18n="dash.totalRevenue">Total Revenue</h5>'),
        ('<div class="text-center fw-medium my-6">62% Company Growth</div>', '<div class="text-center fw-medium my-6" data-i18n="dash.companyGrowth">62% Company Growth</div>'),
        ('<h5 class="text-nowrap mb-1">Profile Report</h5>', '<h5 class="text-nowrap mb-1" data-i18n="dash.profileReport">Profile Report</h5>'),
        ('<span class="badge bg-label-warning">YEAR 2022</span>', '<span class="badge bg-label-warning" data-i18n="dash.year2022">YEAR 2022</span>'),
        ('<h5 class="mb-1 me-2">Order Statistics</h5>', '<h5 class="mb-1 me-2" data-i18n="dash.orderStats">Order Statistics</h5>'),
        ('<p class="card-subtitle">42.82k Total Sales</p>', '<p class="card-subtitle" data-i18n="dash.totalSales">42.82k Total Sales</p>'),
        ('<small>Total Orders</small>', '<small data-i18n="dash.totalOrders">Total Orders</small>'),
        ('<h6 class="mb-0">Electronic</h6>\n                  <small>Mobile, Earbuds, TV</small>',
         '<h6 class="mb-0" data-i18n="dash.electronic">Electronic</h6>\n                  <small data-i18n="dash.electronic.sub">Mobile, Earbuds, TV</small>'),
        ('<h6 class="mb-0">Fashion</h6>\n                  <small>T-shirt, Jeans, Shoes</small>',
         '<h6 class="mb-0" data-i18n="dash.fashion">Fashion</h6>\n                  <small data-i18n="dash.fashion.sub">T-shirt, Jeans, Shoes</small>'),
        ('<h6 class="mb-0">Decor</h6>\n                  <small>Fine Art, Dining</small>',
         '<h6 class="mb-0" data-i18n="dash.decor">Decor</h6>\n                  <small data-i18n="dash.decor.sub">Fine Art, Dining</small>'),
        ('<h6 class="mb-0">Sports</h6>\n                  <small>Football, Cricket Kit</small>',
         '<h6 class="mb-0" data-i18n="dash.sports">Sports</h6>\n                  <small data-i18n="dash.sports.sub">Football, Cricket Kit</small>'),
        ('aria-selected="true">Income</button>', 'aria-selected="true" data-i18n="dash.income">Income</button>'),
        ('class="nav-link" role="tab">Expenses</button>', 'class="nav-link" role="tab" data-i18n="dash.expenses">Expenses</button>'),
        ('class="nav-link" role="tab">Profit</button>', 'class="nav-link" role="tab" data-i18n="dash.profit">Profit</button>'),
        ('<p class="mb-0">Total Balance</p>', '<p class="mb-0" data-i18n="dash.totalBalance">Total Balance</p>'),
        ('<h6 class="mb-0">Income this week</h6>\n                  <small>$39k less than last week</small>',
         '<h6 class="mb-0" data-i18n="dash.incomeWeek">Income this week</h6>\n                  <small data-i18n="dash.incomeWeek.sub">$39k less than last week</small>'),
        ('<h5 class="card-title m-0 me-2">Transactions</h5>', '<h5 class="card-title m-0 me-2" data-i18n="dash.transactions">Transactions</h5>'),
        ('<h6 class="fw-normal mb-0">Send money</h6>', '<h6 class="fw-normal mb-0" data-i18n="dash.sendMoney">Send money</h6>'),
        ('<h6 class="fw-normal mb-0">Refund</h6>', '<h6 class="fw-normal mb-0" data-i18n="dash.refund">Refund</h6>'),
        ('<h6 class="fw-normal mb-0">Ordered Food</h6>', '<h6 class="fw-normal mb-0" data-i18n="dash.orderedFood">Ordered Food</h6>'),
        ('<h5 class="card-title m-0 me-2">Activity Timeline</h5>', '<h5 class="card-title m-0 me-2" data-i18n="dash.activity">Activity Timeline</h5>'),
        ('<h6 class="mb-0">12 Invoices have been paid</h6>\n                  <small class="text-body-secondary">12 min ago</small>',
         '<h6 class="mb-0" data-i18n="dash.invPaid">12 Invoices have been paid</h6>\n                  <small class="text-body-secondary" data-i18n="dash.invPaid.time">12 min ago</small>'),
        ('<p class="mb-2">Invoices have been paid to the company</p>', '<p class="mb-2" data-i18n="dash.invPaid.body">Invoices have been paid to the company</p>'),
        ('<h6 class="mb-0">Client Meeting</h6>\n                  <small class="text-body-secondary">45 min ago</small>',
         '<h6 class="mb-0" data-i18n="dash.clientMeeting">Client Meeting</h6>\n                  <small class="text-body-secondary" data-i18n="dash.clientMeeting.time">45 min ago</small>'),
        ('<p class="mb-2">Project meeting with john @10:15am</p>', '<p class="mb-2" data-i18n="dash.clientMeeting.body">Project meeting with john @10:15am</p>'),
        ('<p class="mb-0 small fw-medium">Lester McCarthy (Client)</p>', '<p class="mb-0 small fw-medium" data-i18n="dash.client">Lester McCarthy (Client)</p>'),
        ('<h6 class="mb-0">Create a new project for client</h6>\n                  <small class="text-body-secondary">2 Day Ago</small>',
         '<h6 class="mb-0" data-i18n="dash.newProject">Create a new project for client</h6>\n                  <small class="text-body-secondary" data-i18n="dash.newProject.time">2 Day Ago</small>'),
        ('<p class="mb-2">6 team members in a project</p>', '<p class="mb-2" data-i18n="dash.newProject.body">6 team members in a project</p>'),
        # tabs tables
        ('aria-selected="true">Browser</button>', 'aria-selected="true" data-i18n="tab.browser">Browser</button>'),
        ('aria-selected="false">Operating System</button>', 'aria-selected="false" data-i18n="tab.os">Operating System</button>'),
        ('aria-selected="false">Country</button>', 'aria-selected="false" data-i18n="tab.country">Country</button>'),
        ('<th>No</th>', '<th data-i18n="table.no">No</th>'),
        ('<th>Browser</th>', '<th data-i18n="table.browser">Browser</th>'),
        ('<th>Visits</th>', '<th data-i18n="table.visits">Visits</th>'),
        ('<th class="w-50">Data In Percentage</th>', '<th class="w-50" data-i18n="table.percent">Data In Percentage</th>'),
        ('<th>System</th>', '<th data-i18n="table.system">System</th>'),
        ('<th>Country</th>', '<th data-i18n="table.country">Country</th>'),
        ('<span class="text-heading">USA</span>', '<span class="text-heading" data-i18n="country.us">USA</span>'),
        ('<span class="text-heading">Brazil</span>', '<span class="text-heading" data-i18n="country.br">Brazil</span>'),
        ('<span class="text-heading">India</span>', '<span class="text-heading" data-i18n="country.in">India</span>'),
        ('<span class="text-heading">Australia</span>', '<span class="text-heading" data-i18n="country.au">Australia</span>'),
        ('<span class="text-heading">France</span>', '<span class="text-heading" data-i18n="country.fr">France</span>'),
        ('<span class="text-heading">Canada</span>', '<span class="text-heading" data-i18n="country.ca">Canada</span>'),
        # footer
        ('© <span id="zon-year"></span> <strong>Zon Admin</strong> — barcha huquqlar himoyalangan',
         '<span data-i18n="footer.rights">© {year} Zon Admin — barcha huquqlar himoyalangan</span>'),
        ('Backend API tayyor', ''),
    ]

    for a, b in reps:
        if a and a in html and "data-i18n" not in b[:40] or (a and a in html):
            if a and b is not None and a in html:
                html = html.replace(a, b)

    for a, b in simple:
        if a in html:
            html = html.replace(a, b)

    # footer api line
    html = html.replace(
        '<div class="d-none d-lg-inline-block text-muted small">\n        \n      </div>',
        '<div class="d-none d-lg-inline-block text-muted small" data-i18n="footer.api">Backend API ready</div>',
    )
    html = html.replace(
        '<div class="d-none d-lg-inline-block text-muted small">\n        Backend API tayyor\n      </div>',
        '<div class="d-none d-lg-inline-block text-muted small" data-i18n="footer.api">Backend API tayyor</div>',
    )

    # action dropdowns - replace_all
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">View More</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.viewMore">View More</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Delete</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.delete">Delete</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Select All</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.selectAll">Select All</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Refresh</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.refresh">Refresh</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Share</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.share">Share</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Last 28 Days</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.last28">Last 28 Days</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Last Month</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.lastMonth">Last Month</a>',
    )
    html = html.replace(
        '<a class="dropdown-item" href="javascript:void(0);">Last Year</a>',
        '<a class="dropdown-item" href="javascript:void(0);" data-i18n="action.lastYear">Last Year</a>',
    )
    html = html.replace(
        '<span class="visually-hidden">Toggle Dropdown</span>',
        '<span class="visually-hidden" data-i18n="action.toggleDropdown">Toggle Dropdown</span>',
    )

    # Notification items - unique strings
    notif_map = [
        ("Congratulation Lettie 🎉", "notif.1.title"),
        ("Won the monthly best seller gold badge", "notif.1.body"),
        ("1h ago", "notif.1.time"),  # appears twice - careful
        ("Charles Franklin", "notif.2.title"),
        ("Accepted your connection", "notif.2.body"),
        ("12hr ago", "notif.2.time"),
        ("New Message ✉️", "notif.3.title"),
        ("You have new message from Natalie", "notif.3.body"),
        ("Whoo! You have new order 🛒", "notif.4.title"),
        ("ACME Inc. made new order $1,154", "notif.4.body"),
        ("1 day ago", "notif.4.time"),
        ("Application has been approved 🚀", "notif.5.title"),
        ("Your ABC project application has been approved.", "notif.5.body"),
        ("2 days ago", "notif.5.time"),
        ("Monthly report is generated", "notif.6.title"),
        ("July monthly financial report is generated ", "notif.6.body"),
        ("3 days ago", "notif.6.time"),
        ("Send connection request", "notif.7.title"),
        ("Peter sent you connection request", "notif.7.body"),
        ("4 days ago", "notif.7.time"),
        ("New message from Jane", "notif.8.title"),
        ("Your have new message from Jane", "notif.8.body"),
        ("5 days ago", "notif.8.time"),  # twice for 8 and 9
        ("CPU is running high", "notif.9.title"),
        ("CPU Utilization Percent is currently at 88.63%,", "notif.9.body"),
    ]

    # More careful notification replacements with context
    html = html.replace(
        '<h6 class="small mb-0">Congratulation Lettie 🎉</h6>\n                    <small class="mb-1 d-block text-body">Won the monthly best seller gold badge</small>\n                    <small class="text-body-secondary">1h ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.1.title">Congratulation Lettie 🎉</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.1.body">Won the monthly best seller gold badge</small>\n                    <small class="text-body-secondary" data-i18n="notif.1.time">1h ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">Charles Franklin</h6>\n                    <small class="mb-1 d-block text-body">Accepted your connection</small>\n                    <small class="text-body-secondary">12hr ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.2.title">Charles Franklin</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.2.body">Accepted your connection</small>\n                    <small class="text-body-secondary" data-i18n="notif.2.time">12hr ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">New Message ✉️</h6>\n                    <small class="mb-1 d-block text-body">You have new message from Natalie</small>\n                    <small class="text-body-secondary">1h ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.3.title">New Message ✉️</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.3.body">You have new message from Natalie</small>\n                    <small class="text-body-secondary" data-i18n="notif.3.time">1h ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">Whoo! You have new order 🛒</h6>\n                    <small class="mb-1 d-block text-body">ACME Inc. made new order $1,154</small>\n                    <small class="text-body-secondary">1 day ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.4.title">Whoo! You have new order 🛒</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.4.body">ACME Inc. made new order $1,154</small>\n                    <small class="text-body-secondary" data-i18n="notif.4.time">1 day ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">Application has been approved 🚀</h6>\n                    <small class="mb-1 d-block text-body">Your ABC project application has been approved.</small>\n                    <small class="text-body-secondary">2 days ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.5.title">Application has been approved 🚀</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.5.body">Your ABC project application has been approved.</small>\n                    <small class="text-body-secondary" data-i18n="notif.5.time">2 days ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">Monthly report is generated</h6>\n                    <small class="mb-1 d-block text-body">July monthly financial report is generated </small>\n                    <small class="text-body-secondary">3 days ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.6.title">Monthly report is generated</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.6.body">July monthly financial report is generated</small>\n                    <small class="text-body-secondary" data-i18n="notif.6.time">3 days ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">Send connection request</h6>\n                    <small class="mb-1 d-block text-body">Peter sent you connection request</small>\n                    <small class="text-body-secondary">4 days ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.7.title">Send connection request</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.7.body">Peter sent you connection request</small>\n                    <small class="text-body-secondary" data-i18n="notif.7.time">4 days ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">New message from Jane</h6>\n                    <small class="mb-1 d-block text-body">Your have new message from Jane</small>\n                    <small class="text-body-secondary">5 days ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.8.title">New message from Jane</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.8.body">You have new message from Jane</small>\n                    <small class="text-body-secondary" data-i18n="notif.8.time">5 days ago</small>',
    )
    html = html.replace(
        '<h6 class="small mb-0">CPU is running high</h6>\n                    <small class="mb-1 d-block text-body">CPU Utilization Percent is currently at 88.63%,</small>\n                    <small class="text-body-secondary">5 days ago</small>',
        '<h6 class="small mb-0" data-i18n="notif.9.title">CPU is running high</h6>\n                    <small class="mb-1 d-block text-body" data-i18n="notif.9.body">CPU Utilization Percent is currently at 88.63%</small>\n                    <small class="text-body-secondary" data-i18n="notif.9.time">5 days ago</small>',
    )

    # Ordered Food appears twice - already replaced both with same key which is fine

    # Second Ordered Food already covered by replace_all of that exact string - both get same translation OK

    # Inject script
    inject = """    <script src="js/zon-i18n.js"></script>
"""
    if "js/zon-i18n.js" not in html:
        html = html.replace(
            '<script src="js/app-config.js"></script>',
            inject + '    <script src="js/app-config.js"></script>',
            1,
        )

    # html lang default uz
    html = html.replace('lang="en"', 'lang="uz"', 1)

    # Fix broken theme spans if double-nested wrongly - check later

    return html


def main() -> None:
    write_locales()
    (ROOT / "js" / "zon-i18n.js").write_text(ENGINE, encoding="utf-8")
    print("Wrote zon-i18n.js")

    html = HTML.read_text(encoding="utf-8")
    html = patch_html(html)
    HTML.write_text(html, encoding="utf-8")
    print("Patched index.html")

    # quick stats
    count = html.count("data-i18n")
    print(f"data-i18n attributes: {count}")
    for needle in ["French", "Arabic", "German", "data-language=\"fr\""]:
        if needle in html:
            print("WARN leftover:", needle)


if __name__ == "__main__":
    main()
