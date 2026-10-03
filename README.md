# FanarLool

پلتفرم نمایشی کارخانه فنر لول، React/TypeScript/Vite.

راهنمای عامل: `AGENT_RUNBOOK.md`؛ دستورها: `AGENTS.md`؛ عملیات production: `docs/DEPLOYMENT.md`؛ وضعیت ادامه: `docs/CONTINUATION_PLAN.md`.

ادیت در Windows، commit/push به GitHub، install/build/validate روی VPS با `scripts/remote.ps1`؛ سرو مستقیم `dist` توسط Nginx موجود پشت Caddy موجود با HTTPS. Bun و `bun.lock` مرجع وابستگی‌ها هستند.
