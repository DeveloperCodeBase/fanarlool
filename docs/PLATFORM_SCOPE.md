# دامنه نسخه نقش‌محور

عنوان: پلتفرم یکپارچه تولید هوشمند مبتنی بر هوش مصنوعی برای صنایع ایران، با تمرکز بر کنترل ابعادی و کیفیت بصری، مانیتورینگ تجهیزات و انرژی، کارخانه فنر لول ایران و استان سمنان.

منابع محلی مالک: دو پروپوزال زیر `C:\vistapower\fanarlool-project\fanarlool\doc`. این نسخه هسته ثبت دستی مستند را عملیاتی و ابزارهای قدیمی را در آزمایشگاه نمونه جدا می‌کند. خرید/نصب تجهیزات، inference صنعتی، فرمان PLC، گواهی رسمی و کاهش اقتصادی محقق‌شده ادعا نمی‌شود.

## قابلیت و پذیرش

- landing عمومی مستقل، ورود با session سروری و داشبورد از مجوز نقش؛ انتخاب نقش در مرورگر اختیار ایجاد نمی‌کند.
- هشت نقش: مدیر سامانه، مدیریت کارخانه، تولید، کیفیت، نگهداری، انرژی، مهندسی، ناظر فقط‌خواندنی.
- نه حوزه رکورد: تولید/OEE، بازرسی، دستورکار، انرژی، دارایی، recipe، کالیبراسیون، NCR و انبار؛ persistence SQLite، bounds، version conflict، بررسی مستقل، CSV و audit.
- گردش: draft → submitted → approved/rejected؛ تأییدکننده متفاوت از ثبت‌کننده. تأیید رکورد به معنای گواهی رسمی انطباق قطعه نیست.
- محاسبه OEE فقط از شیفت‌های approved با جمع زمان برنامه، زمان کار، زمان ایده‌آل و تولید سالم؛ داده نبودن با null نمایش داده می‌شود.
- مهاجرت داده اتوماتیک از mock ممنوع؛ backend دفتر عملیاتی از ابتدا خالی دارد. نسخهٔ فعلی single-factory است؛ توسعه چندکارخانه‌ای به tenant isolation نیاز دارد.

## امنیت و استقرار

Node 22.23.2 VPS، `node:sqlite` در حال توسعه فعال است و روی همین نسخه gate می‌شود. password scrypt با salt تصادفی، session token هش‌شده و cookie Secure/HttpOnly/SameSite Strict، Origin و CSRF، محدودیت ورود، timeout، revocation نشست هنگام تغییر role/disable، تغییر اجباری رمز موقت. نشست ۸ ساعت حداکثر و ۳۰ دقیقه inactivity.

API روی Unix socket systemd با AF_UNIX، filesystem write allowlist و سقف 512MB اجرا می‌شود. پورت TCP جدید ندارد. Nginx `/api/` فقط از شبکه Caddy و loopback می‌پذیرد؛ frontend همان dist است. deploy DB backup با integrity_check، سپس switch/restart API اختصاصی و probe؛ failure قبل از پذیرش نسخهٔ قبلی برنامه را برمی‌گرداند. rollback DB خودکار نمی‌کند تا رکورد جدید از دست نرود.

## برنامه تکمیل صنعتی

بعد از تأیید کارخانه: catalog خطوط/محصولات، baseline، ارتباط gateway با MQTT/OPC-UA فقط‌خواندنی، صف offline/idempotency، calibration/MSA، مدل vision با dataset مستقل و معیار precision/recall و خطای اندازه‌گیری، PdM با history واقعی، OEE خط منتخب و انرژی. مهندسی، شبکه و مسئول ایمنی باید هر اتصال را بپذیرند. قیمت‌ها و اجاره تجهیزات با استعلام جدید ایران بررسی شوند. نتیجه میدانی نیازمند صورتجلسه پذیرش است.

منابع طراحی: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)، [NIST OT Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final)، [NIST Digital Thread](https://www.nist.gov/publications/roadmap-strengthen-us-manufacturing-supply-chain-digital-thread-technology)، [Node SQLite v22](https://nodejs.org/download/release/v22.23.0/docs/api/sqlite.html). اینها راهنمای طراحی هستند، نه گواهی انطباق محصول.
# تکمیل فضای شخصی و دمو

ورود دمو شامل دکمه هر هشت نقش و پرکردن اعتبارنامه عمومی آموزشی است. هر مرورگر یک SQLite در حافظه مستقل، cookie مجزا و مسیر `/api/demo/` دارد؛ session دمو در API واقعی معتبر نیست. حداکثر ۲۴ فضای همزمان، ۲۰۰ رکورد در هر فضا و عمر بیکاری یک ساعت؛ داده دمو با restart از بین می‌رود. حساب‌های آموزشی ثابت‌اند و مدیریت حساب واقعی یا تغییر رمز از دمو انجام نمی‌شود.

`/api/profile` پروفایل و ترجیحات همان حساب، `/api/activity` فقط رویدادهای همان کاربر و `/api/system` فقط برای admin، سلامت دیتابیس، شمارنده‌ها و درخواست‌های اخیر را ارائه می‌کند. رویدادهای جامع در `/api/audit` باقی می‌مانند؛ لاگ خام میزبان و اطلاعات سرویس‌های دیگر منتشر نمی‌شود. تغییر داده و audit در تراکنش واحد انجام می‌شود و نشست پیش از mutation دوباره بررسی می‌شود. schema نسخه ۲ افزوده شدن جدول پروفایل است؛ داده نسخه ۱ حذف نمی‌شود.

