# استقرار FanarLool

## معماری نسخه عملیاتی

رابط React/TypeScript/Vite به صورت `dist` سرو می‌شود. API مستقل Node/SQLite با سرویس `fanarlool-api` و Unix socket `/run/fanarlool/api.sock` مالک احراز هویت، مجوزها، ثبت سوابق، گردش بررسی، پروفایل و فعالیت شخصی است. پنل مدیر، رویدادها و وضعیت سرویس همین پروژه را نمایش می‌دهد.

فرآیند انتشار: commit/push → `validate -Sha` → فقط بار اول `platform -Sha` → `deploy -Sha` → `health`. platform فقط virtual host متعلق به FanarLool را به‌روزرسانی و سرویس اختصاصی را نصب می‌کند؛ پورت جدید ندارد. قبل از deploy، DB با SQLite backup API و integrity_check در `shared/backups` حفظ می‌شود. داده در `shared/data/platform.sqlite`؛ mode 600 و parent 700؛ schema version=3 با جدول پروفایل. API env در `shared/api.env` شامل path/origin/SHA است. رمز اولیه از Git/گزارش/لاگ خارج بماند.

برای نخستین مدیر، مالک از Windows فرمان `scripts/remote.ps1 -Action admin -Sha <active-40-char-SHA>` را اجرا می‌کند. نام کاربری و نام نمایش با prompt و رمز ۱۲ تا ۱۲۸ نویسه با SecureString دریافت و از stdin ارسال می‌شود. این فرمان فقط وقتی مدیر فعال وجود ندارد می‌پذیرد؛ رمز وارد command line نمی‌شود. حساب‌های بعدی از UI مدیر ایجاد می‌شوند و تغییر رمز موقت اجباری است.

health جدید API SHA، منع دسترسی anonymous، HTTPS redirect، asset و hidden-file protections را هم می‌سنجد. logs شامل journal سرویس اختصاصی است. `backup -Sha` backup دستی می‌سازد. rollback برنامه را عوض و API اختصاصی را restart می‌کند؛ به نسخه static قبلی برگردد، فقط API FanarLool متوقف می‌شود. DB restore به دلیل خطر از دست رفتن داده نیازمند snapshot و تصمیم مالک است؛ schema migration آینده باید سازگاری rollback را جدا بررسی کند.

مخزن: `https://github.com/DeveloperCodeBase/fanarlool`؛ VPS: `193.163.201.141`؛ SSH alias پیش‌فرض `my-vps` با کاربر ubuntu و کلید موجود بیرون Git.

## معماری

React 18 / TypeScript / Vite 6 و خروجی static `dist`؛ Node موجود VPS برای API و SQLite WAL برای داده پایدار. ناوبری state/tab است. چهار زبان فارسی، انگلیسی، عربی و ترکی با RTL/LTR و تاریخ شمسی پشتیبانی می‌شوند؛ فرم تاریخ شمسی را به ISO استاندارد API تبدیل می‌کند. فونت Vazirmatn محلی است. دوربین مرورگر به HTTPS و اجازهٔ صریح کاربر نیاز دارد.

پورت تازه باز نمی‌شود: Caddy مشترک موجود 80/443 → `172.18.0.1:8080` با Host همین دامنه → virtual host اختصاصی Nginx موجود → `/var/www/fanarlool/current/dist`. Caddy خودش TLS و redirect را مدیریت می‌کند؛ Certbot یا container جدید ایجاد نمی‌شود. پورت 8080 از قبل توسط Nginx استفاده می‌شود. فایل میزبان اختصاصی `ops/nginx/fanarlool.conf`؛ snippet مسیر Caddy در `ops/caddy/fanarlool.caddy`.

## ساختار و فرمان‌ها

`repo` clone از origin، `releases/<SHA>` worktree جدا، `current` symlink اتمیک، `previous` نقطهٔ rollback، `shared` ابزار Bun و قفل عملیات. هیچ cleanup خودکار release وجود ندارد. release تأییدشده تغییرناپذیر است. Bun پروژه به‌صورت خصوصی در `shared/bun` از installer رسمی با نسخهٔ pinned `1.4.2` نصب می‌شود؛ Node موجود VPS استفاده می‌شود. package manager دیگری و lockfile رقیب نسازید.

همه فرمان‌ها از PowerShell ریشهٔ مخزن:

```powershell
.\scripts\remote.ps1 -Action status
.\scripts\remote.ps1 -Action bootstrap
git push -u origin codex/fanarlool-role-platform
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

validate: `bun install --frozen-lockfile` → `bun run lint` → `bun run build` (`tsc && vite build`) → تست‌های واقعی Node برای API/auth/RBAC، مدل مرجع و ترجمه → تست‌های Node برای هسته TypeScript محاسبات اقتصادی، تقویم و ابزارهای مهندسی → index/logo/JS/CSS → manifest SHA256 و marker. deploy: manifest + `nginx -t` + backup پایگاه‌داده + switch اتمیک + restart فقط API اختصاصی. health: HTTPS، SHA عمومی، دارایی‌ها، هشت نقش آزمایشی، جداسازی مرورگرها، منع workspace ناشناس و نبود listener TCP برای API. وضعیت دو دامنه همسایه نیز فقط از URL عمومی خوانده می‌شود. version.txt و index قابل refresh، assets دارای cache immutable هستند.

## ایمنی وب‌استک مشترک

bootstrap ریشهٔ خالی و متعلق به کاربر را ثبت می‌کند؛ دادهٔ موجود را حذف نمی‌کند. nginx فقط config جدید FanarLool را اضافه می‌کند؛ syntax failure همان config تازه را برمی‌دارد. edge mount/gateway واقعی را کنترل، اتصال origin را اثبات، DNS A/AAAA را بررسی، config قبلی را در `shared/edge-before.caddy` نگه‌داری و snippet را به انتها اضافه می‌کند. candidate داخل Caddy validate می‌شود؛ تطابق config پیش از نوشتن دوباره بررسی و فقط reload انجام می‌شود. خطای reload باعث restoration می‌شود. فایل وب‌استک مشترک `/home/ubuntu/Desktop/magazine/deploy/Caddyfile` تنها با افزودن بلوک FanarLool تغییر می‌کند؛ محتوای hostهای دیگر حفظ می‌شود. در صورت تغییر زیرساخت، دوباره بررسی کنید؛ پورت یا gateway را حدس نزنید.

## rollback و شواهد

`previous` در deploy بعدی به آخرین release اشاره می‌کند. SHA آن را از version.txt دریافت و `scripts/remote.ps1 -Action rollback -Sha <previous-SHA>` اجرا کنید؛ manifest بررسی و switch سپس health می‌شود. اولین انتشار previous ندارد؛ نسخهٔ تأییدشدهٔ initial در releases باقی می‌ماند و backup config مشترک قابل بررسی است. برای قطع اتصال اولیه فقط بلوک مشخص FanarLool را پس از مقایسهٔ config جاری حذف و validate/reload کنید؛ backup قدیمی را روی تغییرهای تازهٔ دیگران overwrite نکنید.

SSH password/private key یا secret در Git قرار نگیرد. Vite env عمومی وارد bundle می‌شود؛ secret در آن قرار نگیرد. frontend متغیر محیطی محرمانه ندارد؛ API از فایل محیط خصوصی systemd استفاده می‌کند. پذیرش نهایی: DNS، HTTP redirect، HTTPS/certificate hostname، چهار زبان و جهت، SHA، logo، JS/CSS، no listing، لاگ و مرورگر واقعی. آزمون دوربین نیاز به دستگاه/اجازهٔ کاربر دارد. بررسی انجام‌نشده را SKIP گزارش کنید.
# حساب نخست و محیط دمو

پس از deploy، مالک از Windows فرمان `scripts/remote.ps1 -Action admin -Sha <active-40-char-SHA>` را اجرا می‌کند؛ نام کاربری/نام و رمز موقت با prompt خصوصی دریافت می‌شوند و رمز فقط از stdin ارسال می‌شود. این action فعال بودن و validation همان release را کنترل می‌کند و در صورت وجود مدیر فعال، حساب جدید نمی‌سازد. سپس مالک در سایت رمز موقت را تغییر می‌دهد. اعتبارنامه دمو هیچ ارتباطی با این حساب ندارد.

دمو هر مرورگر در حافظه و `/api/demo/` جداست؛ restart آن را پاک می‌کند و بکاپ production شامل دمو نیست. فونت Vazirmatn نسخه `v33.003` با مجوز OFL در `public/fonts/` محلی است. آمار request پنل admin فقط ۱۰۰ مورد اخیر همان برنامه و audit فقط رویدادهای کاربردی است؛ لاگ OS از طریق wrapper عملیات خوانده می‌شود.

## آموزش مرجع بدون سرویس و پورت جدید

`remote.ps1 -Action train -Sha <pushed full SHA>` فقط در release checkout متعلق به همان SHA، اسکریپت Node با سقف ۱۸۰ ثانیه و اولویت پایین را اجرا می‌کند. ZIP رسمی UCI با کنترل اندازه و hash خوانده می‌شود؛ داده و وزن در `shared/models/<SHA>` با مجوز خصوصی قرار می‌گیرند. هیچ listener ساخته نمی‌شود. خروجی JSON مدل، تقسیم و ارزیابی پس از پایان موفق استخراج و در سورس محلی ثبت می‌شود؛ سپس SHA جدید محصول باید validate/deploy شود. فایل‌های دیتاست مرجع با سوابق عملیاتی SQLite ادغام نمی‌شوند.


## اجرای کارخانه و نگهداری محصول

schema۳ افزایشی، چهار جدول اختصاصی سفارش، بچ، کار اجرایی و دفتر مواد را اضافه می‌کند. داده‌های نسخه قبلی حذف یا با نمونه جایگزین نمی‌شوند. مسیر `/api/operations` پشت همان احراز هویت، CSRF و RBAC قرار دارد. آزادسازی سفارش و کیفیت، راستی‌آزمایی کار، مصرف و برگشت مواد با کنترل مرجع، نسخه و تراکنش ثبت می‌شوند. گزارش `/api/reports/production` کل شیفت‌های تأییدشده بازه را در SQL جمع می‌کند. جستجوی `/api/records/search` مجوز دامنه را پیش از شمارش و صفحه‌بندی اعمال می‌کند؛ آرشیو در مرورگر با صفحه۲۵تایی و CSV همان صفحه ارائه می‌شود.

deploy سرویس و timer اختصاصی `fanarlool-backup` را پس از کنترل مالکیت نام و Description نصب می‌کند. زمان‌بندی روزانه ساعت۰۳:۰۰ تهران با تأخیر تصادفی حداکثر۵دقیقه و Persistent فعال است. [SQLite Online Backup API](https://www.sqlite.org/backup.html) منبع را فقط خواندنی باز می‌کند و نسخه کامل همراه شمارش جداول، hash، integrity و foreign-key check در `shared/backups/daily` نگه می‌دارد. [systemd timer](https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml) اجرای ازدست‌رفته در خاموشی را پس از فعال‌شدن جبران می‌کند. هیچ حذف خودکار backup یا پورت تازه‌ای وجود ندارد. رشد فضای دیسک، سیاست نگهداری و نسخه خارج سرور باید در بهره‌برداری پایش و تصویب شوند.

پس از انتشار، `scripts/remote.ps1 -Action backup-drill -Sha <active SHA>` یک پشتیبان تازه می‌سازد، hash را بررسی و تنها روی کپی موقت اختصاصی بازیابی می‌کند. فایل زنده تغییر نمی‌کند. نتیجه و زمان آخرین پشتیبان/مانور در مانیتورینگ مدیر دیده می‌شوند؛ این شاهد، جای مانور کامل قطع سرور و نسخه خارج سایت را نمی‌گیرد.

مدیر می‌تواند رمز کاربر دیگر را با دلیل مستند بازنشانی کند؛ رمز در audit ذخیره نمی‌شود، همه نشست‌های هدف باطل و تغییر رمز در ورود بعد اجباری می‌شود. هر کاربر فقط نشست‌های خود را می‌بیند و می‌تواند نشست دیگر را باطل کند. اگر تمام مدیران دسترسی را فراموش کنند، مالک میزبان از `scripts/remote.ps1 -Action recover-admin -Sha <active SHA>` استفاده می‌کند؛ حساب admin نام‌برده باید قبلاً وجود داشته باشد، رمز از SecureString/stdin دریافت و رویداد بازیابی ثبت می‌شود. این مسیر حساب تازه یا رمز پیش‌فرض ایجاد نمی‌کند.
