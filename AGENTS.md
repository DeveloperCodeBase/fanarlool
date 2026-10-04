# FanarLool — دستورهای عامل

گزارش‌ها فارسی و کوتاه: تغییر، شاهد گیت، قدم بعد. هیچ فایل را با علامت at و مسیر import نکنید.

در شروع فقط `AGENT_RUNBOOK.md`، همین فایل و `docs/CONTINUATION_PLAN.md` را بخوانید؛ برای عملیات، `docs/DEPLOYMENT.md`.

این پروژه مستقل است: `DeveloperCodeBase/fanarlool`، سرور `193.163.201.141`، ریشه `/var/www/fanarlool`، دامنه `fanarlool.vistapower.ir`. فایل محصول، محیط، داده و سرویس پروژه‌های دیگر را نخوانید یا تغییر ندهید.

Windows/PowerShell محل ادیت است. install/build/test/runtime روی VPS فقط با `scripts/remote.ps1`. Docker محلی، SSH خام، و ادیت سورس مستقیم روی VPS ممنوع است. جست‌وجوی سراسری کد را به subagent بسپارید و خلاصه بگیرید.

قبل از ادیت status و مالکیت worktree را بررسی کنید. تغییرهای نشست دیگر را دست نزنید؛ فقط مسیرهای متعلق به کار خود را stage کنید. شاخه `codex/`، commit و push معمولی؛ force push ممنوع.

معماری فعلی frontend static React/Vite و API واقعی Node/SQLite است؛ مالک ورود و نقش‌های واقعی را درخواست کرده است. Bun با `bun.lock` و install frozen برای build؛ Node موجود VPS برای API. سرویس اختصاصی `fanarlool-api` فقط Unix socket `/run/fanarlool/api.sock` دارد؛ Docker جدید یا پورت تازه نسازید. Nginx فعلی 8080 با virtual host اختصاصی؛ Caddy موجود 80/443 با مسیر اختصاصی و TLS خودکار. وب‌استک مشترک فقط validate/reload؛ restart سرویس API اختصاصی در deploy مجاز است.

فقط SHA کامل و push‌شده validate و سپس deploy شود. release تأییدشده/فعال قابل rebuild نیست. SKIP برابر PASS نیست. تست API/auth/RBAC و قواعد داده با Node روی VPS اجرا شود. DB اختصاصی در `shared/data` و backup پیش از deploy؛ داده operational را seed نمونه نکنید. حساب اولیه فقط با رمز مالک از مسیر امن فعال شود. شبیه‌سازها اتصال صنعتی یا دستاورد میدانی محسوب نمی‌شوند. مدارک هزینه/قرارداد محلی و خصوصی بمانند؛ گزارش مالی بین دریافت، هزینه مستند و برآورد تفکیک کند.
