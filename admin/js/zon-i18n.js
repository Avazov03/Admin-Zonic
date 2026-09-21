/**
 * Zon Admin i18n — UZ / RU / EN (inline dictionaries)
 */
(function (global) {
  const STORAGE_KEY = "zon_admin_lang";
  const SUPPORTED = ["uz", "ru", "en"];
  const DICTS = {"uz": {"page.title": "Zon Admin — Boshqaruv paneli", "footer.rights": "© {year} Zon Admin — Barcha huquqlar himoyalangan", "footer.api": "Backend API tayyor", "menu.dashboard": "Dashboard", "menu.management": "Boshqaruv", "menu.users": "Foydalanuvchilar", "menu.products": "Mahsulotlar", "menu.orders": "Buyurtmalar", "menu.categories": "Kategoriyalar", "menu.system": "Tizim", "menu.settings": "Sozlamalar", "menu.logout": "Chiqish", "lang.uz": "Oʻzbekcha", "lang.ru": "Русский", "lang.en": "English", "theme.toggle": "Mavzuni almashtirish", "theme.light": "Yorugʻ", "theme.dark": "Qorongʻu", "theme.system": "Tizim", "search.placeholder": "Qidirish [CTRL + K]", "search.noResults": "Natija topilmadi", "shortcuts.title": "Tezkor havolalar", "shortcuts.add": "Tezkor havola qoʻshish", "shortcuts.calendar": "Kalendar", "shortcuts.calendar.sub": "Uchrashuvlar", "shortcuts.invoice": "Hisob-faktura", "shortcuts.invoice.sub": "Hisoblarni boshqarish", "shortcuts.user": "Foydalanuvchilar", "shortcuts.user.sub": "Foydalanuvchilarni boshqarish", "shortcuts.role": "Rollar", "shortcuts.role.sub": "Ruxsatlar", "shortcuts.dashboard": "Dashboard", "shortcuts.dashboard.sub": "Foydalanuvchi paneli", "shortcuts.setting": "Sozlama", "shortcuts.setting.sub": "Hisob sozlamalari", "shortcuts.faqs": "Savollar", "shortcuts.faqs.sub": "FAQ va maqolalar", "shortcuts.modals": "Modallar", "shortcuts.modals.sub": "Foydali oynalar", "notif.title": "Bildirishnomalar", "notif.new": "8 yangi", "notif.markAll": "Hammasini oʻqilgan deb belgilash", "notif.viewAll": "Barcha bildirishnomalar", "notif.1.title": "Tabriklaymiz, Lettie 🎉", "notif.1.body": "Oylik eng yaxshi sotuvchi oltin belgisini yutdi", "notif.1.time": "1 soat oldin", "notif.2.title": "Charles Franklin", "notif.2.body": "Ulanish soʻrovingizni qabul qildi", "notif.2.time": "12 soat oldin", "notif.3.title": "Yangi xabar ✉️", "notif.3.body": "Nataliedan yangi xabaringiz bor", "notif.3.time": "1 soat oldin", "notif.4.title": "Yangi buyurtma! 🛒", "notif.4.body": "ACME Inc. $1,154 lik buyurtma berdi", "notif.4.time": "1 kun oldin", "notif.5.title": "Ariza tasdiqlandi 🚀", "notif.5.body": "ABC loyihasi arizangiz tasdiqlandi.", "notif.5.time": "2 kun oldin", "notif.6.title": "Oylik hisobot tayyor", "notif.6.body": "Iyul oyi moliyaviy hisoboti yaratildi", "notif.6.time": "3 kun oldin", "notif.7.title": "Ulanish soʻrovi", "notif.7.body": "Peter sizga ulanish soʻrovi yubordi", "notif.7.time": "4 kun oldin", "notif.8.title": "Janedan yangi xabar", "notif.8.body": "Janedan yangi xabaringiz bor", "notif.8.time": "5 kun oldin", "notif.9.title": "CPU yuklamasi yuqori", "notif.9.body": "CPU foydalanish foizi hozir 88.63%", "notif.9.time": "5 kun oldin", "user.role": "Admin", "user.profile": "Profilim", "user.settings": "Sozlamalar", "user.billing": "Toʻlov rejasi", "user.pricing": "Narxlar", "user.faq": "FAQ", "user.logout": "Chiqish", "dash.welcome": "Xush kelibsiz! 🎉", "dash.welcome.body": "Bugun savdo 72% ga oshdi.<br />Profilingizdagi yangi belgini koʻring.", "dash.viewBadges": "Belgilarni koʻrish", "dash.order": "Buyurtma", "dash.sales": "Savdo", "dash.payments": "Toʻlovlar", "dash.revenue": "Daromad", "dash.totalRevenue": "Umumiy daromad", "dash.companyGrowth": "62% kompaniya oʻsishi", "dash.profileReport": "Profil hisoboti", "dash.year2022": "2022 YIL", "dash.orderStats": "Buyurtma statistikasi", "dash.totalSales": "42.82k jami savdo", "dash.totalOrders": "Jami buyurtmalar", "dash.electronic": "Elektronika", "dash.electronic.sub": "Telefon, quloqchin, TV", "dash.fashion": "Moda", "dash.fashion.sub": "Futbolka, jinsi, poyabzal", "dash.decor": "Dekor", "dash.decor.sub": "Sanʼat, oshxona", "dash.sports": "Sport", "dash.sports.sub": "Futbol, kriket toʻplami", "dash.income": "Daromad", "dash.expenses": "Xarajatlar", "dash.profit": "Foyda", "dash.totalBalance": "Umumiy balans", "dash.incomeWeek": "Shu hafta daromadi", "dash.incomeWeek.sub": "Oʻtgan haftadan $39k kam", "dash.transactions": "Tranzaksiyalar", "dash.sendMoney": "Pul yuborish", "dash.refund": "Qaytarish", "dash.orderedFood": "Ovqat buyurtmasi", "dash.activity": "Faoliyat tarixi", "dash.invPaid": "12 ta hisob-faktura toʻlandi", "dash.invPaid.time": "12 daqiqa oldin", "dash.invPaid.body": "Kompaniyaga hisob-fakturalar toʻlandi", "dash.clientMeeting": "Mijoz bilan uchrashuv", "dash.clientMeeting.time": "45 daqiqa oldin", "dash.clientMeeting.body": "John bilan loyiha uchrashuvi @10:15", "dash.client": "Lester McCarthy (Mijoz)", "dash.newProject": "Mijoz uchun yangi loyiha", "dash.newProject.time": "2 kun oldin", "dash.newProject.body": "Loyihada 6 ta jamoa aʼzosi", "dash.more3": "+3", "action.viewMore": "Koʻproq", "action.delete": "Oʻchirish", "action.selectAll": "Hammasini tanlash", "action.refresh": "Yangilash", "action.share": "Ulashish", "action.last28": "Oxirgi 28 kun", "action.lastMonth": "Oʻtgan oy", "action.lastYear": "Oʻtgan yil", "action.toggleDropdown": "Menyuni ochish", "table.no": "№", "table.browser": "Brauzer", "table.visits": "Tashriflar", "table.percent": "Foizda maʼlumot", "table.system": "Tizim", "table.country": "Mamlakat", "tab.browser": "Brauzer", "tab.os": "Operatsion tizim", "tab.country": "Mamlakat", "country.us": "AQSH", "country.br": "Braziliya", "country.in": "Hindiston", "country.au": "Avstraliya", "country.fr": "Fransiya", "country.ca": "Kanada", "chart.growth": "Oʻsish", "chart.weekly": "Haftalik", "chart.order": "Buyurtma", "m.jan": "Yan", "m.feb": "Fev", "m.mar": "Mar", "m.apr": "Apr", "m.may": "May", "m.jun": "Iyun", "m.jul": "Iyul", "m.aug": "Avg", "m.sep": "Sen", "m.oct": "Okt", "m.nov": "Noy", "m.dec": "Dek", "menu.analytics": "Analytics", "menu.productList": "Roʻyxat", "menu.productAdd": "Qoʻshish", "menu.orderList": "Roʻyxat", "menu.orderDetails": "Tafsilotlar", "menu.customers": "Mijozlar", "menu.userList": "Roʻyxat", "menu.userView": "Koʻrish", "menu.roles": "Rollar", "menu.permissions": "Ruxsatlar", "menu.invoices": "Hisob-fakturalar", "menu.invoiceList": "Roʻyxat", "menu.invoicePreview": "Koʻrish", "menu.invoiceAdd": "Qoʻshish", "menu.apps": "Ilovalar", "menu.calendar": "Kalendar", "menu.account": "Hisob", "menu.security": "Xavfsizlik", "menu.login": "Kirish", "menu.register": "Roʻyxatdan oʻtish"}, "ru": {"page.title": "Zon Admin — Панель управления", "footer.rights": "© {year} Zon Admin — Все права защищены", "footer.api": "Backend API готов", "menu.dashboard": "Дашборд", "menu.management": "Управление", "menu.users": "Пользователи", "menu.products": "Товары", "menu.orders": "Заказы", "menu.categories": "Категории", "menu.system": "Система", "menu.settings": "Настройки", "menu.logout": "Выйти", "lang.uz": "Oʻzbekcha", "lang.ru": "Русский", "lang.en": "English", "theme.toggle": "Сменить тему", "theme.light": "Светлая", "theme.dark": "Тёмная", "theme.system": "Системная", "search.placeholder": "Поиск [CTRL + K]", "search.noResults": "Ничего не найдено", "shortcuts.title": "Ярлыки", "shortcuts.add": "Добавить ярлык", "shortcuts.calendar": "Календарь", "shortcuts.calendar.sub": "Встречи", "shortcuts.invoice": "Счета", "shortcuts.invoice.sub": "Управление счетами", "shortcuts.user": "Пользователи", "shortcuts.user.sub": "Управление пользователями", "shortcuts.role": "Роли", "shortcuts.role.sub": "Права доступа", "shortcuts.dashboard": "Дашборд", "shortcuts.dashboard.sub": "Панель пользователя", "shortcuts.setting": "Настройка", "shortcuts.setting.sub": "Настройки аккаунта", "shortcuts.faqs": "FAQ", "shortcuts.faqs.sub": "Вопросы и статьи", "shortcuts.modals": "Модалки", "shortcuts.modals.sub": "Полезные окна", "notif.title": "Уведомления", "notif.new": "8 новых", "notif.markAll": "Отметить все как прочитанные", "notif.viewAll": "Все уведомления", "notif.1.title": "Поздравляем, Lettie 🎉", "notif.1.body": "Получила золотой значок лучшего продавца месяца", "notif.1.time": "1 ч назад", "notif.2.title": "Charles Franklin", "notif.2.body": "Принял ваш запрос на связь", "notif.2.time": "12 ч назад", "notif.3.title": "Новое сообщение ✉️", "notif.3.body": "У вас новое сообщение от Natalie", "notif.3.time": "1 ч назад", "notif.4.title": "Новый заказ! 🛒", "notif.4.body": "ACME Inc. оформила заказ на $1,154", "notif.4.time": "1 день назад", "notif.5.title": "Заявка одобрена 🚀", "notif.5.body": "Ваша заявка по проекту ABC одобрена.", "notif.5.time": "2 дня назад", "notif.6.title": "Месячный отчёт готов", "notif.6.body": "Финансовый отчёт за июль сформирован", "notif.6.time": "3 дня назад", "notif.7.title": "Запрос на связь", "notif.7.body": "Peter отправил вам запрос на связь", "notif.7.time": "4 дня назад", "notif.8.title": "Сообщение от Jane", "notif.8.body": "У вас новое сообщение от Jane", "notif.8.time": "5 дней назад", "notif.9.title": "Высокая нагрузка CPU", "notif.9.body": "Загрузка CPU сейчас 88.63%", "notif.9.time": "5 дней назад", "user.role": "Админ", "user.profile": "Мой профиль", "user.settings": "Настройки", "user.billing": "Тарифный план", "user.pricing": "Цены", "user.faq": "FAQ", "user.logout": "Выйти", "dash.welcome": "Добро пожаловать! 🎉", "dash.welcome.body": "Сегодня продажи выросли на 72%.<br />Проверьте новый значок в профиле.", "dash.viewBadges": "Смотреть значки", "dash.order": "Заказы", "dash.sales": "Продажи", "dash.payments": "Платежи", "dash.revenue": "Выручка", "dash.totalRevenue": "Общая выручка", "dash.companyGrowth": "Рост компании 62%", "dash.profileReport": "Отчёт профиля", "dash.year2022": "ГОД 2022", "dash.orderStats": "Статистика заказов", "dash.totalSales": "42.82k всего продаж", "dash.totalOrders": "Всего заказов", "dash.electronic": "Электроника", "dash.electronic.sub": "Телефон, наушники, ТВ", "dash.fashion": "Мода", "dash.fashion.sub": "Футболки, джинсы, обувь", "dash.decor": "Декор", "dash.decor.sub": "Искусство, кухня", "dash.sports": "Спорт", "dash.sports.sub": "Футбол, крикет", "dash.income": "Доход", "dash.expenses": "Расходы", "dash.profit": "Прибыль", "dash.totalBalance": "Общий баланс", "dash.incomeWeek": "Доход за неделю", "dash.incomeWeek.sub": "На $39k меньше прошлой недели", "dash.transactions": "Транзакции", "dash.sendMoney": "Отправка денег", "dash.refund": "Возврат", "dash.orderedFood": "Заказ еды", "dash.activity": "Лента активности", "dash.invPaid": "Оплачено 12 счетов", "dash.invPaid.time": "12 мин назад", "dash.invPaid.body": "Счета компании были оплачены", "dash.clientMeeting": "Встреча с клиентом", "dash.clientMeeting.time": "45 мин назад", "dash.clientMeeting.body": "Встреча по проекту с john @10:15", "dash.client": "Lester McCarthy (Клиент)", "dash.newProject": "Новый проект для клиента", "dash.newProject.time": "2 дня назад", "dash.newProject.body": "В проекте 6 участников команды", "dash.more3": "+3", "action.viewMore": "Подробнее", "action.delete": "Удалить", "action.selectAll": "Выбрать всё", "action.refresh": "Обновить", "action.share": "Поделиться", "action.last28": "Последние 28 дней", "action.lastMonth": "Прошлый месяц", "action.lastYear": "Прошлый год", "action.toggleDropdown": "Открыть меню", "table.no": "№", "table.browser": "Браузер", "table.visits": "Визиты", "table.percent": "Данные в процентах", "table.system": "Система", "table.country": "Страна", "tab.browser": "Браузер", "tab.os": "ОС", "tab.country": "Страна", "country.us": "США", "country.br": "Бразилия", "country.in": "Индия", "country.au": "Австралия", "country.fr": "Франция", "country.ca": "Канада", "chart.growth": "Рост", "chart.weekly": "Неделя", "chart.order": "Заказ", "m.jan": "Янв", "m.feb": "Фев", "m.mar": "Мар", "m.apr": "Апр", "m.may": "Май", "m.jun": "Июн", "m.jul": "Июл", "m.aug": "Авг", "m.sep": "Сен", "m.oct": "Окт", "m.nov": "Ноя", "m.dec": "Дек", "menu.analytics": "Аналитика", "menu.productList": "Список", "menu.productAdd": "Добавить", "menu.orderList": "Список", "menu.orderDetails": "Детали", "menu.customers": "Клиенты", "menu.userList": "Список", "menu.userView": "Просмотр", "menu.roles": "Роли", "menu.permissions": "Права", "menu.invoices": "Счета", "menu.invoiceList": "Список", "menu.invoicePreview": "Просмотр", "menu.invoiceAdd": "Добавить", "menu.apps": "Приложения", "menu.calendar": "Календарь", "menu.account": "Аккаунт", "menu.security": "Безопасность", "menu.login": "Вход", "menu.register": "Регистрация"}, "en": {"page.title": "Zon Admin — Dashboard", "footer.rights": "© {year} Zon Admin — All rights reserved", "footer.api": "Backend API ready", "menu.dashboard": "Dashboard", "menu.management": "Management", "menu.users": "Users", "menu.products": "Products", "menu.orders": "Orders", "menu.categories": "Categories", "menu.system": "System", "menu.settings": "Settings", "menu.logout": "Log out", "lang.uz": "Oʻzbekcha", "lang.ru": "Русский", "lang.en": "English", "theme.toggle": "Toggle theme", "theme.light": "Light", "theme.dark": "Dark", "theme.system": "System", "search.placeholder": "Search [CTRL + K]", "search.noResults": "No results found", "shortcuts.title": "Shortcuts", "shortcuts.add": "Add shortcuts", "shortcuts.calendar": "Calendar", "shortcuts.calendar.sub": "Appointments", "shortcuts.invoice": "Invoice App", "shortcuts.invoice.sub": "Manage Accounts", "shortcuts.user": "User App", "shortcuts.user.sub": "Manage Users", "shortcuts.role": "Role Management", "shortcuts.role.sub": "Permission", "shortcuts.dashboard": "Dashboard", "shortcuts.dashboard.sub": "User Dashboard", "shortcuts.setting": "Setting", "shortcuts.setting.sub": "Account Settings", "shortcuts.faqs": "FAQs", "shortcuts.faqs.sub": "FAQs & Articles", "shortcuts.modals": "Modals", "shortcuts.modals.sub": "Useful Popups", "notif.title": "Notification", "notif.new": "8 New", "notif.markAll": "Mark all as read", "notif.viewAll": "View all notifications", "notif.1.title": "Congratulation Lettie 🎉", "notif.1.body": "Won the monthly best seller gold badge", "notif.1.time": "1h ago", "notif.2.title": "Charles Franklin", "notif.2.body": "Accepted your connection", "notif.2.time": "12hr ago", "notif.3.title": "New Message ✉️", "notif.3.body": "You have new message from Natalie", "notif.3.time": "1h ago", "notif.4.title": "Whoo! You have new order 🛒", "notif.4.body": "ACME Inc. made new order $1,154", "notif.4.time": "1 day ago", "notif.5.title": "Application has been approved 🚀", "notif.5.body": "Your ABC project application has been approved.", "notif.5.time": "2 days ago", "notif.6.title": "Monthly report is generated", "notif.6.body": "July monthly financial report is generated", "notif.6.time": "3 days ago", "notif.7.title": "Send connection request", "notif.7.body": "Peter sent you connection request", "notif.7.time": "4 days ago", "notif.8.title": "New message from Jane", "notif.8.body": "You have new message from Jane", "notif.8.time": "5 days ago", "notif.9.title": "CPU is running high", "notif.9.body": "CPU Utilization Percent is currently at 88.63%", "notif.9.time": "5 days ago", "user.role": "Admin", "user.profile": "My Profile", "user.settings": "Settings", "user.billing": "Billing Plan", "user.pricing": "Pricing", "user.faq": "FAQ", "user.logout": "Log Out", "dash.welcome": "Welcome! 🎉", "dash.welcome.body": "You have done 72% more sales today.<br />Check your new badge in your profile.", "dash.viewBadges": "View Badges", "dash.order": "Order", "dash.sales": "Sales", "dash.payments": "Payments", "dash.revenue": "Revenue", "dash.totalRevenue": "Total Revenue", "dash.companyGrowth": "62% Company Growth", "dash.profileReport": "Profile Report", "dash.year2022": "YEAR 2022", "dash.orderStats": "Order Statistics", "dash.totalSales": "42.82k Total Sales", "dash.totalOrders": "Total Orders", "dash.electronic": "Electronic", "dash.electronic.sub": "Mobile, Earbuds, TV", "dash.fashion": "Fashion", "dash.fashion.sub": "T-shirt, Jeans, Shoes", "dash.decor": "Decor", "dash.decor.sub": "Fine Art, Dining", "dash.sports": "Sports", "dash.sports.sub": "Football, Cricket Kit", "dash.income": "Income", "dash.expenses": "Expenses", "dash.profit": "Profit", "dash.totalBalance": "Total Balance", "dash.incomeWeek": "Income this week", "dash.incomeWeek.sub": "$39k less than last week", "dash.transactions": "Transactions", "dash.sendMoney": "Send money", "dash.refund": "Refund", "dash.orderedFood": "Ordered Food", "dash.activity": "Activity Timeline", "dash.invPaid": "12 Invoices have been paid", "dash.invPaid.time": "12 min ago", "dash.invPaid.body": "Invoices have been paid to the company", "dash.clientMeeting": "Client Meeting", "dash.clientMeeting.time": "45 min ago", "dash.clientMeeting.body": "Project meeting with john @10:15am", "dash.client": "Lester McCarthy (Client)", "dash.newProject": "Create a new project for client", "dash.newProject.time": "2 Day Ago", "dash.newProject.body": "6 team members in a project", "dash.more3": "+3", "action.viewMore": "View More", "action.delete": "Delete", "action.selectAll": "Select All", "action.refresh": "Refresh", "action.share": "Share", "action.last28": "Last 28 Days", "action.lastMonth": "Last Month", "action.lastYear": "Last Year", "action.toggleDropdown": "Toggle Dropdown", "table.no": "No", "table.browser": "Browser", "table.visits": "Visits", "table.percent": "Data In Percentage", "table.system": "System", "table.country": "Country", "tab.browser": "Browser", "tab.os": "Operating System", "tab.country": "Country", "country.us": "USA", "country.br": "Brazil", "country.in": "India", "country.au": "Australia", "country.fr": "France", "country.ca": "Canada", "chart.growth": "Growth", "chart.weekly": "Weekly", "chart.order": "Order", "m.jan": "Jan", "m.feb": "Feb", "m.mar": "Mar", "m.apr": "Apr", "m.may": "May", "m.jun": "Jun", "m.jul": "Jul", "m.aug": "Aug", "m.sep": "Sep", "m.oct": "Oct", "m.nov": "Nov", "m.dec": "Dec", "menu.analytics": "Analytics", "menu.productList": "List", "menu.productAdd": "Add", "menu.orderList": "List", "menu.orderDetails": "Details", "menu.customers": "Customers", "menu.userList": "List", "menu.userView": "View", "menu.roles": "Roles", "menu.permissions": "Permissions", "menu.invoices": "Invoices", "menu.invoiceList": "List", "menu.invoicePreview": "Preview", "menu.invoiceAdd": "Add", "menu.apps": "Apps", "menu.calendar": "Calendar", "menu.account": "Account", "menu.security": "Security", "menu.login": "Login", "menu.register": "Register"}};

  let current = localStorage.getItem(STORAGE_KEY) || "uz";
  if (!SUPPORTED.includes(current)) current = "uz";

  function t(key, vars) {
    const dict = DICTS[current] || {};
    let str = dict[key] != null ? dict[key] : (DICTS.en[key] != null ? DICTS.en[key] : key);
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = String(str).replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]));
      });
    }
    return str;
  }

  function apply() {
    document.documentElement.setAttribute("lang", current);
    document.title = t("page.title");

    document.querySelectorAll("[data-zon-i18n]").forEach((el) => {
      const key = el.getAttribute("data-zon-i18n");
      if (!key) return;
      const val = t(key, { year: new Date().getFullYear() });
      if (el.hasAttribute("data-zon-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    });

    document.querySelectorAll("[data-zon-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.getAttribute("data-zon-i18n-title")));
    });

    document.querySelectorAll("[data-zon-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-zon-i18n-placeholder")));
    });

    document.querySelectorAll(".dropdown-language .dropdown-item").forEach((item) => {
      item.classList.toggle("active", item.getAttribute("data-language") === current);
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

    if (global.SearchConfig) global.SearchConfig.placeholder = t("search.placeholder");
    const ph = document.querySelector(".aa-DetachedSearchButtonPlaceholder");
    if (ph) ph.textContent = t("search.placeholder");

    global.dispatchEvent(new CustomEvent("zon:langchange", { detail: { lang: current } }));
  }

  function setLang(lang, opts) {
    if (!SUPPORTED.includes(lang)) lang = "uz";
    const prev = current;
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
    // Chart labels render once — reload so ApexCharts pick up new language
    if (opts && opts.reload === false) return;
    if (prev !== lang) location.reload();
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

  global.ZonI18n = {
    t,
    setLang,
    apply,
    get lang() { return current; },
    SUPPORTED,
    monthsShort() {
      return ["m.jan","m.feb","m.mar","m.apr","m.may","m.jun","m.jul","m.aug","m.sep","m.oct","m.nov","m.dec"].map((k) => t(k));
    },
  };

  // Apply ASAP (script is deferred after DOM partial) — also on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
      bindSwitcher();
      setTimeout(apply, 0);
      setTimeout(apply, 800);
    });
  } else {
    apply();
    bindSwitcher();
    setTimeout(apply, 0);
    setTimeout(apply, 800);
  }
})(window);
