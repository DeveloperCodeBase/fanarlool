# FanarLool — دستورهای عامل

گزارش‌ها فارسی و کوتاه: تغییر، شاهد گیت، قدم بعد. هیچ فایل را با علامت at و مسیر import نکنید.

در شروع فقط `AGENT_RUNBOOK.md`، همین فایل و `docs/CONTINUATION_PLAN.md` را بخوانید؛ برای عملیات، `docs/DEPLOYMENT.md`.

این پروژه مستقل است: `DeveloperCodeBase/fanarlool`، سرور `193.163.201.141`، ریشه `/var/www/fanarlool`، دامنه `fanarlool.vistapower.ir`. فایل محصول، محیط، داده و سرویس پروژه‌های دیگر را نخوانید یا تغییر ندهید.

Windows/PowerShell محل ادیت است. install/build/test/runtime روی VPS فقط با `scripts/remote.ps1`. Docker محلی، SSH خام، و ادیت سورس مستقیم روی VPS ممنوع است. جست‌وجوی سراسری کد را به subagent بسپارید و خلاصه بگیرید.

قبل از ادیت status و مالکیت worktree را بررسی کنید. تغییرهای نشست دیگر را دست نزنید؛ فقط مسیرهای متعلق به کار خود را stage کنید. شاخه `codex/`، commit و push معمولی؛ force push ممنوع.

معماری فعلی static React/Vite است؛ Bun با `bun.lock` و install frozen. Node دائمی، Vite dev/preview و Docker برای این محصول لازم نیست. هیچ پورتی بدون بررسی تخصیص ندهید. Nginx فعلی 8080 با virtual host اختصاصی؛ Caddy موجود 80/443 با مسیر اختصاصی و TLS خودکار. تغییر وب‌استک مشترک فقط به اندازهٔ اتصال همین دامنه، با backup و validation و reload؛ restart ممنوع.

فقط SHA کامل و push‌شده validate و سپس deploy شود. release تأییدشده/فعال قابل rebuild نیست. SKIP برابر PASS نیست؛ تست فعلاً موجود نیست. اطلاعات ورود فعلی mock است و اثبات امنیت/اتصال صنعتی محسوب نمی‌شود.
