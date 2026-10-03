# قرارداد API و یکپارچه سازی

شناسه: FL-SW-06 | نسخه ۲.۰ | تاریخ تدوین: ۱۴۰۵/۰۷/۱۱ | وضعیت: نسخه نخست محصول؛ هسته نرم‌افزاری عملیاتی در محیط تولید و برنامه تکمیل صنعتی

## احراز هویت

POST /api/auth/login با username/password؛ GET /api/auth/me برای بازیابی هویت و CSRF؛ POST /api/auth/logout؛ POST /api/auth/password با رمز فعلی و جدید. نشست در cookie امن HttpOnly است و توکن در localStorage نگهداری نمی‌شود.

## رکوردها

GET /api/workspace داده و catalog مجاز و KPI را می‌دهد. POST /api/records با kind/data پیش‌نویس می‌سازد. PATCH /api/records/:id با version و data یا status انجام می‌شود. تأیید فقط از submitted و توسط نقش مجاز متفاوت است؛ رکورد approved قابل ویرایش عادی نیست.

## کاربران و نظارت

GET/POST /api/users و PATCH /api/users/:id برای مدیر سامانه؛ تغییر نقش یا غیرفعال‌سازی نشست‌های کاربر را باطل می‌کند. GET /api/audit برای مدیر سامانه، مدیر کارخانه و ناظر. GET /api/health فقط وضعیت، schema و SHA را بدون اطلاعات کاربران ارائه می‌دهد.

## امنیت قرارداد

درخواست تغییردهنده باید Origin منطبق داشته باشد و عملیات پس از ورود x-csrf-token معتبر دریافت کند. Content-Type JSON و سقف ۳۲ کیلوبایت رعایت می‌شود. client نباید خطای ۴۰۹ را با ارسال خودکار نسخه جدید دور بزند؛ کاربر باید نسخه تازه را ببیند.

## محدودیت و توسعه

workspace فعلی حداکثر ۲۰۰۰ رکورد و audit آخرین ۳۰۰ رویداد را برمی‌گرداند. صفحه‌بندی سروری و API ماشین به ماشین جزو نیاز پایلوت بزرگ است. endpoint صنعتی، MQTT و OPC UA فعلاً عرضه نشده؛ قرارداد آنها پس از انتخاب تجهیزات تدوین و جدا احراز هویت می‌شود.

## نمونه قرارداد ثبت و ارسال

POST /api/records
{"kind":"production","data":{"batch":"B-001","line":"L1","product":"FL-220","date":"2026-10-03","shift":"صبح","plannedMinutes":480,"runMinutes":420,"idealCycleSeconds":20,"total":1000,"good":980,"downtimeReason":"تنظیم دستگاه"}}
پاسخ ۲۰۱: {"id":"<uuid>"}
PATCH /api/records/<uuid>
{"version":1,"status":"submitted"}
بازبین متفاوت: {"version":2,"status":"approved"}
پاسخ موفق ۲۰۰: {"ok":true}. در تعارض ۴۰۹ و در عدم مجوز ۴۰۳ صادر می‌شود.

## API فضای شخصی و مانیتورینگ

GET/PATCH /api/profile: پروفایل و تنظیمات فقط کاربر فعلی. name، department، jobTitle، email، phone و preferences با density/startPage/notifications دریافت می‌شوند. شروع باید overview یا حوزه مجاز همان نقش باشد. GET /api/activity: آخرین ۲۰۰ رویداد actor همین حساب. GET /api/system: فقط admin، SHA، uptime، حافظه، quick_check، شمار حساب/نشست/رکورد/audit و ۱۰۰ request اخیر؛ query، body، رمز و cookie در telemetry ثبت نمی‌شوند. مسیرهای دمو prefix /api/demo و cookie مستقل دارند.

## قرارداد داده صنعتی محصول نهایی

پیشنهاد POST /integration/v1/events با هویت تجهیز و امضای درخواست؛ payload شامل event_id، source_id، captured_at، sequence، schema_version، measurements:[name,value,unit,quality]، batch و recipe_revision. پاسخ پذیرش queued/duplicate با event_id؛ خطای schema ۴۲۲؛ خطای اصالت ۴۰۱/۴۰۳؛ محدودیت ظرفیت ۴۲۹ همراه retry_after. این قرارداد برای توسعه است و endpoint فعلی محسوب نمی‌شود. قرارداد تصویری باید image_hash، calibration_id و model_version را نیز نگهداری کند.

## فایل قرارداد ماشینی

openapi.json در همین پوشه، نوع فیلد و حدود داده نه حوزه، مسیرهای delivered و scheme نشست را مستند می‌کند. requestهای تغییردهنده Origin و CSRF می‌خواهند. فایل JSON جایگزین قواعد بین‌فیلدی و گردش مستقل در SRS نیست. dataset/model/integration آتی در آن endpoint فعال تلقی نشده‌اند.

