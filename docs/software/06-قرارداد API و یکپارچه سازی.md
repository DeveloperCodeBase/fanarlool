# قرارداد API و یکپارچه سازی

دموی محصول: [https://fanarlool.vistapower.ir](https://fanarlool.vistapower.ir)

شناسه: FL-SW-06 | نسخه ۲.۰ | تاریخ تدوین: ۱۴۰۵/۰۷/۱۲ | وضعیت: نسخه نخست محصول؛ هسته نرم‌افزاری عملیاتی در محیط تولید و برنامه تکمیل صنعتی

## احراز هویت

POST /api/auth/login با username/password؛ GET /api/auth/me برای بازیابی هویت و CSRF؛ POST /api/auth/logout؛ POST /api/auth/password با رمز فعلی و جدید. نشست در cookie امن HttpOnly است و توکن در localStorage نگهداری نمی‌شود.

## رکوردها

GET /api/workspace داده و catalog مجاز و KPI را می‌دهد. POST /api/records با kind/data پیش‌نویس می‌سازد. PATCH /api/records/:id با version و data یا status انجام می‌شود. تأیید فقط از submitted و توسط نقش مجاز متفاوت است؛ رکورد approved قابل ویرایش عادی نیست.

## کاربران و نظارت

GET/POST /api/users و PATCH /api/users/:id برای مدیر سامانه؛ تغییر نقش یا غیرفعال‌سازی نشست‌های کاربر را باطل می‌کند. GET /api/audit برای مدیر سامانه، مدیر کارخانه و ناظر. GET /api/health فقط وضعیت، schema و SHA را بدون اطلاعات کاربران ارائه می‌دهد.

## امنیت قرارداد

درخواست تغییردهنده باید Origin منطبق داشته باشد و عملیات پس از ورود x-csrf-token معتبر دریافت کند. Content-Type JSON و سقف ۳۲ کیلوبایت رعایت می‌شود. client نباید خطای ۴۰۹ را با ارسال خودکار نسخه جدید دور بزند؛ کاربر باید نسخه تازه را ببیند.

## محدودیت و توسعه

در نسخه منتشرشده پیش از این موج، سقف دریافت workspace و audit باید در تفسیر جست‌وجو لحاظ شود. موج اجرای کارخانه خواندن صفحه‌بندی‌شده و KPI کل بازه مجاز را به قرارداد سروری اضافه می‌کند؛ اعداد سقف و پارامترهای دقیق فقط از قرارداد تثبیت‌شده همین نسخه ثبت می‌شوند. API ماشین‌به‌ماشین، MQTT و OPC UA بخش اتصال OT مستقل‌اند و در وب‌اپ فعلی از رابطه نرم‌افزاری منابع نتیجه نمی‌شوند.

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

## قرارداد یکپارچه اجرای کارخانه

سفارش، بچ، وظیفه و حرکت موجودی منابع تخصصی‌اند. هر mutation به نشست معتبر، CSRF، مجوز حوزه، بررسی نسخه و گذار مجاز وابسته است. آزادسازی، تغییر وضعیت کار و حرکت ماده باید همراه audit اتمیک باشند. مشتری endpoint یا enum را از متن راهنما حدس نمی‌زند؛ مسیر، روش HTTP، schema و کد پاسخ در openapi و پیاده‌سازی تثبیت‌شده همان SHA درج می‌شوند. شماره صفحه/فیلتر/بازه جزو قرارداد خواندن است؛ total مجموعه با شمار ردیف نمایش‌داده‌شده خلط نمی‌شود.

## مسیرهای دقیق اجرای کارخانه و فهرست‌ها

GET /api/operations با q، tab و status: چهار فهرست orders/lots/tasks/movements، totalCounts و limited و خلاصه کل SQL؛ جست‌وجو پیش از LIMIT 200 انجام می‌شود. POST /api/operations/orders، /lots، /tasks و /movements منبع می‌سازند. PATCH /api/operations/:tab/:id گذار با version و action و در صورت لزوم note را اجرا می‌کند؛ PATCH movements با ۴۰۹ رد می‌شود. GET /api/operations/:tab/:id پرونده را می‌خواند؛ پرونده lots رابطه سفارش/recipe/asset/inspection و گردش ماده و رخداد را می‌دهد. مرجع سند خارج اختیار نقش null می‌شود و یادداشت CAPA برای نقش فاقد دسترسی NCR پنهان می‌ماند؛ totalCounts/limited سقف ۲۰۰ حرکت و رخداد را روشن می‌کنند. GET /api/records/search فهرست RBAC صفحه‌بندی‌شده می‌دهد. GET /api/reports/production با from/to، KPI کل تولید approved بازه را از SQL می‌سازد؛ KPI وابسته به صفحه جدول نیست. این قرارداد نامزد کد آماده گیت است.

## مسیرهای حساب و نشست

GET /api/auth/sessions فقط نشست‌های فعال حساب خود را با id، current، expiresAt و lastSeen نشان می‌دهد. DELETE /api/auth/sessions/:id فقط نشست همان کاربر را می‌بندد؛ بستن نشست جاری cookie را پاک می‌کند. POST /api/auth/revoke-others نشست‌های دیگر همان کاربر را با audit باطل می‌کند. POST /api/users/:id/reset-password فقط admin عملیاتی برای حساب دیگری است؛ password تازه معتبر و متفاوت و reason بین ۱۰ تا ۱۰۰۰ نویسه الزامی‌اند، همه نشست‌های هدف بسته و must_change فعال می‌شود. فضای ارزیابی اجازه reset هویت آموزشی ندارد. بازیابی مدیر از wrapper recover-admin با نام مدیر موجود و رمز ورودی امن مالک انجام می‌شود؛ رمز در CLI عمومی یا سند نوشته نمی‌شود.

## دوقلوی مهندسی، حساب و مشاهده‌پذیری — schema۴

ماژول server/twin.mjs مدل compression-spring-wahl-v1 را با G و تنش مجاز صریح اجرا می‌کند. مرجع تجهیز/دستور ساخت باید تأییدشده باشد. سناریو و baseline هندسی snapshot با نسخه مرجع ذخیره می‌شوند؛ نیرو و خواص ماده در مقایسه به هر دو حالت اعمال می‌شوند. تغییر نسخه یا وضعیت تأیید مرجع، preview اصلاحی و PATCH را با 409 متوقف می‌کند؛ GET تاریخچه را حفظ می‌کند. خروجی ۲۱ نقطه نیرو–خیز، تماس حلقه، تنش Wahl و مقایسه عددی دارد. این مدل اتصال زنده OT، مدل خستگی یا تغییر خودکار دستور ساخت نیست.

ماژول account-services.mjs پروفایل نسخه‌دار و خلاصه مجاز شخصی را ارائه می‌کند. نقش، شناسه و رمز از PATCH پروفایل قابل تغییر نیستند. اطلاعات واحد/سمت/شیفت خوداظهاری هستند. مانیتور admin شامل ring محدود ۵۰۰ درخواست، صفحه‌بندی SQL audit و نشست‌های گروه‌بندی‌شده بدون توکن است؛ شمارنده buffer برابر SLA تاریخی نیست. quick_check هر پنج دقیقه برای همان DatabaseSync cache می‌شود؛ health.checkedAt زمان بررسی اصلی و generatedAt زمان مشاهده است. حافظه، فرآیند اختصاصی شامل فضاهای ارزیابی را اندازه می‌گیرد.