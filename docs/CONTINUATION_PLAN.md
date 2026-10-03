# وضعیت ادامه

تاریخ: ۲۰۲۶-۱۰-۰۳. baseline محصول `dc7c5b47e9b563ea9d9d9bb9fa0b1ce7279b865f`.

ممیزی: React/Vite static؛ Bun lock؛ test/backend/DB/env ندارد؛ navigation بر پایهٔ tab. شاخهٔ bootstrap `codex/fanarlool-bootstrap`. wrapper، گیت exact-SHA، release اتمیک و rollback، config اختصاصی Nginx و snippet Caddy در این بسته افزوده شده‌اند.

شاهد اولیهٔ VPS: Ubuntu 24.04، Node 22.23.2، Nginx 1.24 روی 8080، Caddy 2.8.4 موجود روی 80/443، حدود ۱۲GiB دیسک آزاد، ریشهٔ پروژه خالی و متعلق به ubuntu؛ Bun/Certbot عمومی موجود نیست. DNS A برابر `193.163.201.141`؛ AAAA دیده نشد. HTTPS پیش از اتصال خطای TLS دارد.

bootstrap اولیه PASS: clone از origin صحیح، marker مالکیت، Bun خصوصی 1.4.2 از installer رسمی و nginx syntax موفق. وضعیت جاری و SHA production را با wrapper دریافت کنید؛ snapshot زیر شاهد انتشار اولیه است.

گیت اولیهٔ `fe5c325` install/typecheck/build/bundle موفق داشت؛ test script وجود ندارد (SKIP). فرمان Bun برای تشخیص test متوقف ماند و پس از تطابق PID، start ticks، cwd و cmdline فقط همان probe متوقف شد. تشخیص test به Python تغییر کرد و فرمان‌های install/build/test دارای timeout شدند. هشدار Vite: bundle JS حدود 1.1MB؛ تقسیم bundle کار بعدی مستقل است.

انتشار اولیهٔ `c4a4e31e54f0041676b88d86893d0d5ca19b7b94`: گیت مجدد کامل PASS؛ nginx syntax و Caddy validate/reload PASS؛ DNS A صحیح و AAAA ندارد؛ HTTPS با تأیید certificate و پاسخ 200، HTTP redirect 308، logo/JS/CSS و version.txt PASS، asset مفقود 404. لاگ خطای اختصاصی Nginx خالی. مرورگر production صفحهٔ فارسی و tab دوقلوی دیجیتال را نمایش داد؛ خطا/warning ثبت‌شدهٔ کنسول وجود نداشت. پاسخ hooshgate=307، vistapower=200 و refah=200 قبل/بعد یکسان بود. container/service/port جدید ایجاد نشد؛ فقط virtual host اختصاصی Nginx و بلوک FanarLool در وب‌استک مشترک افزوده شدند. backup config در `shared/edge-before.caddy` محفوظ است.

بستهٔ نهایی این اسناد و health گسترده‌تر را دارد و باید همان SHA کامل نهایی نیز validate/deploy شود؛ SHA جاری از Git و `remote.ps1 -Action version` قابل بازیابی است. انتشار بعدی `previous` را روی release اولیه نگه می‌دارد. redeploy همان SHA نقطه rollback را overwrite نمی‌کند.

SKIP: تست خودکار موجود نیست؛ دوربین/مجوز سخت‌افزاری و همهٔ گردش‌های محصول بررسی نشده‌اند؛ URL routing ندارد و SPA fallback فعلاً موضوعیت ندارد. کار بعد: review/merge معمولی PR و توسعه از این workflow؛ تقسیم bundle و محلی‌سازی فونت‌ها مستقل از bootstrap. داده و ورود محصول فعلاً شبیه‌سازی‌شده‌اند.
