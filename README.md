# FanarLool

پلتفرم عملیاتی کارخانه فنر لول: React/TypeScript/Vite، API اختصاصی Node و SQLite، ورود واقعی، هشت نقش و نه حوزه رکورد با تأیید مستقل. ثبت داده فعلاً دستی است؛ اتصال صنعتی و اعتبارسنجی هوش مصنوعی مرحله پایلوت بعدی‌اند.

راهنمای عامل: `AGENT_RUNBOOK.md`؛ دستورها: `AGENTS.md`؛ عملیات production: `docs/DEPLOYMENT.md`؛ وضعیت ادامه: `docs/CONTINUATION_PLAN.md`.

ادیت در Windows، commit/push به GitHub، install/build/validate روی VPS با `scripts/remote.ps1`؛ سرو مستقیم `dist` توسط Nginx موجود پشت Caddy موجود با HTTPS. API با Unix socket و بدون پورت TCP جدید اجرا می‌شود. Bun و `bun.lock` مرجع وابستگی‌ها هستند. مجموعه ۱۸ سند نرم‌افزار در `docs/software/README.md` است؛ گزارش صندوق خصوصی است و وارد Git نمی‌شود.
