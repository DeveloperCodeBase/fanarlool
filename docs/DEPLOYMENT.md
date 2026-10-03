# استقرار FanarLool

## تغییر معماری نسخه نقش‌محور

مالک پس از bootstrap ورود واقعی، داشبورد نقش‌ها و اطلاعات پایدار را درخواست کرد. از نسخهٔ نقش‌محور، frontend همچنان dist است اما API مستقل Node/SQLite با سرویس `fanarlool-api` و Unix socket `/run/fanarlool/api.sock` افزوده شده است؛ متن تاریخی static زیر مربوط به bootstrap اولیه است.

در بسته جدید: commit/push → `validate -Sha` (اکنون test واقعی Node دارد) → فقط بار اول `platform -Sha` → `deploy -Sha` → `health`. platform فقط virtual host متعلق به FanarLool را به‌روزرسانی و سرویس اختصاصی را نصب می‌کند؛ پورت جدید ندارد. قبل از deploy، DB با SQLite backup API و integrity_check در `shared/backups` حفظ می‌شود. داده در `shared/data/platform.sqlite`؛ mode 600 و parent 700. schema version=1. API env در `shared/api.env` و شامل path/origin/SHA است؛ secret لازم ندارد. رمز اولیه از Git/گزارش/لاگ خارج بماند.

برای نخستین مدیر: از محیط امن مدیر VPS JSON شامل username/name/password با حداقل ۱۲ نویسه به stdin اسکریپت committed `server/admin.mjs` بدهید و `FANAR_DATA_ROOT=/var/www/fanarlool/shared/data` تعیین کنید. این فرمان فقط وقتی مدیر فعال وجود ندارد می‌پذیرد؛ رمز در command line قرار نگیرد. قبل از این کار حساب فعال و credential پیش‌فرض وجود ندارد. افراد بعدی از UI مدیر ایجاد می‌شوند و رمز موقت اجباری تغییر می‌کند.

health جدید API SHA، منع دسترسی anonymous، HTTPS redirect، asset و hidden-file protections را هم می‌سنجد. logs شامل journal سرویس اختصاصی است. `backup -Sha` backup دستی می‌سازد. rollback برنامه را عوض و API اختصاصی را restart می‌کند؛ به نسخه static قبلی برگردد، فقط API FanarLool متوقف می‌شود. DB restore به دلیل خطر از دست رفتن داده نیازمند snapshot و تصمیم مالک است؛ schema migration آینده باید سازگاری rollback را جدا بررسی کند.

مخزن: `https://github.com/DeveloperCodeBase/fanarlool`؛ VPS: `193.163.201.141`؛ SSH alias پیش‌فرض `my-vps` با کاربر ubuntu و کلید موجود بیرون Git.

## معماری

React 18 / TypeScript / Vite 6، خروجی static `dist`. backend، DB، env موردنیاز و test script فعلاً ندارد. ناوبری state/tab است؛ URL route و fallback SPA لازم نیست. فونت‌ها Google Fonts هستند. دوربین مرورگر به HTTPS و اجازهٔ کاربر نیاز دارد.

پورت تازه باز نمی‌شود: Caddy مشترک موجود 80/443 → `172.18.0.1:8080` با Host همین دامنه → virtual host اختصاصی Nginx موجود → `/var/www/fanarlool/current/dist`. Caddy خودش TLS و redirect را مدیریت می‌کند؛ Certbot یا container جدید ایجاد نمی‌شود. پورت 8080 از قبل توسط Nginx استفاده می‌شود. فایل میزبان اختصاصی `ops/nginx/fanarlool.conf`؛ snippet مسیر Caddy در `ops/caddy/fanarlool.caddy`.

## ساختار و فرمان‌ها

`repo` clone از origin، `releases/<SHA>` worktree جدا، `current` symlink اتمیک، `previous` نقطهٔ rollback، `shared` ابزار Bun و قفل عملیات. هیچ cleanup خودکار release وجود ندارد. release تأییدشده تغییرناپذیر است. Bun پروژه به‌صورت خصوصی در `shared/bun` از installer رسمی با نسخهٔ pinned `1.4.2` نصب می‌شود؛ Node موجود VPS استفاده می‌شود. package manager دیگری و lockfile رقیب نسازید.

همه فرمان‌ها از PowerShell ریشهٔ مخزن:

```powershell
.\scripts\remote.ps1 -Action status
.\scripts\remote.ps1 -Action bootstrap
git push -u origin codex/fanarlool-bootstrap
$releaseSha = git rev-parse HEAD
.\scripts\remote.ps1 -Action validate -Sha $releaseSha
.\scripts\remote.ps1 -Action deploy -Sha $releaseSha
# فقط اتصال اولیه؛ تکرار عمداً overwrite نمی‌کند:
.\scripts\remote.ps1 -Action nginx -Sha $releaseSha
.\scripts\remote.ps1 -Action edge -Sha $releaseSha
.\scripts\remote.ps1 -Action health
.\scripts\remote.ps1 -Action version
.\scripts\remote.ps1 -Action logs
```

`fetch/install/build/test` برای عیب‌یابی candidate جدید با SHA کامل موجودند. runner عملیات از نسخهٔ Git همان SHA خوانده می‌شود؛ transport اسکریپت است، سورس محصول همیشه از GitHub می‌آید. status/bootstrap تنها عملیات پیش از commit هستند. به origin متفاوت، پوشهٔ غیرخالی ناشناس، سورس dirty، SHA غیر push‌شده و تغییر release فعال اجازه داده نمی‌شود.

validate: `bun install --frozen-lockfile` → `bun run lint` → `bun run build` (`tsc && vite build`) → test script در صورت وجود وگرنه SKIP → index/logo/JS/CSS موجود → manifest SHA256 و marker. deploy: manifest + `nginx -t` + switch اتمیک. health: HTTPS، SHA عمومی، logo، JS/CSS و 404 asset مفقود. version.txt و index قابل refresh، assets دارای cache immutable هستند.

## ایمنی وب‌استک مشترک

bootstrap ریشهٔ خالی و متعلق به کاربر را ثبت می‌کند؛ دادهٔ موجود را حذف نمی‌کند. nginx فقط config جدید FanarLool را اضافه می‌کند؛ syntax failure همان config تازه را برمی‌دارد. edge mount/gateway واقعی را کنترل، اتصال origin را اثبات، DNS A/AAAA را بررسی، config قبلی را در `shared/edge-before.caddy` نگه‌داری و snippet را به انتها اضافه می‌کند. candidate داخل Caddy validate می‌شود؛ تطابق config پیش از نوشتن دوباره بررسی و فقط reload انجام می‌شود. خطای reload باعث restoration می‌شود. فایل وب‌استک مشترک `/home/ubuntu/Desktop/magazine/deploy/Caddyfile` تنها با افزودن بلوک FanarLool تغییر می‌کند؛ محتوای hostهای دیگر حفظ می‌شود. در صورت تغییر زیرساخت، دوباره بررسی کنید؛ پورت یا gateway را حدس نزنید.

## rollback و شواهد

`previous` در deploy بعدی به آخرین release اشاره می‌کند. SHA آن را از version.txt دریافت و `scripts/remote.ps1 -Action rollback -Sha <previous-SHA>` اجرا کنید؛ manifest بررسی و switch سپس health می‌شود. اولین انتشار previous ندارد؛ نسخهٔ تأییدشدهٔ initial در releases باقی می‌ماند و backup config مشترک قابل بررسی است. برای قطع اتصال اولیه فقط بلوک مشخص FanarLool را پس از مقایسهٔ config جاری حذف و validate/reload کنید؛ backup قدیمی را روی تغییرهای تازهٔ دیگران overwrite نکنید.

SSH password/private key یا secret در Git قرار نگیرد. Vite env عمومی وارد bundle می‌شود؛ secret در آن قرار نگیرد. پروژه فعلی env نیاز ندارد. پذیرش نهایی: DNS، HTTP redirect، HTTPS/certificate hostname، HTML فارسی، SHA، logo، JS/CSS، no listing، لاگ و مرورگر واقعی. آزمون دوربین نیاز به دستگاه/اجازهٔ کاربر دارد. نبود تست و بررسی انجام‌نشده را SKIP گزارش کنید.
