# Zon Admin — serverga yuklash

## Nima yuklanadi
Faqat shu papka ichidagilar (toza paket):

```
zon-admin-deploy/
  index.html          → / ga redirect
  admin/              → butun admin panel
  nginx.example.conf  → Nginx namuna
  web.config          → IIS (Windows) namuna
```

## Tezkor qadamlar

1. `deploy/zon-admin-deploy.zip` ni serverga yuklang va oching
   (masalan `/var/www/zon-admin` yoki IIS site root).

2. `admin/js/app-config.js` ichida tekshiring:
   - `API_BASE_URL` = backend manzili (`http://18.197.174.196:5065`)
   - HTTPS domain bo‘lsa, API ham HTTPS bo‘lishi yaxshi (mixed content oldini olish)

3. Web server:
   - **Nginx**: `nginx.example.conf` ni moslab ulashing
   - **IIS**: `web.config` allaqachon paketda
   - **Apache**: `FallbackResource /index.html` yoki DocumentRoot shu papkaga

4. Backend (Zonic API) da CORS:
   - Admin domenini allow qiling (masalan `https://admin.sizning-domen.uz`)
   - `credentials: true` bo‘lsa `Access-Control-Allow-Credentials: true`
   - `Authorization` headeriga ruxsat

5. Brauzerda oching: `https://sizning-domen.uz/` → `admin/`

## Tekshiruv
- `/admin/` ochiladi
- CSS/JS yuklanadi
- Swagger: http://18.197.174.196:5065/swagger
- Keyin API ulash (Login / Dashboard / Users)

## Eslatma
Hozircha sahifalar static HTML. API helper tayyor (`ZonApi`), lekin
to‘liq Login/Dashboard ulanishi keyingi qadam.
