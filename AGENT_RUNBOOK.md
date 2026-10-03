# راهنمای ادامهٔ FanarLool

1. دستورهای `AGENTS.md` و وضعیت `docs/CONTINUATION_PLAN.md` را بخوانید.
2. `git status --short`، `git branch --show-current`، `git rev-parse HEAD` و remote را بررسی کنید.
3. `scripts/remote.ps1 -Action version` و در صورت نیاز `-Action status`؛ وضعیت production را از شاهد زنده بگیرید.
4. ادیت فقط در worktree انتخاب‌شدهٔ Windows؛ مسیرهای خودتان را commit و push کنید.
5. `scripts/remote.ps1 -Action validate -Sha <40-char-SHA>`؛ install frozen، TypeScript، build، تست موجود و صحت bundle روی VPS.
6. در صورت PASS، `scripts/remote.ps1 -Action deploy -Sha <40-char-SHA>` سپس `-Action health` و بررسی مرورگر دامنهٔ واقعی.
7. خطا فقط با ادیت لوکال، commit/push جدید و گیت SHA جدید اصلاح شود. روش rollback و bootstrap در `docs/DEPLOYMENT.md`.

لاگ اختصاصی Nginx: `scripts/remote.ps1 -Action logs`. گزارش گیت شامل PASS/FAIL/SKIP، SHA و محدودیت واقعی باشد. source یا secret روی سرور patch نشود.
